import sqlite3
import json
import pandas as pd
import os
from pathlib import Path
from datetime import datetime

# Environment Config
BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"
OUTPUT_DIR = BASE_DIR / "data" / "bim_export"

class BIMExportEngine:
    """
    Enterprise-grade BIM/SAP Export Engine.
    Generates professional executive reports with technical standards integration.
    """
    
    def __init__(self):
        self.conn = None
        if DB_PATH.exists():
            self.conn = sqlite3.connect(DB_PATH)
            self.conn.row_factory = sqlite3.Row
        
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def _get_catalog_with_norms(self):
        """Fetches material catalog enriched with reference standards."""
        if not self.conn: return []
        
        query = """
        SELECT 
            m.sap as "CÓDIGO SAP", 
            m.descricao as "DESCRIÇÃO TÉCNICA", 
            m.unidade as "UN", 
            m.preco_unitario as "CUSTO UNIT (R$)",
            GROUP_CONCAT(n.fonte || ' (P.' || n.pagina || ')', ' | ') as "NORMAS REF"
        FROM materiais m
        LEFT JOIN normas_referencia n ON m.sap = n.sap
        GROUP BY m.sap
        """
        return pd.read_sql_query(query, self.conn)

    def generate_executive_report(self, project_bom=None):
        """
        Generates a premium Excel report.
        If project_bom is provided, it filters and formats the specific project data.
        """
        df_catalog = self._get_catalog_with_norms()
        
        if project_bom:
            # project_bom is expected to be a list of {sap, quantidade, ...}
            df_project = pd.DataFrame(project_bom)
            # Rename columns for the report
            df_project = df_project.rename(columns={
                "sap": "CÓDIGO SAP",
                "quantidade": "QUANTIDADE",
                "descricao": "DESCRIÇÃO",
                "unidade": "UN"
            })
            
            # Merge with catalog to get norms and pricing
            report_df = pd.merge(df_project, df_catalog, on="CÓDIGO SAP", how="left", suffixes=('', '_cat'))
            
            # Cleanup duplicate columns if any
            if "DESCRIÇÃO TÉCNICA" in report_df.columns:
                report_df["DESCRIÇÃO"] = report_df["DESCRIÇÃO TÉCNICA"]
                report_df = report_df.drop(columns=["DESCRIÇÃO TÉCNICA"])
            
            report_df["TOTAL (R$)"] = report_df["QUANTIDADE"] * report_df["CUSTO UNIT (R$)"].fillna(0)
        else:
            report_df = df_catalog

        # Generate File Name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        file_path = OUTPUT_DIR / f"ZENITH_BIM_REPORT_{timestamp}.xlsx"
        
        # Professional Styling with Pandas ExcelWriter
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            report_df.to_excel(writer, sheet_name='Project BOM', index=False)
            
            # Access openpyxl objects for styling if needed (requires openpyxl installed)
            workbook = writer.book
            worksheet = writer.sheets['Project BOM']
            
            # Simple column width adjustment
            for col in worksheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except: pass
                worksheet.column_dimensions[column].width = min(max_length + 2, 50)

        return str(file_path)

    def close(self):
        if self.conn:
            self.conn.close()

if __name__ == "__main__":
    engine = BIMExportEngine()
    print("[Zenith Engine] Generatind SotA BIM Export...")
    
    # Test with dummy project data
    test_bom = [
        {"sap": "10001234", "quantidade": 10, "descricao": "Poste DT 11/300", "unidade": "UN"},
        {"sap": "10005432", "quantidade": 1, "descricao": "Trafo 45kVA", "unidade": "UN"}
    ]
    
    result_path = engine.generate_executive_report(test_bom)
    print(f"✅ Excel SotA generated: {result_path}")
    engine.close()
