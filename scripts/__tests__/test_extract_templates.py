import unittest
import tempfile
import os
import json
from scripts import extract_templates

class TestExtractTemplates(unittest.TestCase):
    def setUp(self):
        # Create a temporary Excel file with pandas
        import pandas as pd
        self.temp_dir = tempfile.TemporaryDirectory()
        self.input_path = os.path.join(self.temp_dir.name, 'test_kits.xlsx')
        self.output_path = os.path.join(self.temp_dir.name, 'output.json')
        data = {
            'KIT': ['K1', '', 'K2'],
            'DESCRIÇÃO': ['Kit One', '', 'Kit Two'],
            'MAT. SAP': ['1001', '1002', '1003'],
            'QTD': [2, 1, 3],
        }
        df = pd.DataFrame(data)
        df.to_excel(self.input_path, index=False, engine='openpyxl')
    def tearDown(self):
        self.temp_dir.cleanup()
    def test_extract_templates_basic(self):
        extract_templates.extract_templates(
            input_path=self.input_path,
            output_path=self.output_path,
            sheet_name='Sheet1',
            kit_col='KIT',
            desc_col='DESCRIÇÃO',
            sap_col='MAT. SAP',
            qty_col='QTD',
        )
        self.assertTrue(os.path.exists(self.output_path))
        with open(self.output_path, encoding='utf-8') as f:
            data = json.load(f)
        self.assertIn('K1', data)
        self.assertIn('K2', data)
        self.assertEqual(data['K1']['name'], 'Kit One')
        self.assertEqual(data['K2']['name'], 'Kit Two')
        self.assertEqual(data['K1']['materials'][0]['sap'], '1001')
        self.assertEqual(data['K1']['materials'][0]['qty'], 2)

if __name__ == '__main__':
    unittest.main()
