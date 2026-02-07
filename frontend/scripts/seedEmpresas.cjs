/**
 * Seed script to create initial companies in the database
 * Run this once to populate empresa table
 */

const db = require('../electron/db/database.cjs');

async function seedEmpresas() {
  await db.init();

  const empresas = [
    { nome: 'DÍNAMO', contrato: 'CT-2024-001', regional: 'Sul' },
    { nome: 'PARTNERSHIP', contrato: 'CT-2024-002', regional: 'Sudeste' },
    { nome: 'ENERGISA', contrato: 'CT-2024-003', regional: 'Centro-Oeste' },
    { nome: 'CEMIG', contrato: 'CT-2024-004', regional: 'Sudeste' },
  ];

  console.log('🌱 Seeding empresas...\n');

  for (const emp of empresas) {
    try {
      const id = db.createEmpresa(emp.nome, emp.contrato, emp.regional);
      console.log(`✅ Created: ${emp.nome} (ID: ${id})`);
    } catch (error) {
      console.error(`❌ Error creating ${emp.nome}:`, error.message);
    }
  }

  // Set DÍNAMO as active company
  const allEmpresas = db.getAllEmpresas();
  if (allEmpresas.length > 0) {
    db.setEmpresaAtiva(allEmpresas[0].id);
    console.log(`\n🎯 Set ${allEmpresas[0].nome} as active company`);
  }

  console.log('\n✨ Seed complete!');
  console.log(`Total companies: ${allEmpresas.length}`);
}

seedEmpresas().catch(console.error);
