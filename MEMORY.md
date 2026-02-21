# CQT Light — RAG / Memória de Trabalho

> **Atualizado em:** 2026-02-21 (sessão 5)  
> **Branch ativa:** `dev`  
> **Arquitetura:** DDD · Electron + React (frontend) · FastAPI (backend) · SQLite (DB local)

---

## 1. Visão Geral do Projeto

**CQT Light** é uma ferramenta de orçamentação para redes de distribuição de energia elétrica de baixa/média tensão (BT/MT), seguindo normas **ABNT** e padrões construtivos de concessionárias brasileiras.

### Objetivo Estratégico
Nível enterprise / dominância de mercado → SotA (State of the Art) em orçamentação elétrica 2.5D.

### Usuário-Alvo
Engenheiros/técnicos de concessionárias e empreiteiras que projetam e orçam obras de redes de distribuição.

---

## 2. Tecnologias

| Camada       | Stack                                       |
|--------------|---------------------------------------------|
| Frontend     | React 19, Tailwind CSS, Lucide React, Vite  |
| Desktop shell| Electron 34 (IPC main/preload/renderer)     |
| Banco local  | SQLite via `better-sqlite3`                 |
| Backend API  | Python 3.11 · FastAPI · Uvicorn             |
| DXF          | `ezdxf` (geração 2.5D headless)             |
| Testes FE    | Vitest + @testing-library/react             |
| Testes BE    | pytest + pytest-asyncio                     |
| Containers   | Docker + docker-compose                     |
| Geo          | Conversão UTM↔decimal via `pyproj`          |

---

## 3. Arquitetura DDD

```
cqt_light/
├── frontend/               # Thin client (Electron + React)
│   ├── electron/           # Main process (IPC handlers, SQLite)
│   │   ├── db/             # Database layer (schema.sql, database.cjs)
│   │   ├── main.cjs        # IPC handlers
│   │   └── preload.cjs     # Context bridge
│   └── src/                # React app
│       ├── components/     # UI components (max 500 linhas cada)
│       ├── hooks/          # Custom hooks (lógica reutilizável)
│       └── utils/          # Utilitários (export, parse)
├── backend/                # Smart backend (FastAPI)
│   ├── api/                # Rotas HTTP
│   ├── domain/             # Entidades e regras de negócio
│   ├── services/           # Serviços de aplicação
│   │   ├── dxf_service.py  # Geração DXF 2.5D (ezdxf)
│   │   └── geo_service.py  # Conversão UTM ↔ decimal (pyproj)
│   ├── tests/              # pytest
│   └── main.py             # Entrypoint FastAPI
├── data/                   # Dados estruturados (kits, catálogo)
├── scripts/                # Scripts de extração/seed
├── docker-compose.yml
├── .gitignore
├── .dockerignore
└── MEMORY.md               # Este arquivo (RAG)
```

---

## 4. Regras de Negócio Críticas

### 4.1 Coordenadas de Referência para Testes
| Sistema        | Valor                          |
|----------------|--------------------------------|
| UTM (23K)      | 788547 E, 7634925 N (Zona 23K) |
| Decimal        | -22.15018, -42.92185           |
| SIRGAS2000     | EPSG:31983 (UTM 23S)           |

Raios de teste: **100 m · 500 m · 1 km**

### 4.2 Projeção 2.5D (Não 3D)
- Todos os desenhos DXF usam 2.5D: planta baixa (XY) com cota Z como atributo de texto.
- Sem entidades 3D (extrusões, sólidos).
- Postes: círculos no plano XY com elevação anotada.

### 4.3 Estruturas de Kits
- `codigo_kit` → referência ao catálogo de kits SAP.
- `kit_composicao` → lista de SAP + quantidade.
- `templates_kit_manual` → kits com materiais parciais (sufixos contextuais).

### 4.4 Condutores
| Nível | Tipos                            |
|-------|----------------------------------|
| MT    | Convencional (CAA), Compacta (Spacer) |
| BT    | Multiplexada (Multiplex), Rede Nua     |

### 4.5 ABNT Aplicáveis
- NBR 5410 (instalações de BT)  
- NBR 14039 (instalações de MT)  
- ABNT NBR 6492 (representação de projetos de arquitetura)  
- Padrões construtivos da concessionária local

---

## 5. Fluxo Principal (Orçamentação)

```
Usuário seleciona estruturas/materiais
    → useBudgetCalculator (hook React)
    → IPC: getCustoTotal(kitCodes)
    → electron/main.cjs → db.getCustoTotal()
    → SQL: JOIN kits + kit_composicao + materiais + servicos_cm
    → Retorna: { materiais[], totalMaterial, totalServico }
    → Agrega materiais avulsos
    → Exibe na SummaryFooter
    → Exporta Excel ou gera DXF (backend FastAPI)
```

---

## 6. Módulos do Frontend (Responsabilidades)

| Arquivo                        | Responsabilidade               | Linhas |
|--------------------------------|--------------------------------|--------|
| `Configurator.jsx`             | Orquestrador principal         | 486    |
| `StructureList.jsx`            | Lista de estruturas            | 119    |
| `MaterialList.jsx`             | Lista de materiais avulsos     | 106    |
| `SummaryFooter.jsx`            | Rodapé com totais              | 79     |
| `useBudgetCalculator.js`       | Cálculo de custo total         | 182    |
| `useKeyboardNav.js`            | Navegação por teclado          | 89     |
| `excelExporter.js`             | Exportação Excel               | 123    |
| `constants/conductors.js`      | Constantes de condutores       | 28     |
| `ConfiguratorToolbar.jsx`      | Barra de ferramentas           | 84     |
| `ConductorSelector.jsx`        | Dropdown condutores MT/BT      | 110    |
| `PosteSearch.jsx`              | Busca de postes                | 54     |
| `QuantityPopup.jsx`            | Modal de quantidade            | 58     |
| `utils/configuratorStorage.js` | Persistência localStorage      | 38     |

**Módulos do banco (electron/db/):**

| Arquivo                   | Responsabilidade                    | Linhas |
|---------------------------|-------------------------------------|--------|
| `database.cjs`            | Orquestrador + helpers base + stats | 119    |
| `modules/materialsKits.cjs` | CRUD materiais, kits, composição  | 155    |
| `modules/budget.cjs`      | Serviços, orçamentos, templates     | 103    |
| `modules/pricing.cjs`     | Empresas, preços, histórico         | 143    |
| `modules/sufixos.cjs`     | Sufixos contextuais, templates manuais | 108 |

**Módulos do backend (domain/ e services/):**

| Arquivo                        | Responsabilidade                              | Linhas |
|--------------------------------|-----------------------------------------------|--------|
| `domain/entities.py`           | Entidades DDD puras + Value Objects elétricos | 157    |
| `services/dxf_service.py`      | Geração DXF 2.5D (ezdxf)                     | 187    |
| `services/geo_service.py`      | Conversão UTM ↔ decimal (pyproj + fallback)   | 167    |
| `services/voltage_drop_service.py` | Queda de tensão ABNT NBR 5410/14039       | 117    |
| `services/kml_service.py`      | Importação KML/GPX (stdlib)                   | 210    |

---

## 7. Backend FastAPI (Endpoints)

| Endpoint                              | Método | Descrição                                        |
|---------------------------------------|--------|--------------------------------------------------|
| `/api/dxf/generate`                   | POST   | Gera DXF 2.5D de rede elétrica                  |
| `/api/dxf/validate`                   | POST   | Valida DXF gerado (entidades, camadas)           |
| `/api/geo/utm-to-decimal`             | POST   | Converte UTM SIRGAS2000 → decimal                |
| `/api/geo/decimal-to-utm`             | POST   | Converte decimal → UTM SIRGAS2000                |
| `/api/geo/buffer`                     | POST   | Calcula área de influência (100/500/1000m)       |
| `/api/queda-tensao/calcular`          | POST   | Calcula queda de tensão (ABNT NBR 5410/14039)    |
| `/api/queda-tensao/tensoes`           | GET    | Lista tensões nominais disponíveis               |
| `/api/trace/importar`                 | POST   | Importa traçado GPS (KML/GPX → lista de pontos) |
| `/api/prodist/classificar-tensao`     | POST   | Classifica tensão: ADEQUADA/PRECÁRIA/CRÍTICA (PRODIST Módulo 8) |
| `/api/prodist/queda-alimentador`      | POST   | Queda de tensão com limites PRODIST (Módulo 6)   |
| `/api/prodist/limites`                | GET    | Lista limites PRODIST + comparação ABNT          |
| `/health`                             | GET    | Health check                                     |

---

## 8. Regras de Qualidade

- Arquivos > 500 linhas → modularizar  
- Cobertura de testes ≥ 80%  
- Sem dados mockados em produção (apenas em testes)  
- Zero custo monetário (APIs públicas/gratuitas)  
- Interface em **pt-BR**  
- Docker first: toda execução deve funcionar em container  
- Segurança: sanitização de inputs em todas as entradas de dados  
- Thin frontend / Smart backend  

---

## 9. Decisões Técnicas Registradas

| Data       | Decisão                                                     | Motivo                                |
|------------|-------------------------------------------------------------|---------------------------------------|
| 2026-02-21 | `ezdxf` para geração DXF                                   | Grátis, suporta DXF R2010+, headless  |
| 2026-02-21 | `pyproj` para conversão UTM                                 | SIRGAS2000 (EPSG:31983), padrão IBGE  |
| 2026-02-21 | FastAPI como backend                                        | Async, tipado, docs automáticas       |
| 2026-02-21 | 2.5D via Z como atributo (não extrusão)                    | Compatibilidade DWG/AutoCAD           |
| 2026-02-21 | accoreconsole.exe para testes DXF headless                 | Validação nativa AutoCAD              |
| 2026-02-21 | Modularização: extrair constantes e toolbar do Configurator | Limite 500 linhas, SRP                |
| 2026-02-21 | `database.cjs` dividido em 4 módulos de domínio            | Limite 500 linhas, SRP, manutenibilidade |
| 2026-02-21 | `httpx TestClient` para testes de integração FastAPI        | Cobertura 97% backend, sem servidor real |
| 2026-02-21 | `field_validator` Pydantic v2 para validar `radius_m > 0`  | Sanitização de entrada na API         |
| 2026-02-21 | `media_type="application/octet-stream"` no endpoint DXF    | Padrão IANA correto                   |
| 2026-02-21 | Entidades de domínio em `backend/domain/entities.py`        | DDD: domínio puro sem infraestrutura  |
| 2026-02-21 | `field_validator` para `nivel` ("MT"/"BT") e `potencia_kva` | Sanitização + domínio validado na API |
| 2026-02-21 | CI/CD via GitHub Actions (`.github/workflows/ci.yml`)       | Automação: tests + coverage + Docker build |
| 2026-02-21 | `LAYERS_CONFIG` movido para `domain/entities.py`            | Constantes de domínio com entidades   |
| 2026-02-21 | `voltage_drop_service.py` — ABNT NBR 5410/14039             | Cálculo de queda de tensão por trecho |
| 2026-02-21 | `kml_service.py` — xml.etree.ElementTree stdlib             | Zero custo, suporte KML+GPX           |
| 2026-02-21 | Haversine para comprimento de traçado GPS                   | Sem deps externas, ≈0.5% erro < 100km |
| 2026-02-21 | `prodist_service.py` — ANEEL/PRODIST Módulo 6 e 8          | Norma concessionária sobrepõe ABNT; toast aviso explícito |
| 2026-02-21 | `aviso_toast` em respostas PRODIST                          | Requisito: "ignorar ABNT com toast explícito" quando concessionária aplicada |
| 2026-02-21 | `NORMA_ABNT` / `NORMA_PRODIST` como strings no domínio     | Evita enum de infraestrutura em entidades puras (DDD) |

---

## 10. Status dos Testes

| Suite                         | Testes | Status     | Cobertura |
|-------------------------------|--------|------------|-----------|
| `components.test.js`          | 9      | ✅ pass    | –         |
| `database.test.js`            | 17     | ✅ pass    | –         |
| `useBudgetCalculator.test.js` | 3      | ✅ pass    | 81%       |
| `useKeyboardNav.test.js`      | 8      | ✅ pass    | 100%      |
| `configuratorStorage.test.js` | 6      | ✅ pass    | 90%       |
| `conductors.test.js`          | 8      | ✅ pass    | 100%      |
| `excelPriceParser.test.js`    | 10     | ✅ pass    | 90%       |
| `excelExporter.test.js`       | 11     | ✅ pass    | 85%       |
| `test_domain.py`              | 20     | ✅ pass    | 100%      |
| `test_api.py`                 | 30     | ✅ pass    | –         |
| `test_dxf_service.py`         | 13     | ✅ pass    | 93%       |
| `test_geo_service.py`         | 27     | ✅ pass    | 95%       |
| `test_voltage_drop.py`        | 40     | ✅ pass    | 100%      |
| `test_prodist_service.py`     | 59     | ✅ pass    | 100%      |
| **Total frontend**            | **72** | ✅ pass    | ~25%*     |
| **Total backend**             | **218**| ✅ pass    | **97%**   |
| **TOTAL GERAL**               | **290**| ✅ pass    | –         |

*Cobertura frontend baixa porque Configurator, KitEditor etc. precisam de mocks Electron mais aprofundados.

---

## 11. Próximos Passos

- [x] Integrar cálculo de queda de tensão (ABNT NBR 5410/14039) — `voltage_drop_service.py`  
- [x] Importação de traçado via KML/GPX — `kml_service.py` (zero custo, stdlib)  
- [x] ANEEL/PRODIST — `prodist_service.py` + `prodist_router.py` (sessão 5)  
- [ ] Integrar DXF com mapa visual (Leaflet.js, OpenStreetMap)  
- [ ] Half-way BIM: exportação IFC simplificada  
- [x] CI/CD pipeline (GitHub Actions) — `.github/workflows/ci.yml`  
- [ ] Aumentar cobertura frontend (mocks do Electron para Configurator, KitEditor)
- [ ] Testes E2E com Playwright (Electron app)  
