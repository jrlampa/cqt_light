"""
CQT Light — Testes das Entidades de Domínio
Cobre: domain/entities.py — Poste, TrechoRede, Transformador, RedeEletrica
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from domain.entities import (
    Poste,
    TrechoRede,
    Transformador,
    RedeEletrica,
    NIVEL_MT,
    NIVEL_BT,
    NIVEIS_VALIDOS,
    LAYERS_CONFIG,
)


class TestPoste:
    def test_defaults(self):
        p = Poste(id="1", x=0.0, y=0.0)
        assert p.altura_m == 11.0
        assert p.carga_dan == 300
        assert p.descricao == ""

    def test_custom_values(self):
        p = Poste(id="P1", x=100.5, y=200.3, altura_m=13.0, carga_dan=600, descricao="Principal")
        assert p.id == "P1"
        assert p.x == 100.5
        assert p.altura_m == 13.0
        assert p.carga_dan == 600


class TestTrechoRede:
    def test_defaults(self):
        t = TrechoRede(poste_a="1", poste_b="2")
        assert t.nivel == NIVEL_MT
        assert t.condutor == ""

    def test_nivel_mt_valid(self):
        t = TrechoRede(poste_a="1", poste_b="2", nivel="MT")
        assert t.nivel == "MT"

    def test_nivel_bt_valid(self):
        t = TrechoRede(poste_a="1", poste_b="2", nivel="BT")
        assert t.nivel == "BT"

    def test_nivel_invalido_raises(self):
        with pytest.raises(ValueError, match="Nível inválido"):
            TrechoRede(poste_a="1", poste_b="2", nivel="AT")

    def test_nivel_invalido_vazio(self):
        with pytest.raises(ValueError):
            TrechoRede(poste_a="1", poste_b="2", nivel="")

    def test_condutor_set(self):
        t = TrechoRede(poste_a="1", poste_b="2", condutor="CAA 35mm²")
        assert t.condutor == "CAA 35mm²"


class TestTransformador:
    def test_defaults(self):
        tr = Transformador(id="T1", poste_id="P5")
        assert tr.potencia_kva == 30.0

    def test_custom_potencia(self):
        tr = Transformador(id="T2", poste_id="P3", potencia_kva=112.5)
        assert tr.potencia_kva == 112.5


class TestRedeEletrica:
    def _make_rede(self):
        return RedeEletrica(
            postes=[
                Poste(id="1", x=0.0, y=0.0),
                Poste(id="2", x=50.0, y=0.0),
                Poste(id="3", x=100.0, y=0.0),
            ],
            trechos=[
                TrechoRede(poste_a="1", poste_b="2", nivel="MT"),
                TrechoRede(poste_a="2", poste_b="3", nivel="BT"),
            ],
            transformadores=[
                Transformador(id="T1", poste_id="2", potencia_kva=45.0),
            ],
        )

    def test_get_poste_found(self):
        rede = self._make_rede()
        poste = rede.get_poste("2")
        assert poste is not None
        assert poste.x == 50.0

    def test_get_poste_not_found(self):
        rede = self._make_rede()
        assert rede.get_poste("99") is None

    def test_defaults(self):
        rede = RedeEletrica()
        assert rede.titulo == "REDE DE DISTRIBUIÇÃO"
        assert rede.escala == "S/E"
        assert rede.postes == []

    def test_multiple_postes(self):
        rede = self._make_rede()
        assert len(rede.postes) == 3
        assert len(rede.trechos) == 2
        assert len(rede.transformadores) == 1


class TestConstants:
    def test_niveis_validos(self):
        assert "MT" in NIVEIS_VALIDOS
        assert "BT" in NIVEIS_VALIDOS

    def test_layers_config_has_required_keys(self):
        required = {"POSTES", "REDE_MT", "REDE_BT", "TRANSFORMADOR", "TEXTO", "COTA"}
        assert required.issubset(set(LAYERS_CONFIG.keys()))

    def test_layers_config_has_color(self):
        for name, props in LAYERS_CONFIG.items():
            assert "color" in props, f"Camada {name} sem cor"


class TestDxfRouterValidation:
    """Testa validação do TrechoModel via API (nível inválido)."""

    def test_nivel_invalido_retorna_422(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        resp = client.post("/api/dxf/generate", json={
            "postes": [{"id": "1", "x": 0, "y": 0}, {"id": "2", "x": 10, "y": 0}],
            "trechos": [{"poste_a": "1", "poste_b": "2", "nivel": "AT"}],
            "transformadores": [],
        })
        assert resp.status_code == 422

    def test_potencia_negativa_retorna_422(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        resp = client.post("/api/dxf/generate", json={
            "postes": [{"id": "1", "x": 0, "y": 0}],
            "trechos": [],
            "transformadores": [{"id": "T1", "poste_id": "1", "potencia_kva": -10}],
        })
        assert resp.status_code == 422

    def test_nivel_lowercase_accepted(self):
        """nivel 'mt' (lowercase) deve ser aceito e normalizado para 'MT'."""
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        resp = client.post("/api/dxf/validate", json={
            "postes": [{"id": "1", "x": 0, "y": 0}, {"id": "2", "x": 10, "y": 0}],
            "trechos": [{"poste_a": "1", "poste_b": "2", "nivel": "mt"}],
            "transformadores": [],
        })
        assert resp.status_code == 200
