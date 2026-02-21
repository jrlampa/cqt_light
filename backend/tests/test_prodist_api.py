"""
CQT Light — Testes de serviço e API ANEEL/PRODIST (queda de tensão + integração REST)

Referência normativa:
  PRODIST Módulo 6 — Acesso ao Sistema de Distribuição
  PRODIST Módulo 8 — Qualidade da Energia Elétrica (Rev. 11, 2022)
  Resolução Normativa ANEEL nº 1.000/2021

Coordenadas de referência (MEMORY.md):
  UTM 23K: 788547 E, 7634925 N
  Decimal: -22.15018, -42.92185
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from domain.entities import (
    CLASSIFICACAO_ADEQUADA,
    CLASSIFICACAO_PRECARIA,
    CLASSIFICACAO_CRITICA,
    NORMA_PRODIST,
)
from services.prodist_service import (
    calcular_queda_alimentador_prodist,
    obter_limites_prodist,
)
from main import app

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de queda de tensão com limites PRODIST
# ─────────────────────────────────────────────────────────────────────────────

class TestQuedaAlimentadorPRODIST:
    """Testa cálculo de queda com limites PRODIST (mais restritivos que ABNT)."""

    def test_bt_alimentador_conforme(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=10.0,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            material="AL",
            num_fases=3,
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.conforme is True
        assert r.limite_pct == 5.0
        assert r.norma_aplicada == NORMA_PRODIST
        assert r.aviso_toast is not None
        assert "PRODIST" in r.aviso_toast

    def test_bt_alimentador_reprovado_prodist_mas_aprovado_abnt(self):
        """Caso crítico: queda entre 5% e 7% — reprovado pelo PRODIST, aprovado pela ABNT."""
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=99.8,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            material="AL",
            num_fases=3,
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.conforme is False
        assert r.abnt_conforme is True
        assert r.abnt_limite_pct == 7.0
        assert "ABNT" in r.aviso_toast
        assert "PRODIST" in r.aviso_toast
        assert "REPROVADA" in r.aviso_toast or "PRODIST" in r.aviso_toast

    def test_bt_ramal_limite_correto(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=10.0,
            corrente_a=5.0,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            tipo_alimentador="BT_RAMAL",
        )
        assert r.limite_pct == 2.0
        assert r.tipo_alimentador == "BT_RAMAL"

    def test_mt_limite_correto(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=500.0,
            corrente_a=20.0,
            secao_mm2=35.0,
            tensao_nominal_v=13800.0,
            tipo_alimentador="MT",
        )
        assert r.limite_pct == 3.0
        assert r.tipo_alimentador == "MT"

    def test_material_cu(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=10.0,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            material="CU",
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.queda_v > 0

    def test_monofasico(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=10.0,
            secao_mm2=35.0,
            tensao_nominal_v=127.0,
            num_fases=1,
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.queda_v > 0

    def test_corrente_zero(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=0.0,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.queda_v == 0.0
        assert r.conforme is True

    def test_retorna_norma_prodist(self):
        r = calcular_queda_alimentador_prodist(
            comprimento_m=100.0,
            corrente_a=10.0,
            secao_mm2=35.0,
            tensao_nominal_v=220.0,
            tipo_alimentador="BT_ALIMENTADOR",
        )
        assert r.norma_aplicada == NORMA_PRODIST

    def test_mt_toast_menciona_abnt_mais_restritiva(self):
        """Para MT, ABNT (2%) é mais restritiva que PRODIST (3%); toast deve informar."""
        r = calcular_queda_alimentador_prodist(
            comprimento_m=500.0,
            corrente_a=20.0,
            secao_mm2=35.0,
            tensao_nominal_v=13800.0,
            tipo_alimentador="MT",
        )
        assert r.abnt_limite_pct == 2.0
        assert r.limite_pct == 3.0
        assert r.aviso_toast is not None
        assert "ABNT" in r.aviso_toast
        assert "PRODIST" in r.aviso_toast


# ─────────────────────────────────────────────────────────────────────────────
# Testes de validação de entradas — queda alimentador
# ─────────────────────────────────────────────────────────────────────────────

class TestQuedaValidacao:
    def test_comprimento_zero(self):
        with pytest.raises(ValueError, match="comprimento_m"):
            calcular_queda_alimentador_prodist(0.0, 10.0, 35.0, 220.0)

    def test_corrente_negativa(self):
        with pytest.raises(ValueError, match="corrente_a"):
            calcular_queda_alimentador_prodist(100.0, -1.0, 35.0, 220.0)

    def test_secao_zero(self):
        with pytest.raises(ValueError, match="secao_mm2"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 0.0, 220.0)

    def test_tensao_zero(self):
        with pytest.raises(ValueError, match="tensao_nominal_v"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 35.0, 0.0)

    def test_material_invalido(self):
        with pytest.raises(ValueError, match="material"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 35.0, 220.0, material="FE")

    def test_num_fases_invalido(self):
        with pytest.raises(ValueError, match="num_fases"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 35.0, 220.0, num_fases=2)

    def test_tipo_alimentador_invalido(self):
        with pytest.raises(ValueError, match="tipo_alimentador"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 35.0, 220.0,
                                               tipo_alimentador="XX")

    def test_fator_potencia_invalido(self):
        with pytest.raises(ValueError, match="fator_potencia"):
            calcular_queda_alimentador_prodist(100.0, 10.0, 35.0, 220.0,
                                               fator_potencia=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de obter_limites_prodist
# ─────────────────────────────────────────────────────────────────────────────

class TestObterLimitesPRODIST:
    def test_retorna_norma_correta(self):
        r = obter_limites_prodist()
        assert r["norma"] == NORMA_PRODIST

    def test_contem_limites_queda(self):
        r = obter_limites_prodist()
        assert "limites_queda" in r
        assert len(r["limites_queda"]) == 3

    def test_bt_alimentador_mais_restritivo(self):
        r = obter_limites_prodist()
        bt = next(l for l in r["limites_queda"] if l["tipo"] == "BT_ALIMENTADOR")
        assert bt["prodist_pct"] < bt["abnt_pct"]
        assert bt["mais_restritivo"] == "PRODIST"

    def test_bt_ramal_mais_restritivo_prodist(self):
        r = obter_limites_prodist()
        ramal = next(l for l in r["limites_queda"] if l["tipo"] == "BT_RAMAL")
        assert ramal["prodist_pct"] < ramal["abnt_pct"]
        assert ramal["mais_restritivo"] == "PRODIST"

    def test_mt_mais_restritivo_abnt(self):
        r = obter_limites_prodist()
        mt = next(l for l in r["limites_queda"] if l["tipo"] == "MT")
        assert mt["abnt_pct"] < mt["prodist_pct"]
        assert mt["mais_restritivo"] == "ABNT"

    def test_contem_faixas_tensao(self):
        r = obter_limites_prodist()
        assert "faixas_tensao_bt" in r
        assert "faixas_tensao_mt" in r

    def test_contem_aviso(self):
        r = obter_limites_prodist()
        assert "aviso" in r
        assert "ABNT" in r["aviso"]


# ─────────────────────────────────────────────────────────────────────────────
# Testes de integração — API REST (TestClient)
# ─────────────────────────────────────────────────────────────────────────────

class TestApiPRODISTClassificacao:
    def test_classificar_tensao_adequada(self):
        resp = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": 220.0,
            "tensao_referencia_v": 220.0,
            "nivel": "BT",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["classificacao"] == CLASSIFICACAO_ADEQUADA
        assert data["norma_aplicada"] == NORMA_PRODIST
        assert data["aviso_toast"] is None

    def test_classificar_tensao_precaria(self):
        resp = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": 200.0,
            "tensao_referencia_v": 220.0,
            "nivel": "BT",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["classificacao"] == CLASSIFICACAO_PRECARIA
        assert data["aviso_toast"] is not None
        assert "PRODIST" in data["aviso_toast"]

    def test_classificar_tensao_critica(self):
        resp = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": 185.0,
            "tensao_referencia_v": 220.0,
            "nivel": "BT",
        })
        assert resp.status_code == 200
        assert resp.json()["classificacao"] == CLASSIFICACAO_CRITICA

    def test_classificar_nivel_invalido_retorna_422(self):
        resp = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": 220.0,
            "tensao_referencia_v": 220.0,
            "nivel": "AT",
        })
        assert resp.status_code == 422

    def test_classificar_tensao_referencia_zero_retorna_422(self):
        resp = client.post("/api/prodist/classificar-tensao", json={
            "tensao_medida_v": 220.0,
            "tensao_referencia_v": 0.0,
            "nivel": "BT",
        })
        assert resp.status_code == 422


class TestApiPRODISTQueda:
    def test_queda_alimentador_conforme(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 50.0,
            "corrente_a": 10.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_ALIMENTADOR",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "queda_pct" in data
        assert "aviso_toast" in data
        assert data["norma_aplicada"] == NORMA_PRODIST

    def test_queda_alimentador_contem_comparacao_abnt(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 100.0,
            "corrente_a": 10.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_ALIMENTADOR",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "abnt_limite_pct" in data
        assert "abnt_conforme" in data

    def test_queda_material_invalido_retorna_422(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 100.0,
            "corrente_a": 10.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "material": "FE",
        })
        assert resp.status_code == 422

    def test_queda_num_fases_invalido_retorna_422(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 100.0,
            "corrente_a": 10.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "num_fases": 2,
        })
        assert resp.status_code == 422

    def test_queda_tipo_alimentador_invalido_retorna_422(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 100.0,
            "corrente_a": 10.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "XX",
        })
        assert resp.status_code == 422

    def test_queda_bt_ramal(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 20.0,
            "corrente_a": 5.0,
            "secao_mm2": 16.0,
            "tensao_nominal_v": 220.0,
            "tipo_alimentador": "BT_RAMAL",
        })
        assert resp.status_code == 200
        assert resp.json()["limite_pct"] == 2.0

    def test_queda_mt(self):
        resp = client.post("/api/prodist/queda-alimentador", json={
            "comprimento_m": 500.0,
            "corrente_a": 20.0,
            "secao_mm2": 35.0,
            "tensao_nominal_v": 13800.0,
            "tipo_alimentador": "MT",
        })
        assert resp.status_code == 200
        assert resp.json()["limite_pct"] == 3.0


class TestApiPRODISTLimites:
    def test_listar_limites(self):
        resp = client.get("/api/prodist/limites")
        assert resp.status_code == 200
        data = resp.json()
        assert data["norma"] == NORMA_PRODIST
        assert len(data["limites_queda"]) == 3

    def test_limites_contem_faixas_tensao(self):
        resp = client.get("/api/prodist/limites")
        data = resp.json()
        assert "faixas_tensao_bt" in data
        assert "faixas_tensao_mt" in data
