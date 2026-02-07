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
-- 7. empresas (Multi-Company Support)
CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  contrato TEXT,
  regional TEXT,
  ativa BOOLEAN DEFAULT 1,
  data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_empresas_nome ON empresas(nome);
-- 8. precos_empresa (Company-Specific Prices)
CREATE TABLE IF NOT EXISTS precos_empresa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  sap TEXT NOT NULL,
  preco_unitario REAL NOT NULL DEFAULT 0,
  data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  origem TEXT DEFAULT 'manual',
  -- 'importacao', 'manual', 'reajuste', 'sap'
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (sap) REFERENCES materiais(sap) ON DELETE CASCADE,
  UNIQUE(empresa_id, sap)
);
CREATE INDEX IF NOT EXISTS idx_precos_empresa_id ON precos_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_precos_sap ON precos_empresa(sap);
-- 9. historico_precos (Price Change History)
CREATE TABLE IF NOT EXISTS historico_precos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER,
  sap TEXT,
  preco_anterior REAL,
  preco_novo REAL,
  tipo_alteracao TEXT,
  -- 'importacao', 'reajuste_percentual', 'manual', 'inicial'
  percentual REAL,
  observacao TEXT,
  data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE
  SET NULL
);
CREATE INDEX IF NOT EXISTS idx_historico_empresa ON historico_precos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_precos(data_alteracao DESC);
-- 10. configuracao (App Configuration)
CREATE TABLE IF NOT EXISTS configuracao (chave TEXT PRIMARY KEY, valor TEXT);
-- 11. sufixos_contextuais (Dynamic Kit Material Resolution)
-- Maps partial codes (F-10/, M1/) to complete codes based on pole/conductor context
CREATE TABLE IF NOT EXISTS sufixos_contextuais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefixo TEXT NOT NULL,
  -- 'F-10/', 'M1/', 'TR/', 'O-25/'
  tipo_contexto TEXT NOT NULL,
  -- 'poste', 'condutor', 'estrutura'
  valor_contexto TEXT NOT NULL,
  -- '11600B', 'CAA 1/0', etc
  sufixo TEXT NOT NULL,
  -- '06', '1/0', etc
  codigo_completo TEXT,
  -- Cached: 'F-10/06' (optional)
  UNIQUE(prefixo, tipo_contexto, valor_contexto)
);
CREATE INDEX IF NOT EXISTS idx_sufixos_prefixo ON sufixos_contextuais(prefixo);
CREATE INDEX IF NOT EXISTS idx_sufixos_contexto ON sufixos_contextuais(tipo_contexto, valor_contexto);
-- 12. templates_kit_manual (Manual Kit Templates from PADRÕES)
-- Stores entire kit template including partial codes
CREATE TABLE IF NOT EXISTS templates_kit_manual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_template TEXT NOT NULL UNIQUE,
  -- 'CE3T', 'CE2JPR', etc
  kit_base TEXT,
  -- Base SAP kit code (13CE3T)
  materiais_json TEXT NOT NULL,
  -- JSON array: [{codigo, quantidade, tipo}]
  observacao TEXT
);
CREATE INDEX IF NOT EXISTS idx_templates_manual_nome ON templates_kit_manual(nome_template);