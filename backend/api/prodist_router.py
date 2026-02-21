"""
CQT Light — Router ANEEL/PRODIST
Endpoints para classificação de tensão e cálculo de queda conforme
PRODIST Módulo 8 (Qualidade) e Módulo 6 (Acesso ao Sistema).

Quando normas da concessionária são aplicadas, ABNT é ignorada e um
aviso explícito (aviso_toast) é incluído na resposta para exibição
no frontend (toast em pt-BR).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from domain.entities import (
    RESISTIVIDADE_CONDUTOR,
    LIMITE_QUEDA_PRODIST_PCT,
    NORMA_PRODIST,
)
from services.prodist_service import (
    classificar_tensao_prodist,
    calcular_queda_alimentador_prodist,
    obter_limites_prodist,
)

router = APIRouter()

_TIPOS_ALIMENTADOR = set(LIMITE_QUEDA_PRODIST_PCT.keys())
_MATERIAIS_VALIDOS = set(RESISTIVIDADE_CONDUTOR.keys())


# ─────────────────────────────────────────────────────────────────────────────
# Modelos de entrada (sanitizados via Pydantic)
# ─────────────────────────────────────────────────────────────────────────────

class ClassificacaoTensaoModel(BaseModel):
    tensao_medida_v: float = Field(
        ...,
        gt=0,
        description="Tensão medida no ponto de entrega em Volts (> 0)",
        json_schema_extra={"example": 209.0},
    )
    tensao_referencia_v: float = Field(
        ...,
        gt=0,
        description="Tensão de referência (nominal/contratada) em Volts (> 0)",
        json_schema_extra={"example": 220.0},
    )
    nivel: str = Field(
        "BT",
        description="Nível de tensão: 'BT' (≤ 1 kV) ou 'MT' (> 1 kV até 69 kV)",
        json_schema_extra={"example": "BT"},
    )

    @field_validator("nivel")
    @classmethod
    def nivel_valido(cls, v: str) -> str:
        u = v.upper()
        if u not in ("BT", "MT"):
            raise ValueError(f"nivel deve ser 'BT' ou 'MT', recebido: '{v}'")
        return u


class QuedaAlimentadorModel(BaseModel):
    comprimento_m: float = Field(
        ..., gt=0, description="Comprimento do trecho em metros",
        json_schema_extra={"example": 100.0},
    )
    corrente_a: float = Field(
        ..., ge=0, description="Corrente no trecho em Ampères (>= 0)",
        json_schema_extra={"example": 45.0},
    )
    secao_mm2: float = Field(
        35.0, gt=0, description="Seção do condutor em mm²",
        json_schema_extra={"example": 35.0},
    )
    tensao_nominal_v: float = Field(
        220.0, gt=0, description="Tensão nominal da rede em Volts",
        json_schema_extra={"example": 220.0},
    )
    material: str = Field(
        "AL", description="Material do condutor: 'AL' (alumínio) ou 'CU' (cobre)",
        json_schema_extra={"example": "AL"},
    )
    num_fases: int = Field(
        3, description="Número de fases: 1 (monofásico+N) ou 3 (trifásico)",
        json_schema_extra={"example": 3},
    )
    tipo_alimentador: str = Field(
        "BT_ALIMENTADOR",
        description="Tipo: 'BT_ALIMENTADOR' (lim. 5%), 'BT_RAMAL' (lim. 2%), 'MT' (lim. 3%)",
        json_schema_extra={"example": "BT_ALIMENTADOR"},
    )
    fator_potencia: float = Field(
        0.92, gt=0, le=1.0, description="Fator de potência cos(φ) entre 0 e 1",
        json_schema_extra={"example": 0.92},
    )

    @field_validator("material")
    @classmethod
    def material_valido(cls, v: str) -> str:
        u = v.upper()
        if u not in _MATERIAIS_VALIDOS:
            raise ValueError(f"material deve ser 'AL' ou 'CU', recebido: '{v}'")
        return u

    @field_validator("num_fases")
    @classmethod
    def num_fases_valido(cls, v: int) -> int:
        if v not in (1, 3):
            raise ValueError("num_fases deve ser 1 (monofásico) ou 3 (trifásico)")
        return v

    @field_validator("tipo_alimentador")
    @classmethod
    def tipo_alimentador_valido(cls, v: str) -> str:
        u = v.upper()
        if u not in _TIPOS_ALIMENTADOR:
            raise ValueError(
                f"tipo_alimentador deve ser um de {sorted(_TIPOS_ALIMENTADOR)}, recebido: '{v}'"
            )
        return u


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/classificar-tensao",
    summary="Classificar tensão conforme PRODIST Módulo 8 (ADEQUADA/PRECÁRIA/CRÍTICA)",
)
async def classificar_tensao(body: ClassificacaoTensaoModel):
    """
    Classifica a tensão de atendimento conforme **PRODIST Módulo 8** (ANEEL).

    - **ADEQUADA**: Vc/Vr ∈ [0,93; 1,05] (BT) | [0,95; 1,05] (MT)
    - **PRECÁRIA**: fora da faixa adequada mas ainda dentro da tolerada
    - **CRÍTICA**: fora de todos os limites → ação corretiva obrigatória

    Quando a norma **ANEEL/PRODIST** é aplicada, a ABNT NBR 5410 é ignorada
    e um aviso (`aviso_toast`) é incluído na resposta para exibição no frontend.
    """
    try:
        resultado = classificar_tensao_prodist(
            tensao_medida_v=body.tensao_medida_v,
            tensao_referencia_v=body.tensao_referencia_v,
            nivel=body.nivel,
        )
        return {
            "tensao_medida_v": resultado.tensao_medida_v,
            "tensao_referencia_v": resultado.tensao_referencia_v,
            "relacao_vc_vr": resultado.relacao_vc_vr,
            "classificacao": resultado.classificacao,
            "nivel": resultado.nivel,
            "norma_aplicada": resultado.norma_aplicada,
            "aviso_toast": resultado.aviso_toast,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/queda-alimentador",
    summary="Calcular queda de tensão com limites PRODIST/ANEEL (Módulo 6)",
)
async def calcular_queda_alimentador(body: QuedaAlimentadorModel):
    """
    Calcula a queda de tensão em um trecho com os **limites PRODIST** (Módulo 6):

    - **BT Alimentador**: máx **5%** (vs. 7% ABNT NBR 5410)
    - **BT Ramal**: máx **2%**
    - **MT**: máx **3%** (vs. 2% ABNT NBR 14039)

    A resposta inclui comparação com o limite ABNT e aviso (`aviso_toast`)
    explicitando que a norma da concessionária (ANEEL/PRODIST) foi aplicada
    em substituição à ABNT.
    """
    try:
        resultado = calcular_queda_alimentador_prodist(
            comprimento_m=body.comprimento_m,
            corrente_a=body.corrente_a,
            secao_mm2=body.secao_mm2,
            tensao_nominal_v=body.tensao_nominal_v,
            material=body.material,
            num_fases=body.num_fases,
            tipo_alimentador=body.tipo_alimentador,
            fator_potencia=body.fator_potencia,
        )
        return {
            "queda_v": resultado.queda_v,
            "queda_pct": resultado.queda_pct,
            "corrente_a": resultado.corrente_a,
            "limite_pct": resultado.limite_pct,
            "conforme": resultado.conforme,
            "tipo_alimentador": resultado.tipo_alimentador,
            "norma_aplicada": resultado.norma_aplicada,
            "abnt_limite_pct": resultado.abnt_limite_pct,
            "abnt_conforme": resultado.abnt_conforme,
            "aviso_toast": resultado.aviso_toast,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/limites",
    summary="Listar limites PRODIST/ANEEL e comparação com ABNT",
)
async def listar_limites_prodist():
    """
    Retorna os limites de queda de tensão e faixas de classificação conforme
    **PRODIST Módulo 6 e Módulo 8** (ANEEL), com comparação aos equivalentes ABNT.
    """
    return obter_limites_prodist()
