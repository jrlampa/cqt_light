"""
CQT Light — API Router IFC (Half-way BIM)
Endpoints para exportação e validação de rede elétrica no formato IFC2X3 STEP.
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

from services.ifc_service import generate_ifc, validate_ifc
from domain.entities import (
    RedeEletrica, Poste, TrechoRede, Transformador,
    NIVEIS_VALIDOS,
)

router = APIRouter()


# ─── Modelos de entrada ───────────────────────────────────────────────────────

class PosteModel(BaseModel):
    id: str = Field(..., description="Identificador do poste")
    x: float = Field(..., description="Coordenada X (metros)")
    y: float = Field(..., description="Coordenada Y (metros)")
    altura_m: float = Field(11.0, ge=0.1, description="Altura do poste (m)")
    carga_dan: int = Field(300, gt=0, description="Carga mecânica (daN)")
    descricao: str = Field("", description="Descrição")

    model_config = {"json_schema_extra": {
        "example": {"id": "01", "x": 0.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300}
    }}


class TrechoModel(BaseModel):
    poste_a: str = Field(..., description="ID do poste de origem")
    poste_b: str = Field(..., description="ID do poste de destino")
    nivel: str = Field("BT", description="Nível de tensão: 'MT' ou 'BT'")
    condutor: str = Field("", description="Código do condutor")

    @field_validator("nivel")
    @classmethod
    def validar_nivel(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in NIVEIS_VALIDOS:
            raise ValueError(f"nivel deve ser um de: {sorted(NIVEIS_VALIDOS)}")
        return v_upper


class TransformadorModel(BaseModel):
    id: str = Field(..., description="Identificador do transformador")
    poste_id: str = Field(..., description="ID do poste onde está instalado")
    potencia_kva: float = Field(30.0, gt=0, description="Potência nominal (kVA)")


class ExportIFCRequest(BaseModel):
    postes: list[PosteModel] = Field(..., min_length=1)
    trechos: list[TrechoModel] = Field(default_factory=list)
    transformadores: list[TransformadorModel] = Field(default_factory=list)
    titulo: str = Field("REDE DE DISTRIBUIÇÃO", description="Título do projeto")
    escala: str = Field("S/E", description="Escala do projeto")

    model_config = {"json_schema_extra": {"example": {
        "postes": [
            {"id": "01", "x": 0.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300},
            {"id": "02", "x": 50.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300},
        ],
        "trechos": [{"poste_a": "01", "poste_b": "02", "nivel": "BT", "condutor": "70mm²"}],
        "transformadores": [{"id": "01", "poste_id": "01", "potencia_kva": 75.0}],
        "titulo": "REDE BT EXEMPLO",
        "escala": "S/E",
    }}}


class ValidateIFCRequest(BaseModel):
    ifc_content: str = Field(..., description="Conteúdo do arquivo IFC em texto")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/export",
    summary="Exportar rede elétrica em formato IFC2X3 (BIM)",
    response_description="Arquivo IFC2X3 STEP para uso em software BIM",
    tags=["Half-way BIM"],
)
async def export_ifc(req: ExportIFCRequest) -> Response:
    """
    Exporta rede elétrica para formato **IFC2X3 STEP** (Half-way BIM).

    - Postes → `IFCCOLUMN` com propriedades (altura, carga mecânica)
    - Trechos de rede → `IFCFLOWSEGMENT` com nível de tensão (BT/MT)
    - Transformadores → `IFCELECTRICALDISTRIBUTIONELEMENT` com potência kVA

    O arquivo gerado pode ser aberto em softwares BIM (FreeCAD, BIM Vision, etc.).
    """
    rede = RedeEletrica(
        postes=[Poste(**p.model_dump()) for p in req.postes],
        trechos=[TrechoRede(**t.model_dump()) for t in req.trechos],
        transformadores=[Transformador(**t.model_dump()) for t in req.transformadores],
        titulo=req.titulo,
        escala=req.escala,
    )
    ifc_bytes = generate_ifc(rede)
    return Response(
        content=ifc_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=rede_eletrica.ifc"},
    )


@router.post(
    "/validate",
    summary="Validar arquivo IFC gerado",
    tags=["Half-way BIM"],
)
async def validate_ifc_endpoint(req: ValidateIFCRequest) -> dict:
    """
    Valida a estrutura de um arquivo IFC2X3 gerado.

    Verifica:
    - Presença de cabeçalho ISO-10303-21
    - Schema IFC2X3
    - Entidade IFCPROJECT
    - Contagem de entidades (postes, trechos, transformadores)
    """
    result = validate_ifc(req.ifc_content.encode("utf-8"))
    return result
