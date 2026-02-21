"""
CQT Light — Testes do Serviço de Georreferenciamento
Coordenadas de referência:
  UTM 23K: 788547 E, 7634925 N
  Decimal: -22.15018, -42.92185
Raios: 100m, 500m, 1000m
"""

import math
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from services.geo_service import (
    utm_to_decimal,
    decimal_to_utm,
    calculate_buffer_bbox,
    DecimalCoordinate,
)

# Coordenadas de referência do projeto (MEMORY.md)
# Nota: as coordenadas UTM e decimais do enunciado não correspondem ao mesmo ponto;
# os testes usam roundtrip para validar a consistência da conversão.
REF_LAT  = -22.15018
REF_LON  = -42.92185
ZONE     = 23

# Valores UTM esperados para as coordenadas decimais de referência (SIRGAS2000/WGS84 UTM23S)
REF_EASTING_COMPUTED  = 714315.67
REF_NORTHING_COMPUTED = 7549084.21
TOLERANCE_M           = 10.0   # tolerância de 10 m para pyproj
TOLERANCE_DEG         = 0.0001  # tolerância de ~11 m em graus


class TestUtmToDecimal:
    def test_roundtrip_decimal_to_utm_to_decimal(self):
        """Verifica consistência do roundtrip decimal→UTM→decimal."""
        e, n, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        result = utm_to_decimal(e, n, zone, northern)
        assert abs(result.latitude - REF_LAT) < TOLERANCE_DEG
        assert abs(result.longitude - REF_LON) < TOLERANCE_DEG

    def test_returns_decimal_coordinate(self):
        e, n, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        result = utm_to_decimal(e, n, zone, northern)
        assert isinstance(result, DecimalCoordinate)
        assert isinstance(result.latitude, float)
        assert isinstance(result.longitude, float)

    def test_southern_hemisphere_negative_lat(self):
        e, n, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        result = utm_to_decimal(e, n, zone, northern)
        assert result.latitude < 0, "Hemisfério sul deve retornar latitude negativa"

    def test_precision_six_decimal_places(self):
        e, n, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        result = utm_to_decimal(e, n, zone, northern)
        assert result.latitude == round(result.latitude, 6)
        assert result.longitude == round(result.longitude, 6)


class TestDecimalToUtm:
    def test_reference_coordinates_easting(self):
        easting, northing, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        assert abs(easting - REF_EASTING_COMPUTED) < TOLERANCE_M
        assert abs(northing - REF_NORTHING_COMPUTED) < TOLERANCE_M

    def test_zone_23_for_reference_lon(self):
        _, _, zone, _ = decimal_to_utm(REF_LAT, REF_LON)
        assert zone == ZONE

    def test_southern_hemisphere(self):
        _, _, _, northern = decimal_to_utm(REF_LAT, REF_LON)
        assert not northern

    def test_roundtrip_consistency(self):
        """decimal → UTM → decimal deve ser consistente."""
        e, n, zone, northern = decimal_to_utm(REF_LAT, REF_LON)
        dec = utm_to_decimal(e, n, zone, northern)
        assert abs(dec.latitude - REF_LAT) < TOLERANCE_DEG
        assert abs(dec.longitude - REF_LON) < TOLERANCE_DEG


class TestCalculateBufferBbox:
    @pytest.mark.parametrize("radius_m", [100, 500, 1000])
    def test_buffer_radii(self, radius_m):
        result = calculate_buffer_bbox(REF_LAT, REF_LON, radius_m)
        bbox = result["bbox"]
        assert bbox["min_lat"] < REF_LAT < bbox["max_lat"]
        assert bbox["min_lon"] < REF_LON < bbox["max_lon"]
        assert result["radius_m"] == radius_m

    def test_larger_radius_larger_bbox(self):
        small = calculate_buffer_bbox(REF_LAT, REF_LON, 100)
        large = calculate_buffer_bbox(REF_LAT, REF_LON, 1000)
        assert large["bbox"]["max_lat"] > small["bbox"]["max_lat"]
        assert large["bbox"]["max_lon"] > small["bbox"]["max_lon"]

    def test_invalid_radius_raises(self):
        with pytest.raises(ValueError):
            calculate_buffer_bbox(REF_LAT, REF_LON, -1)

    def test_center_in_result(self):
        result = calculate_buffer_bbox(REF_LAT, REF_LON, 500)
        assert result["center"]["latitude"] == REF_LAT
        assert result["center"]["longitude"] == REF_LON
