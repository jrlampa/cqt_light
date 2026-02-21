"""
CQT Light — Router de Georreferenciamento
Endpoints para conversão UTM↔decimal e cálculo de buffer.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.geo_service import (
    utm_to_decimal,
    decimal_to_utm,
    calculate_buffer_bbox,
)

router = APIRouter()


class UTMInput(BaseModel):
    easting: float = Field(..., example=788547.0, description="Coordenada E em metros")
    northing: float = Field(..., example=7634925.0, description="Coordenada N em metros")
    zone_number: int = Field(23, description="Número da faixa UTM")
    northern: bool = Field(False, description="True para hemisfério norte")


class DecimalInput(BaseModel):
    latitude: float = Field(..., example=-22.15018, description="Latitude em graus decimais")
    longitude: float = Field(..., example=-42.92185, description="Longitude em graus decimais")


class BufferInput(BaseModel):
    latitude: float = Field(..., example=-22.15018)
    longitude: float = Field(..., example=-42.92185)
    radius_m: float = Field(..., example=500.0, description="Raio em metros (100, 500, 1000)")


@router.post("/utm-to-decimal", summary="Converter UTM → Decimal")
async def utm_to_decimal_endpoint(body: UTMInput):
    """Converte coordenadas UTM SIRGAS2000 para graus decimais."""
    try:
        result = utm_to_decimal(body.easting, body.northing, body.zone_number, body.northern)
        return {"latitude": result.latitude, "longitude": result.longitude}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/decimal-to-utm", summary="Converter Decimal → UTM")
async def decimal_to_utm_endpoint(body: DecimalInput):
    """Converte graus decimais para UTM WGS84."""
    try:
        easting, northing, zone, northern = decimal_to_utm(body.latitude, body.longitude)
        return {
            "easting": easting,
            "northing": northing,
            "zone_number": zone,
            "northern": northern,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/buffer", summary="Calcular área de influência")
async def buffer_endpoint(body: BufferInput):
    """Calcula bounding box para um raio a partir de um ponto."""
    try:
        result = calculate_buffer_bbox(body.latitude, body.longitude, body.radius_m)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
