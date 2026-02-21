"""
CQT Light — Testes E2E de fluxo completo (backend)

Testa pipelines de ponta-a-ponta usando coordenadas de referência reais (MEMORY.md):
  UTM 23K: 788547 E, 7634925 N
  Decimal: -22.15018, -42.92185
  Raios: 100 m · 500 m · 1 km

Fluxos cobertos:
  1. UTM → decimal → buffer (3 raios)
  2. Decimal → UTM (roundtrip)
  3. Queda de tensão ABNT + classificação PRODIST (integrado)
  4. Geração DXF de rede completa (2 postes, 1 trecho)
  5. Validação DXF gerado
  6. Exportação IFC2X3 (Half-way BIM)
  7. Validação IFC gerado
  8. Pipeline BIM completo (UTM → DXF + IFC)
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ─── Coordenadas de referência (MEMORY.md) ────────────────────────────────────
REF_UTM_EASTING = 788547.0
REF_UTM_NORTHING = 7634925.0
# zone_number=23, northern=False (hemisfério sul)
REF_LAT = -22.15018
REF_LON = -42.92185
RAIOS = [100, 500, 1000]


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 1: UTM → decimal → buffer (3 raios)
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoGeoCompleto:
    """UTM → decimal → buffer: fluxo geo completo com coordenadas de referência.

    Nota: as coordenadas UTM (788547 E, 7634925 N, Zona 23) e as coordenadas
    decimais (-22.15018, -42.92185) são dois pontos de referência distintos no
    MEMORY.md — ambos usados para testar a API geo, porém em fluxos separados.
    Os testes verificam consistência interna (roundtrip) e formato de resposta.
    """

    def setup_method(self):
        resp = client.post("/api/geo/utm-to-decimal", json={
            "easting": REF_UTM_EASTING,
            "northing": REF_UTM_NORTHING,
            "zone_number": 23,
            "northern": False,
        })
        assert resp.status_code == 200, f"UTM→decimal falhou: {resp.text}"
        self.geo = resp.json()  # retorna {"latitude": ..., "longitude": ...}

    def test_utm_to_decimal_retorna_latitude(self):
        assert "latitude" in self.geo
        assert isinstance(self.geo["latitude"], float)

    def test_utm_to_decimal_retorna_longitude(self):
        assert "longitude" in self.geo
        assert isinstance(self.geo["longitude"], float)

    def test_utm_to_decimal_latitude_em_sul(self):
        """Zona 23K (hemisfério sul) → latitude negativa."""
        assert self.geo["latitude"] < 0

    @pytest.mark.parametrize("raio", RAIOS)
    def test_buffer_raio(self, raio):
        resp = client.post("/api/geo/buffer", json={
            "latitude": self.geo["latitude"],
            "longitude": self.geo["longitude"],
            "radius_m": raio,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["radius_m"] == raio
        assert "bbox" in data
        bbox = data["bbox"]
        # BBox deve conter a coordenada de referência
        assert bbox["min_lat"] < self.geo["latitude"] < bbox["max_lat"]
        assert bbox["min_lon"] < self.geo["longitude"] < bbox["max_lon"]


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 2: Decimal → UTM (roundtrip)
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoRoundtripGeo:
    """Garante consistência bidirecional entre UTM e decimal."""

    def test_roundtrip_utm_decimal_utm(self):
        # UTM → decimal
        r1 = client.post("/api/geo/utm-to-decimal", json={
            "easting": REF_UTM_EASTING,
            "northing": REF_UTM_NORTHING,
            "zone_number": 23,
            "northern": False,
        })
        assert r1.status_code == 200
        geo = r1.json()

        # decimal → UTM
        r2 = client.post("/api/geo/decimal-to-utm", json={
            "latitude": geo["latitude"],
            "longitude": geo["longitude"],
        })
        assert r2.status_code == 200
        utm = r2.json()

        # Tolerância: < 5 metros (conversão SIRGAS2000/WGS84)
        assert abs(utm["easting"] - REF_UTM_EASTING) < 5.0
        assert abs(utm["northing"] - REF_UTM_NORTHING) < 5.0

    def test_roundtrip_decimal_utm_decimal(self):
        # decimal → UTM
        r1 = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT,
            "longitude": REF_LON,
        })
        assert r1.status_code == 200
        utm = r1.json()

        # UTM → decimal
        r2 = client.post("/api/geo/utm-to-decimal", json={
            "easting": utm["easting"],
            "northing": utm["northing"],
            "zone_number": utm["zone_number"],
            "northern": utm["northern"],
        })
        assert r2.status_code == 200
        geo = r2.json()

        assert abs(geo["latitude"] - REF_LAT) < 0.001
        assert abs(geo["longitude"] - REF_LON) < 0.001


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 3: Queda de tensão ABNT + classificação PRODIST (integrado)
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoQuedaPRODIST:
    """
    Simula projeto de trecho BT próximo às coordenadas de referência:
      - Calcular queda de tensão (ABNT NBR 5410) para 3 comprimentos
      - Classificar tensão resultante (PRODIST Módulo 8)
    """

    @pytest.mark.parametrize("comprimento_m", RAIOS)
    def test_queda_prodist_bt_alimentador(self, comprimento_m):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": float(comprimento_m),
            "corrente_a": 20.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_ALIMENTADOR",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["norma_aplicada"] == "ANEEL_PRODIST"
        assert "conforme" in data
        assert isinstance(data["conforme"], bool)

    def test_queda_1km_bt_reprovada_prodist(self):
        """1 km com corrente moderada → deve reprovar no PRODIST (5%)."""
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 1000.0,
            "corrente_a": 20.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_ALIMENTADOR",
        })
        assert resp.status_code == 200
        # Trecho de 1 km → certamente reprovado (queda >> 5%)
        assert resp.json()["conforme"] is False

    def test_queda_depois_classificar_tensao_prodist(self):
        """Encadeia queda de tensão com classificação PRODIST."""
        # 1. Calcular queda via PRODIST
        r_queda = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 100.0,
            "corrente_a": 30.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_ALIMENTADOR",
        })
        assert r_queda.status_code == 200
        queda_pct = r_queda.json()["queda_pct"]

        tensao_final = 220.0 * (1.0 - queda_pct / 100.0)

        # 2. Classificar tensão resultante via PRODIST
        r_class = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": tensao_final,
            "tensao_referencia_v": 220.0,
            "nivel": "BT",
        })
        assert r_class.status_code == 200
        classif = r_class.json()
        assert classif["classificacao"] in ("ADEQUADA", "PRECÁRIA", "CRÍTICA")
        assert classif["norma_aplicada"] == "ANEEL_PRODIST"


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 4+5: Geração e validação de DXF
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoDXFCompleto:
    """
    Gera DXF 2.5D com 2 postes e 1 trecho BT usando coords de referência.
    Valida o arquivo gerado.
    """

    _PAYLOAD = {
        "postes": [
            {"id": "P01", "x": REF_UTM_EASTING, "y": REF_UTM_NORTHING,
             "altura_m": 11.0, "carga_dan": 300},
            {"id": "P02", "x": REF_UTM_EASTING + 50.0, "y": REF_UTM_NORTHING,
             "altura_m": 11.0, "carga_dan": 300},
        ],
        "trechos": [
            {"poste_a": "P01", "poste_b": "P02", "nivel": "BT",
             "condutor": "Multiplexado 3x35+25mm²"},
        ],
        "transformadores": [
            {"id": "TR01", "poste_id": "P01", "potencia_kva": 75.0},
        ],
    }

    def test_gerar_dxf_status_200(self):
        resp = client.post("/api/dxf/generate", json=self._PAYLOAD)
        assert resp.status_code == 200

    def test_gerar_dxf_content_type(self):
        resp = client.post("/api/dxf/generate", json=self._PAYLOAD)
        assert "octet-stream" in resp.headers.get("content-type", "")

    def test_gerar_dxf_conteudo_nao_vazio(self):
        resp = client.post("/api/dxf/generate", json=self._PAYLOAD)
        assert len(resp.content) > 100

    def test_gerar_dxf_possui_marcadores_dxf(self):
        resp = client.post("/api/dxf/generate", json=self._PAYLOAD)
        texto = resp.content.decode("utf-8", errors="replace")
        assert "SECTION" in texto or "0\nSECTION" in texto

    def test_validar_dxf_gerado(self):
        """O endpoint /validate usa o mesmo payload JSON — não file upload."""
        resp = client.post("/api/dxf/validate", json=self._PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        # O campo de status é "valid" (não "valido")
        assert data.get("valid") is True


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 6+7: Exportação e validação IFC2X3
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoIFC:
    """
    Exporta rede em formato IFC2X3 STEP e valida o arquivo gerado.
    """

    _PAYLOAD = {
        "postes": [
            {"id": "P01", "x": REF_UTM_EASTING, "y": REF_UTM_NORTHING,
             "altura_m": 11.0, "carga_dan": 300},
        ],
        "trechos": [
            {"poste_a": "P01", "poste_b": "P01", "nivel": "BT",
             "condutor": "Multiplexado 3x35+25mm²"},
        ],
        "transformadores": [],
    }

    def test_exportar_ifc_status_200(self):
        resp = client.post("/api/ifc/export", json=self._PAYLOAD)
        assert resp.status_code == 200

    def test_exportar_ifc_conteudo_iso_step(self):
        resp = client.post("/api/ifc/export", json=self._PAYLOAD)
        texto = resp.content.decode("utf-8", errors="replace")
        assert "ISO-10303-21" in texto

    def test_exportar_ifc_contem_ifc2x3(self):
        resp = client.post("/api/ifc/export", json=self._PAYLOAD)
        texto = resp.content.decode("utf-8", errors="replace")
        assert "IFC2X3" in texto or "IFCPROJECT" in texto

    def test_validar_ifc_gerado(self):
        """O endpoint /validate usa JSON com campo ifc_content (string)."""
        gen = client.post("/api/ifc/export", json=self._PAYLOAD)
        assert gen.status_code == 200

        ifc_text = gen.content.decode("utf-8", errors="replace")
        resp = client.post("/api/ifc/validate", json={"ifc_content": ifc_text})
        assert resp.status_code == 200
        data = resp.json()
        # O campo de status é "valid" (não "valido")
        assert data.get("valid") is True


# ─────────────────────────────────────────────────────────────────────────────
# Fluxo 8: Pipeline BIM completo (UTM → DXF + IFC)
# ─────────────────────────────────────────────────────────────────────────────

class TestFluxoPipelineBIM:
    """
    Fluxo completo: coordenadas de referência UTM → rede elétrica → DXF 2.5D + IFC2X3.
    Simula workflow real: localiza no mapa, projeta a rede,
    exporta para AutoCAD (DXF) e para BIM (IFC).
    """

    def test_pipeline_utm_dxf(self):
        # 1. Converter UTM → decimal
        r_geo = client.post("/api/geo/utm-to-decimal", json={
            "easting": REF_UTM_EASTING,
            "northing": REF_UTM_NORTHING,
            "zone_number": 23,
            "northern": False,
        })
        assert r_geo.status_code == 200

        # 2. Gerar DXF com postes em coords UTM
        r_dxf = client.post("/api/dxf/generate", json={
            "postes": [
                {"id": "P01", "x": REF_UTM_EASTING, "y": REF_UTM_NORTHING,
                 "altura_m": 11.0, "carga_dan": 300},
            ],
            "trechos": [],
            "transformadores": [],
        })
        assert r_dxf.status_code == 200
        assert len(r_dxf.content) > 50

    def test_pipeline_utm_ifc(self):
        r_ifc = client.post("/api/ifc/export", json={
            "postes": [
                {"id": "P01", "x": REF_UTM_EASTING, "y": REF_UTM_NORTHING,
                 "altura_m": 11.0, "carga_dan": 300},
            ],
            "trechos": [],
            "transformadores": [],
        })
        assert r_ifc.status_code == 200
        texto = r_ifc.content.decode("utf-8", errors="replace")
        assert "ISO-10303-21" in texto

    @pytest.mark.parametrize("raio", RAIOS)
    def test_buffer_para_cada_raio(self, raio):
        """Para cada raio de influência, verifica que buffer retorna BBox válida."""
        r = client.post("/api/geo/buffer", json={
            "latitude": REF_LAT,
            "longitude": REF_LON,
            "radius_m": raio,
        })
        assert r.status_code == 200
        bbox = r.json()["bbox"]
        area_lat = bbox["max_lat"] - bbox["min_lat"]
        area_lon = bbox["max_lon"] - bbox["min_lon"]
        assert area_lat > 0
        assert area_lon > 0
