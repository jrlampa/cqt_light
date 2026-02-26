# RAG - Memória de Trabalho (Working Memory) - CQT LIGHT

Este documento registra a inteligência de desenvolvimento, arquitetura e decisões críticas para continuidade do projeto.

---

## 🏛️ Arquitetura do Sistema (Current State)

O projeto segue o padrão **Thin Frontend / Smart Backend** (Electron + Python Bridge).

* **Backend Architecture**: Domain-Driven Design (DDD).
  * `application/`: UseCases (AuditProject, GenerateBOM).
  * `domain/`: Entities + Services (BudgetIQService, ProjectFinancialService).
  * `infrastructure/`: Services (PythonBridge, CADAutomationService) and Repositories (MaterialRepo, KitRepo).
  * `interfaces/`: IPC Controllers (AuditController, MaterialController, EngineeringController, etc.) and `ControllerRegistry`.
* **Database**: SQLite with Repository Pattern (`better-sqlite3`).
* **Intelligence Engine (Python)**:
  * `audit_engine.py`: Validação técnica normativa.
  * `bom_generator.py`: Geração e consolidação de listas de materiais SAP.
  * `dxf_generator.py`: Geração de plantas CAD 2D (DXF R12 native, zero-dependency).
  * `dxf_auditor.py`: Auditoria headless de arquivos DXF.
* **Frontend**: Thin React (Vite) + SotA components.
  * `pdfExporter.js`: Geração de relatório PDF com jsPDF + autoTable.
  * `excelExporter.js`: Exportação de BOM para Excel (XLSX).
  * `transformerCalculations.js`: Funções puras de cálculo elétrico (demanda, corrente, queda de tensão, carregamento).

---

## 📑 Módulos Críticos e Localização

* **RAG de Engenharia**: `RAG/padroes_construtivos.md` (Zenith Master).
* **Regras de Cálculo**: `data/rules/calculation_logic.json`.
* **Serviços Electron**: `frontend/electron/services/` e `frontend/electron/src/`.
* **DXF Generator**: `scripts/dxf_generator.py` — Projeção geo→CAD, layers POSTES/CONDUTORES/EQUIPAMENTOS/TEXTO/COTACAO/REFERENCIA.
* **Transformer Calculations**: `frontend/src/utils/transformerCalculations.js` — Importado pelo componente e pelos testes.

---

## 💡 Aprendizados e Decisões (Knowledge Base)

1. **Bridge Python/Node**: A comunicação via `stdin/stdout` é robusta para auditoria, mas exige JSON bem formado. O `audit_engine.py` trata erros internos retornando uma lista JSON de erro para não quebrar o Electron.
2. **Mapeamento de Materiais**: Redes de blindagem (`MBNM`) exigem ferragens específicas (Cinta 220mm) que devem ser injetadas na BOM mesmo que não explicitamente selecionadas se o contexto de rede for blindado.
3. **Auditoria Mecânica**: A fórmula $L/10 + 0.6$ é o padrão ouro. Qualquer variação deve ser tratada como Warning pesado ou Critical.
4. **Vitest + CJS/ESM**: Tests em `electron/__tests__/` que usam `require('vitest')` falham. Usar sempre `import { describe, it, expect } from 'vitest'`. vi.mock + variáveis externas exige `vi.hoisted()`.
5. **BOMService alias**: `electron/services/BOMService.js` é proxy de `BomService.js` para compatibilidade de testes.
6. **AuditController alias**: `electron/ipc/AuditController.js` é proxy de `src/interfaces/ipc/AuditController.js`. O vi.mock não intercepta o require interno porque o caminho de resolução diverge entre o contexto do teste e o contexto do módulo aninhado. Manter como pre-existing failure.
7. **BudgetIQService.PRODUCTIVITY**: POSTE=4.5h, TRANSFORMADOR=12h, CABO=0.05h/m, KIT=4h. HOURLY_RATE=R$120/h.
8. **Logger.debug guard**: `app?.isPackaged` (optional chaining) evita crash em ambiente de teste onde Electron app não está inicializado.
9. **DXF Generator Design**: O `PlantaEletricaGenerator` usa projeção geográfica simples (1° lat ≈ 111km) para converter coordenadas GPS em coordenadas CAD. Layers obrigatórias: POSTES, CONDUTORES, EQUIPAMENTOS, TEXTO, COTACAO, REFERENCIA. DXF R12 ASCII — compatível com accoreconsole.exe headless.
10. **PDF Export**: `gerarRelatorioPDF()` usa jsPDF + jspdf-autotable (já nas deps). Gera 3 seções: Dados Gerais, Resumo Financeiro, BOM Completo.
11. **WMS Layers**: Usar `WMSTileLayer` do react-leaflet com endpoint IBGE gratuito (`geoservicos.ibge.gov.br/geoserver/wms`). Layer: `CGEO:BCG_Municipio_A`. Opacidade 0.5 para sobreposição visual. Estado `wmsLayer` controlado pelo MapToolbar.
12. **Transformer Load Simulator**: Cálculos baseados em PRODIST Módulo 8, NBR 14039 e guia CEMIG DS-EL-01-1. FP padrão = 0.92. Margem obrigatória de 20% ao sugerir transformador (NBR 14039 seção 4.2.1). Funções puras em `utils/transformerCalculations.js` — importadas pelo componente E pelos testes.
13. **PythonBridge tests**: Pre-existing failure. vi.mock('child_process') com CJS não intercepta o spawn dentro do módulo CJS PythonBridge.js. Causa: CJS/ESM interop no Vite-node. Não reescrever PythonBridge.js para corrigir.
14. **ControllerRegistry test**: Pre-existing failure. `MaterialRepository is not a constructor` — erro de compatibilidade CJS/ESM no carregamento do repositório em contexto de teste.

---

## 🧪 Estado dos Testes

* **Total**: 150 testes (142 passando, 8 falhando)
* **Pre-existing failures**: 4 arquivos (PythonBridge, AuditController, AuditProjectUseCase, ControllerRegistry)
* **Python DXF tests**: 18 testes (todos passando, headless)
* **Build**: `npm run build` → OK (zero erros)
* **CodeQL**: 0 alertas

---

## 🚀 Próximos Passos (Ciclo 5)

* **Fase 4 (IFC/OpenBIM)**: Exportar estruturas configuradas para IFC 4.0 via IfcOpenShell Python bridge.
* **Simulador de Stress Estrutural (Fase 6)**: Visualização de heatmap de tensão mecânica em postes.
* **Corrigir pre-existing test failures**: Reescrever AuditController.test.js para usar vi.mock com caminho absoluto ou refatorar o bridge para um único nível de indireção.
* **Modo Offline-First (Fase 7)**: Motor de sincronização SQLite com cofre de projetos.
* **Editor de Relatórios dinâmico (Fase 16)**: Drag-and-drop de blocos de conteúdo para memoriais descritivos.

---
*Status: Ciclo 4 — DXF Export UI, WMS Layers, Transformer Load Simulator*
*Data: 2026-02-26*
*RAG Level: ZENITH ENGINEERING MASTER (Stage 9)*
