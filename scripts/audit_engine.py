import json
import os
import sys
import logging
from typing import List, Dict, Any, Optional

# Constants for Quality Limits
QDT_LIMIT_URBAN = 7.0
QDT_LIMIT_RURAL = 10.0
TRAFO_AVG_CONS_KW = 1.2
TRAFO_PF = 0.92

class TechnicalAuditEngine:
    """
    Enterprise-grade Intelligence Engine for CQT LIGHT.
    Validates technical standards for electrical network design.
    """
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.rules_path = os.path.join(self.base_dir, 'data', 'rules', 'calculation_logic.json')
        self.rules = self._load_rules()
        self.audit_log: List[Dict[str, Any]] = []

    def _load_rules(self) -> Dict[str, Any]:
        """Loads technical rules from JSON."""
        try:
            if not os.path.exists(self.rules_path):
                return {}
            with open(self.rules_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Failed to load rules: {e}")
            return {}

    def report_issue(self, code: str, severity: str, message: str, element_id: Optional[str] = None):
        """Standardized issue reporting."""
        self.audit_log.append({
            "code": code,
            "severity": severity,
            "message": message,
            "element_id": element_id
        })

    def validate_ampacity(self, project: Dict[str, Any]):
        """Checks if conductor current exceeds physical capacity."""
        conductors = self.rules.get("bt_conductors_multiplexed", [])
        sections = project.get("sections", [])
        for section in sections:
            cond_name = section.get("conductor")
            current = section.get("current_a", 0)
            spec = next((c for c in conductors if c["name"] == cond_name), None)
            
            if spec:
                capacity = spec["capacity_a"]
                if current > capacity:
                    self.report_issue(
                        "AMP_01", "CRITICAL", 
                        f"Cabo {cond_name}: Corrente {current}A excede capacidade {capacity}A.", 
                        section.get("id")
                    )

    def validate_clearances(self, project: Dict[str, Any]):
        """Validates crossing heights against technical safety clearances."""
        clearances = self.rules.get("clearances_m", {})
        crossings = project.get("crossings", [])
        for crossing in crossings:
            scenario = crossing.get("scenario")
            height = crossing.get("height_m", 0)
            min_h = clearances.get(scenario, 6.0)
            if height < min_h:
                self.report_issue(
                    "CLEAR_01", "CRITICAL", 
                    f"Afastamento Vertical ({scenario}): {height}m < Mínimo {min_h}m.", 
                    crossing.get("id")
                )

    def validate_bim_metadata(self, project: Dict[str, Any]):
        """Ensures all elements have SAP codes for BIM integration."""
        poles = project.get("poles", [])
        sections = project.get("sections", [])
        for item in poles + sections:
            if not item.get("sap"):
                self.report_issue(
                    "BIM_01", "WARNING", 
                    f"Elemento {item.get('id')} não possui código SAP vinculado.", 
                    item.get("id")
                )

    def validate_mechanical_foundation(self, project: Dict[str, Any]):
        """Standard L/10 + 0.6 mechanical engagement rule."""
        poles = project.get("poles", [])
        for pole in poles:
            length = pole.get("length", 0)
            depth = pole.get("foundation_depth", 0)
            if length > 0:
                min_depth = (length / 10.0) + 0.6
                if depth < min_depth:
                    self.report_issue(
                        "MECH_01", "CRITICAL", 
                        f"Poste {pole.get('id')}: Profundidade {depth}m < Mínimo normativo {min_depth:.2f}m.", 
                        pole.get("id")
                    )

    def validate_prodist_quality(self, project: Dict[str, Any]):
        """ANEEL PRODIST Módulo 8 voltage drop limits."""
        is_rural = project.get("environment") == "RURAL"
        limit = QDT_LIMIT_RURAL if is_rural else QDT_LIMIT_URBAN
        
        sections = project.get("sections", [])
        for section in sections:
            drop = section.get("voltage_drop_pct", 0)
            if drop > limit:
                severity = "CRITICAL" if drop > (limit * 1.5) else "WARNING"
                self.report_issue(
                    "PRODIST_01", severity, 
                    f"Queda de Tensão ({drop}%) excede limite PRODIST {limit}% ({'Rural' if is_rural else 'Urbano'}).", 
                    section.get("id")
                )

    def simulate_transformer_load(self, project: Dict[str, Any]):
        """Community network load simulation."""
        transformers = project.get("transformers", [])
        for trafo in transformers:
            cap = trafo.get("capacity_kva", 0)
            consumers = trafo.get("consumer_count", 0)
            avg_kw = trafo.get("avg_consumption_kw", TRAFO_AVG_CONS_KW)
            
            demand = (consumers * avg_kw) / TRAFO_PF
            
            if cap > 0:
                if demand > cap:
                    pct = (demand / cap - 1) * 100
                    self.report_issue(
                        "LOAD_01", "CRITICAL", 
                        f"Trafo {trafo.get('id')}: Sobrecarga de {pct:.1f}% ({demand:.1f}kVA > {cap}kVA).", 
                        trafo.get("id")
                    )
                elif demand < cap * 0.2:
                    self.report_issue(
                        "LOAD_02", "INFO", 
                        f"Trafo {trafo.get('id')}: Subutilizado ({demand:.1f}kVA). Potencial perda de investimento.", 
                        trafo.get("id")
                    )

    def execute_audit(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Orchestrates all validation routines."""
        self.audit_log = []
        validation_methods = [
            self.validate_ampacity,
            self.validate_clearances,
            self.validate_bim_metadata,
            self.validate_mechanical_foundation,
            self.validate_prodist_quality,
            self.simulate_transformer_load
        ]
        
        for method in validation_methods:
            try:
                method(project_data)
            except Exception as e:
                self.report_issue("ENGINE_ERROR", "CRITICAL", f"Falha no validador {method.__name__}: {str(e)}")
        
        return self.audit_log

if __name__ == "__main__":
    engine = TechnicalAuditEngine()
    
    # Electron STDIN Bridge
    if not sys.stdin.isatty():
        try:
            raw_input = sys.stdin.read()
            if raw_input:
                data = json.loads(raw_input)
                results = engine.execute_audit(data)
                print(json.dumps(results, indent=4, ensure_ascii=False))
                sys.exit(0)
        except Exception as e:
            print(json.dumps([{"code": "FATAL", "severity": "CRITICAL", "message": f"Bridge Failure: {str(e)}"}]))
            sys.exit(1)

    # CLI Manual Test Mock
    mock_project = {
        "environment": "URBAN",
        "sections": [
            {"id": "S1", "conductor": "3x70 + 53", "current_a": 250, "voltage_drop_pct": 8.5, "sap": "1001"},
            {"id": "S2", "conductor": "3x70 + 53", "current_a": 100, "voltage_drop_pct": 2.0, "sap": ""}
        ],
        "poles": [
            {"id": "P1", "length": 12, "foundation_depth": 1.5, "sap": "2001"}
        ],
        "transformers": [
            {"id": "T1", "capacity_kva": 45, "consumer_count": 50, "avg_consumption_kw": 1.2}
        ],
        "crossings": [
            {"id": "C1", "scenario": "federal_highway", "height_m": 5.5}
        ]
    }
    print("\n[CQT LIGHT] Initing Enterprise Audit CLI Test...")
    print(json.dumps(engine.execute_audit(mock_project), indent=4, ensure_ascii=False))
