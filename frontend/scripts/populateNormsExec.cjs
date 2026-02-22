const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../cqt_light.db');
const MINING_RESULTS_PATH = path.join(__dirname, '../../data/standards/mining_results.json');

function populateNorms() {
  if (!fs.existsSync(MINING_RESULTS_PATH)) {
    console.error('Mining results not found:', MINING_RESULTS_PATH);
    return;
  }

  const data = JSON.parse(fs.readFileSync(MINING_RESULTS_PATH, 'utf-8'));
  const db = new Database(DB_PATH);

  console.log('Using DB:', DB_PATH);

  // Clean current references
  db.prepare('DELETE FROM normas_referencia').run();

  const insert = db.prepare(`
        INSERT INTO normas_referencia (sap, fonte, pagina, contexto)
        VALUES (?, ?, ?, ?)
    `);

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.sap, item.source, item.page, item.context);
    }
  });

  transaction(data.details);

  console.log(`Successfully populated ${data.details.length} normative references.`);
}

populateNorms();
