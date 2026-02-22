# RAG - Memória de Trabalho (Working Memory) - CQT LIGHT

Este documento registra a inteligência de desenvolvimento, arquitetura e decisões críticas para continuidade do projeto.

---

## 🏛️ Arquitetura do Sistema (Current State)

O projeto segue o padrão **Thin Frontend / Smart Backend** (Electron + Python Bridge).

* **Backend Architecture**: Domain-Driven Design (DDD).
  * `application/`: UseCases (AuditProject, GenerateBOM).
  * `domain/`: Entities.
  * `infrastructure/`: Services (PythonBridge) and Repositories (MaterialRepo, KitRepo).
  * `interfaces/`: IPC Controllers (AuditController, MaterialController, etc.) and `ControllerRegistry`.
* **Database**: SQLite with Repository Pattern (`better-sqlite3`).
* **Intelligence Engine (Python)**:
  * `audit_engine.py`: Validação técnica normativa.
  * `bom_generator.py`: Geração e consolidação de listas de materiais SAP.
* **Frontend**: Thin React (Vite) + SotA (State-of-the-Art) components like `AuditReport` sidebar.

---

## 📑 Módulos Críticos e Localização

* **RAG de Engenharia**: [padroes_construtivos.md](file:///c:/Users/jonat/OneDrive%20-%20IM3%20Brasil/utils/myworld/cqt_light/RAG/padroes_construtivos.md) (Zenith Master).
* **Regras de Cálculo**: [calculation_logic.json](file:///c:/Users/jonat/OneDrive%20-%20IM3%20Brasil/utils/myworld/cqt_light/data/rules/calculation_logic.json).
* **Serviços Electron**: Localizados em `frontend/electron/services/`.

---

## 💡 Aprendizados e Decisões (Knowledge Base)

1. **Bridge Python/Node**: A comunicação via `stdin/stdout` é robusta para auditoria, mas exige JSON bem formado. O `audit_engine.py` trata erros internos retornando uma lista JSON de erro para não quebrar o Electron.
2. **Mapeamento de Materiais**: Redes de blindagem (`MBNM`) exigem ferragens específicas (Cinta 220mm) que devem ser injetadas na BOM mesmo que não explicitamente selecionadas se o contexto de rede for blindado.
3. **Auditoria Mecânica**: A fórmula $L/10 + 0.6$ é o padrão ouro. Qualquer variação deve ser tratada como Warning pesado ou Critical.

---

## 🚀 Próximos Passos Sugeridos

### Learning 3: DDD & IPC Registration

Decoupling `main.cjs` from business logic by using IPC Controllers and a `ControllerRegistry` prevents the main process from becoming a monolithic "god file".

### Learning 4: Concessionaire Override Logic (Zenith Master)

When ABNT standards conflict with Concessionaire (LIGHT) norms, the RAG Zenith Master rules must take precedence, with an explicit UI notification (Toast/Audit Alert) to ensure engineering compliance.

## 🚀 Próximos Passos (Ciclo 2)

- Refinar visualização 2.5D no Mapa (Leaflet).
* Alinhamento ANEEL/PRODIST Módulo 8 (Limites de qualidade).
* Simulador de carga de Transformadores.

---
*Status: Ciclo de Desenvolvimento Concluído*
*Data: 2026-02-22*
*RAG Level: ZENITH ENGINEERING MASTER (Stage 7)*
