"""
Testes para o serviço IFC (Half-way BIM) e router IFC.
Cobre: generate_ifc, validate_ifc, POST /api/ifc/export, POST /api/ifc/validate.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from domain.entities import (
    RedeEletrica, Poste, TrechoRede, Transformador,
)
from services.ifc_service import generate_ifc, validate_ifc
from main import app

client = TestClient(app)

# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture()
def rede_simples() -> RedeEletrica:
    """Rede com 2 postes, 1 trecho BT e 1 transformador."""
    return RedeEletrica(
        postes=[
            Poste(id="01", x=0.0, y=0.0, altura_m=11.0, carga_dan=300),
            Poste(id="02", x=50.0, y=0.0, altura_m=9.0, carga_dan=150, descricao="Poste Fim"),
        ],
        trechos=[TrechoRede(poste_a="01", poste_b="02", nivel="BT", condutor="70mm²")],
        transformadores=[Transformador(id="01", poste_id="01", potencia_kva=75.0)],
        titulo="REDE TESTE",
    )


@pytest.fixture()
def rede_mt() -> RedeEletrica:
    """Rede com trecho MT."""
    return RedeEletrica(
        postes=[
            Poste(id="A", x=788547.0, y=7634925.0),
            Poste(id="B", x=788647.0, y=7634925.0),
        ],
        trechos=[TrechoRede(poste_a="A", poste_b="B", nivel="MT", condutor="CAA 35mm²")],
        titulo="REDE MT",
    )


@pytest.fixture()
def rede_sem_trecho() -> RedeEletrica:
    """Rede com apenas 1 poste e sem trechos."""
    return RedeEletrica(
        postes=[Poste(id="X", x=10.0, y=10.0)],
    )


# ─── Testes: generate_ifc ─────────────────────────────────────────────────────

class TestGenerateIfc:
    def test_retorna_bytes(self, rede_simples):
        result = generate_ifc(rede_simples)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_cabecalho_iso(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "ISO-10303-21;" in content

    def test_footer_iso(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "END-ISO-10303-21;" in content

    def test_schema_ifc2x3(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFC2X3" in content

    def test_ifcproject_presente(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCPROJECT" in content

    def test_titulo_no_arquivo(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "REDE TESTE" in content

    def test_postes_como_ifccolumn(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCCOLUMN" in content
        # Deve haver 2 postes
        assert content.count("IFCCOLUMN") == 2

    def test_trecho_como_ifcflowsegment(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCFLOWSEGMENT" in content

    def test_transformador_ifcelectrical(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCELECTRICALDISTRIBUTIONELEMENT" in content

    def test_propriedade_altura_poste(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "AlturaPoste" in content
        assert "11.00" in content

    def test_propriedade_carga_dan(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "CargaMecanicaDaN" in content

    def test_propriedade_potencia_kva(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "PotenciaKVA" in content
        assert "75.00" in content

    def test_nivel_tensao_no_trecho(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "NivelTensao" in content
        assert "'BT'" in content

    def test_trecho_mt(self, rede_mt):
        content = generate_ifc(rede_mt).decode("utf-8")
        assert "'MT'" in content
        assert "IFCFLOWSEGMENT" in content

    def test_condutor_no_trecho(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "70mm" in content

    def test_rede_sem_trecho(self, rede_sem_trecho):
        result = generate_ifc(rede_sem_trecho)
        content = result.decode("utf-8")
        assert "IFCCOLUMN" in content
        assert "IFCFLOWSEGMENT" not in content

    def test_rede_sem_transformador(self):
        rede = RedeEletrica(
            postes=[Poste(id="1", x=0.0, y=0.0)],
        )
        content = generate_ifc(rede).decode("utf-8")
        assert "IFCELECTRICALDISTRIBUTIONELEMENT" not in content

    def test_trecho_poste_inexistente_ignorado(self):
        """Trecho referenciando poste inexistente deve ser ignorado sem erro."""
        rede = RedeEletrica(
            postes=[Poste(id="1", x=0.0, y=0.0)],
            trechos=[TrechoRede(poste_a="1", poste_b="FANTASMA", nivel="BT")],
        )
        content = generate_ifc(rede).decode("utf-8")
        # Não deve gerar IFCFLOWSEGMENT para trecho incompleto
        assert "IFCFLOWSEGMENT" not in content

    def test_transformador_poste_inexistente_ignorado(self):
        rede = RedeEletrica(
            postes=[Poste(id="1", x=0.0, y=0.0)],
            transformadores=[Transformador(id="T1", poste_id="FANTASMA", potencia_kva=30.0)],
        )
        content = generate_ifc(rede).decode("utf-8")
        assert "IFCELECTRICALDISTRIBUTIONELEMENT" not in content

    def test_rel_contained_in_spatial_structure(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCRELCONTAINEDINSPATIALSTRUCTURE" in content

    def test_ifcsite_e_building_presentes(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "IFCSITE" in content
        assert "IFCBUILDING" in content

    def test_guid_deterministico(self, rede_simples):
        """GUIDs devem ser idênticos em duas gerações com a mesma rede."""
        content1 = generate_ifc(rede_simples).decode("utf-8")
        content2 = generate_ifc(rede_simples).decode("utf-8")
        # Extrai apenas linhas com entidades (ignorando timestamp do FILE_NAME)
        lines1 = [l for l in content1.splitlines() if l.startswith("#")]
        lines2 = [l for l in content2.splitlines() if l.startswith("#")]
        assert lines1 == lines2

    def test_coordenadas_poste_no_arquivo(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "50.0000" in content  # coordenada X do poste 02

    def test_descricao_poste_no_arquivo(self, rede_simples):
        content = generate_ifc(rede_simples).decode("utf-8")
        assert "Poste Fim" in content


# ─── Testes: validate_ifc ─────────────────────────────────────────────────────

class TestValidateIfc:
    def test_valida_ifc_gerado(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["valid"] is True

    def test_schema_ifc2x3(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["schema"] == "IFC2X3"

    def test_contagem_postes(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["n_postes"] == 2

    def test_contagem_trechos(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["n_trechos"] == 1

    def test_contagem_transformadores(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["n_trafos"] == 1

    def test_arquivo_invalido(self):
        result = validate_ifc(b"lixo nao e ifc")
        assert result["valid"] is False
        assert len(result["warnings"]) > 0

    def test_has_header_e_footer(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["has_header"] is True
        assert result["has_footer"] is True

    def test_total_entidades_positivo(self, rede_simples):
        ifc_bytes = generate_ifc(rede_simples)
        result = validate_ifc(ifc_bytes)
        assert result["total_entities"] > 10


# ─── Testes: API Router ───────────────────────────────────────────────────────

# ─── Testes: API Router ───────────────────────────────────────────────────────

@pytest.fixture()
def payload_basico():
    return {
        "postes": [
            {"id": "01", "x": 0.0, "y": 0.0, "altura_m": 11.0, "carga_dan": 300},
            {"id": "02", "x": 50.0, "y": 0.0, "altura_m": 9.0, "carga_dan": 150},
        ],
        "trechos": [{"poste_a": "01", "poste_b": "02", "nivel": "BT", "condutor": "70mm²"}],
        "transformadores": [{"id": "T1", "poste_id": "01", "potencia_kva": 75.0}],
        "titulo": "REDE API TEST",
        "escala": "S/E",
    }


class TestIfcRouter:
    def test_export_status_200(self, payload_basico):
        r = client.post("/api/ifc/export", json=payload_basico)
        assert r.status_code == 200

    def test_export_content_type(self, payload_basico):
        r = client.post("/api/ifc/export", json=payload_basico)
        assert "octet-stream" in r.headers["content-type"]

    def test_export_content_disposition(self, payload_basico):
        r = client.post("/api/ifc/export", json=payload_basico)
        assert "rede_eletrica.ifc" in r.headers["content-disposition"]

    def test_export_body_e_ifc_valido(self, payload_basico):
        r = client.post("/api/ifc/export", json=payload_basico)
        result = validate_ifc(r.content)
        assert result["valid"] is True

    def test_export_sem_postes_retorna_422(self):
        r = client.post("/api/ifc/export", json={"postes": [], "titulo": "X"})
        assert r.status_code == 422

    def test_export_nivel_invalido_retorna_422(self):
        payload = {
            "postes": [{"id": "01", "x": 0.0, "y": 0.0}],
            "trechos": [{"poste_a": "01", "poste_b": "02", "nivel": "INVALIDO"}],
        }
        r = client.post("/api/ifc/export", json=payload)
        assert r.status_code == 422

    def test_export_potencia_zero_retorna_422(self):
        payload = {
            "postes": [{"id": "01", "x": 0.0, "y": 0.0}],
            "transformadores": [{"id": "T1", "poste_id": "01", "potencia_kva": 0}],
        }
        r = client.post("/api/ifc/export", json=payload)
        assert r.status_code == 422

    def test_validate_ifc_valido(self, payload_basico):
        r_export = client.post("/api/ifc/export", json=payload_basico)
        ifc_text = r_export.content.decode("utf-8")
        r_val = client.post("/api/ifc/validate", json={"ifc_content": ifc_text})
        assert r_val.status_code == 200
        data = r_val.json()
        assert data["valid"] is True
        assert data["n_postes"] == 2
        assert data["n_trechos"] == 1
        assert data["n_trafos"] == 1

    def test_validate_ifc_invalido(self):
        r = client.post("/api/ifc/validate", json={"ifc_content": "lixo"})
        assert r.status_code == 200
        data = r.json()
        assert data["valid"] is False

    def test_export_rede_mt(self):
        payload = {
            "postes": [
                {"id": "A", "x": 788547.0, "y": 7634925.0},
                {"id": "B", "x": 788647.0, "y": 7634925.0},
            ],
            "trechos": [{"poste_a": "A", "poste_b": "B", "nivel": "MT", "condutor": "CAA 35mm²"}],
            "titulo": "REDE MT TESTE",
        }
        r = client.post("/api/ifc/export", json=payload)
        assert r.status_code == 200
        result = validate_ifc(r.content)
        assert result["valid"] is True
        assert result["n_trechos"] == 1
