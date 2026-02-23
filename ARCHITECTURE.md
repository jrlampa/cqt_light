# cqt_light Architecture & Data Flow

## Overview
cqt_light is a modular system for technical and cost analysis of electrical networks, combining a React/Electron frontend with Python-based ETL/data processing.

## Main Components
- **Frontend**: React 19, Electron, Vite, TailwindCSS
- **Backend/ETL**: Python scripts (pandas, openpyxl)
- **Database**: SQLite (accessed via Electron and Python)
- **Data**: Excel, JSON, SQLite

## Data Flow
1. **Source Data**: Excel files (e.g., KIT.xlsm, RESUMO KITS MAIS USADOS.xlsx, CADASTRO DE KITS E MATERIAIS.xlsm) in `data/raw/`
2. **ETL Scripts**: Python scripts extract, transform, and output JSON to `data/kits/`, `data/standards/`, `data/catalog/`
3. **Database**: Data is loaded into SQLite for use by the Electron/React app
4. **Frontend**: React/Electron UI presents, edits, and analyzes data, communicating with the database and backend logic

## Key Scripts & Files
- `scripts/extract_templates.py`: Unified ETL for kits/templates
- `etl_config.ini`: Central config for ETL paths
- `frontend/electron/db/database.cjs`: Database logic
- `frontend/src/components/`: UI logic

## Extending & Maintaining
- Add new ETL logic in Python, referencing `etl_config.ini` for paths
- Update requirements in `requirements.txt`
- Add tests for new scripts in `scripts/tests/`

---
For more details, see inline comments and docstrings in each module.
