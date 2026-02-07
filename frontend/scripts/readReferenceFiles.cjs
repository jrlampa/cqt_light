const XLSX = require('xlsx');
const fs = require('fs');

// ========================================
// ANÁLISE: PLAN MATERIAL LIGHT 2019
// ========================================

const planPath = 'c:/myworld/cqt_light/data/raw/PLAN MATERIAL LIGHT 2019.xls';
const workbook = XLSX.readFile(planPath);

let output = [];
output.push('==============================================================================');
output.push('📘 ANÁLISE COMPLETA: PLAN MATERIAL LIGHT 2019.xls');
output.push('==============================================================================\n');

output.push(`Total de Abas: ${workbook.SheetNames.length}`);
output.push(`Nomes das Abas: \n  ${workbook.SheetNames.join('\n  ')}`);
output.push('\n');

// Analisar cada aba
workbook.SheetNames.forEach((sheetName, idx) => {
  const ws = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  output.push('='.repeat(80));
  output.push(`ABA ${idx + 1}: "${sheetName}" (${data.length} linhas)`);
  output.push('='.repeat(80));

  // Mostrar primeiras 30 linhas com conteúdo
  let shown = 0;
  for (let i = 0; i < data.length && shown < 30; i++) {
    const row = data[i] || [];
    const cells = row.filter(c => c !== null && c !== undefined && c !== '');
    if (cells.length > 0) {
      const formatted = cells.slice(0, 6).map(c => String(c).substring(0, 30)).join(' | ');
      output.push(`L${i + 1}: ${formatted}`);
      shown++;
    }
  }

  output.push(`\nTotal linhas nesta aba: ${data.length}`);
  output.push('\n');
});

// Escrever arquivo
const outputPath = 'c:/myworld/cqt_light/ANALYSIS_PLAN_MATERIAL_LIGHT_2019.txt';
fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
console.log(`✅ Análise salva em: ${outputPath}`);
console.log('\n' + output.slice(0, 100).join('\n'));
