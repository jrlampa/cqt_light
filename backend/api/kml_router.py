"""
CQT Light — Router de Importação KML/GPX
Importa traçados GPS de campo (Google Earth KML ou dispositivos GPX)
e converte em lista de pontos georeferenciados para geração de DXF.

Zero custo: usa apenas bibliotecas padrão (xml.etree.ElementTree).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.kml_service import importar_trace, TracadoRede

router = APIRouter()


class TraceImportBody(BaseModel):
    conteudo_xml: str = Field(
        ...,
        min_length=10,
        description="Conteúdo textual do arquivo KML ou GPX",
    )
    nome_arquivo: str = Field(
        "",
        max_length=255,
        description="Nome do arquivo de origem (ex: levantamento.kml)",
    )


@router.post(
    "/importar",
    summary="Importar traçado GPS (KML ou GPX)",
)
async def importar_tracado(body: TraceImportBody):
    """
    Importa traçado GPS de um arquivo KML (Google Earth) ou GPX (GPS devices).

    Retorna lista de pontos com coordenadas decimais e comprimento total estimado.
    Pode ser usado para gerar DXF 2.5D com as coordenadas reais do campo.

    **Coordenadas de teste**:
    - Google Earth 23K: 788547 E, 7634925 N
    - Decimal: -22.15018, -42.92185
    """
    try:
        resultado = importar_trace(body.conteudo_xml, body.nome_arquivo)
        return {
            "formato": resultado.formato,
            "nome_arquivo": resultado.nome_arquivo,
            "total_pontos": resultado.total_pontos,
            "comprimento_total_m": resultado.comprimento_total_m,
            "pontos": [
                {
                    "id": p.id,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "altitude_m": p.altitude_m,
                    "nome": p.nome,
                }
                for p in resultado.pontos
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
