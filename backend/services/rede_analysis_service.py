"""
CQT Light — Serviço de Análise de Topologia de Rede Elétrica.

DDD Application Service: valida conectividade da rede, calcula comprimentos
de cabos (euclidiano em coordenadas planas) e gera estatísticas operacionais.

Referências: ABNT NBR 14565 (topologia), PRODIST Módulo 6 (análise de rede).
"""

import math
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from domain.entities import (
    NIVEL_BT,
    NIVEL_MT,
    Poste,
    TrechoRede,
    Transformador,
)


@dataclass
class EstatisticasRede:
    """Value Object: Estatísticas de topologia da rede elétrica."""

    total_postes: int
    total_trechos: int
    total_transformadores: int
    comprimento_total_m: float
    comprimento_mt_m: float
    comprimento_bt_m: float
    potencia_total_kva: float
    conectada: bool
    nos_isolados: int


@dataclass
class ResultadoAnalise:
    """Value Object: Resultado completo da análise de rede."""

    estatisticas: EstatisticasRede
    ids_isolados: List[str] = field(default_factory=list)
    avisos: List[str] = field(default_factory=list)


def _distancia_m(p1: Poste, p2: Poste) -> float:
    """Distância euclidiana em metros entre dois postes (coordenadas planas XY)."""
    return math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)


def validar_conectividade(
    postes: List[Poste], trechos: List[TrechoRede]
) -> Tuple[bool, List[str]]:
    """
    Verifica conectividade da rede via BFS.

    Returns:
        (is_connected, isolated_pole_ids): tupla com flag e lista de IDs isolados.
    """
    if not postes:
        return True, []

    adjacency: dict = defaultdict(set)
    for t in trechos:
        adjacency[t.poste_a].add(t.poste_b)
        adjacency[t.poste_b].add(t.poste_a)

    pole_ids = {p.id for p in postes}
    start = min(pole_ids)

    visited: set = {start}
    queue: deque = deque([start])

    while queue:
        node = queue.popleft()
        for neighbor in adjacency[node]:
            if neighbor in pole_ids and neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    isolated = [pid for pid in sorted(pole_ids) if pid not in visited]
    return len(isolated) == 0, isolated


def calcular_comprimento_rede(
    postes: List[Poste], trechos: List[TrechoRede]
) -> Tuple[float, float, float]:
    """
    Calcula comprimentos de rede em metros (distância euclidiana, coordenadas planas).

    Returns:
        (total_m, mt_m, bt_m): comprimentos total, MT e BT.
    """
    mapa_postes = {p.id: p for p in postes}
    total, mt_total, bt_total = 0.0, 0.0, 0.0

    for t in trechos:
        pa = mapa_postes.get(t.poste_a)
        pb = mapa_postes.get(t.poste_b)
        if pa is None or pb is None:
            continue
        dist = _distancia_m(pa, pb)
        total += dist
        if t.nivel == NIVEL_MT:
            mt_total += dist
        else:
            bt_total += dist

    return round(total, 2), round(mt_total, 2), round(bt_total, 2)


def analisar_rede(
    postes: List[Poste],
    trechos: List[TrechoRede],
    transformadores: Optional[List[Transformador]] = None,
) -> ResultadoAnalise:
    """
    Análise completa de topologia de rede elétrica.

    Verifica conectividade via BFS, calcula comprimentos por nível de tensão
    (MT/BT) e emite avisos de conformidade.

    Args:
        postes: lista de postes da rede.
        trechos: lista de trechos de rede (segmentos de condutor).
        transformadores: lista opcional de transformadores.

    Returns:
        ResultadoAnalise com estatísticas, IDs isolados e avisos.
    """
    transformadores = transformadores or []
    avisos: List[str] = []

    conectada, ids_isolados = validar_conectividade(postes, trechos)
    if not conectada:
        n = len(ids_isolados)
        amostra = ", ".join(ids_isolados[:5])
        sufixo = "..." if n > 5 else ""
        avisos.append(
            f"Rede desconectada: {n} poste(s) isolado(s): {amostra}{sufixo}"
        )

    comprimento_total, comprimento_mt, comprimento_bt = calcular_comprimento_rede(
        postes, trechos
    )

    potencia_total = sum(t.potencia_kva for t in transformadores)

    if not trechos:
        avisos.append("Rede sem trechos definidos.")

    if not transformadores and postes:
        avisos.append("Nenhum transformador definido na rede.")

    return ResultadoAnalise(
        estatisticas=EstatisticasRede(
            total_postes=len(postes),
            total_trechos=len(trechos),
            total_transformadores=len(transformadores),
            comprimento_total_m=comprimento_total,
            comprimento_mt_m=comprimento_mt,
            comprimento_bt_m=comprimento_bt,
            potencia_total_kva=potencia_total,
            conectada=conectada,
            nos_isolados=len(ids_isolados),
        ),
        ids_isolados=ids_isolados,
        avisos=avisos,
    )
