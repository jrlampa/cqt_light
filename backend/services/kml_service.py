"""
CQT Light — Serviço de Importação KML/GPX
Converte traçados GPS (KML/GPX) em nós e trechos de rede elétrica.

Usa apenas a biblioteca padrão Python (xml.etree.ElementTree) — zero custo.
Compatível com Google Earth (.kml) e dispositivos GPS Garmin/OSMand (.gpx).

Coordenadas de referência (MEMORY.md):
  UTM 23K: 788547 E, 7634925 N
  Decimal: -22.15018, -42.92185
"""

from __future__ import annotations

import math
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import List, Optional


# Namespaces XML
_NS_KML = "http://www.opengis.net/kml/2.2"
_NS_GPX = "http://www.topografix.com/GPX/1/1"


@dataclass
class PontoGPS:
    """Ponto GPS com coordenadas e rótulo opcional."""
    id: str
    latitude: float
    longitude: float
    altitude_m: Optional[float] = None
    nome: Optional[str] = None


@dataclass
class TracadoRede:
    """Resultado da importação: lista de pontos ordenados (traçado)."""
    pontos: List[PontoGPS] = field(default_factory=list)
    nome_arquivo: str = ""
    formato: str = ""   # "KML" ou "GPX"
    total_pontos: int = 0
    comprimento_total_m: float = 0.0  # Comprimento geográfico estimado


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância em metros entre dois pontos (fórmula de Haversine).
    Precisão ≈ 0.5% para distâncias < 100 km.
    """
    R = 6_371_000.0  # raio médio da Terra em metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _calcular_comprimento(pontos: List[PontoGPS]) -> float:
    """Comprimento total do traçado em metros (soma dos segmentos)."""
    total = 0.0
    for i in range(1, len(pontos)):
        total += _haversine_m(
            pontos[i - 1].latitude, pontos[i - 1].longitude,
            pontos[i].latitude, pontos[i].longitude,
        )
    return round(total, 2)


def _sanitizar_coordenada(valor: str) -> float:
    """Converte string de coordenada para float, tratando vírgula como separador decimal."""
    return float(valor.strip().replace(",", "."))


def importar_kml(conteudo_xml: str, nome_arquivo: str = "tracado.kml") -> TracadoRede:
    """
    Importa traçado GPS de um arquivo KML (Google Earth).

    Processa:
    - <Placemark> com <Point> → pontos individuais
    - <Placemark> com <LineString> → vértices de linha como pontos
    - <Folder> aninhadas

    Args:
        conteudo_xml: conteúdo textual do arquivo KML
        nome_arquivo: nome do arquivo de origem (para rastreabilidade)

    Returns:
        TracadoRede com pontos extraídos e comprimento estimado

    Raises:
        ValueError: se o XML for inválido ou não contiver coordenadas
    """
    try:
        root = ET.fromstring(conteudo_xml.strip())
    except ET.ParseError as e:
        raise ValueError(f"KML inválido: {e}")

    # Detectar namespace (com ou sem namespace)
    tag_prefix = ""
    if root.tag.startswith("{"):
        tag_prefix = root.tag.split("}")[0] + "}"

    pontos: List[PontoGPS] = []
    contador = 0

    def _processar_no(no: ET.Element) -> None:
        nonlocal contador
        for placemark in no.findall(f".//{tag_prefix}Placemark"):
            nome_elem = placemark.find(f"{tag_prefix}name")
            nome = nome_elem.text.strip() if nome_elem is not None and nome_elem.text else None

            # Ponto único
            point = placemark.find(f".//{tag_prefix}Point")
            if point is not None:
                coords_elem = point.find(f"{tag_prefix}coordinates")
                if coords_elem is not None and coords_elem.text:
                    partes = coords_elem.text.strip().split(",")
                    if len(partes) >= 2:
                        lon = _sanitizar_coordenada(partes[0])
                        lat = _sanitizar_coordenada(partes[1])
                        alt = _sanitizar_coordenada(partes[2]) if len(partes) > 2 else None
                        contador += 1
                        pontos.append(PontoGPS(
                            id=str(contador),
                            latitude=lat,
                            longitude=lon,
                            altitude_m=alt,
                            nome=nome,
                        ))

            # Linha (LineString)
            linestring = placemark.find(f".//{tag_prefix}LineString")
            if linestring is not None:
                coords_elem = linestring.find(f"{tag_prefix}coordinates")
                if coords_elem is not None and coords_elem.text:
                    for triplet in coords_elem.text.strip().split():
                        partes = triplet.split(",")
                        if len(partes) >= 2:
                            lon = _sanitizar_coordenada(partes[0])
                            lat = _sanitizar_coordenada(partes[1])
                            alt = _sanitizar_coordenada(partes[2]) if len(partes) > 2 else None
                            contador += 1
                            pontos.append(PontoGPS(
                                id=str(contador),
                                latitude=lat,
                                longitude=lon,
                                altitude_m=alt,
                                nome=f"{nome}_{contador}" if nome else str(contador),
                            ))

    _processar_no(root)

    if not pontos:
        raise ValueError("Nenhuma coordenada válida encontrada no KML")

    comprimento = _calcular_comprimento(pontos)
    return TracadoRede(
        pontos=pontos,
        nome_arquivo=nome_arquivo,
        formato="KML",
        total_pontos=len(pontos),
        comprimento_total_m=comprimento,
    )


def importar_gpx(conteudo_xml: str, nome_arquivo: str = "tracado.gpx") -> TracadoRede:
    """
    Importa traçado GPS de um arquivo GPX (GPS eXchange Format).

    Processa:
    - <trkpt> (track points) — pontos de trilha GPS
    - <wpt> (waypoints) — pontos de referência

    Args:
        conteudo_xml: conteúdo textual do arquivo GPX
        nome_arquivo: nome do arquivo de origem (para rastreabilidade)

    Returns:
        TracadoRede com pontos extraídos e comprimento estimado

    Raises:
        ValueError: se o XML for inválido ou não contiver coordenadas
    """
    try:
        root = ET.fromstring(conteudo_xml.strip())
    except ET.ParseError as e:
        raise ValueError(f"GPX inválido: {e}")

    tag_prefix = ""
    if root.tag.startswith("{"):
        tag_prefix = root.tag.split("}")[0] + "}"

    pontos: List[PontoGPS] = []
    contador = 0

    def _processar_ponto(elem: ET.Element, tipo: str) -> None:
        nonlocal contador
        lat_str = elem.get("lat")
        lon_str = elem.get("lon")
        if lat_str is None or lon_str is None:
            return
        lat = _sanitizar_coordenada(lat_str)
        lon = _sanitizar_coordenada(lon_str)

        ele_elem = elem.find(f"{tag_prefix}ele")
        alt = float(ele_elem.text) if ele_elem is not None and ele_elem.text else None

        name_elem = elem.find(f"{tag_prefix}name")
        nome = name_elem.text.strip() if name_elem is not None and name_elem.text else None

        contador += 1
        pontos.append(PontoGPS(
            id=str(contador),
            latitude=lat,
            longitude=lon,
            altitude_m=alt,
            nome=nome or f"{tipo}_{contador}",
        ))

    # Track points (trilha contínua)
    for trkpt in root.findall(f".//{tag_prefix}trkpt"):
        _processar_ponto(trkpt, "trkpt")

    # Waypoints (se não houver track points)
    if not pontos:
        for wpt in root.findall(f".//{tag_prefix}wpt"):
            _processar_ponto(wpt, "wpt")

    if not pontos:
        raise ValueError("Nenhuma coordenada válida encontrada no GPX")

    comprimento = _calcular_comprimento(pontos)
    return TracadoRede(
        pontos=pontos,
        nome_arquivo=nome_arquivo,
        formato="GPX",
        total_pontos=len(pontos),
        comprimento_total_m=comprimento,
    )


def importar_trace(conteudo_xml: str, nome_arquivo: str = "") -> TracadoRede:
    """
    Auto-detecta formato (KML ou GPX) pelo conteúdo XML e importa.

    Args:
        conteudo_xml: conteúdo textual do arquivo
        nome_arquivo: nome opcional do arquivo (ex: "levantamento.kml")

    Returns:
        TracadoRede com pontos e comprimento

    Raises:
        ValueError: formato não reconhecido ou XML inválido
    """
    stripped = conteudo_xml.strip()
    nome_lower = nome_arquivo.lower()

    if "<kml" in stripped or nome_lower.endswith(".kml"):
        return importar_kml(stripped, nome_arquivo)
    if "<gpx" in stripped or nome_lower.endswith(".gpx"):
        return importar_gpx(stripped, nome_arquivo)

    raise ValueError(
        "Formato não reconhecido. Use arquivos .kml (Google Earth) ou .gpx (GPS)."
    )
