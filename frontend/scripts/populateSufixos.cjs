/**
 * populateSufixos.cjs
 * Seeds the sufixos_contextuais table with F-10 (cinta) mappings for pole diameters
 */
const Database = require('../electron/db/database.cjs');

// F-10/XX → Cinta para poste circular de XX0 mm
// Poste code pattern: [altura]00[diametro]B → e.g., 11600B = 11m altura, Ø200mm
const CINTA_MAPPING = {
  // Sufixo → Diâmetro do poste em mm
  '02': 90,   // Poste Ø90mm (9B)
  '03': 120,  // Poste Ø120mm (12B)
  '04': 140,  // Poste Ø140mm (14B)
  '05': 170,  // Poste Ø170mm (17B)
  '06': 200,  // Poste Ø200mm (20B)
  '07': 230,  // Poste Ø230mm (23B)
  '08': 260,  // Poste Ø260mm (26B)
  '09': 280,  // Poste Ø280mm (28B)
  '10': 300,  // Poste Ø300mm (30B)
};

// Common pole codes and their diameters based on the last 2-3 digits before 'B'
// Pattern: AAADDDB where AAA=height*100, DDD=diameter code, B=concreto
function extractDiameterFromPole(poleCode) {
  // Match patterns like: 11600B, 9100B, 10150B, etc
  const match = poleCode.match(/(\d+)(\d{2,3})B$/i);
  if (!match) return null;

  const diamCode = match[2]; // Last 2-3 digits before B

  // Map diameter codes to actual mm
  const diamMap = {
    '00': 90, '01': 100, '02': 110, '05': 90,
    '09': 90, '12': 120, '14': 140, '15': 150,
    '17': 170, '20': 200, '23': 230, '26': 260,
    '28': 280, '30': 300,
    '100': 100, '120': 120, '140': 140, '150': 150,
    '170': 170, '200': 200, '230': 230, '260': 260,
    '280': 280, '300': 300
  };

  return diamMap[diamCode] || parseInt(diamCode);
}

// Find the correct cinta suffix for a diameter
function getCintaSufixo(diameterMm) {
  for (const [sufixo, diam] of Object.entries(CINTA_MAPPING)) {
    if (diam === diameterMm || Math.abs(diam - diameterMm) <= 10) {
      return sufixo;
    }
  }
  return null;
}

// M1/ Mapping (Conductors)
// Maps internal frontend ID -> Suffix
const CONDUTOR_MAPPING = {
  // Convencional
  'cab_21_caa': '4',       // M1/4 (4 AWG)
  'cab_53_caa': '1/0',     // M1/1/0 (1/0 AWG)
  'cab_201_ca': '397',     // M1/397 (397 MCM)

  // Compacta
  'cab_53_spacer': '1/0SI', // M1/1/0SI (53mm Spacer)
  'cab_185_spacer': '120',  // M1/120 (185mm Spacer uses 120 alça)
};

async function main() {
  await Database.init();
  console.log('Populating sufixos_contextuais...\n');

  // 1. F-10/ (Poste)
  const postes = Database.searchMaterials('POSTE').filter(m =>
    m.sap && (m.sap.includes('B') || m.descricao?.includes('CIRCULAR'))
  );

  console.log(`Found ${postes.length} poste materials for F-10/ check`);

  let mappedF10 = 0;
  for (const poste of postes) {
    const diam = extractDiameterFromPole(poste.sap);
    if (diam) {
      const sufixo = getCintaSufixo(diam);
      if (sufixo) {
        Database.upsertSufixo('F-10/', 'poste', poste.sap, sufixo);
        mappedF10++;
      }
    }
  }
  console.log(`✓ Mapped ${mappedF10} poste codes to F-10/ sufixos`);

  // 2. M1/ (Condutor)
  console.log('\nMapping M1/ suffixes for conductors...');
  let mappedM1 = 0;
  for (const [condutorId, sufixo] of Object.entries(CONDUTOR_MAPPING)) {
    // Validate if M1/ + sufixo exists in DB (optional validation)
    // const fullCode = 'M1/' + sufixo;
    // const exists = Database.getMaterial(fullCode); 
    // if (!exists) console.warn(`Warning: ${fullCode} not found in materials!`);

    Database.upsertSufixo('M1/', 'condutor', condutorId, sufixo);
    console.log(`  ${condutorId} → M1/${sufixo}`);
    mappedM1++;
  }
  console.log(`✓ Mapped ${mappedM1} conductor codes to M1/ sufixos`);

  // Show sample of what's in the table
  const samplesF10 = Database.getSufixosByPrefixo('F-10/');
  const samplesM1 = Database.getSufixosByPrefixo('M1/');

  console.log(`\nTotal entries: ${samplesF10.length} (F-10/), ${samplesM1.length} (M1/)`);

  // 3. TR/ (Hastes - Ground Rods)
  // Context: Usually 'estrutura' or default. Let's add generic options for now.
  // TR/2400 -> Haste 2400mm
  // TR/3000 -> Haste 3000mm
  console.log('\nMapping TR/ suffixes...');
  Database.upsertSufixo('TR/', 'estrutura', 'default', '2400'); // Default
  Database.upsertSufixo('TR/', 'estrutura', 'default', '3000');
  // Add specific context if needed later. For now, user sees both if we query by prefix.
  // Actually KitResolutionModal filters by match?
  // It fetches ALL suffixes and filters by prefix?
  // "const matches = allSufixos.filter(s => s.prefixo === mat.codigo);"
  // Yes. It doesn't filter by context yet in the UI dropdown (it shows label with context).
  // So adding them is enough.
  console.log('✓ Mapped TR/ suffixes');

  // 4. O-25/ (Olhal)
  // O-25/16 -> Olhal 16mm
  console.log('\nMapping O-25/ suffixes...');
  Database.upsertSufixo('O-25/', 'estrutura', 'default', '16');
  console.log('✓ Mapped O-25/ suffixes');

  console.log('✓ Mapped O-25/ suffixes');

  // 5. F-34T/ (Parafuso Terminal)
  // F-34T/1 -> Parafuso Terminal C/CAB
  // F-34T/2 -> Parafuso Terminal 556 MCM
  console.log('\nMapping F-34T/ suffixes...');
  Database.upsertSufixo('F-34T/', 'Parafuso', 'C/CAB', '1');
  Database.upsertSufixo('F-34T/', 'Parafuso', '556 MCM', '2');
  console.log('✓ Mapped F-34T/ suffixes');

  // 6. 0-80/ (Zero-80) -> Alias for O-80/ (Letter O) - Emenda Reta
  // Needs manual insert to override codigo_completo to O-80
  console.log('\nMapping 0-80/ suffixes (Aliased to O-80/)...');

  const o80_mappings = [
    { s: '15', desc: '240AL/185AL' },
    { s: '16', desc: '240CU/185AL' },
    { s: '17', desc: '185/120 AL' },
    { s: '18', desc: '50/35 AL' },
    { s: '185', desc: '12/20' }
  ];

  for (const m of o80_mappings) {
    const aliasPrefix = '0-80/';
    const realCode = `O-80/${m.s}`; // The code that exists in Materials table

    // Direct run to allow custom codigo_completo
    Database.run(`
      INSERT INTO sufixos_contextuais (prefixo, tipo_contexto, valor_contexto, sufixo, codigo_completo)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(prefixo, tipo_contexto, valor_contexto) DO UPDATE SET
        sufixo = excluded.sufixo,
        codigo_completo = excluded.codigo_completo
    `, [aliasPrefix, 'Emenda', m.desc, m.s, realCode]);
  }
  console.log('✓ Mapped 0-80/ suffixes');

  // 7. C10/ (Cabos CA)
  console.log('\nMapping C10/ suffixes (Cabos CA)...');
  Database.upsertSufixo('C10/', 'Cabo', '397 MCM BT', '397BT'); // C10397BT
  Database.upsertSufixo('C10/', 'Cabo', '1/0 AWG TR', '1/0TR'); // C101/0TR
  Database.upsertSufixo('C10/', 'Cabo', '400 MCM TR', '400TR'); // C10400TR
  console.log('✓ Mapped C10/ suffixes');

  // 8. O-12/ (Conector Ampact)
  console.log('\nMapping O-12/ suffixes (Ampact)...');
  const o12_map = [
    { s: '01', d: '556-556' }, { s: '02', d: '556-397' },
    { s: '03', d: '397-397' }, { s: '04', d: '397-250' },
    { s: '05', d: '397-1/0' }
  ];
  o12_map.forEach(m => Database.upsertSufixo('O-12/', 'Ampact', m.d, m.s));
  console.log('✓ Mapped O-12/ suffixes');

  // 9. O-13/ (Conector Terminal Compressão)
  console.log('\nMapping O-13/ suffixes (Terminal)...');
  Database.upsertSufixo('O-13/', 'Terminal', '25mm', '25');
  Database.upsertSufixo('O-13/', 'Terminal', '35mm', '35');
  console.log('✓ Mapped O-13/ suffixes');

  // 10. CG-13/ (Chaves e Grampos - Mapping to CG13 and CG-34)
  console.log('\nMapping CG-13/ suffixes...');
  // Map suffix '13' to Code 'CG13'
  // Map suffix '34' to Code 'CG-34'
  Database.run(`INSERT INTO sufixos_contextuais (prefixo, tipo_contexto, valor_contexto, sufixo, codigo_completo) VALUES (?, ?, ?, ?, ?) ON CONFLICT(prefixo, tipo_contexto, valor_contexto) DO UPDATE SET sufixo=excluded.sufixo, codigo_completo=excluded.codigo_completo`, ['CG-13/', 'Chave', '13kV', '13', 'CG13']);
  Database.run(`INSERT INTO sufixos_contextuais (prefixo, tipo_contexto, valor_contexto, sufixo, codigo_completo) VALUES (?, ?, ?, ?, ?) ON CONFLICT(prefixo, tipo_contexto, valor_contexto) DO UPDATE SET sufixo=excluded.sufixo, codigo_completo=excluded.codigo_completo`, ['CG-13/', 'Chave', '34.5kV', '34', 'CG-34']);
  console.log('✓ Mapped CG-13/ suffixes');

  // 11. A-46/ (Capuz)
  console.log('\nMapping A-46/ suffixes...');
  Database.upsertSufixo('A-46/', 'Capuz', '400MCM/185', '1');
  console.log('✓ Mapped A-46/ suffixes');

  // 12. O-80/ (Real O-80 codes) - The correct prefix
  console.log('\nMapping O-80/ suffixes (Real code)...');
  // Reuse o80_mappings from step 6 
  for (const m of o80_mappings) {
    Database.upsertSufixo('O-80/', 'Emenda', m.desc, m.s);
  }
  console.log('✓ Mapped O-80/ suffixes');

  console.log('\n✓ Population complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
