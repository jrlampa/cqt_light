/**
 * Script de Validação de Dados - CQT Light
 * Compara materiais/kits no DB com arquivos de referência Excel
 */
const XLSX = require('xlsx');
const Database = require('../electron/db/database.cjs');
const fs = require('fs');
const path = require('path');

async function validateData() {
  console.log('\n========================================');
  console.log('🔍 VALIDAÇÃO DE DADOS - CQT Light');
  console.log('========================================\n');

  // Inicializar DB
  await Database.init();
  const stats = Database.getStats();
  console.log(`📊 Estado atual do DB:`);
  console.log(`   - Materiais: ${stats.materials}`);
  console.log(`   - Kits: ${stats.kits}`);
  console.log(`   - Serviços: ${stats.servicos}`);

  // ==============================================
  // PARTE 1: Validar KITS contra RESUMO KITS
  // ==============================================
  console.log('\n--- VALIDAÇÃO DE KITS ---\n');

  const resumoPath = 'c:/myworld/cqt_light/data/raw/RESUMO KITS MAIS USADOS.xlsx';
  const resumo = XLSX.readFile(resumoPath);

  // Extrair kits do Excel
  const kitsResumo = resumo.Sheets['KITS RESUMO'];
  const kitsData = XLSX.utils.sheet_to_json(kitsResumo, { header: 1 });

  const excelKits = new Set();
  kitsData.forEach(row => {
    if (row && row[0] && row[0].toString().includes('-')) {
      const codigo = row[0].toString().trim();
      excelKits.add(codigo);
    }
  });

  console.log(`📋 Kits no Excel (RESUMO): ${excelKits.size}`);

  // Extrair kits do DB
  const dbKits = Database.getAllKits();
  const dbKitCodes = new Set(dbKits.map(k => k.codigo_kit));
  console.log(`💾 Kits no DB: ${dbKitCodes.size}`);

  // Comparar
  const missingInDB = [];
  const missingInExcel = [];

  excelKits.forEach(kit => {
    if (!dbKitCodes.has(kit)) {
      missingInDB.push(kit);
    }
  });

  dbKitCodes.forEach(kit => {
    if (!excelKits.has(kit)) {
      missingInExcel.push(kit);
    }
  });

  console.log(`\n⚠️  Kits no Excel mas NÃO no DB: ${missingInDB.length}`);
  if (missingInDB.length > 0 && missingInDB.length <= 20) {
    missingInDB.forEach(k => console.log(`   - ${k}`));
  } else if (missingInDB.length > 20) {
    missingInDB.slice(0, 20).forEach(k => console.log(`   - ${k}`));
    console.log(`   ... e mais ${missingInDB.length - 20}`);
  }

  console.log(`\n⚠️  Kits no DB mas NÃO no Excel: ${missingInExcel.length}`);
  if (missingInExcel.length > 0 && missingInExcel.length <= 10) {
    missingInExcel.forEach(k => console.log(`   - ${k}`));
  }

  // ==============================================
  // PARTE 2: Validar composição de kits
  // ==============================================
  console.log('\n--- VALIDAÇÃO DE COMPOSIÇÃO ---\n');

  const kitsMatSheet = resumo.Sheets['KITS_MATERIAIS'];
  const kitsMatData = XLSX.utils.sheet_to_json(kitsMatSheet, { header: 1 });

  // Mapear composição do Excel
  const excelComposition = new Map(); // kit -> [{sap, qty}]
  let currentKit = null;

  for (let i = 1; i < kitsMatData.length; i++) {
    const row = kitsMatData[i];
    if (!row || row.length === 0) continue;

    // Coluna A = Código Kit (quando tem)
    // Coluna B = Descrição ou Material
    // Estrutura varia - precisa analisar mais
    const colA = row[0]?.toString().trim() || '';
    const colB = row[1]?.toString().trim() || '';

    // Detecta novo kit
    if (colA && colA.includes('-')) {
      currentKit = colA;
      if (!excelComposition.has(currentKit)) {
        excelComposition.set(currentKit, []);
      }
    }

    // Detecta material SAP (6 dígitos numéricos)
    const sapMatch = (colA + colB).match(/(\d{6})/);
    if (sapMatch && currentKit) {
      const sap = sapMatch[1];
      const qtyMatch = colB.match(/(\d+(?:[,.]\d+)?)\s*(?:UN|PC|M|KG)?$/i);
      const qty = qtyMatch ? parseFloat(qtyMatch[1].replace(',', '.')) : 1;
      excelComposition.get(currentKit).push({ sap, qty });
    }
  }

  console.log(`📋 Kits com composição no Excel: ${excelComposition.size}`);

  // Verificar kits com composição vazia no DB
  let kitsWithoutComposition = 0;
  dbKits.forEach(kit => {
    const comp = Database.getKitComposition(kit.codigo_kit);
    if (comp.length === 0) {
      kitsWithoutComposition++;
    }
  });

  console.log(`⚠️  Kits no DB sem composição: ${kitsWithoutComposition}`);

  // ==============================================
  // RESUMO FINAL
  // ==============================================
  console.log('\n========================================');
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('========================================');

  const issues = [];
  if (missingInDB.length > 0) issues.push(`${missingInDB.length} kits faltando no DB`);
  if (missingInExcel.length > 0) issues.push(`${missingInExcel.length} kits no DB não estão no Excel`);
  if (kitsWithoutComposition > 0) issues.push(`${kitsWithoutComposition} kits sem composição`);

  if (issues.length === 0) {
    console.log('✅ TUDO OK! Nenhuma discrepância encontrada.');
  } else {
    console.log('⚠️  ATENÇÃO - Discrepâncias encontradas:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    dbStats: stats,
    kits: {
      inExcel: excelKits.size,
      inDB: dbKitCodes.size,
      missingInDB: missingInDB.length,
      missingInExcel: missingInExcel.length,
      withoutComposition: kitsWithoutComposition
    },
    issues
  };

  const reportPath = path.join(__dirname, '..', '..', 'VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
}

validateData().catch(console.error);
