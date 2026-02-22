"""
CQT Light — Testes de Integração da API FastAPI
Cobre: main.py, api/geo_router.py, api/dxf_router.py
Usa httpx.TestClient (síncrono) para cobertura máxima.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# --- Coordenadas de referência (MEMORY.md) ---
REF_LAT = -22.15018
REF_LON = -42.92185
REF_EASTING_COMPUTED = 714315.67
REF_NORTHING_COMPUTED = 7549084.21
ZONE = 23


class TestHealth:
    def test_health_returns_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "service" in data

    def test_docs_available(self):
        resp = client.get("/docs")
        assert resp.status_code == 200

    def test_openapi_json(self):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "paths" in schema


class TestGeoUtmToDecimal:
    """Testes do endpoint POST /api/geo/utm-to-decimal"""

    def test_reference_coordinates_roundtrip(self):
        """decimal→UTM→decimal deve ser idempotente."""
        # Primeiro convertemos decimal→UTM para obter um ponto válido
        to_utm = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT, "longitude": REF_LON
        })
        assert to_utm.status_code == 200
        utm = to_utm.json()

        # Agora UTM→decimal
        resp = client.post("/api/geo/utm-to-decimal", json={
            "easting": utm["easting"],
            "northing": utm["northing"],
            "zone_number": utm["zone_number"],
            "northern": utm["northern"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert abs(data["latitude"] - REF_LAT) < 0.001
        assert abs(data["longitude"] - REF_LON) < 0.001

    def test_southern_hemisphere_negative_lat(self):
        to_utm = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT, "longitude": REF_LON
        })
        utm = to_utm.json()
        resp = client.post("/api/geo/utm-to-decimal", json={
            "easting": utm["easting"],
            "northing": utm["northing"],
            "zone_number": utm["zone_number"],
            "northern": False,
        })
        data = resp.json()
        assert data["latitude"] < 0

    def test_missing_field_returns_422(self):
        resp = client.post("/api/geo/utm-to-decimal", json={"easting": 700000.0})
        assert resp.status_code == 422

    def test_response_has_lat_lon(self):
        to_utm = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT, "longitude": REF_LON
        })
        utm = to_utm.json()
        resp = client.post("/api/geo/utm-to-decimal", json={
            "easting": utm["easting"],
            "northing": utm["northing"],
            "zone_number": utm["zone_number"],
            "northern": utm["northern"],
        })
        data = resp.json()
        assert "latitude" in data
        assert "longitude" in data


class TestGeoDecimalToUtm:
    """Testes do endpoint POST /api/geo/decimal-to-utm"""

    def test_reference_coordinates(self):
        resp = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT, "longitude": REF_LON
        })
        assert resp.status_code == 200
        data = resp.json()
        assert abs(data["easting"] - REF_EASTING_COMPUTED) < 20
        assert abs(data["northing"] - REF_NORTHING_COMPUTED) < 20
        assert data["zone_number"] == ZONE
        assert data["northern"] is False

    def test_northern_hemisphere(self):
        resp = client.post("/api/geo/decimal-to-utm", json={
            "latitude": 48.8566, "longitude": 2.3522  # Paris
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["northern"] is True

    def test_missing_field_returns_422(self):
        resp = client.post("/api/geo/decimal-to-utm", json={"latitude": -22.15018})
        assert resp.status_code == 422

    def test_response_shape(self):
        resp = client.post("/api/geo/decimal-to-utm", json={
            "latitude": REF_LAT, "longitude": REF_LON
        })
        data = resp.json()
        for key in ["easting", "northing", "zone_number", "northern"]:
            assert key in data


class TestGeoBuffer:
    """Testes do endpoint POST /api/geo/buffer"""

    @pytest.mark.parametrize("radius_m", [100, 500, 1000])
    def test_buffer_radii(self, radius_m):
        resp = client.post("/api/geo/buffer", json={
            "latitude": REF_LAT, "longitude": REF_LON, "radius_m": radius_m
        })
        assert resp.status_code == 200
        data = resp.json()
        bbox = data["bbox"]
        assert bbox["min_lat"] < REF_LAT < bbox["max_lat"]
        assert bbox["min_lon"] < REF_LON < bbox["max_lon"]
        assert data["radius_m"] == radius_m

    def test_invalid_radius_returns_422(self):
        resp = client.post("/api/geo/buffer", json={
            "latitude": REF_LAT, "longitude": REF_LON, "radius_m": -100
        })
        assert resp.status_code == 422

    def test_zero_radius_returns_422(self):
        resp = client.post("/api/geo/buffer", json={
            "latitude": REF_LAT, "longitude": REF_LON, "radius_m": 0
        })
        assert resp.status_code == 422

    def test_center_in_response(self):
        resp = client.post("/api/geo/buffer", json={
            "latitude": REF_LAT, "longitude": REF_LON, "radius_m": 500
        })
        data = resp.json()
        assert data["center"]["latitude"] == REF_LAT
        assert data["center"]["longitude"] == REF_LON


class TestDxfGenerate:
    """Testes do endpoint POST /api/dxf/generate"""

    def _make_rede_simples(self):
        return {
            "postes": [
                {"id": "1", "x": 0.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300, "descricao": "P1"},
                {"id": "2", "x": 50.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300, "descricao": "P2"},
            ],
            "trechos": [
                {"poste_a": "1", "poste_b": "2", "nivel": "MT", "condutor": "CAA 35mm²"}
            ],
            "transformadores": [],
            "titulo": "REDE TESTE API",
            "escala": "S/E",
        }

    def test_generate_returns_200(self):
        resp = client.post("/api/dxf/generate", json=self._make_rede_simples())
        assert resp.status_code == 200

    def test_generate_returns_bytes(self):
        resp = client.post("/api/dxf/generate", json=self._make_rede_simples())
        assert len(resp.content) > 0

    def test_generate_content_type(self):
        resp = client.post("/api/dxf/generate", json=self._make_rede_simples())
        assert "octet-stream" in resp.headers.get("content-type", "")

    def test_generate_content_disposition(self):
        resp = client.post("/api/dxf/generate", json=self._make_rede_simples())
        assert "attachment" in resp.headers.get("content-disposition", "")
        assert ".dxf" in resp.headers.get("content-disposition", "")

    def test_generate_dxf_content(self):
        resp = client.post("/api/dxf/generate", json=self._make_rede_simples())
        content = resp.content.decode("utf-8", errors="ignore")
        assert "SECTION" in content or "ENTITIES" in content

    def test_generate_empty_rede(self):
        resp = client.post("/api/dxf/generate", json={
            "postes": [], "trechos": [], "transformadores": [],
            "titulo": "VAZIO", "escala": "S/E"
        })
        assert resp.status_code == 200

    def test_generate_with_transformador(self):
        payload = self._make_rede_simples()
        payload["transformadores"] = [
            {"id": "T1", "poste_id": "2", "potencia_kva": 45.0}
        ]
        resp = client.post("/api/dxf/generate", json=payload)
        assert resp.status_code == 200

    def test_generate_with_bt_trecho(self):
        payload = {
            "postes": [
                {"id": "A", "x": 0.0, "y": 0.0},
                {"id": "B", "x": 30.0, "y": 20.0},
            ],
            "trechos": [{"poste_a": "A", "poste_b": "B", "nivel": "BT", "condutor": "Multiplex 35mm²"}],
            "transformadores": [],
        }
        resp = client.post("/api/dxf/generate", json=payload)
        assert resp.status_code == 200


class TestDxfValidate:
    """Testes do endpoint POST /api/dxf/validate"""

    def _make_rede(self):
        return {
            "postes": [
                {"id": "1", "x": 0.0, "y": 0.0},
                {"id": "2", "x": 60.0, "y": 0.0},
            ],
            "trechos": [{"poste_a": "1", "poste_b": "2", "nivel": "MT"}],
            "transformadores": [],
        }

    def test_validate_returns_200(self):
        resp = client.post("/api/dxf/validate", json=self._make_rede())
        assert resp.status_code == 200

    def test_validate_valid_true(self):
        resp = client.post("/api/dxf/validate", json=self._make_rede())
        data = resp.json()
        assert data["valid"] is True

    def test_validate_has_layers(self):
        resp = client.post("/api/dxf/validate", json=self._make_rede())
        data = resp.json()
        assert "POSTES" in data["layers_found"]
        assert "REDE_MT" in data["layers_found"]

    def test_validate_has_entity_counts(self):
        resp = client.post("/api/dxf/validate", json=self._make_rede())
        data = resp.json()
        assert isinstance(data["entity_counts"], dict)
        assert data["total_entities"] > 0

    def test_validate_dxf_version(self):
        resp = client.post("/api/dxf/validate", json=self._make_rede())
        data = resp.json()
        assert "dxf_version" in data
        assert data["dxf_version"] is not None


class TestLandingPage:
    """Testes da landing page servida em /"""

    def test_landing_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_landing_content_type_html(self):
        resp = client.get("/")
        assert "text/html" in resp.headers.get("content-type", "")

    def test_landing_contains_brand(self):
        resp = client.get("/")
        html = resp.text
        assert "CQT Light" in html

    def test_landing_contains_abnt_reference(self):
        resp = client.get("/")
        assert "ABNT" in resp.text

    def test_landing_contains_prodist_reference(self):
        resp = client.get("/")
        assert "PRODIST" in resp.text

    def test_landing_contains_api_endpoints(self):
        resp = client.get("/")
        html = resp.text
        assert "/api/dxf/generate" in html
        assert "/api/prodist/classificar-tensao" in html

    def test_landing_is_ptbr(self):
        resp = client.get("/")
        html = resp.text
        assert 'lang="pt-BR"' in html

    def test_landing_features_section(self):
        resp = client.get("/")
        html = resp.text
        assert "Geração DXF 2.5D" in html
        assert "Georreferenciamento" in html

    def test_landing_normas_section(self):
        resp = client.get("/")
        html = resp.text
        assert "NBR 5410" in html
        assert "NBR 14039" in html
        assert "PRODIST Módulo 6" in html
        assert "PRODIST Módulo 8" in html

    def test_landing_docker_mention(self):
        resp = client.get("/")
        assert "Docker" in resp.text


class TestSecurityHeaders:
    """Testes dos cabeçalhos de segurança HTTP (SecurityHeadersMiddleware)."""

    def test_health_x_content_type_options(self):
        resp = client.get("/health")
        assert resp.headers.get("x-content-type-options") == "nosniff"

    def test_health_x_frame_options(self):
        resp = client.get("/health")
        assert resp.headers.get("x-frame-options") == "DENY"

    def test_health_referrer_policy(self):
        resp = client.get("/health")
        assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_api_endpoint_security_headers(self):
        resp = client.get("/api/queda-tensao/tensoes")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"

    def test_landing_security_headers(self):
        resp = client.get("/")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
