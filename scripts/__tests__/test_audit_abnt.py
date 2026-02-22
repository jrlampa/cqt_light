import unittest
import sqlite3
import re
from pathlib import Path

def validate_item_abnt(desc, und):
    unidades_padrao = {'UN', 'M', 'KG', 'CJ', 'PAR', 'RL', 'PC', 'JG'}
    errors = []
    if not desc:
        return ["DESC_VAZIA"]
    if desc != desc.upper():
        errors.append("CAIXA ALTA")
    if not und or und.upper() not in unidades_padrao:
        errors.append("UNIDADE_INVALIDA")
    if any(char in desc for char in [';', '|', '_']):
        errors.append("CARACTER_PROIBIDO")
    return errors

class TestAbntLogic(unittest.TestCase):
    def test_valid_item(self):
        self.assertEqual(len(validate_item_abnt("POSTE DE CONCRETO", "UN")), 0)

    def test_lowercase_desc(self):
        self.assertIn("CAIXA ALTA", validate_item_abnt("poste", "UN"))

    def test_invalid_unit(self):
        self.assertIn("UNIDADE_INVALIDA", validate_item_abnt("POSTE", "METROS"))

    def test_forbidden_chars(self):
        self.assertIn("CARACTER_PROIBIDO", validate_item_abnt("POSTE;CONCRETO", "UN"))
        self.assertIn("CARACTER_PROIBIDO", validate_item_abnt("FERRAGEM_TIPO_A", "UN"))

    def test_empty_desc(self):
        self.assertIn("DESC_VAZIA", validate_item_abnt("", "UN"))

if __name__ == '__main__':
    unittest.main()
