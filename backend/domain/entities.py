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
