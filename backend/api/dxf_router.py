"""
CQT Light — Router DXF
Endpoints para geração e validação de arquivos DXF 2.5D de redes elétricas.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import List, Optional

from services.dxf_service import (
    RedeEletrica, Poste, TrechoRede, Transformador,
    generate_dxf, validate_dxf,
)

router = APIRouter()


class PosteModel(BaseModel):
    id: str
    x: float = Field(..., description="Coordenada X (planta) em metros")
    y: float = Field(..., description="Coordenada Y (planta) em metros")
    altura_m: float = Field(11.0, description="Altura do poste em metros")
    carga_dan: int = Field(300, description="Carga mecânica em daN")
    descricao: str = ""


class TrechoModel(BaseModel):
    poste_a: str
    poste_b: str
    nivel: str = Field("MT", description="'MT' ou 'BT'")
    condutor: str = ""


class TransformadorModel(BaseModel):
    id: str
    poste_id: str
    potencia_kva: float = 30.0


class RedeEletricaModel(BaseModel):
    postes: List[PosteModel] = []
    trechos: List[TrechoModel] = []
    transformadores: List[TransformadorModel] = []
    titulo: str = "REDE DE DISTRIBUIÇÃO"
    escala: str = "S/E"


@router.post(
    "/generate",
    summary="Gerar DXF 2.5D de rede elétrica",
    response_class=Response,
    responses={200: {"content": {"application/octet-stream": {}}}},
)
async def generate_dxf_endpoint(body: RedeEletricaModel):
    """
    Gera arquivo DXF 2.5D com postes, trechos de rede e transformadores.
    Compatível com AutoCAD R2010+. Segue ABNT NBR 6492.
    """
    try:
        rede = RedeEletrica(
            postes=[Poste(**p.model_dump()) for p in body.postes],
            trechos=[TrechoRede(**t.model_dump()) for t in body.trechos],
            transformadores=[Transformador(**tr.model_dump()) for tr in body.transformadores],
            titulo=body.titulo,
            escala=body.escala,
        )
        dxf_bytes = generate_dxf(rede)
        return Response(
            content=dxf_bytes,
            media_type="application/dxf",
            headers={"Content-Disposition": "attachment; filename=rede_eletrica.dxf"},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate", summary="Validar arquivo DXF")
async def validate_dxf_endpoint(body: RedeEletricaModel):
    """Gera e valida um DXF, retornando estatísticas de entidades e camadas."""
    try:
        rede = RedeEletrica(
            postes=[Poste(**p.model_dump()) for p in body.postes],
            trechos=[TrechoRede(**t.model_dump()) for t in body.trechos],
            transformadores=[Transformador(**tr.model_dump()) for tr in body.transformadores],
            titulo=body.titulo,
            escala=body.escala,
        )
        dxf_bytes = generate_dxf(rede)
        result = validate_dxf(dxf_bytes)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
