"""
CQT Light — Entidades de Domínio (DDD)
Domínio: Rede Elétrica de Distribuição BT/MT.

Estas dataclasses representam as entidades puras do domínio,
sem dependências de infraestrutura (ezdxf, FastAPI, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

# Níveis de tensão válidos
NIVEL_MT = "MT"
NIVEL_BT = "BT"
NIVEIS_VALIDOS = {NIVEL_MT, NIVEL_BT}

# Camadas ABNT para redes elétricas (definidas no domínio, usadas na infra)
LAYERS_CONFIG: dict = {
    "POSTES":        {"color": 2,  "linetype": "CONTINUOUS"},  # amarelo
    "REDE_MT":       {"color": 1,  "linetype": "CONTINUOUS"},  # vermelho
    "REDE_BT":       {"color": 3,  "linetype": "CONTINUOUS"},  # verde
    "TRANSFORMADOR": {"color": 4,  "linetype": "CONTINUOUS"},  # ciano
    "TEXTO":         {"color": 7,  "linetype": "CONTINUOUS"},  # branco/preto
    "COTA":          {"color": 8,  "linetype": "CONTINUOUS"},  # cinza
}


@dataclass
class Poste:
    """
    Entidade de domínio: Poste de distribuição elétrica.
    Representa um poste na planta 2.5D.
    """
    id: str
    x: float           # Coordenada X em metros (planta)
    y: float           # Coordenada Y em metros (planta)
    altura_m: float = 11.0      # Altura padrão ABNT: 9, 11 ou 13 m
    carga_dan: int = 300        # Carga mecânica: 150, 300, 600, 1000 daN
    descricao: str = ""


@dataclass
class TrechoRede:
    """
    Entidade de domínio: Trecho de rede entre dois postes.
    Representa um segmento de condutor na rede de distribuição.
    """
    poste_a: str
    poste_b: str
    nivel: str = NIVEL_MT   # "MT" (Média Tensão) ou "BT" (Baixa Tensão)
    condutor: str = ""      # Código do condutor (ex: "CAA 35mm²")

    def __post_init__(self) -> None:
        if self.nivel not in NIVEIS_VALIDOS:
            raise ValueError(
                f"Nível inválido '{self.nivel}'. Valores aceitos: {sorted(NIVEIS_VALIDOS)}"
            )


@dataclass
class Transformador:
    """
    Entidade de domínio: Transformador de distribuição.
    Associado a um poste da rede.
    """
    id: str
    poste_id: str
    potencia_kva: float = 30.0   # Potências padrão: 15, 30, 45, 75, 112.5, 150 kVA


@dataclass
class RedeEletrica:
    """
    Agregado de domínio: Rede elétrica de distribuição.
    Contém postes, trechos e transformadores para geração DXF.
    """
    postes: List[Poste] = field(default_factory=list)
    trechos: List[TrechoRede] = field(default_factory=list)
    transformadores: List[Transformador] = field(default_factory=list)
    titulo: str = "REDE DE DISTRIBUIÇÃO"
    escala: str = "S/E"

    def get_poste(self, poste_id: str) -> Poste | None:
        """Localiza um poste pelo ID."""
        for p in self.postes:
            if p.id == poste_id:
                return p
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Domínio: Cálculo Elétrico (Queda de Tensão — ABNT NBR 5410 / NBR 14039)
# ─────────────────────────────────────────────────────────────────────────────

# Resistividade por material de condutor a 70 °C (temperatura de operação)
# Unidade: Ω·mm²/m
RESISTIVIDADE_CONDUTOR: dict = {
    "AL": 0.028264,   # Alumínio (CAA, ACSR, AAC)
    "CU": 0.018510,   # Cobre
}

# Tensões nominais de rede mais comuns no Brasil
TENSOES_NOMINAIS_V: dict = {
    "BT_127":   127.0,   # Monofásico neutro (BT)
    "BT_220":   220.0,   # Bifásico (BT)
    "BT_380":   380.0,   # Trifásico (BT)
    "MT_13800": 13800.0, # Média tensão 13,8 kV
    "MT_34500": 34500.0, # Média tensão 34,5 kV
}

# Limite de queda de tensão por nível (ABNT NBR 5410 / PRODIST Módulo 8)
LIMITE_QUEDA_PCT: dict = {
    "BT": 7.0,   # % (da geração até o ponto de utilização)
    "MT": 2.0,   # % (subtransmissão)
}

MATERIAIS_CONDUTOR_VALIDOS = set(RESISTIVIDADE_CONDUTOR.keys())

# ─────────────────────────────────────────────────────────────────────────────
# Domínio: ANEEL / PRODIST — Qualidade de Tensão e Limites de Queda
# Referência: PRODIST Módulo 8 (Rev. 11, 2022) e Módulo 6
# ─────────────────────────────────────────────────────────────────────────────

# Faixas de tensão PRODIST Módulo 8 — relativas à tensão de referência (Vr)
# Pontos de entrega BT (até 1 kV), faixa de tensão de atendimento (TAN)
FAIXAS_TENSAO_PRODIST_BT: dict = {
    # (limite_inferior_relativo, limite_superior_relativo)
    "ADEQUADA":  (0.93, 1.05),   # Vc/Vr ∈ [0.93, 1.05]
    "PRECARIA":  (0.90, 1.06),   # 0.90≤Vc/Vr<0.93 ou 1.05<Vc/Vr≤1.06
    # "CRITICA" = fora das duas faixas acima
}

# Faixas de tensão PRODIST Módulo 8 — MT (acima de 1 kV até 69 kV)
FAIXAS_TENSAO_PRODIST_MT: dict = {
    "ADEQUADA":  (0.95, 1.05),   # Vc/Vr ∈ [0.95, 1.05]
    "PRECARIA":  (0.93, 1.06),   # 0.93≤Vc/Vr<0.95 ou 1.05<Vc/Vr≤1.06
}

# Limites de queda de tensão PRODIST / ANEEL (mais restritivos que ABNT)
# Referência: PRODIST Módulo 6 (Acesso ao Sistema) e Módulo 8
LIMITE_QUEDA_PRODIST_PCT: dict = {
    "BT_ALIMENTADOR": 5.0,  # Alimentador BT: máx 5% (PRODIST Módulo 6)
    "BT_RAMAL":       2.0,  # Ramal de ligação BT: máx 2%
    "MT":             3.0,  # Subtransmissão MT: máx 3% (PRODIST Módulo 6)
}

# Classificação de tensão (constante de domínio)
CLASSIFICACAO_ADEQUADA = "ADEQUADA"
CLASSIFICACAO_PRECARIA = "PRECÁRIA"
CLASSIFICACAO_CRITICA  = "CRÍTICA"

# Enum-like para norma aplicada (evita dependência de enum stdlib em entidades puras)
NORMA_ABNT    = "ABNT"
NORMA_PRODIST = "ANEEL_PRODIST"


@dataclass
class TrechoEletrico:
    """
    Entidade de domínio: Trecho de rede com dados físicos para cálculo elétrico.
    Representa um segmento de condutor com comprimento e seção transversal conhecidos.
    """
    id: str
    poste_a: str
    poste_b: str
    comprimento_m: float          # Comprimento real do trecho (campo ou planta)
    secao_mm2: float = 35.0       # Seção do condutor em mm² (ex: 35, 70, 120)
    nivel: str = NIVEL_BT
    material: str = "AL"          # "AL" (alumínio) ou "CU" (cobre)
    num_fases: int = 3            # 1 = monofásico+N, 3 = trifásico

    def __post_init__(self) -> None:
        if self.nivel not in NIVEIS_VALIDOS:
            raise ValueError(f"Nível inválido '{self.nivel}'. Aceitos: {sorted(NIVEIS_VALIDOS)}")
        if self.material not in MATERIAIS_CONDUTOR_VALIDOS:
            raise ValueError(f"Material inválido '{self.material}'. Aceitos: {sorted(MATERIAIS_CONDUTOR_VALIDOS)}")
        if self.comprimento_m <= 0:
            raise ValueError("comprimento_m deve ser positivo")
        if self.secao_mm2 <= 0:
            raise ValueError("secao_mm2 deve ser positiva")
        if self.num_fases not in (1, 3):
            raise ValueError("num_fases deve ser 1 (monofásico) ou 3 (trifásico)")


@dataclass
class CargaEletrica:
    """
    Entidade de domínio: Carga elétrica num nó da rede.
    """
    poste_id: str
    potencia_w: float             # Potência ativa em W
    fator_potencia: float = 0.92  # cos(φ) padrão ABNT

    def __post_init__(self) -> None:
        if self.potencia_w < 0:
            raise ValueError("potencia_w não pode ser negativa")
        if not (0.0 < self.fator_potencia <= 1.0):
            raise ValueError("fator_potencia deve estar entre 0 (exclusive) e 1")


@dataclass
class ResultadoQuedaTensao:
    """
    Value Object: Resultado do cálculo de queda de tensão para um trecho.
    """
    trecho_id: str
    poste_a: str
    poste_b: str
    queda_v: float      # Queda de tensão em Volts no trecho
    queda_pct: float    # Queda percentual relativa à tensão nominal
    corrente_a: float   # Corrente no trecho em A
    conforme: bool      # True se dentro do limite ABNT


@dataclass
class ResultadoRedeEletrica:
    """
    Value Object: Resultado agregado do cálculo de queda de tensão da rede.
    """
    trechos: List[ResultadoQuedaTensao]
    queda_maxima_pct: float
    queda_total_v: float
    tensao_nominal_v: float
    limite_pct: float
    rede_conforme: bool   # True se toda a rede está dentro do limite ABNT

