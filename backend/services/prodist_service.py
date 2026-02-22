"""
CQT Light — Serviço ANEEL/PRODIST
Implementa regras de qualidade de tensão e limites de queda conforme:
  - PRODIST Módulo 8 (Qualidade da Energia Elétrica, Rev. 11/2022)
  - PRODIST Módulo 6 (Acesso ao Sistema de Distribuição)
  - Resolução Normativa ANEEL nº 1.000/2021

Regra de precedência (requisito do projeto):
  Quando a norma da concessionária (ANEEL/PRODIST) for aplicada, a ABNT é
  ignorada e o resultado inclui um aviso explícito (campo `aviso_toast`) para
  exibição no frontend (toast/notificação em pt-BR).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from domain.entities import (
    FAIXAS_TENSAO_PRODIST_BT,
    FAIXAS_TENSAO_PRODIST_MT,
    LIMITE_QUEDA_PRODIST_PCT,
    CLASSIFICACAO_ADEQUADA,
    CLASSIFICACAO_PRECARIA,
    CLASSIFICACAO_CRITICA,
    NORMA_ABNT,
    NORMA_PRODIST,
    RESISTIVIDADE_CONDUTOR,
)

import math


# ─────────────────────────────────────────────────────────────────────────────
# Value Objects de resultado
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ResultadoClassificacaoTensao:
    """Resultado da classificação de tensão conforme PRODIST Módulo 8."""
    tensao_medida_v: float
    tensao_referencia_v: float
    relacao_vc_vr: float         # Vc / Vr
    classificacao: str            # ADEQUADA / PRECÁRIA / CRÍTICA
    nivel: str                    # "BT" ou "MT"
    norma_aplicada: str           # NORMA_PRODIST
    aviso_toast: Optional[str]    # Mensagem pt-BR para exibição no frontend


@dataclass
class ResultadoQuedaAlimentador:
    """Resultado de queda de tensão com limites PRODIST (mais restritivo que ABNT)."""
    queda_v: float
    queda_pct: float
    corrente_a: float
    limite_pct: float             # Limite PRODIST aplicado
    conforme: bool
    tipo_alimentador: str         # "BT_ALIMENTADOR" | "BT_RAMAL" | "MT"
    norma_aplicada: str           # NORMA_PRODIST
    abnt_limite_pct: float        # Limite ABNT equivalente (para referência)
    abnt_conforme: bool           # Como seria classificado pela ABNT
    aviso_toast: Optional[str]    # Toast quando PRODIST é mais restritivo que ABNT


# ─────────────────────────────────────────────────────────────────────────────
# Funções de classificação
# ─────────────────────────────────────────────────────────────────────────────

def classificar_tensao_prodist(
    tensao_medida_v: float,
    tensao_referencia_v: float,
    nivel: str = "BT",
) -> ResultadoClassificacaoTensao:
    """
    Classifica a tensão de atendimento conforme PRODIST Módulo 8.

    A classificação é feita pela relação Vc/Vr (tensão medida / tensão de
    referência):
      - BT: ADEQUADA [0,93; 1,05] | PRECÁRIA [0,90; 0,93) ∪ (1,05; 1,06] | CRÍTICA resto
      - MT: ADEQUADA [0,95; 1,05] | PRECÁRIA [0,93; 0,95) ∪ (1,05; 1,06] | CRÍTICA resto

    Args:
        tensao_medida_v: tensão medida no ponto de entrega (V)
        tensao_referencia_v: tensão nominal/contratada (V)
        nivel: "BT" (padrão) ou "MT"

    Returns:
        ResultadoClassificacaoTensao com classificação e aviso toast se crítica/precária
    """
    if tensao_referencia_v <= 0:
        raise ValueError("tensao_referencia_v deve ser positiva")

    nivel_upper = nivel.upper()
    if nivel_upper not in ("BT", "MT"):
        raise ValueError(f"nivel deve ser 'BT' ou 'MT', recebido: '{nivel}'")

    relacao = tensao_medida_v / tensao_referencia_v
    faixas = FAIXAS_TENSAO_PRODIST_BT if nivel_upper == "BT" else FAIXAS_TENSAO_PRODIST_MT

    adeq_min, adeq_max = faixas["ADEQUADA"]
    prec_min, prec_max = faixas["PRECARIA"]

    if adeq_min <= relacao <= adeq_max:
        classificacao = CLASSIFICACAO_ADEQUADA
        aviso_toast = None
    elif prec_min <= relacao < adeq_min or adeq_max < relacao <= prec_max:
        classificacao = CLASSIFICACAO_PRECARIA
        aviso_toast = (
            f"⚠️ Tensão PRECÁRIA conforme PRODIST Módulo 8 (Vc/Vr={relacao:.3f}). "
            "Norma ANEEL/PRODIST aplicada — ABNT NBR 5410 ignorada para este ponto."
        )
    else:
        classificacao = CLASSIFICACAO_CRITICA
        aviso_toast = (
            f"🔴 Tensão CRÍTICA conforme PRODIST Módulo 8 (Vc/Vr={relacao:.3f}). "
            "Norma ANEEL/PRODIST aplicada — ABNT NBR 5410 ignorada para este ponto. "
            "Ação corretiva obrigatória."
        )

    return ResultadoClassificacaoTensao(
        tensao_medida_v=round(tensao_medida_v, 4),
        tensao_referencia_v=round(tensao_referencia_v, 4),
        relacao_vc_vr=round(relacao, 5),
        classificacao=classificacao,
        nivel=nivel_upper,
        norma_aplicada=NORMA_PRODIST,
        aviso_toast=aviso_toast,
    )


def calcular_queda_alimentador_prodist(
    comprimento_m: float,
    corrente_a: float,
    secao_mm2: float,
    tensao_nominal_v: float,
    material: str = "AL",
    num_fases: int = 3,
    tipo_alimentador: str = "BT_ALIMENTADOR",
    fator_potencia: float = 0.92,
) -> ResultadoQuedaAlimentador:
    """
    Calcula queda de tensão com limites PRODIST (Módulo 6).

    Usa a mesma fórmula simplificada do voltage_drop_service, mas aplica os
    limites PRODIST (5% BT alimentador, 2% BT ramal, 3% MT) em vez dos limites
    ABNT (7% BT, 2% MT).

    Quando o PRODIST é mais restritivo que a ABNT (BT alimentador: 5% vs 7%),
    inclui aviso toast explícito de que a ABNT foi ignorada.

    Args:
        comprimento_m: comprimento do trecho em metros
        corrente_a: corrente no trecho em A
        secao_mm2: seção do condutor em mm²
        tensao_nominal_v: tensão nominal em V
        material: "AL" ou "CU"
        num_fases: 1 (monofásico) ou 3 (trifásico)
        tipo_alimentador: "BT_ALIMENTADOR" | "BT_RAMAL" | "MT"
        fator_potencia: cos(φ)

    Returns:
        ResultadoQuedaAlimentador com resultado e aviso toast
    """
    _validate_inputs(comprimento_m, corrente_a, secao_mm2, tensao_nominal_v,
                     material, num_fases, tipo_alimentador, fator_potencia)

    rho = RESISTIVIDADE_CONDUTOR[material.upper()]
    r_trecho = rho / secao_mm2
    k = math.sqrt(3) if num_fases == 3 else 2.0

    queda_v = k * corrente_a * comprimento_m * r_trecho * fator_potencia
    queda_pct = (queda_v / tensao_nominal_v) * 100.0

    limite_prodist = LIMITE_QUEDA_PRODIST_PCT[tipo_alimentador.upper()]
    conforme_prodist = queda_pct <= limite_prodist

    # Limite ABNT equivalente para comparação
    abnt_limite = _limite_abnt_equivalente(tipo_alimentador)
    conforme_abnt = queda_pct <= abnt_limite

    aviso_toast = _gerar_aviso_toast(
        tipo_alimentador, limite_prodist, abnt_limite, queda_pct, conforme_prodist
    )

    return ResultadoQuedaAlimentador(
        queda_v=round(queda_v, 4),
        queda_pct=round(queda_pct, 4),
        corrente_a=round(corrente_a, 4),
        limite_pct=limite_prodist,
        conforme=conforme_prodist,
        tipo_alimentador=tipo_alimentador.upper(),
        norma_aplicada=NORMA_PRODIST,
        abnt_limite_pct=abnt_limite,
        abnt_conforme=conforme_abnt,
        aviso_toast=aviso_toast,
    )


def obter_limites_prodist() -> dict:
    """
    Retorna os limites PRODIST e a comparação com ABNT.

    Returns:
        Dict com limites organizados por tipo de alimentador, incluindo
        referência à norma ABNT correspondente e aviso de precedência.
    """
    return {
        "norma": NORMA_PRODIST,
        "referencia": "PRODIST Módulo 6 e Módulo 8 (ANEEL)",
        "aviso": (
            "Quando normas da concessionária (ANEEL/PRODIST) são aplicadas, "
            "os limites ABNT são substituídos. Um aviso (toast) é exibido ao usuário."
        ),
        "limites_queda": [
            {
                "tipo": "BT_ALIMENTADOR",
                "prodist_pct": LIMITE_QUEDA_PRODIST_PCT["BT_ALIMENTADOR"],
                "abnt_pct": 7.0,
                "abnt_norma": "NBR 5410",
                "mais_restritivo": "PRODIST",
            },
            {
                "tipo": "BT_RAMAL",
                "prodist_pct": LIMITE_QUEDA_PRODIST_PCT["BT_RAMAL"],
                "abnt_pct": 7.0,
                "abnt_norma": "NBR 5410",
                "mais_restritivo": "PRODIST",
            },
            {
                "tipo": "MT",
                "prodist_pct": LIMITE_QUEDA_PRODIST_PCT["MT"],
                "abnt_pct": 2.0,
                "abnt_norma": "NBR 14039",
                "mais_restritivo": "ABNT",
            },
        ],
        "faixas_tensao_bt": {
            "adequada": f"0,93 ≤ Vc/Vr ≤ 1,05",
            "precaria": f"0,90 ≤ Vc/Vr < 0,93  ou  1,05 < Vc/Vr ≤ 1,06",
            "critica": f"Vc/Vr < 0,90  ou  Vc/Vr > 1,06",
        },
        "faixas_tensao_mt": {
            "adequada": f"0,95 ≤ Vc/Vr ≤ 1,05",
            "precaria": f"0,93 ≤ Vc/Vr < 0,95  ou  1,05 < Vc/Vr ≤ 1,06",
            "critica": f"Vc/Vr < 0,93  ou  Vc/Vr > 1,06",
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers internos
# ─────────────────────────────────────────────────────────────────────────────

def _validate_inputs(
    comprimento_m: float,
    corrente_a: float,
    secao_mm2: float,
    tensao_nominal_v: float,
    material: str,
    num_fases: int,
    tipo_alimentador: str,
    fator_potencia: float,
) -> None:
    if comprimento_m <= 0:
        raise ValueError("comprimento_m deve ser positivo")
    if corrente_a < 0:
        raise ValueError("corrente_a não pode ser negativa")
    if secao_mm2 <= 0:
        raise ValueError("secao_mm2 deve ser positiva")
    if tensao_nominal_v <= 0:
        raise ValueError("tensao_nominal_v deve ser positiva")
    if material.upper() not in RESISTIVIDADE_CONDUTOR:
        raise ValueError(f"material inválido: '{material}'. Aceitos: AL, CU")
    if num_fases not in (1, 3):
        raise ValueError("num_fases deve ser 1 ou 3")
    if tipo_alimentador.upper() not in LIMITE_QUEDA_PRODIST_PCT:
        raise ValueError(
            f"tipo_alimentador inválido: '{tipo_alimentador}'. "
            f"Aceitos: {list(LIMITE_QUEDA_PRODIST_PCT.keys())}"
        )
    if not (0.0 < fator_potencia <= 1.0):
        raise ValueError("fator_potencia deve estar entre 0 (exclusive) e 1")


def _limite_abnt_equivalente(tipo_alimentador: str) -> float:
    """Retorna o limite ABNT equivalente ao tipo de alimentador PRODIST."""
    tipo = tipo_alimentador.upper()
    if tipo == "MT":
        return 2.0   # NBR 14039
    return 7.0       # NBR 5410 (BT_ALIMENTADOR e BT_RAMAL)


def _gerar_aviso_toast(
    tipo_alimentador: str,
    limite_prodist: float,
    limite_abnt: float,
    queda_pct: float,
    conforme_prodist: bool,
) -> Optional[str]:
    """Gera mensagem de aviso toast quando PRODIST é aplicado no lugar da ABNT."""
    tipo = tipo_alimentador.upper()
    if limite_prodist < limite_abnt:
        # PRODIST é mais restritivo — sempre avisar que ABNT foi ignorada
        if not conforme_prodist and queda_pct <= limite_abnt:
            # Situação em que passaria pela ABNT mas falha pelo PRODIST
            return (
                f"⚠️ Queda de tensão {queda_pct:.2f}% aprovada pela ABNT ({limite_abnt:.0f}%) "
                f"mas REPROVADA pelo PRODIST/ANEEL ({limite_prodist:.0f}% — {tipo}). "
                "Norma da concessionária (ANEEL/PRODIST) aplicada — ABNT ignorada."
            )
        # Conforme PRODIST, mas ainda assim informar qual norma está ativa
        return (
            f"ℹ️ Norma ANEEL/PRODIST aplicada (limite {limite_prodist:.0f}% para {tipo}). "
            "ABNT NBR 5410 ignorada conforme norma da concessionária."
        )
    # MT: ABNT (2%) mais restritivo que PRODIST (3%) — informar que PRODIST é aplicado
    # mesmo sendo menos restritivo (norma da concessionária tem precedência)
    return (
        f"ℹ️ Norma ANEEL/PRODIST aplicada (limite {limite_prodist:.0f}% para {tipo}). "
        f"ABNT NBR 14039 (limite {limite_abnt:.0f}%) é mais restritiva mas é ignorada "
        "conforme norma da concessionária (ANEEL/PRODIST)."
    )
