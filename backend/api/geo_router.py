"""
CQT Light — Router de Georreferenciamento
Endpoints para conversão UTM↔decimal e cálculo de buffer.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from services.geo_service import (
    utm_to_decimal,
    decimal_to_utm,
    calculate_buffer_bbox,
)

router = APIRouter()


class UTMInput(BaseModel):
    easting: float = Field(..., description="Coordenada E em metros", json_schema_extra={"example": 788547.0})
    northing: float = Field(..., description="Coordenada N em metros", json_schema_extra={"example": 7634925.0})
    zone_number: int = Field(23, description="Número da faixa UTM")
    northern: bool = Field(False, description="True para hemisfério norte")


class DecimalInput(BaseModel):
    latitude: float = Field(..., description="Latitude em graus decimais", json_schema_extra={"example": -22.15018})
    longitude: float = Field(..., description="Longitude em graus decimais", json_schema_extra={"example": -42.92185})


class BufferInput(BaseModel):
    latitude: float = Field(..., json_schema_extra={"example": -22.15018})
    longitude: float = Field(..., json_schema_extra={"example": -42.92185})
    radius_m: float = Field(..., description="Raio em metros (100, 500, 1000)", json_schema_extra={"example": 500.0})

    @field_validator("radius_m")
    @classmethod
    def radius_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("radius_m deve ser positivo (> 0)")
        return v


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
