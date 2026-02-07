const db = require('../electron/db/database.cjs');

async function check() {
  await db.init();

  const zeroMaterials = await db.all("SELECT count(*) as count FROM materiais WHERE preco_unitario = 0 OR preco_unitario IS NULL");
  const totalMaterials = await db.all("SELECT count(*) as count FROM materiais");

  const zeroKits = await db.all("SELECT count(*) as count FROM kits WHERE custo_servico = 0 OR custo_servico IS NULL");
  const totalKits = await db.all("SELECT count(*) as count FROM kits");

  console.log(`Materials: ${zeroMaterials[0].count} / ${totalMaterials[0].count} with zero price.`);
  console.log(`Kits: ${zeroKits[0].count} / ${totalKits[0].count} with zero service cost.`);

  // Sample some zero price materials
  const sample = await db.all("SELECT sap, descricao FROM materiais WHERE preco_unitario = 0 LIMIT 10");
  console.log('\nSample Zero Price Materials:');
  console.table(sample);
}

check();
