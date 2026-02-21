"""
CQT Light — Serviço de Georreferenciamento
Conversão entre coordenadas UTM SIRGAS2000 (EPSG:31983) e decimais (EPSG:4326).
Raios de influência padrão: 100 m, 500 m, 1000 m.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Tuple

try:
    from pyproj import Transformer as _ProjTransformer
    _PYPROJ_AVAILABLE = True
except ImportError:
    _PYPROJ_AVAILABLE = False


@dataclass
class UTMCoordinate:
    """Coordenada UTM com zona."""
    easting: float   # m (E)
    northing: float  # m (N)
    zone: str = "23K"


@dataclass
class DecimalCoordinate:
    """Coordenada em graus decimais (lat/lon)."""
    latitude: float
    longitude: float


def utm_to_decimal(easting: float, northing: float, zone_number: int = 23, northern: bool = False) -> DecimalCoordinate:
    """
    Converte coordenadas UTM SIRGAS2000 (EPSG:31983) para graus decimais.
    Usa pyproj quando disponível (recomendado); fallback para fórmula geodésica WGS84.

    Args:
        easting: coordenada E em metros
        northing: coordenada N em metros
        zone_number: número da faixa UTM (ex: 23)
        northern: True se hemisfério norte, False se sul

    Returns:
        DecimalCoordinate com lat/lon em graus decimais
    """
    epsg_utm = 31960 + zone_number  # SIRGAS2000 UTM (31961..31985)

    if _PYPROJ_AVAILABLE:
        t = _ProjTransformer.from_crs(f"EPSG:{epsg_utm}", "EPSG:4326", always_xy=True)
        lon, lat = t.transform(easting, northing)
        return DecimalCoordinate(latitude=round(lat, 6), longitude=round(lon, 6))

    return _utm_to_decimal_manual(easting, northing, zone_number, northern)


def _utm_to_decimal_manual(easting: float, northing: float, zone_number: int, northern: bool) -> DecimalCoordinate:
    """Implementação manual da conversão UTM→decimal (WGS84)."""
    a = 6378137.0
    f = 1 / 298.257223563
    b = a * (1 - f)
    e2 = (a**2 - b**2) / a**2
    e_prime2 = (a**2 - b**2) / b**2
    k0 = 0.9996

    x = easting - 500000.0
    y = northing if northern else northing - 10000000.0

    lon_origin_rad = math.radians((zone_number - 1) * 6 - 180 + 3)
    m = y / k0
    mu = m / (a * (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    phi1 = (
        mu
        + (3*e1/2 - 27*e1**3/32) * math.sin(2*mu)
        + (21*e1**2/16 - 55*e1**4/32) * math.sin(4*mu)
        + (151*e1**3/96) * math.sin(6*mu)
        + (1097*e1**4/512) * math.sin(8*mu)
    )
    n1 = a / math.sqrt(1 - e2 * math.sin(phi1)**2)
    t1 = math.tan(phi1)**2
    c1 = e_prime2 * math.cos(phi1)**2
    r1 = a * (1 - e2) / (1 - e2 * math.sin(phi1)**2)**1.5
    d = x / (n1 * k0)

    lat_rad = phi1 - (n1 * math.tan(phi1) / r1) * (
        d**2/2
        - (5 + 3*t1 + 10*c1 - 4*c1**2 - 9*e_prime2) * d**4/24
        + (61 + 90*t1 + 298*c1 + 45*t1**2 - 252*e_prime2 - 3*c1**2) * d**6/720
    )
    lon_rad = lon_origin_rad + (
        d
        - (1 + 2*t1 + c1) * d**3/6
        + (5 - 2*c1 + 28*t1 - 3*c1**2 + 8*e_prime2 + 24*t1**2) * d**5/120
    ) / math.cos(phi1)

    return DecimalCoordinate(
        latitude=round(math.degrees(lat_rad), 6),
        longitude=round(math.degrees(lon_rad), 6),
    )


def decimal_to_utm(lat: float, lon: float, zone_number: int = None) -> Tuple[float, float, int, bool]:
    """
    Converte graus decimais para UTM SIRGAS2000.
    Usa pyproj quando disponível; fallback para fórmula WGS84.

    Returns:
        (easting, northing, zone_number, northern_hemisphere)
    """
    if zone_number is None:
        zone_number = int((lon + 180) / 6) + 1
    northern = lat >= 0

    if _PYPROJ_AVAILABLE:
        epsg_utm = 31960 + zone_number
        t = _ProjTransformer.from_crs("EPSG:4326", f"EPSG:{epsg_utm}", always_xy=True)
        easting, northing = t.transform(lon, lat)
        return round(easting, 2), round(northing, 2), zone_number, northern

    return _decimal_to_utm_manual(lat, lon, zone_number, northern)


def _decimal_to_utm_manual(lat: float, lon: float, zone_number: int, northern: bool) -> Tuple[float, float, int, bool]:
    """Implementação manual da conversão decimal→UTM (WGS84)."""
    a = 6378137.0
    f = 1 / 298.257223563
    e2 = 1 - (a * (1 - f))**2 / a**2
    k0 = 0.9996

    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    lon_origin_rad = math.radians((zone_number - 1) * 6 - 180 + 3)

    n = a / math.sqrt(1 - e2 * math.sin(lat_rad)**2)
    t = math.tan(lat_rad)**2
    c = (e2 / (1 - e2)) * math.cos(lat_rad)**2
    a_coef = math.cos(lat_rad) * (lon_rad - lon_origin_rad)
    m = a * (
        (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256) * lat_rad
        - (3*e2/8 + 3*e2**2/32 + 45*e2**3/1024) * math.sin(2*lat_rad)
        + (15*e2**2/256 + 45*e2**3/1024) * math.sin(4*lat_rad)
        - (35*e2**3/3072) * math.sin(6*lat_rad)
    )

    easting = k0 * n * (
        a_coef
        + (1 - t + c) * a_coef**3/6
        + (5 - 18*t + t**2 + 72*c - 58*(e2/(1-e2))) * a_coef**5/120
    ) + 500000.0

    northing = k0 * (
        m + n * math.tan(lat_rad) * (
            a_coef**2/2
            + (5 - t + 9*c + 4*c**2) * a_coef**4/24
            + (61 - 58*t + t**2 + 600*c - 330*(e2/(1-e2))) * a_coef**6/720
        )
    )
    if not northern:
        northing += 10000000.0

    return round(easting, 2), round(northing, 2), zone_number, northern


def calculate_buffer_bbox(lat: float, lon: float, radius_m: float) -> dict:
    """
    Calcula bounding box aproximada para um raio em metros a partir de um ponto.
    Método: delta em graus via fórmula esférica.

    Args:
        lat: latitude em graus decimais
        lon: longitude em graus decimais
        radius_m: raio em metros (ex: 100, 500, 1000)

    Returns:
        dict com min_lat, max_lat, min_lon, max_lon

    Raises:
        ValueError: se radius_m <= 0
    """
    if radius_m <= 0:
        raise ValueError("O raio deve ser positivo.")

    earth_radius_m = 6371000.0
    delta_lat = math.degrees(radius_m / earth_radius_m)
    delta_lon = math.degrees(radius_m / (earth_radius_m * math.cos(math.radians(lat))))

    return {
        "center": {"latitude": lat, "longitude": lon},
        "radius_m": radius_m,
        "bbox": {
            "min_lat": round(lat - delta_lat, 6),
            "max_lat": round(lat + delta_lat, 6),
            "min_lon": round(lon - delta_lon, 6),
            "max_lon": round(lon + delta_lon, 6),
        },
    }
