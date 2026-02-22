import sys
import json
import os
from typing import Dict, Any, List

class DXFAuditor:
    """
    Headless DXF Auditor for CQT LIGHT.
    Validates technical integrity of generated CAD files.
    """
    
    def __init__(self, dxf_path: str):
        self.dxf_path = dxf_path
        self.report = {
            "status": "PASS",
            "score": 100,
            "issues": [],
            "stats": {
                "layers": [],
                "blocks": 0
            }
        }

    def audit(self) -> Dict[str, Any]:
        """
        Performs technical check. 
        Note: In a headless environment without a full CAD engine, 
        we can parse the DXF as text or use lightweight parsers.
        """
        if not os.path.exists(self.dxf_path):
            return {"status": "ERROR", "message": "DXF file not found"}

        try:
            with open(self.dxf_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                # SOTA Check: Layer consistency
                required_layers = ["POSTES", "CONDUTORES", "TEXTO", "EQUIPAMENTOS"]
                found_layers = []
                for layer in required_layers:
                    if layer in content:
                        found_layers.append(layer)
                    else:
                        self.report["issues"].append({
                            "type": "LAYER_MISSING",
                            "severity": "WARNING",
                            "message": f"Layer obrigatória ausente: {layer}"
                        })
                        self.report["score"] -= 10

                self.report["stats"]["layers"] = found_layers
                self.report["stats"]["blocks"] = content.count("INSERT") # Rough block count

                # Quality Score Adjustment
                if self.report["score"] < 70:
                    self.report["status"] = "FAIL"
                elif self.report["score"] < 90:
                    self.report["status"] = "NEEDS_REVIEW"

        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

        return self.report

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "ERROR", "message": "Usage: python dxf_auditor.py <path_to_dxf>"}))
        sys.exit(1)

    auditor = DXFAuditor(sys.argv[1])
    results = auditor.audit()
    print(json.dumps(results, indent=4))
