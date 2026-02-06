-- Tabela de Materiais (Baseado no SAP)
CREATE TABLE IF NOT EXISTS materiais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_sap TEXT UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT
);
-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS contratos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_empresa TEXT NOT NULL,
  regional TEXT NOT NULL,
  -- Ex: 'LESTE', 'OESTE'
  numero_contrato TEXT NOT NULL UNIQUE
);
-- Tabela de Custos Modulares (Preços de serviço por contrato)
CREATE TABLE IF NOT EXISTS custos_modulares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contrato_id INTEGER NOT NULL,
  codigo_servico TEXT NOT NULL,
  descricao_servico TEXT,
  unidade TEXT,
  preco_bruto REAL NOT NULL,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
  UNIQUE(contrato_id, codigo_servico)
);
-- Tabela de Configuração dos Kits (Materiais por Estrutura)
CREATE TABLE IF NOT EXISTS kits_composicao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_kit TEXT NOT NULL,
  -- Ex: '13N1', 'CE4'
  codigo_sap_material TEXT NOT NULL,
  -- Link com materiais via SAP
  quantidade REAL NOT NULL,
  FOREIGN KEY (codigo_sap_material) REFERENCES materiais(codigo_sap) ON DELETE CASCADE
);
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kits_codigo ON kits_composicao(codigo_kit);
CREATE INDEX IF NOT EXISTS idx_custos_contrato ON custos_modulares(contrato_id);