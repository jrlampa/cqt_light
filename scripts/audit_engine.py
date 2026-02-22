import json
import os
import sys

# Motor de Auditoria Técnica - CQT LIGHT (Ultimate)
# Validadores: Ampacidade, QDT, Engastamento, Afastamentos, BIM.

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

class AuditEngine:
    def __init__(self):
        # Paths based on script location
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.rules_path = os.path.join(base_dir, 'data/rules/calculation_logic.json')
        self.rules = load_json(self.rules_path)
        self.results = []

    def log_issue(self, code, severity, message, element_id=None):
        self.results.append({
            "code": code,
            "severity": severity,
            "message": message,
            "element_id": element_id
        })

    def audit_ampacity(self, project_data):
        conductors = self.rules.get("bt_conductors_multiplexed", [])
        sections = project_data.get("sections", [])
        for section in sections:
            cond_name = section.get("conductor")
            current = section.get("current_a", 0)
            match = next((c for c in conductors if c["name"] == cond_name), None)
            if match:
                capacity = match["capacity_a"]
                if current > capacity:
                    self.log_issue("Erro 03", "CRITICAL", f"Cabo {cond_name}: Corrente {current}A > Capacidade {capacity}A.", section.get("id"))

    def audit_clearances(self, project_data):
        clearances = self.rules.get("clearances_m", {})
        crossings = project_data.get("crossings", [])
        for crz in crossings:
            scenario = crz.get("scenario")
            height = crz.get("height_m", 0)
            min_required = clearances.get(scenario, 6.0)
            if height < min_required:
                self.log_issue("Erro_Afast_01", "CRITICAL", f"Cruzamento ({scenario}): Altura {height}m < Mínimo {min_required}m.", crz.get("id"))

    def audit_bim_compliance(self, project_data):
        elements = project_data.get("poles", []) + project_data.get("sections", [])
        for el in elements:
            if not el.get("sap"):
                self.log_issue("Erro_BIM_01", "WARNING", f"Elemento {el.get('id')} sem código SAP.", el.get("id"))

    def audit_mechanical(self, project_data):
        poles = project_data.get("poles", [])
        for p in poles:
            l = p.get("length", 0)
            d = p.get("foundation_depth", 0)
            if l > 0 and d < (l/10 + 0.6):
                self.log_issue("Erro_Mec_01", "CRITICAL", f"Poste {p.get('id')}: Engastamento insuficiente ({d}m).", p.get("id"))

    def run_full_audit(self, project_data):
        self.results = []
        self.audit_ampacity(project_data)
        self.audit_clearances(project_data)
        self.audit_bim_compliance(project_data)
        self.audit_mechanical(project_data)
        return self.results

if __name__ == "__main__":
    engine = AuditEngine()
    
    # Se houver dados via STDIN (Usado pelo Electron)
    if not sys.stdin.isatty():
        try:
            input_data = sys.stdin.read()
            if input_data:
                project_json = json.loads(input_data)
                report = engine.run_full_audit(project_json)
                print(json.dumps(report, indent=4, ensure_ascii=False))
                sys.exit(0)
        except Exception as e:
            print(json.dumps([{"code": "INTERNAL_ERROR", "severity": "CRITICAL", "message": str(e)}]))
            sys.exit(1)

    # Mock data para teste manual via CLI (Normal mode)
    test_json = {
        "sections": [{"id": "S1", "conductor": "3x70 + 53", "current_a": 200, "sap": "mult_70"}],
        "poles": [{"id": "P1", "length": 11, "foundation_depth": 1.5, "sap": ""}],
        "crossings": [{"id": "C1", "scenario": "federal_highway", "height_m": 7.0}]
    }
    report = engine.run_full_audit(test_json)
    print("\n--- INICIANDO AUDITORIA (CLI TEST) ---")
    print(json.dumps(report, indent=4, ensure_ascii=False))
    print("--- FIM DA AUDITORIA ---\n")
