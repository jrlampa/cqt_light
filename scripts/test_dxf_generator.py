"""
test_dxf_generator.py — Testes unitários para o gerador de DXF.
Compatível com execução headless (sem AutoCAD/accoreconsole).
"""

import sys
import os
import json
import tempfile
import unittest

# Ensure scripts directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from dxf_generator import DXFWriter, PlantaEletricaGenerator, geo_to_cad


class TestDXFWriter(unittest.TestCase):
    """Testa a escrita direta de entidades DXF."""

    def setUp(self):
        self.writer = DXFWriter()

    def test_add_line_generates_entity(self):
        self.writer.add_line(0, 0, 10, 10)
        content = self.writer.build()
        self.assertIn("LINE", content)
        self.assertIn("10.0000", content)

    def test_add_circle_generates_entity(self):
        self.writer.add_circle(5, 5, 1.5)
        content = self.writer.build()
        self.assertIn("CIRCLE", content)
        self.assertIn("1.5000", content)

    def test_add_text_generates_entity(self):
        self.writer.add_text(0, 0, "POSTE P-01")
        content = self.writer.build()
        self.assertIn("TEXT", content)
        self.assertIn("POSTE P-01", content)

    def test_build_contains_required_sections(self):
        content = self.writer.build()
        for section in ("HEADER", "TABLES", "BLOCKS", "ENTITIES", "EOF"):
            self.assertIn(section, content, f"Missing section: {section}")

    def test_layers_are_declared(self):
        content = self.writer.build()
        for layer in ("POSTES", "CONDUTORES", "EQUIPAMENTOS", "TEXTO"):
            self.assertIn(layer, content, f"Missing layer: {layer}")

    def test_save_creates_file(self):
        with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
            path = tmp.name
        try:
            self.writer.add_line(0, 0, 1, 1)
            self.writer.save(path)
            self.assertTrue(os.path.exists(path))
            self.assertGreater(os.path.getsize(path), 0)
        finally:
            os.unlink(path)

    def test_dim_line_generates_text_and_line(self):
        self.writer.add_dim_line(0, 0, 10, 0, label="100m")
        content = self.writer.build()
        self.assertIn("LINE", content)
        self.assertIn("100m", content)


class TestGeoToCad(unittest.TestCase):
    """Testa a projeção geográfica para coordenadas CAD."""

    def test_same_point_returns_zero(self):
        x, y = geo_to_cad(-22.15018, -42.92185, -22.15018, -42.92185)
        self.assertAlmostEqual(x, 0.0, places=3)
        self.assertAlmostEqual(y, 0.0, places=3)

    def test_displacement_north_positive_y(self):
        _, y = geo_to_cad(-22.14, -42.92185, -22.15, -42.92185)
        self.assertGreater(y, 0, "North displacement should give positive Y")

    def test_displacement_east_positive_x(self):
        x, _ = geo_to_cad(-22.15018, -42.91, -22.15018, -42.92)
        self.assertGreater(x, 0, "East displacement should give positive X")


class TestPlantaEletricaGenerator(unittest.TestCase):
    """Testa a geração completa de plantas elétricas."""

    SAMPLE_PROJECT = {
        "output_path": None,  # set in setUp
        "projeto": {"nome": "Teste Unitário", "empresa": "CQT Test Co"},
        "postes": [
            {"pole_id": "P-01", "lat": -22.15018, "lng": -42.92185, "altura": 11},
            {"pole_id": "P-02", "lat": -22.15050, "lng": -42.92220, "altura": 12},
            {"pole_id": "P-03", "lat": -22.15080, "lng": -42.92255, "altura": 11},
        ],
        "estruturas": [
            {"codigo_kit": "N1", "descricao_kit": "Estrutura Aérea N1"},
            {"codigo_kit": "TR-75", "descricao_kit": "Transformador 75kVA"},
        ],
        "condutor_mt": {"codigo": "CA-50", "descricao": "CABO ALUMÍNIO 50MM²"},
        "condutor_bt": {"codigo": "3x35+1x16", "descricao": "MULTIPLEX 35MM²"},
    }

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.outfile = os.path.join(self.tmpdir, "test_planta.dxf")
        self.project = dict(self.SAMPLE_PROJECT)
        self.project["output_path"] = self.outfile

    def tearDown(self):
        if os.path.exists(self.outfile):
            os.unlink(self.outfile)
        os.rmdir(self.tmpdir)

    def test_generate_creates_dxf_file(self):
        gen = PlantaEletricaGenerator(self.project)
        result = gen.generate(self.outfile)
        self.assertEqual(result["status"], "SUCCESS")
        self.assertTrue(os.path.exists(self.outfile))
        self.assertGreater(os.path.getsize(self.outfile), 100)

    def test_result_stats_correct(self):
        gen = PlantaEletricaGenerator(self.project)
        result = gen.generate(self.outfile)
        self.assertEqual(result["stats"]["postes"], 3)
        self.assertEqual(result["stats"]["estruturas"], 2)
        self.assertEqual(result["stats"]["condutor_mt"], "CA-50")

    def test_dxf_content_has_required_layers(self):
        gen = PlantaEletricaGenerator(self.project)
        gen.generate(self.outfile)
        with open(self.outfile, "r", encoding="utf-8") as f:
            content = f.read()
        for layer in ("POSTES", "CONDUTORES", "EQUIPAMENTOS", "TEXTO"):
            self.assertIn(layer, content, f"Layer ausente no DXF: {layer}")

    def test_dxf_contains_pole_ids(self):
        gen = PlantaEletricaGenerator(self.project)
        gen.generate(self.outfile)
        with open(self.outfile, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("P-01", content)
        self.assertIn("P-02", content)

    def test_dxf_contains_transformer_symbol(self):
        gen = PlantaEletricaGenerator(self.project)
        gen.generate(self.outfile)
        with open(self.outfile, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("TRAFO", content)

    def test_generate_empty_postes(self):
        """Deve funcionar sem postes — gera apenas carimbo."""
        project_empty = dict(self.project)
        project_empty["postes"] = []
        project_empty["output_path"] = os.path.join(self.tmpdir, "empty.dxf")
        gen = PlantaEletricaGenerator(project_empty)
        result = gen.generate(project_empty["output_path"])
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(result["stats"]["postes"], 0)
        os.unlink(project_empty["output_path"])


class TestMainEntryPoint(unittest.TestCase):
    """Testa o entry-point via stdin (PythonBridge pattern)."""

    def _run_via_stdin(self, data: dict) -> dict:
        import subprocess
        script = os.path.join(os.path.dirname(__file__), "dxf_generator.py")
        proc = subprocess.run(
            ["python3", script],
            input=json.dumps(data),
            capture_output=True,
            text=True,
            timeout=15,
        )
        return json.loads(proc.stdout.strip())

    def test_stdin_generates_dxf(self):
        with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
            path = tmp.name
        try:
            result = self._run_via_stdin({
                "output_path": path,
                "projeto": {"nome": "Test stdin"},
                "postes": [{"pole_id": "P-01", "lat": -22.15018, "lng": -42.92185, "altura": 10}],
                "estruturas": [],
                "condutor_mt": {},
                "condutor_bt": {},
            })
            self.assertEqual(result["status"], "SUCCESS")
            self.assertTrue(os.path.exists(path))
        finally:
            if os.path.exists(path):
                os.unlink(path)

    def test_stdin_missing_output_path_returns_error(self):
        result = self._run_via_stdin({"postes": []})
        self.assertEqual(result["status"], "ERROR")
        self.assertIn("output_path", result["message"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
