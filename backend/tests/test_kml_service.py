"""
CQT Light — Testes do Serviço de Importação KML/GPX
Cobre: services/kml_service.py + api/kml_router.py

Usa coordenadas de referência do MEMORY.md:
  Ponto 1 UTM 23K: 788547 E, 7634925 N
  Ponto 2 Decimal: -22.15018, -42.92185
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from services.kml_service import (
    importar_kml,
    importar_gpx,
    importar_trace,
    _haversine_m,
    _calcular_comprimento,
    PontoGPS,
)
from main import app

client = TestClient(app)


# ─────────────────────────────────────────────
# Fixtures: XMLs de Teste
# ─────────────────────────────────────────────

KML_POINT = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Poste P1</name>
      <Point>
        <coordinates>-42.92185,-22.15018,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>"""

KML_LINESTRING = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Trecho MT</name>
      <LineString>
        <coordinates>
          -42.92185,-22.15018,0
          -42.9205,-22.1490,0
          -42.9195,-22.1480,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>"""

KML_INVALIDO = """<?xml version="1.0" encoding="UTF-8"?>
<kml><Placemark><Point></Point></Placemark></kml>"""

KML_XML_INVALIDO = """<<not valid xml"""

KML_SEM_NAMESPACE = """<?xml version="1.0" encoding="UTF-8"?>
<kml>
  <Document>
    <Placemark>
      <name>Teste</name>
      <Point>
        <coordinates>-42.92185,-22.15018,100</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>"""

GPX_TRACK = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>
      <trkpt lat="-22.15018" lon="-42.92185">
        <ele>850</ele>
        <name>P1</name>
      </trkpt>
      <trkpt lat="-22.14900" lon="-42.92050">
        <ele>855</ele>
      </trkpt>
      <trkpt lat="-22.14800" lon="-42.91950">
        <ele>860</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>"""

GPX_WAYPOINTS = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="-22.15018" lon="-42.92185">
    <name>Poste A</name>
    <ele>850</ele>
  </wpt>
  <wpt lat="-22.14900" lon="-42.92050">
    <name>Poste B</name>
  </wpt>
</gpx>"""

GPX_INVALIDO = """<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"></gpx>"""


# ─────────────────────────────────────────────
# Testes de Funções Auxiliares
# ─────────────────────────────────────────────

class TestHaversine:
    def test_distancia_zero_mesmo_ponto(self):
        assert _haversine_m(-22.15018, -42.92185, -22.15018, -42.92185) == 0.0

    def test_distancia_conhecida(self):
        # 1 grau de latitude ≈ 111 km
        dist = _haversine_m(0.0, 0.0, 1.0, 0.0)
        assert 110_000 < dist < 112_000

    def test_distancia_positiva(self):
        dist = _haversine_m(-22.15018, -42.92185, -22.14900, -42.92050)
        assert dist > 0

    def test_simetrica(self):
        d1 = _haversine_m(-22.15018, -42.92185, -22.14900, -42.92050)
        d2 = _haversine_m(-22.14900, -42.92050, -22.15018, -42.92185)
        assert abs(d1 - d2) < 0.001


class TestComprimento:
    def test_um_ponto_comprimento_zero(self):
        pontos = [PontoGPS(id="1", latitude=-22.15018, longitude=-42.92185)]
        assert _calcular_comprimento(pontos) == 0.0

    def test_dois_pontos(self):
        pontos = [
            PontoGPS(id="1", latitude=-22.15018, longitude=-42.92185),
            PontoGPS(id="2", latitude=-22.14900, longitude=-42.92050),
        ]
        comprimento = _calcular_comprimento(pontos)
        assert comprimento > 0

    def test_lista_vazia(self):
        assert _calcular_comprimento([]) == 0.0


# ─────────────────────────────────────────────
# Testes KML
# ─────────────────────────────────────────────

class TestImportarKML:
    def test_ponto_simples(self):
        resultado = importar_kml(KML_POINT)
        assert resultado.total_pontos == 1
        assert resultado.formato == "KML"
        p = resultado.pontos[0]
        assert abs(p.latitude - (-22.15018)) < 0.001
        assert abs(p.longitude - (-42.92185)) < 0.001

    def test_linestring_3_pontos(self):
        resultado = importar_kml(KML_LINESTRING)
        assert resultado.total_pontos == 3

    def test_linestring_comprimento_positivo(self):
        resultado = importar_kml(KML_LINESTRING)
        assert resultado.comprimento_total_m > 0

    def test_ponto_altitude(self):
        resultado = importar_kml(KML_POINT)
        assert resultado.pontos[0].altitude_m == 0.0

    def test_kml_sem_namespace(self):
        resultado = importar_kml(KML_SEM_NAMESPACE)
        assert resultado.total_pontos == 1

    def test_kml_altitude_100m(self):
        resultado = importar_kml(KML_SEM_NAMESPACE)
        assert resultado.pontos[0].altitude_m == 100.0

    def test_kml_invalido_sem_coords_raises(self):
        with pytest.raises(ValueError, match="coordenada"):
            importar_kml(KML_INVALIDO)

    def test_xml_invalido_raises(self):
        with pytest.raises(ValueError, match="KML inválido"):
            importar_kml(KML_XML_INVALIDO)

    def test_nome_arquivo(self):
        resultado = importar_kml(KML_POINT, "levantamento_campo.kml")
        assert resultado.nome_arquivo == "levantamento_campo.kml"


# ─────────────────────────────────────────────
# Testes GPX
# ─────────────────────────────────────────────

class TestImportarGPX:
    def test_track_3_pontos(self):
        resultado = importar_gpx(GPX_TRACK)
        assert resultado.total_pontos == 3
        assert resultado.formato == "GPX"

    def test_track_altitude(self):
        resultado = importar_gpx(GPX_TRACK)
        assert resultado.pontos[0].altitude_m == 850.0

    def test_coordenadas_referencia(self):
        resultado = importar_gpx(GPX_TRACK)
        p1 = resultado.pontos[0]
        assert abs(p1.latitude - (-22.15018)) < 0.001
        assert abs(p1.longitude - (-42.92185)) < 0.001

    def test_waypoints_fallback(self):
        resultado = importar_gpx(GPX_WAYPOINTS)
        assert resultado.total_pontos == 2

    def test_gpx_sem_pontos_raises(self):
        with pytest.raises(ValueError, match="coordenada"):
            importar_gpx(GPX_INVALIDO)

    def test_comprimento_track(self):
        resultado = importar_gpx(GPX_TRACK)
        assert resultado.comprimento_total_m > 0


# ─────────────────────────────────────────────
# Testes importar_trace (auto-detect)
# ─────────────────────────────────────────────

class TestImportarTrace:
    def test_autodetect_kml_por_tag(self):
        resultado = importar_trace(KML_POINT)
        assert resultado.formato == "KML"

    def test_autodetect_gpx_por_tag(self):
        resultado = importar_trace(GPX_TRACK)
        assert resultado.formato == "GPX"

    def test_autodetect_kml_por_extensao(self):
        resultado = importar_trace(KML_POINT, "arquivo.kml")
        assert resultado.formato == "KML"

    def test_autodetect_gpx_por_extensao(self):
        resultado = importar_trace(GPX_TRACK, "trilha.gpx")
        assert resultado.formato == "GPX"

    def test_formato_desconhecido_raises(self):
        with pytest.raises(ValueError, match="Formato não reconhecido"):
            importar_trace("<xml>sem formato</xml>", "arquivo.txt")


# ─────────────────────────────────────────────
# Testes de Integração da API
# ─────────────────────────────────────────────

class TestKMLRouterAPI:
    BASE = "/api/trace"

    def test_importar_kml_ponto(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_POINT,
            "nome_arquivo": "teste.kml",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["formato"] == "KML"
        assert data["total_pontos"] == 1
        assert len(data["pontos"]) == 1

    def test_importar_gpx_track(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": GPX_TRACK,
            "nome_arquivo": "trilha.gpx",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["formato"] == "GPX"
        assert data["total_pontos"] == 3

    def test_importar_kml_linestring(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_LINESTRING,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_pontos"] == 3

    def test_importar_xml_invalido_retorna_422(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_XML_INVALIDO,
        })
        assert resp.status_code == 422

    def test_importar_sem_coordenadas_retorna_422(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_INVALIDO,
        })
        assert resp.status_code == 422

    def test_comprimento_calculado(self):
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_LINESTRING,
        })
        assert resp.status_code == 200
        assert resp.json()["comprimento_total_m"] > 0

    def test_coordenadas_referencia_no_resultado(self):
        """Coordenadas de referência MEMORY.md: -22.15018, -42.92185."""
        resp = client.post(f"{self.BASE}/importar", json={
            "conteudo_xml": KML_POINT,
        })
        assert resp.status_code == 200
        p = resp.json()["pontos"][0]
        assert abs(p["latitude"] - (-22.15018)) < 0.001
        assert abs(p["longitude"] - (-42.92185)) < 0.001


class TestGpxCoverageGaps:
    """Cobre linhas não cobertas em kml_service.py: GPX inválido (ParseError) e tag_prefix."""

    def test_gpx_xml_invalido_levanta_value_error(self):
        """Linhas 187-188: ET.ParseError → ValueError."""
        from services.kml_service import importar_gpx
        with pytest.raises(ValueError, match="GPX inválido"):
            importar_gpx("<<XML QUEBRADO>>")

    def test_gpx_sem_namespace_funciona(self):
        """Linha 202: tag_prefix vazio quando root tag não tem namespace."""
        from services.kml_service import importar_gpx
        gpx_sem_ns = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <trkseg>
      <trkpt lat="-22.15018" lon="-42.92185">
        <ele>900</ele>
        <name>Ponto REF</name>
      </trkpt>
    </trkseg>
  </trk>
</gpx>"""
        resultado = importar_gpx(gpx_sem_ns)
        assert len(resultado.pontos) == 1
        assert abs(resultado.pontos[0].latitude - (-22.15018)) < 0.001

    def test_gpx_com_namespace_funciona(self):
        """Linha 202: tag_prefix com namespace quando root tag tem {uri}tag."""
        from services.kml_service import importar_gpx
        gpx_com_ns = """<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="-22.15018" lon="-42.92185">
        <ele>900</ele>
      </trkpt>
      <trkpt lat="-22.1510" lon="-42.9220">
        <ele>905</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>"""
        resultado = importar_gpx(gpx_com_ns)
        assert len(resultado.pontos) == 2
        assert resultado.comprimento_total_m > 0
