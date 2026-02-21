"""
CQT Light — Serviço de Geração DXF 2.5D
Gera arquivos DXF de redes elétricas de distribuição seguindo normas ABNT.
Usa ezdxf. Padrão de desenho: 2.5D (planta XY + cota Z como atributo).
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from typing import List, Optional

try:
    import ezdxf
    from ezdxf.enums import TextEntityAlignment
    EZDXF_AVAILABLE = True
except ImportError:
    EZDXF_AVAILABLE = False

# Camadas ABNT para redes elétricas
LAYERS = {
    "POSTES":        {"color": 2,  "linetype": "CONTINUOUS"},  # amarelo
    "REDE_MT":       {"color": 1,  "linetype": "CONTINUOUS"},  # vermelho
    "REDE_BT":       {"color": 3,  "linetype": "CONTINUOUS"},  # verde
    "TRANSFORMADOR": {"color": 4,  "linetype": "CONTINUOUS"},  # ciano
    "TEXTO":         {"color": 7,  "linetype": "CONTINUOUS"},  # branco/preto
    "COTA":          {"color": 8,  "linetype": "CONTINUOUS"},  # cinza
}

POSTE_RADIUS = 0.15       # m — raio do símbolo de poste em planta
TRAFO_SIZE   = 0.5        # m — tamanho do símbolo de transformador


@dataclass
class Poste:
    """Entidade poste de rede elétrica."""
    id: str
    x: float
    y: float
    altura_m: float = 11.0
    carga_dan: int = 300
    descricao: str = ""


@dataclass
class TrechoRede:
    """Trecho de rede (linha entre dois postes)."""
    poste_a: str
    poste_b: str
    nivel: str = "MT"   # "MT" ou "BT"
    condutor: str = ""


@dataclass
class Transformador:
    """Transformador de distribuição."""
    id: str
    poste_id: str
    potencia_kva: float = 30.0


@dataclass
class RedeEletrica:
    """Modelo de rede elétrica para geração DXF."""
    postes: List[Poste] = field(default_factory=list)
    trechos: List[TrechoRede] = field(default_factory=list)
    transformadores: List[Transformador] = field(default_factory=list)
    titulo: str = "REDE DE DISTRIBUIÇÃO"
    escala: str = "S/E"


def _setup_layers(doc) -> None:
    """Configura as camadas padrão no documento DXF."""
    for name, props in LAYERS.items():
        if name not in doc.layers:
            layer = doc.layers.new(name)
            layer.color = props["color"]
            layer.linetype = props.get("linetype", "CONTINUOUS")


def _get_poste_coords(postes: List[Poste], poste_id: str) -> Optional[tuple]:
    """Retorna (x, y) de um poste pelo ID."""
    for p in postes:
        if p.id == poste_id:
            return (p.x, p.y)
    return None


def generate_dxf(rede: RedeEletrica) -> bytes:
    """
    Gera arquivo DXF 2.5D da rede elétrica.

    Args:
        rede: modelo de rede elétrica

    Returns:
        bytes do arquivo DXF (compatível R2010+)

    Raises:
        RuntimeError: se ezdxf não estiver instalado
    """
    if not EZDXF_AVAILABLE:
        raise RuntimeError(
            "ezdxf não está instalado. Execute: pip install ezdxf"
        )

    doc = ezdxf.new(dxfversion="R2010")
    doc.header["$INSUNITS"] = 6   # metros
    doc.header["$MEASUREMENT"] = 1  # sistema métrico
    msp = doc.modelspace()

    _setup_layers(doc)

    # 1. Desenha postes (círculo + texto de cota)
    for poste in rede.postes:
        msp.add_circle(
            center=(poste.x, poste.y, 0),
            radius=POSTE_RADIUS,
            dxfattribs={"layer": "POSTES"},
        )
        # Linha vertical simbólica (2.5D: cota como linha auxiliar)
        msp.add_line(
            start=(poste.x, poste.y, 0),
            end=(poste.x, poste.y, 0),  # mantém 2D; cota vai no texto
            dxfattribs={"layer": "POSTES"},
        )
        # Anotação de cota (texto ABNT)
        label = f"P{poste.id}\nH={poste.altura_m}m/{poste.carga_dan}daN"
        if poste.descricao:
            label += f"\n{poste.descricao}"
        msp.add_text(
            text=label,
            dxfattribs={
                "layer": "TEXTO",
                "height": 0.3,
                "insert": (poste.x + POSTE_RADIUS + 0.1, poste.y + 0.1, 0),
            },
        )

    # 2. Desenha trechos de rede
    for trecho in rede.trechos:
        coords_a = _get_poste_coords(rede.postes, trecho.poste_a)
        coords_b = _get_poste_coords(rede.postes, trecho.poste_b)
        if not coords_a or not coords_b:
            continue

        layer = "REDE_MT" if trecho.nivel == "MT" else "REDE_BT"
        msp.add_line(
            start=(coords_a[0], coords_a[1], 0),
            end=(coords_b[0], coords_b[1], 0),
            dxfattribs={"layer": layer},
        )
        if trecho.condutor:
            mid_x = (coords_a[0] + coords_b[0]) / 2
            mid_y = (coords_a[1] + coords_b[1]) / 2
            msp.add_text(
                text=trecho.condutor,
                dxfattribs={
                    "layer": "TEXTO",
                    "height": 0.2,
                    "insert": (mid_x, mid_y + 0.2, 0),
                },
            )

    # 3. Desenha transformadores
    for trafo in rede.transformadores:
        coords = _get_poste_coords(rede.postes, trafo.poste_id)
        if not coords:
            continue
        cx, cy = coords
        s = TRAFO_SIZE / 2
        # Símbolo: quadrado + cruz
        msp.add_lwpolyline(
            points=[(cx-s, cy-s), (cx+s, cy-s), (cx+s, cy+s), (cx-s, cy+s)],
            close=True,
            dxfattribs={"layer": "TRANSFORMADOR"},
        )
        msp.add_line(start=(cx-s, cy, 0), end=(cx+s, cy, 0), dxfattribs={"layer": "TRANSFORMADOR"})
        msp.add_line(start=(cx, cy-s, 0), end=(cx, cy+s, 0), dxfattribs={"layer": "TRANSFORMADOR"})
        msp.add_text(
            text=f"TR{trafo.id}\n{trafo.potencia_kva}kVA",
            dxfattribs={"layer": "TEXTO", "height": 0.25, "insert": (cx + s + 0.1, cy, 0)},
        )

    # 4. Bloco de título
    msp.add_text(
        text=rede.titulo,
        dxfattribs={"layer": "TEXTO", "height": 0.8, "insert": (0, -5, 0)},
    )
    msp.add_text(
        text=f"Escala: {rede.escala}  |  ABNT NBR 6492",
        dxfattribs={"layer": "TEXTO", "height": 0.3, "insert": (0, -6, 0)},
    )

    buf = io.StringIO()
    doc.write(buf)
    return buf.getvalue().encode("utf-8")


def validate_dxf(dxf_bytes: bytes) -> dict:
    """
    Valida um arquivo DXF gerado: verifica entidades, camadas e integridade.

    Args:
        dxf_bytes: conteúdo do arquivo DXF

    Returns:
        dict com resultado da validação
    """
    if not EZDXF_AVAILABLE:
        raise RuntimeError("ezdxf não está instalado.")

    buf = io.StringIO(dxf_bytes.decode("utf-8"))
    doc = ezdxf.read(buf)
    msp = doc.modelspace()

    layers_found = {e.dxf.layer for e in msp if hasattr(e.dxf, "layer")}
    entity_counts: dict = {}
    for e in msp:
        t = e.dxftype()
        entity_counts[t] = entity_counts.get(t, 0) + 1

    missing_layers = [l for l in LAYERS if l not in layers_found and l != "COTA"]

    return {
        "valid": len(entity_counts) > 0,
        "dxf_version": doc.dxfversion,
        "layers_found": sorted(layers_found),
        "missing_layers": missing_layers,
        "entity_counts": entity_counts,
        "total_entities": sum(entity_counts.values()),
    }
