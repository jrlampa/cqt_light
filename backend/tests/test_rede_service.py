"""
CQT Light — Testes do Serviço de Análise de Rede Elétrica.

Cobre:
- Conectividade BFS (rede conectada, isolada, rede vazia, rede com 1 poste)
- Cálculo de comprimento euclidiano (MT, BT, misto)
- Análise completa (avisos, estatísticas, transformadores)
- API REST /api/rede/analisar (integração FastAPI TestClient)

Coordenadas de referência: -22.15018, -42.92185 (Zona 23K: 788547, 7634925)
"""

import math
import os
import sys

import pytest
from fastapi.testclient import TestClient

# Module-level sys.path: permite importar main e services
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from domain.entities import NIVEL_BT, NIVEL_MT, Poste, TrechoRede, Transformador
from services.rede_analysis_service import (
    _distancia_m,
    analisar_rede,
    calcular_comprimento_rede,
    validar_conectividade,
)


# ─── Fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture()
def rede_simples():
    """Rede linear de 3 postes conectados: P1-P2-P3."""
    postes = [
        Poste("P1", x=0.0, y=0.0),
        Poste("P2", x=100.0, y=0.0),
        Poste("P3", x=200.0, y=0.0),
    ]
    trechos = [
        TrechoRede("P1", "P2", nivel=NIVEL_MT),
        TrechoRede("P2", "P3", nivel=NIVEL_BT),
    ]
    return postes, trechos


@pytest.fixture()
def rede_com_isolado():
    """Rede com poste P3 desconectado."""
    postes = [
        Poste("P1", x=0.0, y=0.0),
        Poste("P2", x=100.0, y=0.0),
        Poste("P3", x=500.0, y=500.0),  # isolado
    ]
    trechos = [TrechoRede("P1", "P2", nivel=NIVEL_MT)]
    return postes, trechos


# ─── Testes de _distancia_m ───────────────────────────────────────────────────


class TestDistanciaM:
    def test_mesma_posicao_zero(self):
        p = Poste("A", 0.0, 0.0)
        assert _distancia_m(p, p) == 0.0

    def test_distancia_horizontal_100m(self):
        p1 = Poste("A", x=0.0, y=0.0)
        p2 = Poste("B", x=100.0, y=0.0)
        assert _distancia_m(p1, p2) == pytest.approx(100.0)

    def test_distancia_vertical_50m(self):
        p1 = Poste("A", x=0.0, y=0.0)
        p2 = Poste("B", x=0.0, y=50.0)
        assert _distancia_m(p1, p2) == pytest.approx(50.0)

    def test_distancia_diagonal_pitagoras(self):
        p1 = Poste("A", x=0.0, y=0.0)
        p2 = Poste("B", x=30.0, y=40.0)
        assert _distancia_m(p1, p2) == pytest.approx(50.0)


# ─── Testes de validar_conectividade ─────────────────────────────────────────


class TestValidarConectividade:
    def test_rede_vazia_conectada(self):
        conectada, isolados = validar_conectividade([], [])
        assert conectada is True
        assert isolados == []

    def test_um_poste_sem_trecho_conectado(self):
        postes = [Poste("P1", 0, 0)]
        conectada, isolados = validar_conectividade(postes, [])
        assert conectada is True
        assert isolados == []

    def test_rede_linear_conectada(self, rede_simples):
        postes, trechos = rede_simples
        conectada, isolados = validar_conectividade(postes, trechos)
        assert conectada is True
        assert isolados == []

    def test_rede_com_poste_isolado(self, rede_com_isolado):
        postes, trechos = rede_com_isolado
        conectada, isolados = validar_conectividade(postes, trechos)
        assert conectada is False
        assert "P3" in isolados

    def test_dois_postes_sem_trecho_isola_segundo(self):
        postes = [Poste("A", 0, 0), Poste("B", 100, 0)]
        conectada, isolados = validar_conectividade(postes, [])
        assert conectada is False
        # Um dos dois está isolado (depende de qual é o `start`)
        assert len(isolados) == 1

    def test_multiplos_isolados(self):
        postes = [Poste(str(i), float(i * 1000), 0.0) for i in range(5)]
        trechos = []  # nenhum trecho — 4 isolados
        conectada, isolados = validar_conectividade(postes, trechos)
        assert conectada is False
        assert len(isolados) == 4

    def test_rede_em_anel_conectada(self):
        """Rede em anel: P1-P2-P3-P1."""
        postes = [Poste("P1", 0, 0), Poste("P2", 100, 0), Poste("P3", 50, 80)]
        trechos = [
            TrechoRede("P1", "P2", nivel=NIVEL_MT),
            TrechoRede("P2", "P3", nivel=NIVEL_MT),
            TrechoRede("P3", "P1", nivel=NIVEL_MT),
        ]
        conectada, isolados = validar_conectividade(postes, trechos)
        assert conectada is True
        assert isolados == []


# ─── Testes de calcular_comprimento_rede ──────────────────────────────────────


class TestCalcularComprimentoRede:
    def test_rede_vazia_zero(self):
        total, mt, bt = calcular_comprimento_rede([], [])
        assert total == 0.0
        assert mt == 0.0
        assert bt == 0.0

    def test_trecho_mt_100m(self):
        postes = [Poste("P1", 0, 0), Poste("P2", 100, 0)]
        trechos = [TrechoRede("P1", "P2", nivel=NIVEL_MT)]
        total, mt, bt = calcular_comprimento_rede(postes, trechos)
        assert total == pytest.approx(100.0)
        assert mt == pytest.approx(100.0)
        assert bt == pytest.approx(0.0)

    def test_trecho_bt_50m(self):
        postes = [Poste("P1", 0, 0), Poste("P2", 50, 0)]
        trechos = [TrechoRede("P1", "P2", nivel=NIVEL_BT)]
        total, mt, bt = calcular_comprimento_rede(postes, trechos)
        assert total == pytest.approx(50.0)
        assert mt == pytest.approx(0.0)
        assert bt == pytest.approx(50.0)

    def test_trechos_mistos(self, rede_simples):
        postes, trechos = rede_simples
        total, mt, bt = calcular_comprimento_rede(postes, trechos)
        # P1-P2 = 100m (MT), P2-P3 = 100m (BT)
        assert total == pytest.approx(200.0)
        assert mt == pytest.approx(100.0)
        assert bt == pytest.approx(100.0)

    def test_poste_referenciado_inexistente_ignorado(self):
        postes = [Poste("P1", 0, 0)]
        trechos = [TrechoRede("P1", "P_INEXISTENTE", nivel=NIVEL_BT)]
        total, mt, bt = calcular_comprimento_rede(postes, trechos)
        assert total == 0.0  # trecho ignorado por falta de ponta


# ─── Testes de analisar_rede ──────────────────────────────────────────────────


class TestAnalisarRede:
    def test_rede_simples_conectada(self, rede_simples):
        postes, trechos = rede_simples
        resultado = analisar_rede(postes, trechos)
        assert resultado.estatisticas.conectada is True
        assert resultado.estatisticas.total_postes == 3
        assert resultado.estatisticas.total_trechos == 2
        assert resultado.ids_isolados == []

    def test_aviso_rede_desconectada(self, rede_com_isolado):
        postes, trechos = rede_com_isolado
        resultado = analisar_rede(postes, trechos)
        assert resultado.estatisticas.conectada is False
        assert resultado.estatisticas.nos_isolados == 1
        assert any("isolado" in a for a in resultado.avisos)

    def test_aviso_sem_trechos(self):
        postes = [Poste("P1", 0, 0)]
        resultado = analisar_rede(postes, [])
        assert any("sem trechos" in a for a in resultado.avisos)

    def test_aviso_sem_transformadores(self):
        postes = [Poste("P1", 0, 0), Poste("P2", 100, 0)]
        trechos = [TrechoRede("P1", "P2")]
        resultado = analisar_rede(postes, trechos)
        assert any("transformador" in a for a in resultado.avisos)

    def test_sem_aviso_rede_completa(self, rede_simples):
        postes, trechos = rede_simples
        transformadores = [Transformador("TR1", "P2", 75.0)]
        resultado = analisar_rede(postes, trechos, transformadores)
        assert resultado.estatisticas.conectada is True
        assert resultado.estatisticas.total_transformadores == 1
        assert resultado.estatisticas.potencia_total_kva == pytest.approx(75.0)
        assert not any("transformador" in a for a in resultado.avisos)

    def test_rede_vazia(self):
        resultado = analisar_rede([], [])
        assert resultado.estatisticas.total_postes == 0
        assert resultado.estatisticas.conectada is True
        assert resultado.estatisticas.comprimento_total_m == 0.0

    def test_comprimentos_corretos(self, rede_simples):
        postes, trechos = rede_simples
        resultado = analisar_rede(postes, trechos)
        assert resultado.estatisticas.comprimento_total_m == pytest.approx(200.0)
        assert resultado.estatisticas.comprimento_mt_m == pytest.approx(100.0)
        assert resultado.estatisticas.comprimento_bt_m == pytest.approx(100.0)


# ─── Testes da API REST ───────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def client():
    from main import app
    return TestClient(app)


POSTES_BASE = [
    {"id": "P1", "x": 0.0, "y": 0.0},
    {"id": "P2", "x": 100.0, "y": 0.0},
    {"id": "P3", "x": 200.0, "y": 0.0},
]
TRECHOS_BASE = [
    {"poste_a": "P1", "poste_b": "P2", "nivel": "MT"},
    {"poste_a": "P2", "poste_b": "P3", "nivel": "BT"},
]


class TestRedeAPI:
    def test_analisar_rede_ok(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={"postes": POSTES_BASE, "trechos": TRECHOS_BASE},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["estatisticas"]["conectada"] is True
        assert data["estatisticas"]["total_postes"] == 3
        assert data["estatisticas"]["comprimento_total_m"] == pytest.approx(200.0)

    def test_analisar_rede_com_transformador(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": POSTES_BASE,
                "trechos": TRECHOS_BASE,
                "transformadores": [{"id": "TR1", "poste_id": "P2", "potencia_kva": 112.5}],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["estatisticas"]["total_transformadores"] == 1
        assert data["estatisticas"]["potencia_total_kva"] == pytest.approx(112.5)

    def test_analisar_rede_isolada_aviso(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": [
                    {"id": "P1", "x": 0.0, "y": 0.0},
                    {"id": "P2", "x": 100.0, "y": 0.0},
                    {"id": "P_ISOLADO", "x": 999.0, "y": 999.0},
                ],
                "trechos": [{"poste_a": "P1", "poste_b": "P2", "nivel": "MT"}],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["estatisticas"]["conectada"] is False
        assert len(data["ids_isolados"]) == 1
        assert any("isolado" in a for a in data["avisos"])

    def test_nivel_invalido_422(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": POSTES_BASE[:2],
                "trechos": [{"poste_a": "P1", "poste_b": "P2", "nivel": "HV"}],
            },
        )
        assert resp.status_code == 422

    def test_id_vazio_422(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": [{"id": "  ", "x": 0.0, "y": 0.0}],
                "trechos": [],
            },
        )
        assert resp.status_code == 422

    def test_potencia_negativa_422(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": POSTES_BASE[:2],
                "trechos": TRECHOS_BASE[:1],
                "transformadores": [{"id": "TR1", "poste_id": "P1", "potencia_kva": -10}],
            },
        )
        assert resp.status_code == 422

    def test_rede_vazia_ok(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={"postes": [], "trechos": []},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["estatisticas"]["total_postes"] == 0
        assert data["estatisticas"]["conectada"] is True

    def test_nivel_bt_minusculas_aceito(self, client):
        resp = client.post(
            "/api/rede/analisar",
            json={
                "postes": POSTES_BASE[:2],
                "trechos": [{"poste_a": "P1", "poste_b": "P2", "nivel": "bt"}],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["estatisticas"]["comprimento_bt_m"] == pytest.approx(100.0)
