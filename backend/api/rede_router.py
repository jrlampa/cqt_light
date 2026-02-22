"""
CQT Light — Router de Análise de Topologia de Rede Elétrica.

Endpoints para análise topológica: conectividade BFS, comprimento de cabos,
estatísticas e avisos de conformidade (ABNT NBR 14565, PRODIST Módulo 6).
"""

from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, field_validator

from domain.entities import NIVEIS_VALIDOS, Poste, TrechoRede, Transformador
from services.rede_analysis_service import ResultadoAnalise, analisar_rede

router = APIRouter(prefix="/api/rede", tags=["Análise de Rede"])


# ─── Modelos de entrada ───────────────────────────────────────────────────────


class PosteInput(BaseModel):
    id: str
    x: float
    y: float
    altura_m: float = 11.0
    carga_dan: int = 300
    descricao: str = ""

    @field_validator("id")
    @classmethod
    def id_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("id não pode ser vazio")
        return v.strip()


class TrechoInput(BaseModel):
    poste_a: str
    poste_b: str
    nivel: str = "MT"

    @field_validator("nivel")
    @classmethod
    def nivel_valido(cls, v: str) -> str:
        v_upper = v.upper().strip()
        if v_upper not in NIVEIS_VALIDOS:
            raise ValueError(f"nivel deve ser MT ou BT, recebido: {v!r}")
        return v_upper


class TransformadorInput(BaseModel):
    id: str
    poste_id: str
    potencia_kva: float = 30.0

    @field_validator("potencia_kva")
    @classmethod
    def potencia_positiva(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("potencia_kva deve ser positiva")
        return v


class RedeInput(BaseModel):
    postes: List[PosteInput]
    trechos: List[TrechoInput]
    transformadores: Optional[List[TransformadorInput]] = None


# ─── Modelos de resposta ──────────────────────────────────────────────────────


class EstatisticasRedeResponse(BaseModel):
    total_postes: int
    total_trechos: int
    total_transformadores: int
    comprimento_total_m: float
    comprimento_mt_m: float
    comprimento_bt_m: float
    potencia_total_kva: float
    conectada: bool
    nos_isolados: int


class ResultadoAnaliseResponse(BaseModel):
    estatisticas: EstatisticasRedeResponse
    ids_isolados: List[str]
    avisos: List[str]


# ─── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/analisar", response_model=ResultadoAnaliseResponse)
def analisar_rede_endpoint(data: RedeInput) -> ResultadoAnaliseResponse:
    """
    Analisa topologia de rede elétrica de distribuição.

    Verifica conectividade via BFS, calcula comprimentos por nível de tensão
    (MT/BT) e emite avisos de conformidade.
    """
    postes = [
        Poste(
            id=p.id,
            x=p.x,
            y=p.y,
            altura_m=p.altura_m,
            carga_dan=p.carga_dan,
            descricao=p.descricao,
        )
        for p in data.postes
    ]
    trechos = [
        TrechoRede(poste_a=t.poste_a, poste_b=t.poste_b, nivel=t.nivel)
        for t in data.trechos
    ]
    transformadores = [
        Transformador(id=t.id, poste_id=t.poste_id, potencia_kva=t.potencia_kva)
        for t in (data.transformadores or [])
    ]

    resultado: ResultadoAnalise = analisar_rede(postes, trechos, transformadores)

    return ResultadoAnaliseResponse(
        estatisticas=EstatisticasRedeResponse(**resultado.estatisticas.__dict__),
        ids_isolados=resultado.ids_isolados,
        avisos=resultado.avisos,
    )
