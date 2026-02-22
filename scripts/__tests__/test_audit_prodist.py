import unittest
import sys
import os

# Add parent dir to path to import audit_engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from audit_engine import AuditEngine

class TestAuditEngineProdist(unittest.TestCase):
    def setUp(self):
        self.engine = AuditEngine()

    def test_prodist_qdt_urban(self):
        project_data = {
            "environment": "URBAN",
            "sections": [
                {"id": "S1", "voltage_drop_pct": 8.5} # > 7% limit
            ]
        }
        report = self.engine.run_full_audit(project_data)
        issue = next((r for r in report if r["code"] == "PRODIST_QDT"), None)
        self.assertIsNotNone(issue)
        self.assertEqual(issue["severity"], "WARNING")
        self.assertIn("excede limite PRODIST 7.0%", issue["message"])

    def test_prodist_qdt_rural(self):
        project_data = {
            "environment": "RURAL",
            "sections": [
                {"id": "S2", "voltage_drop_pct": 11.5} # > 10% limit
            ]
        }
        report = self.engine.run_full_audit(project_data)
        issue = next((r for r in report if r["code"] == "PRODIST_QDT"), None)
        self.assertIsNotNone(issue)
        self.assertIn("excede limite PRODIST 10.0%", issue["message"])

    def test_transformer_overload(self):
        project_data = {
            "transformers": [
                {"id": "T1", "capacity_kva": 45, "consumer_count": 50, "avg_consumption_kw": 1.2}
            ]
        }
        # Demand = (50 * 1.2) / 0.92 = 65.2 kVA > 45 kVA
        report = self.engine.run_full_audit(project_data)
        issue = next((r for r in report if r["code"] == "TRAFO_OVERLOAD"), None)
        self.assertIsNotNone(issue)
        self.assertEqual(issue["severity"], "CRITICAL")
        self.assertIn("Sobrecarga simulada de 44.9%", issue["message"])

if __name__ == "__main__":
    unittest.main()
