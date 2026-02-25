"""
dxf_generator.py — CQT Light DXF Generator (Phase 3: DXF-IQ)
Gera plantas CAD 2D de redes de distribuição de energia elétrica
a partir dos dados de projeto exportados pelo configurador.

Entrada (stdin JSON ou argv):
{
    "output_path": "/tmp/projeto.dxf",
    "estruturas": [
        {"codigo_kit": "N1", "descricao_kit": "..."},
        ...
    ],
    "postes": [
        {"pole_id": "P-01", "lat": -22.15018, "lng": -42.92185, "altura": 11},
        ...
    ],
    "condutor_mt": {"codigo": "CA-50", "descricao": "..."},
    "condutor_bt": {"codigo": "3x35+1x16", "descricao": "..."},
    "projeto": {"nome": "Projeto Teste", "empresa": "Light S.A."}
}

Saída: JSON com status e caminho do arquivo gerado.
"""

import sys
import json
import os
import math
from datetime import datetime
from typing import List, Dict, Any, Optional


# ──────────────────────────────────────────────────────────────────────────────
# DXF Writer — Zero-dependency, native Python
# Gera DXF R12 ASCII compatível com AutoCAD, BricsCAD, QCAD, etc.
# ──────────────────────────────────────────────────────────────────────────────

class DXFWriter:
    """
    Gerador de arquivos DXF R12 ASCII sem dependências externas.
    Implementa entidades básicas: LINE, CIRCLE, TEXT, INSERT (BLOCK).
    """

    # Código de cor DXF por layer
    LAYER_COLORS = {
        "POSTES":      2,   # Yellow
        "CONDUTORES":  5,   # Blue
        "EQUIPAMENTOS":1,   # Red
        "TEXTO":       7,   # White/Black
        "COTACAO":     3,   # Green
        "REFERENCIA":  8,   # Dark gray
    }

    def __init__(self):
        self._sections: List[str] = []
        self._entities: List[str] = []
        self._layers = set(self.LAYER_COLORS.keys())

    # ── Seção HEADER ────────────────────────────────────────────────────────────
    def _make_header(self) -> str:
        return (
            "  0\nSECTION\n"
            "  2\nHEADER\n"
            "  9\n$ACADVER\n"
            "  1\nAC1009\n"       # R12
            "  9\n$INSBASE\n"
            " 10\n0.0\n 20\n0.0\n 30\n0.0\n"
            "  9\n$EXTMIN\n"
            " 10\n-1000.0\n 20\n-1000.0\n 30\n0.0\n"
            "  9\n$EXTMAX\n"
            " 10\n1000.0\n 20\n1000.0\n 30\n0.0\n"
            "  0\nENDSEC\n"
        )

    # ── Seção TABLES ────────────────────────────────────────────────────────────
    def _make_tables(self) -> str:
        lines = ["  0\nSECTION\n  2\nTABLES\n"]

        # LTYPE
        lines.append("  0\nTABLE\n  2\nLTYPE\n 70\n     3\n")
        for lt in ["CONTINUOUS", "DASHED", "DOTTED"]:
            lines.append(f"  0\nLTYPE\n  2\n{lt}\n 70\n     0\n 3\n\n 72\n    65\n 73\n     0\n 40\n0.0\n")
        lines.append("  0\nENDTAB\n")

        # LAYER
        lines.append("  0\nTABLE\n  2\nLAYER\n 70\n{:6d}\n".format(len(self._layers)))
        for name in self._layers:
            color = self.LAYER_COLORS.get(name, 7)
            lines.append(
                f"  0\nLAYER\n  2\n{name}\n 70\n     0\n 62\n{color:6d}\n  6\nCONTINUOUS\n"
            )
        lines.append("  0\nENDTAB\n")
        lines.append("  0\nENDSEC\n")
        return "".join(lines)

    # ── Seção BLOCKS ────────────────────────────────────────────────────────────
    def _make_blocks(self) -> str:
        return "  0\nSECTION\n  2\nBLOCKS\n  0\nENDSEC\n"

    # ── Seção ENTITIES ───────────────────────────────────────────────────────────
    def _make_entities_section(self) -> str:
        body = "".join(self._entities)
        return f"  0\nSECTION\n  2\nENTITIES\n{body}  0\nENDSEC\n"

    # ── Entidades ────────────────────────────────────────────────────────────────
    def add_line(self, x1, y1, x2, y2, layer="CONDUTORES"):
        self._entities.append(
            f"  0\nLINE\n  8\n{layer}\n"
            f" 10\n{x1:.4f}\n 20\n{y1:.4f}\n 30\n0.0\n"
            f" 11\n{x2:.4f}\n 21\n{y2:.4f}\n 31\n0.0\n"
        )

    def add_circle(self, cx, cy, radius, layer="POSTES"):
        self._entities.append(
            f"  0\nCIRCLE\n  8\n{layer}\n"
            f" 10\n{cx:.4f}\n 20\n{cy:.4f}\n 30\n0.0\n"
            f" 40\n{radius:.4f}\n"
        )

    def add_text(self, x, y, text, height=0.5, layer="TEXTO"):
        safe = str(text).replace("\n", " ").replace(";", ",")
        self._entities.append(
            f"  0\nTEXT\n  8\n{layer}\n"
            f" 10\n{x:.4f}\n 20\n{y:.4f}\n 30\n0.0\n"
            f" 40\n{height:.4f}\n"
            f"  1\n{safe}\n"
        )

    def add_dim_line(self, x1, y1, x2, y2, label="", layer="COTACAO"):
        """Linha de cota simplificada com texto central."""
        self.add_line(x1, y1, x2, y2, layer)
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2 + 0.3
        dist = math.hypot(x2 - x1, y2 - y1)
        text = label if label else f"{dist:.1f}m"
        self.add_text(mx, my, text, height=0.3, layer="COTACAO")

    # ── Gerar arquivo ────────────────────────────────────────────────────────────
    def build(self) -> str:
        return (
            self._make_header()
            + self._make_tables()
            + self._make_blocks()
            + self._make_entities_section()
            + "  0\nEOF\n"
        )

    def save(self, path: str) -> None:
        content = self.build()
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)


# ──────────────────────────────────────────────────────────────────────────────
# Projeção geográfica simples → coordenadas CAD
# ──────────────────────────────────────────────────────────────────────────────

def geo_to_cad(lat: float, lng: float, origin_lat: float, origin_lng: float,
               scale: float = 10000.0):
    """
    Converte coordenadas geográficas para coordenadas CAD.

    A projeção usa a equivalência aproximada:
      1° de latitude  ≈ 111,319.9 m
      1° de longitude ≈ 111,319.9 * cos(lat) m

    Com scale=10000, uma diferença de 1° (≈ 111 km) resulta em
    100 unidades DXF (aprox. 1 unidade DXF ≈ 1,1 km real, ou seja,
    cada unidade representa ~1,11 m a escala 1:1000).
    Ajuste 'scale' para alterar o grau de zoom da planta.
    """
    dx = (lng - origin_lng) * math.cos(math.radians(origin_lat)) * 111319.9
    dy = (lat - origin_lat) * 111319.9
    return dx / scale * 100, dy / scale * 100


# ──────────────────────────────────────────────────────────────────────────────
# Gerador de Planta Elétrica
# ──────────────────────────────────────────────────────────────────────────────

class PlantaEletricaGenerator:
    """
    Gera a planta elétrica 2D de rede de distribuição no formato DXF.
    """

    # Raio visual dos postes na planta (em unidades DXF)
    POSTE_RADIUS = 0.5
    POSTE_LABEL_OFFSET = 0.7

    def __init__(self, projeto: Dict[str, Any]):
        self.projeto = projeto
        self.dxf = DXFWriter()

    def _draw_title_block(self):
        """Desenha o carimbo/moldura do projeto."""
        nome = self.projeto.get("nome", "PROJETO SEM NOME")
        empresa = self.projeto.get("empresa", "—")
        data = datetime.now().strftime("%d/%m/%Y")

        # Moldura externa
        self.dxf.add_line(-5, -5, 200, -5, "REFERENCIA")
        self.dxf.add_line(-5, -5, -5, 200, "REFERENCIA")

        # Carimbo inferior
        self.dxf.add_line(0, -4, 180, -4, "TEXTO")
        self.dxf.add_line(0, -2, 180, -2, "TEXTO")
        self.dxf.add_text(1, -3.5, f"PROJETO: {nome}", height=0.6, layer="TEXTO")
        self.dxf.add_text(1, -1.7, f"EMPRESA: {empresa}  |  DATA: {data}  |  CQT Light v3.0", height=0.4, layer="TEXTO")

    def _draw_legend(self, x_start: float = 120.0, y_start: float = 5.0):
        """Legenda de símbolos na planta."""
        self.dxf.add_text(x_start, y_start + 8, "LEGENDA", height=0.7, layer="TEXTO")

        entries = [
            ("○  POSTE", "POSTES"),
            ("── CONDUTOR MT/BT", "CONDUTORES"),
            ("◇  EQUIPAMENTO", "EQUIPAMENTOS"),
        ]
        for i, (label, layer) in enumerate(entries):
            yy = y_start + 6 - i * 1.5
            self.dxf.add_text(x_start, yy, label, height=0.5, layer=layer)

    def _draw_postes(self, postes: List[Dict]) -> List[tuple]:
        """Desenha os postes e retorna lista de coords CAD."""
        if not postes:
            return []

        origin_lat = postes[0].get("lat", 0)
        origin_lng = postes[0].get("lng", 0)

        coords = []
        for p in postes:
            lat = p.get("lat", origin_lat)
            lng = p.get("lng", origin_lng)
            cx, cy = geo_to_cad(lat, lng, origin_lat, origin_lng)
            coords.append((cx, cy))

            # Círculo do poste
            self.dxf.add_circle(cx, cy, self.POSTE_RADIUS, layer="POSTES")

            # Label: ID na linha de cima, altura na linha abaixo
            pole_id = p.get("pole_id", "P?")
            altura = p.get("altura", "?")
            self.dxf.add_text(
                cx + self.POSTE_LABEL_OFFSET,
                cy + self.POSTE_LABEL_OFFSET + 0.5,
                pole_id,
                height=0.4,
                layer="TEXTO",
            )
            self.dxf.add_text(
                cx + self.POSTE_LABEL_OFFSET,
                cy + self.POSTE_LABEL_OFFSET,
                f"H={altura}m",
                height=0.35,
                layer="TEXTO",
            )

        return coords

    def _draw_condutores(self, coords: List[tuple], condutor_label: str = ""):
        """Desenha os condutores conectando os postes sequencialmente."""
        for i in range(len(coords) - 1):
            x1, y1 = coords[i]
            x2, y2 = coords[i + 1]
            self.dxf.add_dim_line(x1, y1, x2, y2, label=condutor_label)

    def _draw_estruturas(self, estruturas: List[Dict], coords: List[tuple]):
        """Marca equipamentos especiais (transformadores, chaves, etc.) nos postes."""
        kit_map = {
            "TR": ("◇ TRAFO", "EQUIPAMENTOS"),
            "CH": ("◇ CHAVE", "EQUIPAMENTOS"),
            "PR": ("◇ PROTEÇÃO", "EQUIPAMENTOS"),
            "RE": ("◇ RELIGADOR", "EQUIPAMENTOS"),
        }

        for idx, est in enumerate(estruturas):
            if idx >= len(coords):
                break
            cx, cy = coords[idx]
            code = (est.get("codigo_kit") or "").upper()

            for prefix, (symbol, layer) in kit_map.items():
                if code.startswith(prefix):
                    desc = est.get("descricao_kit", code)
                    self.dxf.add_text(cx - 2, cy + 1.5, f"{symbol}\n{desc}", height=0.45, layer=layer)
                    break

    def generate(self, output_path: str) -> Dict[str, Any]:
        """Gera o arquivo DXF e retorna relatório de status."""
        postes = self.projeto.get("postes", [])
        estruturas = self.projeto.get("estruturas", [])
        condutor_mt = self.projeto.get("condutor_mt", {})
        condutor_bt = self.projeto.get("condutor_bt", {})

        condutor_label = ""
        if condutor_mt:
            condutor_label = condutor_mt.get("codigo", "")

        self._draw_title_block()
        self._draw_legend()

        coords = self._draw_postes(postes)

        if len(coords) >= 2:
            self._draw_condutores(coords, condutor_label)

        if estruturas and coords:
            self._draw_estruturas(estruturas, coords)

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        self.dxf.save(output_path)

        return {
            "status": "SUCCESS",
            "output_path": output_path,
            "stats": {
                "postes": len(postes),
                "estruturas": len(estruturas),
                "condutor_mt": condutor_mt.get("codigo", "—"),
                "condutor_bt": condutor_bt.get("codigo", "—"),
                "layers": list(DXFWriter.LAYER_COLORS.keys()),
            },
        }


# ──────────────────────────────────────────────────────────────────────────────
# Entry-point (Bridge Python / PythonBridge.run)
# ──────────────────────────────────────────────────────────────────────────────

def main():
    # Ler input: stdin JSON ou argv[1] como path de arquivo JSON
    if len(sys.argv) > 1:
        try:
            with open(sys.argv[1], "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(json.dumps({"status": "ERROR", "message": f"Falha ao ler arquivo de entrada: {e}"}))
            sys.exit(1)
    else:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps({"status": "ERROR", "message": "Nenhum dado recebido via stdin"}))
            sys.exit(1)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            print(json.dumps({"status": "ERROR", "message": f"JSON inválido: {e}"}))
            sys.exit(1)

    output_path = data.get("output_path")
    if not output_path:
        print(json.dumps({"status": "ERROR", "message": "Campo 'output_path' obrigatório"}))
        sys.exit(1)

    try:
        gen = PlantaEletricaGenerator(data)
        result = gen.generate(output_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
