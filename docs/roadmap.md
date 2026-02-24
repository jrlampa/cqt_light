# 🗺️ Roadmap Estratégico: CQT Light (Zenith Engine)

**Visão Tech Lead: Evolução da Plataforma de Engenharia e Orçamentação**

Este documento detalha as próximas 20 fases de desenvolvimento para transformar o CQT Light de uma ferramenta de orçamentação local para um ecossistema completo de inteligência de engenharia.

---

## ⚡ Fluxo 1: Inteligência & Resiliência (Hardening)

### Fase 1: Hardening & Cobertura Elite (V1.5)

- **Status:** Finalizando
- **Foco:** Atingir 100% de cobertura nos 10 arquivos críticos (Pareto). Estabilização definitiva da suite E2E com testes de caos e resiliência (Monkey Tests).

### Fase 2: Inteligência Semântica de Materiais (NLP)

- **Foco:** Implementação de motor de busca semântica usando Embeddings/Transformers para mapear descrições não padronizadas para códigos SAP com >95% de precisão.

### Fase 3: Auditoria Automatizada de DXF (DXF-IQ)

- **Foco:** Motor Python avançado para análise geométrica e de camadas em arquivos DXF, garantindo conformidade com normas técnicas antes da exportação.

---

## 🏗️ Fluxo 2: Digital Twin & BIM (Interoperabilidade)

### Fase 4: Integração OpenBIM Nativa (IFC 4.0)

- **Foco:** Exportação direta de estruturas configuradas para o padrão IFC usando ponte IfcOpenShell, permitindo integração direta com Revit/Navisworks.

### Fase 5: Orquestração Multi-GIS & WMS

- **Foco:** Camadas dinâmicas no mapa 2.5D com suporte a servidores WMS/WFS (IBGE, Prefeituras, Áreas de Preservação) para análise de impacto ambiental.

### Fase 6: Simulação de Stress Estrutural Real-time

- **Foco:** Visualização de mapas de calor (Heatmaps) de tensão mecânica em postes e condutores durante a configuração no mapa.

---

## ☁️ Fluxo 3: Colaboração & Cloud (Sincronização)

### Fase 7: Sincronização Cloud Offline-First

- **Foco:** Motor de sincronização para SQLite local com cofre de projetos centralizado, focando em resolução de conflitos determinística.

### Fase 8: Colaboração Live (Zenith Sync)

- **Foco:** Edição simultânea de projetos com cursores vivos e bloqueio granular de estruturas, permitindo equipes trabalharem no mesmo trecho de rede.

### Fase 9: Enterprise RBAC & Trilhas de Auditoria

- **Foco:** Controle de acesso baseado em funções (Role-Based Access Control) e log imutável de alterações de engenharia.

---

## 🤖 Fluxo 4: Automação Avançada (AI Ops)

### Fase 10: Digitalização de Mapas Legados (Computer Vision)

- **Foco:** Upload de digitalizações de projetos antigos para detecção automatizada de ativos (postes, chaves, transformadores) e população do configurador.

### Fase 11: Otimização Multi-Critério de BOM/MO

- **Foco:** Algoritmo que sugere trocas de materiais/kits baseadas na flutuação de preços em tempo real vs. esforço técnico.

### Fase 12: Análise de Sensibilidade Climática

- **Foco:** Simulação de resistência da rede contra eventos climáticos extremos baseada em dados históricos locais (Vento, Gelo, Descargas).

---

## 📱 Fluxo 5: Mobilidade & Campo (Zenith Field)

### Fase 13: Visualizador Field AR (Realidade Aumentada)

- **Foco:** Exportação de coordenadas e modelos para visualização AR em tablets/celulares no local da obra (USDZ/GLB).

### Fase 14: Mobile Extension (Thin Client)

- **Foco:** App mobile leve para coleta de dados de campo e apontamento de execução sincronizado com o Electron principal.

### Fase 15: Integração com Supply Chain Direta

- **Foco:** Conexão via API com ERPs e Marketplaces de materiais para prazos de entrega reais e disponibilidade de estoque.

---

## 🛡️ Fluxo 6: Segurança & Governança (Enterprise Ready)

### Fase 16: Editor de Relatórios Dinâmicos (Drag-and-Drop)

- **Foco:** UI para criação de templates personalizados de memoriais descritivos e orçamentos em PDF/Excel.

### Fase 17: Hardening de Segurança V3.0

- **Foco:** Ofuscação de binários de nível enterprise e criptografia de ponta a ponta para dados de projetos sensíveis.

### Fase 18: Analytics Preditivo de Ativos

- **Foco:** Painéis de BI com previsão de falha de materiais baseada em metadados de ciclo de vida e exposição ambiental.

### Fase 19: SDK Zenith para Plugins

- **Foco:** Arquitetura de plugins para que empresas de utilidade possam injetar suas próprias regras de engenharia no core.

---

## 🚀 Fase Final: Estabilização de Ciclo Longo

### Fase 20: Release LTS & Pipeline de Update Automatizado

- **Foco:** Certificação de estabilidade 99.9%, instaladores silent com updates delta e suporte a suporte técnico automatizado (RAG integrado).

---
> [!IMPORTANT]
> A ordem das fases pode ser reajustada conforme prioridades de negócio, mantendo o compromisso "Zero Custo" em APIs externas.
