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

---

## 📑 Módulos Críticos e Localização

* **RAG de Engenharia**: `RAG/padroes_construtivos.md` (Zenith Master).
* **Regras de Cálculo**: `data/rules/calculation_logic.json`.
* **Serviços Electron**: `frontend/electron/services/` e `frontend/electron/src/`.
* **DXF Generator**: `scripts/dxf_generator.py` — Projeção geo→CAD, layers POSTES/CONDUTORES/EQUIPAMENTOS/TEXTO/COTACAO/REFERENCIA.

---

## 💡 Aprendizados e Decisões (Knowledge Base)

1. **Bridge Python/Node**: A comunicação via `stdin/stdout` é robusta para auditoria, mas exige JSON bem formado. O `audit_engine.py` trata erros internos retornando uma lista JSON de erro para não quebrar o Electron.
2. **Mapeamento de Materiais**: Redes de blindagem (`MBNM`) exigem ferragens específicas (Cinta 220mm) que devem ser injetadas na BOM mesmo que não explicitamente selecionadas se o contexto de rede for blindado.
3. **Auditoria Mecânica**: A fórmula $L/10 + 0.6$ é o padrão ouro. Qualquer variação deve ser tratada como Warning pesado ou Critical.
4. **Vitest + CJS/ESM**: Tests em `electron/__tests__/` que usam `require('vitest')` falham. Usar sempre `import { describe, it, expect } from 'vitest'`. vi.mock + variáveis externas exige `vi.hoisted()`.
5. **BOMService alias**: `electron/services/BOMService.js` é proxy de `BomService.js` para compatibilidade de testes.
6. **AuditController alias**: `electron/ipc/AuditController.js` é proxy de `src/interfaces/ipc/AuditController.js`.
7. **BudgetIQService.PRODUCTIVITY**: POSTE=4.5h, TRANSFORMADOR=12h, CABO=0.05h/m, KIT=4h. HOURLY_RATE=R$120/h.
8. **Logger.debug guard**: `app?.isPackaged` (optional chaining) evita crash em ambiente de teste onde Electron app não está inicializado.
9. **DXF Generator Design**: O `PlantaEletricaGenerator` usa projeção geográfica simples (1° lat ≈ 111km) para converter coordenadas GPS em coordenadas CAD. Layers obrigatórias: POSTES, CONDUTORES, EQUIPAMENTOS, TEXTO, COTACAO, REFERENCIA. DXF R12 ASCII — compatível com accoreconsole.exe headless.
10. **PDF Export**: `gerarRelatorioPDF()` usa jsPDF + jspdf-autotable (já nas deps). Gera 3 seções: Dados Gerais, Resumo Financeiro, BOM Completo.

---

## 🚀 Próximos Passos (Ciclo 3)

* Integração com `generateDXF` IPC no frontend (botão "Exportar DXF" no mapa ou configurador).
* Alinhamento ANEEL/PRODIST Módulo 8 (Limites de qualidade).
* Simulador de carga de Transformadores.
* Refinar visualização 2.5D no Mapa (Leaflet) com DXF overlay.
* Phase 5 do roadmap: WMS/WFS layers no mapa (IBGE gratuito).

---
*Status: Ciclo 3 — BOM Automation & DXF-IQ (Phase 3)*
*Data: 2026-02-25*
*RAG Level: ZENITH ENGINEERING MASTER (Stage 8)*

