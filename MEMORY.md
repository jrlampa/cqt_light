# CQT Light — RAG / Memória de Trabalho

> **Atualizado em:** 2026-02-22 (sessão 16)  
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
| `hooks/useIfc.js`              | Exportação IFC2X3 STEP via API (BIM)        | 82     |
| `hooks/useRedeAnalise.js`      | Análise de topologia de rede via API        | 72     |
| `hooks/useGeo.js`              | Conversão UTM↔decimal via API               | 91     |
| `hooks/useKml.js`              | Importação KML/GPX via API     | 87     |
| `hooks/useQuedaTensao.js`      | Cálculo queda de tensão via API | 90    |
| `components/MapaRede.jsx`      | Mapa Leaflet/OSM 2.5D + GPS    | 232    |

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
| `services/ifc_service.py`      | Exportação IFC2X3 STEP (Half-way BIM)         | 185    |
| `services/rede_analysis_service.py` | Topologia de rede: BFS, distâncias, stats | 152    |
| `tests/test_prodist_domain.py` | Domínio PRODIST: constantes + classificação    | 138    |
| `tests/test_prodist_api.py`    | API PRODIST: queda + integração REST           | 298    |
| `tests/test_e2e_workflow.py`   | E2E: 8 fluxos reais UTM→DXF→IFC               | 260    |
| `tests/test_rede_service.py`   | Topologia: BFS + comprimentos + API           | 248    |

---

## 7. Backend FastAPI (Endpoints)

| Endpoint                              | Método | Descrição                                        |
|---------------------------------------|--------|--------------------------------------------------|
| `/`                                   | GET    | Landing page (HTML, pt-BR)                       |
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
| `/api/ifc/export`                     | POST   | Exporta rede elétrica em IFC2X3 STEP (Half-way BIM) |
| `/api/ifc/validate`                   | POST   | Valida arquivo IFC2X3 gerado                     |
| `/api/rede/analisar`                  | POST   | Análise de topologia de rede (conectividade BFS, comprimentos MT/BT) |
| `/health`                             | GET    | Health check                                     |
| `/landing`                            | GET    | Serve arquivos estáticos da landing page         |

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
| 2026-02-21 | `vitest setup.js` com `window.api` mock via atribuição direta (não Object.defineProperty) | Preserva `window.addEventListener` que useKeyboardNav precisa |
| 2026-02-21 | `vi.mock('xlsx')` + dynamic import para testar `parseExcelPrecos` com FileReader | Sem deps de browser real, cobertura 9% → 95% |
| 2026-02-21 | `vi.mock('xlsx', importOriginal)` spread para preservar `XLSX.utils.*` ao mock `writeFile` | downloadWorkbook testável sem I/O real |
| 2026-02-21 | `vi.mock('../components/X')` pattern para testar Configurator isolado de sub-componentes pesados | Cobre lógica de orquestração sem precisar instanciar Electron-dependent children |
| 2026-02-21 | `getStats` adicionado ao mock `setup.js` | App.jsx chama `window.api.getStats()` no useEffect — era undefined antes |
| 2026-02-21 | Frontend coverage 20% → 53% em sessão 7 (+119 testes, 12 novos arquivos de teste) | Target 80% ainda não atingido — gap em componentes grandes (Configurator 486L, KitEditor 430L) |
| 2026-02-21 | Frontend coverage 52.71% → 80.28% linhas em sessão 8 (+140 testes, 12 novos arquivos) | Target ≥80% atingido ✅ |
| 2026-02-21 | Landing page `/landing/index.html` — Tailwind CDN, pt-BR, zero custo | Sessão 9: novo requisito "landpage" adicionado ao enunciado |
| 2026-02-21 | FastAPI serve landing via `HTMLResponse` em `GET /` | `Path(__file__).resolve()` obrigatório — `__file__` pode ser relativo em contexto pytest |
| 2026-02-21 | `ifc_service.py` — IFC2X3 STEP sem dependências externas   | Half-way BIM; GUIDs determinísticos (uuid5); zero custo |
| 2026-02-21 | `Toast.jsx` — componente de notificação acessível          | Exibe aviso PRODIST/ABNT em pt-BR; role=alert, aria-live |
| 2026-02-21 | `useProdist.js` — hook React para API PRODIST              | classificarTensao, calcularQuedaAlimentador, obterLimites |
| 2026-02-21 | `backend/.coverage` removido do git tracking               | Estava rastreado por engano desde sessão 6 |
| 2026-02-21 | `test_prodist_service.py` (536L) dividido em `test_prodist_domain.py` + `test_prodist_api.py` | Limite 500 linhas, SRP |
| 2026-02-21 | `useGeo.js` hook — converte UTM↔decimal, buffer via fetch ao backend | Thin frontend: UI exibe mapa; backend faz conversão |
| 2026-02-22 | `pytest-cov>=5.0.0` adicionado a requirements.txt + pytest.ini addopts | CI garante ≥80% backend coverage automaticamente |
| 2026-02-22 | `PriceManagementModalImport.test.jsx` — trigger fileInput change com File mock + act() | Cobre linha 108 (reajuste error), 145 (tab re-click), 237-244 (ambiguous map) |
| 2026-02-22 | `useIfc.js` hook — thin frontend para IFC export + validate | Padrão dos outros hooks (useGeo, useKml, useQuedaTensao); SRP |
| 2026-02-22 | `useRedeAnalise.js` hook — thin frontend para network topology analysis | Endpoint /api/rede/analisar; BFS conectividade, comprimentos MT/BT |
| 2026-02-22 | Landing page atualizada: 936+ testes, 17+ endpoints | Contagem real após sessão 16 |
| 2026-02-22 | `useIfc` e `useRedeAnalise` seguem padrão exato de `useGeo` — postJson + loading/error/clearError | Consistência de código; facilita onboarding |
| 2026-02-22 | `MapaRede.jsx` prop `tracado` — GPS points como circleMarker roxo, incluídos em fitBounds | Integração visual KML/GPX na aba Mapa |
| 2026-02-22 | `rede_analysis_service.py` — BFS conectividade, distância euclidiana, estatísticas | Topologia SotA — ABNT NBR 14565, PRODIST Módulo 6 |
| 2026-02-22 | `rede_router.py` — POST /api/rede/analisar com validação Pydantic | id, nivel (MT/BT), potencia_kva > 0 sanitizados |
| 2026-02-22 | BFS usa `min(pole_ids)` como nó inicial — determinístico independente de set order | Evita falha intermitente em testes com multiplos isolados |
| 2026-02-22 | `useQuedaTensao.js` hook — thin frontend para voltage drop API | Mesmo padrão de useGeo.js e useKml.js |
| 2026-02-22 | `MapaRedeLeaflet.test.jsx` — mock window.L antes do render | carregarLeaflet resolve sync; cobre linhas 78-186; coverage 47% → 92.85% |
| 2026-02-22 | `ConfiguratorSearch.test.jsx` — mock PosteSearch/StructureList/MaterialList controlados | Testa searchPoste, selectPoste, searchMaterial, confirmAddItem sem acesso ao código interno |
| 2026-02-22 | Tooltip GPS usa `ponto.nome \|\| (ponto.id != null ? String(ponto.id) : '')` | Evita exibir 'GPS 0' quando id=0 e nome está vazio |
| 2026-02-21 | App.jsx: aba "Mapa" (Ctrl+5) renderiza MapaRede | Integração do mapa Leaflet/OSM ao app principal |
| 2026-02-21 | Configurator.jsx integra `useProdistToast` + `Toast` | Aviso PRODIST/ABNT explícito conforme requisito "toast explicito" |
| 2026-02-21 | `test_e2e_workflow.py` — 8 fluxos E2E completos | Cobre pipeline real: UTM→geo→buffer→DXF→IFC→PRODIST |
| 2026-02-21 | UTM refs (788547, 7634925) e decimal (-22.15018, -42.92185) são pontos distintos no MEMORY.md | E2E usa roundtrip (não absoluto); pyproj é preciso para EPSG:31983 |

---

## 10. Status dos Testes

| Suite                              | Testes | Status     | Cobertura |
|------------------------------------|--------|------------|-----------|
| `components.test.js`               | 9      | ✅ pass    | –         |
| `database.test.js`                 | 17     | ✅ pass    | –         |
| `useBudgetCalculator.test.js`      | 3      | ✅ pass    | 81%       |
| `useKeyboardNav.test.js`           | 8      | ✅ pass    | 100%      |
| `useProdistToast.test.js`          | 18     | ✅ pass    | 100%      |
| `configuratorStorage.test.js`      | 6      | ✅ pass    | 90%       |
| `conductors.test.js`               | 8      | ✅ pass    | 100%      |
| `excelPriceParser.test.js`         | 21     | ✅ pass    | 95%       |
| `excelExporter.test.js`            | 16     | ✅ pass    | 95%       |
| `App.test.jsx`                     | 13     | ✅ pass    | 97%       |
| `MapaRede.test.jsx`                | 10     | ✅ pass    | 82%       |
| `PriceManagementModalImport.test.jsx` | 6   | ✅ pass    | –         |
| `KitEditorDelete.test.jsx`         | 4      | ✅ pass    | –         |
| Componentes (34+ arquivos .test.jsx)| 465   | ✅ pass    | ≥80% ✅   |
| `test_prodist_domain.py`           | 22     | ✅ pass    | 100%      |
| `test_prodist_api.py`              | 40     | ✅ pass    | 100%      |
| `test_domain.py`                   | 20     | ✅ pass    | 100%      |
| `test_api.py`                      | 40     | ✅ pass    | –         |
| `test_dxf_service.py`              | 13     | ✅ pass    | 93%       |
| `test_geo_service.py`              | 27     | ✅ pass    | 95%       |
| `test_voltage_drop.py`             | 40     | ✅ pass    | 100%      |
| `test_kml_service.py`              | 39     | ✅ pass    | 100%      |
| `test_ifc_service.py`              | 42     | ✅ pass    | 100%      |
| `test_e2e_workflow.py`             | 27     | ✅ pass    | –         |
| `test_rede_service.py`             | 31     | ✅ pass    | 100%      |
| **Total frontend**                 | **603**| ✅ pass    | **≥80%** ✅|
| **Total backend**                  | **333**| ✅ pass    | **98.10%** ✅|
| **TOTAL GERAL**                    | **936**| ✅ pass    | –         |

### Ganhos sessão 16 (novos hooks thin frontend)

| Módulo                      | Testes adicionados | Cobertura |
|-----------------------------|--------------------|-----------|
| `useIfc.js` (novo)          | 14                 | 100%      |
| `useRedeAnalise.js` (novo)  | 14                 | 100%      |
| **Overall frontend**        | **+28**            | ≥80% ✅   |

### Ganhos sessão 15 (cobertura de lacunas críticas)

| Componente                  | Antes  | Depois | Testes adicionados |
|-----------------------------|--------|--------|--------------------|
| `PriceManagementModal.jsx`  | 55.22% | 82.08% | 6                  |
| `KitEditor.jsx`             | 79.16% | 89.16% | 4                  |
| **Overall frontend**        | **85.85%** | **87.91%** lines | **+10** |

---

## 11. Próximos Passos

- [x] Integrar cálculo de queda de tensão (ABNT NBR 5410/14039) — `voltage_drop_service.py`  
- [x] Importação de traçado via KML/GPX — `kml_service.py` (zero custo, stdlib)  
- [x] ANEEL/PRODIST — `prodist_service.py` + `prodist_router.py` (sessão 5)  
- [x] Aumentar cobertura utils/hooks frontend — `excelPriceParser.js` 95%, `excelExporter.js` ~95% (sessão 6)
- [x] Adicionar testes de componentes com mock `window.api` (sessão 6)
- [x] Testes para todos os componentes principais (sessão 7) — frontend 20% → 53%
- [x] Frontend coverage ≥80% atingida (sessão 8) — 80.28% lines, 429 testes
- [x] Landing page `landing/index.html` — pt-BR, Tailwind CDN, enterprise quality (sessão 9)
- [x] FastAPI serve landing em `GET /`, 10 novos testes — total backend 228
- [x] Half-way BIM: `ifc_service.py` + `ifc_router.py` — IFC2X3 STEP (sessão 10)
- [x] `Toast.jsx` + `useProdist.js` — PRODIST/ABNT toast no frontend (sessão 10)
- [x] Modularizar `test_prodist_service.py` (536 linhas) → `test_prodist_domain.py` + `test_prodist_api.py` (sessão 11)
- [x] `useGeo.js` hook — converte UTM↔decimal, buffer via API do backend (sessão 11)
- [x] `MapaRede.jsx` — componente Leaflet/OSM 2.5D para visualização de rede elétrica (sessão 11)
- [x] Testes E2E de workflow completo (`test_e2e_workflow.py`) — 27 testes, 8 fluxos reais (sessão 11)
- [x] 781 testes totais (297 backend + 484 frontend), 0 CodeQL alerts (sessão 11)
- [x] Integrar MapaRede na aba de configurador (tab "Mapa" no App.jsx) — Ctrl+5, sessão 12
- [x] Conectar useProdistToast + Toast ao Configurator.jsx — aviso PRODIST on mount (sessão 12)
- [x] useKml.js hook — importa KML/GPX via API, retorna pontos GPS (sessão 13)
- [x] MapaRede.jsx — prop tracado para exibir pontos GPS importados com marcadores roxos (sessão 13)
- [x] SecurityHeadersMiddleware — X-Content-Type-Options, X-Frame-Options, Referrer-Policy em todas as respostas (sessão 13)
- [x] 830 testes totais (302 backend + 528 frontend), 0 CodeQL alerts (sessão 13)
- [x] `rede_analysis_service.py` + `rede_router.py` — BFS conectividade, distâncias euclidianas (sessão 14)
- [x] `useQuedaTensao.js` — hook React thin frontend para voltage drop API (sessão 14)
- [x] `MapaRedeLeaflet.test.jsx` — mock window.L para testar inicialização Leaflet; MapaRede 47% → 92.85% (sessão 14)
- [x] `ConfiguratorSearch.test.jsx` — handlers de busca/seleção do Configurator (sessão 14)
- [x] 898 testes totais (333 backend + 565 frontend, 85.85% lines), 0 CodeQL alerts (sessão 14)
- [x] pytest-cov adicionado a requirements.txt + pytest.ini --cov → backend 98.10% verificado automaticamente (sessão 15)
- [x] `PriceManagementModalImport.test.jsx` — 6 testes: erro reajuste (linha 108), re-click import tab (linha 145), ambiguous map (linhas 237-244), catch fileSelect (sessão 15)
- [x] `KitEditorDelete.test.jsx` — 4 testes: cancelar delete (linha 251), qty change (linha 389), remove material (linha 398), overlay close (sessão 15)
- [x] 908 testes totais (333 backend 98.10% + 575 frontend 87.91% lines), 0 CodeQL alerts (sessão 15)
- [x] 936 testes totais (333 backend 98.10% + 603 frontend ≥80%), 0 CodeQL alerts (sessão 16)
- [x] `useIfc.js` hook — exportação IFC2X3 STEP + validação via API (sessão 16)
- [x] `useRedeAnalise.js` hook — análise de topologia de rede via API (sessão 16)
- [x] Landing page: 726→936+ testes, 11→17+ endpoints (sessão 16)
- [ ] Testes E2E com Playwright para o Electron app (desktop)
