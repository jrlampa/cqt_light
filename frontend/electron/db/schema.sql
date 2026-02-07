-- CQT Light V3 - Keyboard-First Schema
-- Simplified: 4 tables with direct kit→service linking
-- 1. materiais (SAP catalog)
CREATE TABLE IF NOT EXISTS materiais (
  sap TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  preco_unitario REAL DEFAULT 0
);
-- 2. servicos_cm (Custo Modular reference)
CREATE TABLE IF NOT EXISTS servicos_cm (
  codigo TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  preco_bruto REAL DEFAULT 0
);
-- 3. kits (with direct service code link)
CREATE TABLE IF NOT EXISTS kits (
  codigo_kit TEXT PRIMARY KEY,
  descricao_kit TEXT NOT NULL,
  codigo_servico TEXT,
  -- Direct link to servicos_cm
  custo_servico REAL DEFAULT 0 -- Cached price for fast queries
);
-- 4. kit_composicao (kit → materials)
CREATE TABLE IF NOT EXISTS kit_composicao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_kit TEXT NOT NULL,
  sap TEXT NOT NULL,
  quantidade REAL DEFAULT 1,
  FOREIGN KEY (codigo_kit) REFERENCES kits(codigo_kit) ON DELETE CASCADE,
  FOREIGN KEY (sap) REFERENCES materiais(sap) ON DELETE CASCADE,
  UNIQUE(codigo_kit, sap)
);
-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_materiais_sap ON materiais(sap);
CREATE INDEX IF NOT EXISTS idx_materiais_descricao ON materiais(descricao);
CREATE INDEX IF NOT EXISTS idx_kits_codigo ON kits(codigo_kit);
CREATE INDEX IF NOT EXISTS idx_kits_descricao ON kits(descricao_kit);
CREATE INDEX IF NOT EXISTS idx_kits_servico ON kits(codigo_servico);
CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos_cm(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_descricao ON servicos_cm(descricao);
CREATE INDEX IF NOT EXISTS idx_kit_composicao_kit ON kit_composicao(codigo_kit);
CREATE INDEX IF NOT EXISTS idx_kit_composicao_sap ON kit_composicao(sap);
-- 5. orcamentos (Budget History)
CREATE TABLE IF NOT EXISTS orcamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  total REAL DEFAULT 0,
  dados_json TEXT NOT NULL -- Full state snapshot
);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(data_criacao DESC);
-- 6. templates (Project Templates)
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  dados_json TEXT NOT NULL,
  -- Configuration snapshot
  is_default BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_templates_nome ON templates(nome);