-- CQT Light V2 - Database Schema
-- 5 tables with proper junction tables for materials, kits, and labor
-- 1. Materials (SAP Catalog)
CREATE TABLE IF NOT EXISTS materiais (
  sap TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  preco_unitario REAL DEFAULT 0
);
-- 2. Kits (Structure Types)
CREATE TABLE IF NOT EXISTS kits (
  codigo_kit TEXT PRIMARY KEY,
  descricao_kit TEXT NOT NULL
);
-- 3. Kit Composition (Junction: Kit <-> Material)
CREATE TABLE IF NOT EXISTS kit_composicao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_kit TEXT NOT NULL,
  sap TEXT NOT NULL,
  quantidade REAL DEFAULT 1,
  FOREIGN KEY (codigo_kit) REFERENCES kits(codigo_kit) ON DELETE CASCADE,
  FOREIGN KEY (sap) REFERENCES materiais(sap) ON DELETE CASCADE,
  UNIQUE(codigo_kit, sap)
);
-- 4. Labor Costs (Mão de Obra)
CREATE TABLE IF NOT EXISTS mao_de_obra (
  codigo_mo TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  preco_bruto REAL DEFAULT 0
);
-- 5. Kit Services (Junction: Kit <-> Labor)
CREATE TABLE IF NOT EXISTS kit_servicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_kit TEXT NOT NULL,
  codigo_mo TEXT NOT NULL,
  FOREIGN KEY (codigo_kit) REFERENCES kits(codigo_kit) ON DELETE CASCADE,
  FOREIGN KEY (codigo_mo) REFERENCES mao_de_obra(codigo_mo) ON DELETE CASCADE,
  UNIQUE(codigo_kit, codigo_mo)
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kit_composicao_kit ON kit_composicao(codigo_kit);
CREATE INDEX IF NOT EXISTS idx_kit_composicao_sap ON kit_composicao(sap);
CREATE INDEX IF NOT EXISTS idx_kit_servicos_kit ON kit_servicos(codigo_kit);
CREATE INDEX IF NOT EXISTS idx_kit_servicos_mo ON kit_servicos(codigo_mo);