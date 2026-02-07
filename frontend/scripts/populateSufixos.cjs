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

async function main() {
  await Database.init();
  console.log('Populating sufixos_contextuais...\n');

  // Get all poste materials to map
  const postes = Database.searchMaterials('POSTE').filter(m =>
    m.sap && (m.sap.includes('B') || m.descricao?.includes('CIRCULAR'))
  );

  console.log(`Found ${postes.length} poste materials`);

  let mapped = 0;
  for (const poste of postes) {
    const diam = extractDiameterFromPole(poste.sap);
    if (diam) {
      const sufixo = getCintaSufixo(diam);
      if (sufixo) {
        Database.upsertSufixo('F-10/', 'poste', poste.sap, sufixo);
        mapped++;
        if (mapped <= 10) {
          console.log(`  ${poste.sap} (Ø${diam}mm) → F-10/${sufixo}`);
        }
      }
    }
  }

  // Also add some common pole patterns manually
  const commonPoles = [
    { code: '9100B', diam: 100 },
    { code: '10150B', diam: 150 },
    { code: '11600B', diam: 200 },
    { code: '11700B', diam: 200 },
    { code: '12600B', diam: 200 },
    { code: '13600B', diam: 200 },
    { code: '9200B', diam: 200 },
    { code: '10200B', diam: 200 },
    { code: '11200B', diam: 200 },
    { code: '12200B', diam: 200 },
  ];

  for (const pole of commonPoles) {
    const sufixo = getCintaSufixo(pole.diam);
    if (sufixo) {
      Database.upsertSufixo('F-10/', 'poste', pole.code, sufixo);
    }
  }

  console.log(`\n✓ Mapped ${mapped} poste codes to F-10/ sufixos`);

  // Show sample of what's in the table
  const samples = Database.getSufixosByPrefixo('F-10/');
  console.log(`\nTotal F-10/ entries: ${samples.length}`);
  console.log('\nSample entries:');
  samples.slice(0, 10).forEach(s => {
    console.log(`  ${s.valor_contexto} → ${s.codigo_completo}`);
  });

  console.log('\n✓ Population complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
