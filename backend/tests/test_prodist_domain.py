"""
CQT Light — Testes de domínio ANEEL/PRODIST (constantes + classificação de tensão)

Referência normativa:
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

from domain.entities import (
    FAIXAS_TENSAO_PRODIST_BT,
    FAIXAS_TENSAO_PRODIST_MT,
    LIMITE_QUEDA_PRODIST_PCT,
    CLASSIFICACAO_ADEQUADA,
    CLASSIFICACAO_PRECARIA,
    CLASSIFICACAO_CRITICA,
    NORMA_PRODIST,
)
from services.prodist_service import classificar_tensao_prodist


# ─────────────────────────────────────────────────────────────────────────────
# Testes de constantes de domínio
# ─────────────────────────────────────────────────────────────────────────────

class TestDomainConstantsPRODIST:
    def test_faixas_bt_adequada(self):
        assert FAIXAS_TENSAO_PRODIST_BT["ADEQUADA"] == (0.93, 1.05)

    def test_faixas_bt_precaria(self):
        assert FAIXAS_TENSAO_PRODIST_BT["PRECARIA"] == (0.90, 1.06)

    def test_faixas_mt_adequada(self):
        assert FAIXAS_TENSAO_PRODIST_MT["ADEQUADA"] == (0.95, 1.05)

    def test_faixas_mt_precaria(self):
        assert FAIXAS_TENSAO_PRODIST_MT["PRECARIA"] == (0.93, 1.06)

    def test_limite_queda_bt_alimentador(self):
        assert LIMITE_QUEDA_PRODIST_PCT["BT_ALIMENTADOR"] == 5.0

    def test_limite_queda_bt_ramal(self):
        assert LIMITE_QUEDA_PRODIST_PCT["BT_RAMAL"] == 2.0

    def test_limite_queda_mt(self):
        assert LIMITE_QUEDA_PRODIST_PCT["MT"] == 3.0

    def test_norma_prodist_valor(self):
        assert NORMA_PRODIST == "ANEEL_PRODIST"


# ─────────────────────────────────────────────────────────────────────────────
# Testes de classificação de tensão BT
# ─────────────────────────────────────────────────────────────────────────────

class TestClassificacaoTensaoBT:
    """Testa classificação PRODIST Módulo 8 para rede BT."""

    def test_tensao_adequada_centro(self):
        r = classificar_tensao_prodist(220.0, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_ADEQUADA
        assert r.aviso_toast is None

    def test_tensao_adequada_limite_inferior(self):
        r = classificar_tensao_prodist(220.0 * 0.93, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_ADEQUADA

    def test_tensao_adequada_limite_superior(self):
        r = classificar_tensao_prodist(220.0 * 1.05, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_ADEQUADA

    def test_tensao_precaria_abaixo(self):
        r = classificar_tensao_prodist(220.0 * 0.91, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_PRECARIA
        assert r.aviso_toast is not None
        assert "PRODIST" in r.aviso_toast
        assert "ABNT" in r.aviso_toast

    def test_tensao_precaria_acima(self):
        r = classificar_tensao_prodist(220.0 * 1.055, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_PRECARIA

    def test_tensao_critica_abaixo(self):
        r = classificar_tensao_prodist(220.0 * 0.85, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_CRITICA
        assert "CRÍTICA" in r.aviso_toast
        assert "obrigatória" in r.aviso_toast

    def test_tensao_critica_acima(self):
        r = classificar_tensao_prodist(220.0 * 1.10, 220.0, "BT")
        assert r.classificacao == CLASSIFICACAO_CRITICA

    def test_norma_sempre_prodist(self):
        r = classificar_tensao_prodist(220.0, 220.0, "BT")
        assert r.norma_aplicada == NORMA_PRODIST

    def test_relacao_calculada_corretamente(self):
        r = classificar_tensao_prodist(209.0, 220.0, "BT")
        assert abs(r.relacao_vc_vr - 209 / 220) < 0.001

    def test_nivel_normalizado_para_maiuscula(self):
        r = classificar_tensao_prodist(220.0, 220.0, "bt")
        assert r.nivel == "BT"


# ─────────────────────────────────────────────────────────────────────────────
# Testes de classificação de tensão MT
# ─────────────────────────────────────────────────────────────────────────────

class TestClassificacaoTensaoMT:
    """Testa classificação PRODIST Módulo 8 para rede MT."""

    def test_tensao_mt_adequada(self):
        r = classificar_tensao_prodist(13800.0, 13800.0, "MT")
        assert r.classificacao == CLASSIFICACAO_ADEQUADA

    def test_tensao_mt_precaria_abaixo_limite_menor(self):
        r = classificar_tensao_prodist(13800.0 * 0.94, 13800.0, "MT")
        assert r.classificacao == CLASSIFICACAO_PRECARIA

    def test_tensao_mt_critica_abaixo(self):
        r = classificar_tensao_prodist(13800.0 * 0.90, 13800.0, "MT")
        assert r.classificacao == CLASSIFICACAO_CRITICA

    def test_tensao_mt_nivel_correto(self):
        r = classificar_tensao_prodist(13800.0, 13800.0, "MT")
        assert r.nivel == "MT"


# ─────────────────────────────────────────────────────────────────────────────
# Testes de validação de entrada
# ─────────────────────────────────────────────────────────────────────────────

class TestClassificacaoValidacao:
    def test_nivel_invalido(self):
        with pytest.raises(ValueError, match="nivel deve ser"):
            classificar_tensao_prodist(220.0, 220.0, "AT")

    def test_tensao_referencia_zero(self):
        with pytest.raises(ValueError, match="positiva"):
            classificar_tensao_prodist(220.0, 0.0, "BT")
