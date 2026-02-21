"""
CQT Light — Serviço de Cálculo de Queda de Tensão
Implementa o cálculo conforme ABNT NBR 5410 (BT) e NBR 14039 (MT).

Método simplificado por trecho:
  ΔU = k × I × L × (R·cos(φ) + X·sin(φ))

Onde:
  k = 2 (monofásico) ou √3 (trifásico)
  R = ρ / A  [Ω/m]
  X ≈ 0 (desprezado para redes de distribuição BT/MT típicas)
  L = comprimento do trecho em metros
  I = corrente no trecho em A
"""

from __future__ import annotations

import math
from typing import List

from domain.entities import (
    TrechoEletrico,
    CargaEletrica,
    ResultadoQuedaTensao,
    ResultadoRedeEletrica,
    RESISTIVIDADE_CONDUTOR,
    LIMITE_QUEDA_PCT,
)


def calcular_corrente(
    potencia_w: float,
    tensao_v: float,
    fator_potencia: float,
    num_fases: int,
) -> float:
    """
    Calcula a corrente de linha para uma carga.

    Args:
        potencia_w: potência ativa em W
        tensao_v: tensão de linha (fase-fase) em V
        fator_potencia: cos(φ)
        num_fases: 1 (monofásico) ou 3 (trifásico)

    Returns:
        corrente em A
    """
    if num_fases == 3:
        # P = √3 × V_linha × I × cos(φ)
        return potencia_w / (math.sqrt(3) * tensao_v * fator_potencia)
    # P = V × I × cos(φ)  — tensao_v interpretada como fase-neutro
    return potencia_w / (tensao_v * fator_potencia)


def calcular_queda_trecho(
    trecho: TrechoEletrico,
    corrente_a: float,
    tensao_nominal_v: float,
    fator_potencia: float = 0.92,
) -> ResultadoQuedaTensao:
    """
    Calcula a queda de tensão num trecho de rede.

    Fórmula ABNT NBR 5410 (simplificada, sem reatância):
        ΔU = k × I × L × R   [V]
        ΔU% = (ΔU / V_nominal) × 100

    Onde:
        k = 2 (monofásico) ou √3 (trifásico)
        R = ρ / A  [Ω/m]
        L = comprimento [m]

    Args:
        trecho: dados físicos do trecho
        corrente_a: corrente que circula no trecho (A)
        tensao_nominal_v: tensão nominal da rede (V)
        fator_potencia: cos(φ) para componente resistiva

    Returns:
        ResultadoQuedaTensao com queda em V e %
    """
    rho = RESISTIVIDADE_CONDUTOR[trecho.material]  # Ω·mm²/m
    r_trecho = rho / trecho.secao_mm2              # Ω/m

    # Fator de fase: √3 para 3F, 2 para monofásico+N
    k = math.sqrt(3) if trecho.num_fases == 3 else 2.0

    # Componente resistiva: ΔU = k × I × L × R × cos(φ)
    # Componente reativa desprezada (X ≈ 0.08 Ω/km, pequeno para BT curtos)
    queda_v = k * corrente_a * trecho.comprimento_m * r_trecho * fator_potencia

    queda_pct = (queda_v / tensao_nominal_v) * 100.0

    limite = LIMITE_QUEDA_PCT.get(trecho.nivel, 7.0)
    conforme = queda_pct <= limite

    return ResultadoQuedaTensao(
        trecho_id=trecho.id,
        poste_a=trecho.poste_a,
        poste_b=trecho.poste_b,
        queda_v=round(queda_v, 4),
        queda_pct=round(queda_pct, 4),
        corrente_a=round(corrente_a, 4),
        conforme=conforme,
    )


def calcular_rede(
    trechos: List[TrechoEletrico],
    cargas: List[CargaEletrica],
    tensao_nominal_v: float = 220.0,
) -> ResultadoRedeEletrica:
    """
    Calcula a queda de tensão para toda a rede.

    A carga total é distribuída igualmente pelos trechos (modelo simplificado
    para redes radiais onde cada trecho leva toda a carga a jusante).
    Para redes com carga concentrada no nó terminal, usa a carga do nó destino.

    Args:
        trechos: lista de trechos físicos da rede
        cargas: lista de cargas por poste
        tensao_nominal_v: tensão nominal da rede em V

    Returns:
        ResultadoRedeEletrica com resultados por trecho e resumo
    """
    # Mapa de carga por poste
    carga_por_poste: dict[str, CargaEletrica] = {c.poste_id: c for c in cargas}

    resultados: List[ResultadoQuedaTensao] = []
    queda_acumulada_v = 0.0

    for trecho in trechos:
        # Usa a carga do poste destino; se não houver, assume carga mínima simbólica
        carga = carga_por_poste.get(trecho.poste_b)
        if carga is None:
            # Trecho sem carga associada: corrente residual de perdas
            corrente = 0.0
        else:
            corrente = calcular_corrente(
                potencia_w=carga.potencia_w,
                tensao_v=tensao_nominal_v,
                fator_potencia=carga.fator_potencia,
                num_fases=trecho.num_fases,
            )

        resultado = calcular_queda_trecho(
            trecho=trecho,
            corrente_a=corrente,
            tensao_nominal_v=tensao_nominal_v,
            fator_potencia=carga.fator_potencia if carga else 0.92,
        )
        resultados.append(resultado)
        queda_acumulada_v += resultado.queda_v

    queda_maxima_pct = max((r.queda_pct for r in resultados), default=0.0)
    nivel_dominante = trechos[0].nivel if trechos else "BT"
    limite_pct = LIMITE_QUEDA_PCT.get(nivel_dominante, 7.0)
    rede_conforme = all(r.conforme for r in resultados)

    return ResultadoRedeEletrica(
        trechos=resultados,
        queda_maxima_pct=round(queda_maxima_pct, 4),
        queda_total_v=round(queda_acumulada_v, 4),
        tensao_nominal_v=tensao_nominal_v,
        limite_pct=limite_pct,
        rede_conforme=rede_conforme,
    )
