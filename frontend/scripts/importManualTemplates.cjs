/**
 * importManualTemplates.cjs
 * Imports manual kit templates from "PADRÕES MT, BT, RURAL" sheet in "PLAN MATERIAL LIGHT 2019.xls"
 */
const XLSX = require('xlsx');
const Database = require('../electron/db/database.cjs');
const path = require('path');

const FILE_PATH = path.join('c:/myworld/cqt_light/data/raw/PLAN MATERIAL LIGHT 2019.xls');
const SHEET_NAME = 'PADRÕES MT, BT, RURAL';

// Columns (0-indexed) based on analysis:
// Col 1 (B): Code (Kit Base or Material)
// Col 15 (P): Description
// Col 29 (AD): Quantity

const COL_CODE = 1;
const COL_DESC = 15;
const COL_QTY = 29;

async function main() {
  await Database.init();
  console.log(`Reading ${FILE_PATH}...\n`);

  const wb = XLSX.readFile(FILE_PATH);
  const sheet = wb.Sheets[SHEET_NAME];

  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found!`);
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows: ${data.length}`);

  let currentBlock = [];
  let templatesCount = 0;

  function processBlock(block) {
    if (block.length === 0) return;

    // First item is the Template Header (and usually the Base Kit)
    const headerRow = block[0];
    const templateName = String(headerRow.code).trim();

    // Check if it's a valid kit in DB (optional, but good for metadata)
    // We store it as kit_base anyway.
    const kitBase = templateName;

    // Remaining items are materials
    const materials = [];

    // START FROM INDEX 1 (Second item), assuming first item is just the header/base kit
    // UNLESS the first item has a quantity > 1? 
    // In the example, 13CE3T had no quantity visible in my scan (undefined), 
    // but looking at row 37 (13CE3TA), it had quantity 1.
    // If it has quantity, is it an item of itself? 
    // Logic: The template REPLACES the base kit selection. 
    // So "13CE3T" template means: "Select 13CE3T kit + add these extra materials".
    // So we don't need to add 13CE3T to the materials list if it is the base kit.

    for (let i = 1; i < block.length; i++) {
      const row = block[i];
      if (row.code) {
        let qty = 1;
        if (row.qty) {
          // Parse quantity, handling commas or strings
          if (typeof row.qty === 'number') qty = row.qty;
          else {
            const parsed = parseFloat(String(row.qty).replace(',', '.'));
            if (!isNaN(parsed)) qty = parsed;
          }
        }

        materials.push({
          codigo: String(row.code).trim(),
          quantidade: qty,
          descricao: row.desc ? String(row.desc).trim() : ''
        });
      }
    }

    // Save to DB
    if (materials.length > 0) {
      // console.log(`Saving template: ${templateName} (Base: ${kitBase}) with ${materials.length} extras`);
      Database.saveTemplateManual(templateName, kitBase, materials, `Imported from ${SHEET_NAME}`);
      templatesCount++;
    }
  }

  // Iterate rows
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check if row has code
    const code = row ? row[COL_CODE] : null;

    if (code) {
      // It has data, add to current block
      currentBlock.push({
        rowIdx: i,
        code: code,
        desc: row[COL_DESC],
        qty: row[COL_QTY]
      });
    } else {
      // Empty row (or no code), verify if it ends a block
      if (currentBlock.length > 0) {
        processBlock(currentBlock);
        currentBlock = [];
      }
    }
  }

  // Process last block if exists
  if (currentBlock.length > 0) {
    processBlock(currentBlock);
  }

  console.log(`\n✓ Imported ${templatesCount} manual kit templates.`);

  // Verify a sample
  const sample = Database.getTemplateManual('13CE3T');
  if (sample) {
    console.log('\nSample "13CE3T":');
    console.log('Base:', sample.kit_base);
    console.log('Materials:', JSON.stringify(sample.materiais, null, 2));
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
