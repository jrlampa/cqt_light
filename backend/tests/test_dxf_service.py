"""
CQT Light — Testes do Serviço DXF
Valida geração de DXF 2.5D: entidades, camadas, conteúdo e robustez.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

try:
    import ezdxf
    EZDXF_AVAILABLE = True
except ImportError:
    EZDXF_AVAILABLE = False

from services.dxf_service import (
    RedeEletrica, Poste, TrechoRede, Transformador,
    generate_dxf, validate_dxf, LAYERS,
)

pytestmark = pytest.mark.skipif(not EZDXF_AVAILABLE, reason="ezdxf não instalado")


def make_rede_simples() -> RedeEletrica:
    """Rede mínima para testes: 2 postes + 1 trecho MT."""
    return RedeEletrica(
        postes=[
            Poste(id="1", x=0.0, y=0.0, altura_m=11.0, carga_dan=300),
            Poste(id="2", x=50.0, y=0.0, altura_m=11.0, carga_dan=300),
        ],
        trechos=[TrechoRede(poste_a="1", poste_b="2", nivel="MT", condutor="CAA 35mm²")],
        titulo="REDE TESTE",
    )


def make_rede_completa() -> RedeEletrica:
    """Rede com MT, BT e transformador."""
    return RedeEletrica(
        postes=[
            Poste(id="1", x=0.0, y=0.0),
            Poste(id="2", x=30.0, y=0.0),
            Poste(id="3", x=30.0, y=20.0),
        ],
        trechos=[
            TrechoRede(poste_a="1", poste_b="2", nivel="MT"),
            TrechoRede(poste_a="2", poste_b="3", nivel="BT", condutor="Multiplex 35mm²"),
        ],
        transformadores=[Transformador(id="T1", poste_id="2", potencia_kva=45.0)],
        titulo="REDE COMPLETA",
    )


class TestGenerateDxf:
    def test_returns_bytes(self):
        rede = make_rede_simples()
        result = generate_dxf(rede)
        assert isinstance(result, bytes)
        assert len(result) > 0

    def test_valid_dxf_header(self):
        rede = make_rede_simples()
        result = generate_dxf(rede)
        # DXF começa com seção HEADER
        text = result.decode("utf-8", errors="ignore")
        assert "SECTION" in text
        assert "HEADER" in text or "ENTITIES" in text

    def test_postes_layer_exists(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert "POSTES" in result["layers_found"]

    def test_rede_mt_layer_exists(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert "REDE_MT" in result["layers_found"]

    def test_rede_bt_layer_exists(self):
        rede = make_rede_completa()
        result = validate_dxf(generate_dxf(rede))
        assert "REDE_BT" in result["layers_found"]

    def test_transformador_layer_exists(self):
        rede = make_rede_completa()
        result = validate_dxf(generate_dxf(rede))
        assert "TRANSFORMADOR" in result["layers_found"]

    def test_texto_layer_exists(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert "TEXTO" in result["layers_found"]

    def test_has_circle_entities(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert result["entity_counts"].get("CIRCLE", 0) >= 2  # 1 por poste

    def test_has_line_entities(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert result["entity_counts"].get("LINE", 0) >= 1

    def test_empty_rede_generates_dxf(self):
        rede = RedeEletrica()
        result = generate_dxf(rede)
        assert isinstance(result, bytes)
        assert len(result) > 0


class TestValidateDxf:
    def test_valid_returns_true(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert result["valid"] is True

    def test_returns_dxf_version(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert "dxf_version" in result
        assert result["dxf_version"] is not None

    def test_entity_counts_present(self):
        rede = make_rede_simples()
        result = validate_dxf(generate_dxf(rede))
        assert isinstance(result["entity_counts"], dict)
        assert result["total_entities"] > 0
