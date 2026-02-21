"""
CQT Light — Testes do Serviço de Queda de Tensão
Cobre: services/voltage_drop_service.py + api/voltage_drop_router.py + domain entities

Coordenadas de referência (MEMORY.md):
  UTM 23K: 788547 E, 7634925 N
  Decimal: -22.15018, -42.92185
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import math
import pytest
from fastapi.testclient import TestClient

from domain.entities import (
    TrechoEletrico,
    CargaEletrica,
    RESISTIVIDADE_CONDUTOR,
    LIMITE_QUEDA_PCT,
)
from services.voltage_drop_service import (
    calcular_corrente,
    calcular_queda_trecho,
    calcular_rede,
)
from main import app

client = TestClient(app)


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def trecho_bt_al():
    return TrechoEletrico(
        id="T1",
        poste_a="P1",
        poste_b="P2",
        comprimento_m=100.0,
        secao_mm2=35.0,
        nivel="BT",
        material="AL",
        num_fases=3,
    )


@pytest.fixture
def carga_5kw():
    return CargaEletrica(poste_id="P2", potencia_w=5000.0, fator_potencia=0.92)


# ─────────────────────────────────────────────
# Testes de Entidade de Domínio
# ─────────────────────────────────────────────

class TestTrechoEletrico:
    def test_defaults_validos(self, trecho_bt_al):
        assert trecho_bt_al.nivel == "BT"
        assert trecho_bt_al.material == "AL"
        assert trecho_bt_al.num_fases == 3

    def test_nivel_invalido_raises(self):
        with pytest.raises(ValueError, match="Nível inválido"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, nivel="AT")

    def test_material_invalido_raises(self):
        with pytest.raises(ValueError, match="Material inválido"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, material="FE")

    def test_comprimento_zero_raises(self):
        with pytest.raises(ValueError, match="comprimento_m"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=0)

    def test_comprimento_negativo_raises(self):
        with pytest.raises(ValueError, match="comprimento_m"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=-10)

    def test_num_fases_invalido_raises(self):
        with pytest.raises(ValueError, match="num_fases"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, num_fases=2)

    def test_secao_zero_raises(self):
        with pytest.raises(ValueError, match="secao_mm2"):
            TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, secao_mm2=0)

    def test_material_cu_valido(self):
        t = TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, material="CU")
        assert t.material == "CU"

    def test_num_fases_1_valido(self):
        t = TrechoEletrico(id="X", poste_a="A", poste_b="B", comprimento_m=50, num_fases=1)
        assert t.num_fases == 1


class TestCargaEletrica:
    def test_defaults(self):
        c = CargaEletrica(poste_id="P1", potencia_w=1000.0)
        assert c.fator_potencia == 0.92

    def test_potencia_negativa_raises(self):
        with pytest.raises(ValueError, match="potencia_w"):
            CargaEletrica(poste_id="P1", potencia_w=-100)

    def test_fator_potencia_zero_raises(self):
        with pytest.raises(ValueError, match="fator_potencia"):
            CargaEletrica(poste_id="P1", potencia_w=1000, fator_potencia=0.0)

    def test_fator_potencia_acima_1_raises(self):
        with pytest.raises(ValueError, match="fator_potencia"):
            CargaEletrica(poste_id="P1", potencia_w=1000, fator_potencia=1.1)


# ─────────────────────────────────────────────
# Testes do Serviço
# ─────────────────────────────────────────────

class TestCalcularCorrente:
    def test_trifasico_380v(self):
        # P = 5000W, V=380V, fp=1.0 → I = 5000/(√3×380×1) ≈ 7.59 A
        corrente = calcular_corrente(5000.0, 380.0, 1.0, 3)
        assert abs(corrente - 5000 / (math.sqrt(3) * 380)) < 0.01

    def test_monofasico_220v(self):
        # P = 1000W, V=220V, fp=1.0 → I = 1000/220 ≈ 4.545 A
        corrente = calcular_corrente(1000.0, 220.0, 1.0, 1)
        assert abs(corrente - 1000 / 220) < 0.01

    def test_com_fator_potencia(self):
        # fp=0.92 → I maior
        i_fp1 = calcular_corrente(5000, 380, 1.0, 3)
        i_fp92 = calcular_corrente(5000, 380, 0.92, 3)
        assert i_fp92 > i_fp1


class TestCalcularQuedaTrecho:
    def test_queda_positiva(self, trecho_bt_al, carga_5kw):
        corrente = calcular_corrente(5000.0, 220.0, 0.92, 3)
        resultado = calcular_queda_trecho(trecho_bt_al, corrente, 220.0, 0.92)
        assert resultado.queda_v > 0
        assert resultado.queda_pct > 0

    def test_corrente_zero_queda_zero(self, trecho_bt_al):
        resultado = calcular_queda_trecho(trecho_bt_al, 0.0, 220.0, 0.92)
        assert resultado.queda_v == 0.0
        assert resultado.queda_pct == 0.0

    def test_conforme_pequena_carga(self):
        trecho = TrechoEletrico(
            id="T1", poste_a="P1", poste_b="P2",
            comprimento_m=50.0, secao_mm2=70.0, nivel="BT", material="CU",
        )
        resultado = calcular_queda_trecho(trecho, corrente_a=5.0, tensao_nominal_v=220.0)
        # Queda = √3 × 5 × 50 × (0.018510/70) × 0.92 ≈ 0.18 V → 0.08% < 7%
        assert resultado.conforme is True

    def test_nao_conforme_alta_carga(self):
        trecho = TrechoEletrico(
            id="T1", poste_a="P1", poste_b="P2",
            comprimento_m=2000.0, secao_mm2=10.0, nivel="BT", material="AL",
        )
        resultado = calcular_queda_trecho(trecho, corrente_a=100.0, tensao_nominal_v=127.0)
        assert resultado.conforme is False

    def test_resistividade_al_maior_que_cu(self):
        """Alumínio tem mais resistência que cobre: queda AL > queda CU."""
        trecho_al = TrechoEletrico(id="AL", poste_a="A", poste_b="B", comprimento_m=100, secao_mm2=35, material="AL")
        trecho_cu = TrechoEletrico(id="CU", poste_a="A", poste_b="B", comprimento_m=100, secao_mm2=35, material="CU")
        r_al = calcular_queda_trecho(trecho_al, 10.0, 220.0)
        r_cu = calcular_queda_trecho(trecho_cu, 10.0, 220.0)
        assert r_al.queda_v > r_cu.queda_v

    def test_queda_proporcional_comprimento(self):
        """Dobrando o comprimento, dobra a queda."""
        t1 = TrechoEletrico(id="T1", poste_a="A", poste_b="B", comprimento_m=100)
        t2 = TrechoEletrico(id="T2", poste_a="A", poste_b="B", comprimento_m=200)
        r1 = calcular_queda_trecho(t1, 10.0, 220.0)
        r2 = calcular_queda_trecho(t2, 10.0, 220.0)
        assert abs(r2.queda_v - 2 * r1.queda_v) < 0.001

    def test_trecho_mt_limite_2pct(self):
        trecho = TrechoEletrico(
            id="T1", poste_a="P1", poste_b="P2",
            comprimento_m=100.0, secao_mm2=35.0, nivel="MT", material="AL",
        )
        resultado = calcular_queda_trecho(trecho, 5.0, 13800.0)
        # Limite MT é 2%, queda deve ser muito pequena nessa tensão
        assert resultado.conforme is True


class TestCalcularRede:
    def test_rede_simples(self):
        trechos = [
            TrechoEletrico(id="T1", poste_a="P1", poste_b="P2", comprimento_m=100),
            TrechoEletrico(id="T2", poste_a="P2", poste_b="P3", comprimento_m=100),
        ]
        cargas = [
            CargaEletrica(poste_id="P2", potencia_w=2000),
            CargaEletrica(poste_id="P3", potencia_w=3000),
        ]
        resultado = calcular_rede(trechos, cargas, tensao_nominal_v=220.0)
        assert len(resultado.trechos) == 2
        assert resultado.queda_maxima_pct >= 0
        assert isinstance(resultado.rede_conforme, bool)

    def test_rede_sem_carga_conforme(self):
        trechos = [TrechoEletrico(id="T1", poste_a="P1", poste_b="P2", comprimento_m=100)]
        resultado = calcular_rede(trechos, [], tensao_nominal_v=220.0)
        # Sem carga, sem queda
        assert resultado.queda_maxima_pct == 0.0
        assert resultado.rede_conforme is True

    def test_limite_bt_7pct(self):
        resultado = calcular_rede(
            [TrechoEletrico(id="T1", poste_a="P1", poste_b="P2", comprimento_m=100)],
            [],
            tensao_nominal_v=220.0,
        )
        assert resultado.limite_pct == 7.0

    def test_limite_mt_2pct(self):
        resultado = calcular_rede(
            [TrechoEletrico(id="T1", poste_a="P1", poste_b="P2", comprimento_m=100, nivel="MT")],
            [],
            tensao_nominal_v=13800.0,
        )
        assert resultado.limite_pct == 2.0


# ─────────────────────────────────────────────
# Testes de Integração da API
# ─────────────────────────────────────────────

class TestVoltageDropAPI:
    BASE = "/api/queda-tensao"

    def test_calcular_rede_simples(self):
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": 100, "secao_mm2": 35, "nivel": "BT", "material": "AL", "num_fases": 3},
            ],
            "cargas": [
                {"poste_id": "P2", "potencia_w": 5000, "fator_potencia": 0.92},
            ],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "trechos" in data
        assert "resumo" in data
        assert data["resumo"]["tensao_nominal_v"] == 220.0

    def test_calcular_rede_vazia_retorna_422(self):
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [],  # lista vazia não é aceita
            "cargas": [],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 422

    def test_nivel_invalido_retorna_422(self):
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": 100, "nivel": "AT"},
            ],
            "cargas": [],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 422

    def test_comprimento_negativo_retorna_422(self):
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": -50},
            ],
            "cargas": [],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 422

    def test_material_invalido_retorna_422(self):
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": 100, "material": "FE"},
            ],
            "cargas": [],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 422

    def test_nivel_lowercase_normalizado(self):
        """'bt' em minúsculo deve ser aceito e normalizado."""
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": 100, "nivel": "bt"},
            ],
            "cargas": [],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 200

    def test_listar_tensoes(self):
        resp = client.get(f"{self.BASE}/tensoes")
        assert resp.status_code == 200
        data = resp.json()
        assert "tensoes" in data
        codigos = [t["codigo"] for t in data["tensoes"]]
        assert "BT_220" in codigos
        assert "MT_13800" in codigos

    def test_resultado_rede_conforme(self):
        """Rede com carga pequena deve ser conforme."""
        resp = client.post(f"{self.BASE}/calcular", json={
            "trechos": [
                {"id": "T1", "poste_a": "P1", "poste_b": "P2",
                 "comprimento_m": 50, "secao_mm2": 70, "material": "CU"},
            ],
            "cargas": [{"poste_id": "P2", "potencia_w": 500, "fator_potencia": 0.95}],
            "tensao_nominal_v": 220.0,
        })
        assert resp.status_code == 200
        assert resp.json()["resumo"]["rede_conforme"] is True
