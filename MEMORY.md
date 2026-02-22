# CQT Light - RAG Working Memory

## 🧐 Projeto: CQT Light V3 (Enterprise)

**Objetivo**: Sistema de Cubagem, Quantitativo e Técnica para projetos de rede elétrica (RDA).
**Arquitetura**:

- **Backend (Scripts)**: Python ETL (Extração de dados de planilhas complexas).
- **Backend (App)**: Electron / Node.js (Serviços de banco de dados SQLite).
- **Frontend**: React + Tailwind CSS (Interface Premium em pt-BR).

## 🛠️ Stack Tecnológica

- **Linguagens**: JavaScript (Node/React), Python (ETL Scripts).
- **Banco de Dados**: SQLite3 (better-sqlite3).
- **UI/UX**: Tailwind CSS, Lucide React, Glassmorphism.
- **Standards**: ABNT/NBR, Half-way BIM.

## 🧠 Contexto de Engenharia

- **Kits**: Agrupamentos de materiais para montagens específicas (ex: Postes, Ferragens).
- **Abstração**: O sistema deve resolver sufixos contextuais (ex: sufixo de condutor baseado no tipo de poste).
- **BIM**: Exportação de dados que permitam integração parcial com fluxos BIM (metadados estruturados).

## 🚀 Marcos de Evolução (SotA)

1. **Refatoração SRP**: Concluída (DatabaseService, IpcController).
2. **Dashboard**: Implementado (Visão geral de custos e alertas).
3. **Importação**: Implementado (Excel/CSV via UI).
4. **Próximos Passos**: Dockerização completa, Testes E2E, Exportação ABNT.

## ⚠️ Regras de Ouro

- Zero custo (APIs públicas).
- Interface 100% pt-BR.
- Thin Frontend / Smart Backend.
- Modularidade estrita.
- Segurança e Sanitização de dados.
