"""
CQT Light — Router de Queda de Tensão
Endpoints para cálculo de queda de tensão em redes de distribuição BT/MT.
Conforme ABNT NBR 5410 (BT) e NBR 14039 (MT).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List

from domain.entities import (
    TrechoEletrico,
    CargaEletrica,
    NIVEIS_VALIDOS,
    MATERIAIS_CONDUTOR_VALIDOS,
    TENSOES_NOMINAIS_V,
)
from services.voltage_drop_service import calcular_rede

router = APIRouter()


class TrechoEletricoModel(BaseModel):
    id: str
    poste_a: str
    poste_b: str
    comprimento_m: float = Field(..., gt=0, description="Comprimento do trecho em metros (> 0)")
    secao_mm2: float = Field(35.0, gt=0, description="Seção do condutor em mm²")
    nivel: str = Field("BT", description="'MT' ou 'BT'")
    material: str = Field("AL", description="'AL' (alumínio) ou 'CU' (cobre)")
    num_fases: int = Field(3, description="Número de fases: 1 ou 3")

    @field_validator("nivel")
    @classmethod
    def nivel_valido(cls, v: str) -> str:
        u = v.upper()
        if u not in NIVEIS_VALIDOS:
            raise ValueError(f"nivel deve ser 'MT' ou 'BT', recebido: '{v}'")
        return u

    @field_validator("material")
    @classmethod
    def material_valido(cls, v: str) -> str:
        u = v.upper()
        if u not in MATERIAIS_CONDUTOR_VALIDOS:
            raise ValueError(f"material deve ser 'AL' ou 'CU', recebido: '{v}'")
        return u

    @field_validator("num_fases")
    @classmethod
    def num_fases_valido(cls, v: int) -> int:
        if v not in (1, 3):
            raise ValueError("num_fases deve ser 1 (monofásico) ou 3 (trifásico)")
        return v


class CargaEletricaModel(BaseModel):
    poste_id: str
    potencia_w: float = Field(..., ge=0, description="Potência ativa em W (>= 0)")
    fator_potencia: float = Field(0.92, gt=0, le=1.0, description="cos(φ) entre 0 e 1")


class RedeEletricaCalcModel(BaseModel):
    trechos: List[TrechoEletricoModel] = Field(..., min_length=1, description="Ao menos 1 trecho")
    cargas: List[CargaEletricaModel] = []
    tensao_nominal_v: float = Field(
        220.0,
        gt=0,
        description="Tensão nominal da rede em V (ex: 127, 220, 380, 13800)",
    )


@router.post(
    "/calcular",
    summary="Calcular queda de tensão da rede (ABNT NBR 5410 / NBR 14039)",
)
async def calcular_queda_tensao(body: RedeEletricaCalcModel):
    """
    Calcula a queda de tensão por trecho e verifica conformidade com ABNT.

    - **BT**: limite 7% (NBR 5410 / PRODIST Módulo 8)
    - **MT**: limite 2% (NBR 14039)

    Retorna resultado por trecho e diagnóstico da rede.
    """
    try:
        trechos = [
            TrechoEletrico(
                id=t.id,
                poste_a=t.poste_a,
                poste_b=t.poste_b,
                comprimento_m=t.comprimento_m,
                secao_mm2=t.secao_mm2,
                nivel=t.nivel,
                material=t.material,
                num_fases=t.num_fases,
            )
            for t in body.trechos
        ]
        cargas = [
            CargaEletrica(
                poste_id=c.poste_id,
                potencia_w=c.potencia_w,
                fator_potencia=c.fator_potencia,
            )
            for c in body.cargas
        ]

        resultado = calcular_rede(
            trechos=trechos,
            cargas=cargas,
            tensao_nominal_v=body.tensao_nominal_v,
        )

        return {
            "trechos": [
                {
                    "trecho_id": r.trecho_id,
                    "poste_a": r.poste_a,
                    "poste_b": r.poste_b,
                    "queda_v": r.queda_v,
                    "queda_pct": r.queda_pct,
                    "corrente_a": r.corrente_a,
                    "conforme": r.conforme,
                }
                for r in resultado.trechos
            ],
            "resumo": {
                "queda_maxima_pct": resultado.queda_maxima_pct,
                "queda_total_v": resultado.queda_total_v,
                "tensao_nominal_v": resultado.tensao_nominal_v,
                "limite_pct": resultado.limite_pct,
                "rede_conforme": resultado.rede_conforme,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/tensoes",
    summary="Listar tensões nominais disponíveis",
)
async def listar_tensoes():
    """Retorna as tensões nominais padrão de redes de distribuição brasileiras."""
    return {
        "tensoes": [
            {"codigo": k, "valor_v": v, "descricao": k.replace("_", " ")}
            for k, v in TENSOES_NOMINAIS_V.items()
        ]
    }
