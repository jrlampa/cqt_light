/**
 * CQT Light V3 - UI/UX Test Checklist
 * Run this in browser console at http://localhost:5174
 * 
 * Copy and paste this entire script into Developer Tools Console
 */

(async function runUITests() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`${passed ? '✅' : '❌'} ${name}${details ? ': ' + details : ''}`);
  };

  console.log('\n🧪 CQT Light V3 - UI/UX Test Suite\n' + '='.repeat(50));

  // Test 1: Check main elements exist
  try {
    const header = document.querySelector('h2');
    log('T1: Header exists', header && header.textContent.includes('Configurador'));
  } catch (e) { log('T1: Header exists', false, e.message); }

  // Test 2: Poste search input exists
  try {
    const posteInput = document.querySelector('input[placeholder*="P11"]');
    log('T2: Poste search input exists', !!posteInput);
  } catch (e) { log('T2: Poste search input', false, e.message); }

  // Test 3: Structure search input exists
  try {
    const structureInput = document.querySelector('input[placeholder*="Buscar"]');
    log('T3: Structure search input exists', !!structureInput);
  } catch (e) { log('T3: Structure search input', false, e.message); }

  // Test 4: Conductor dropdowns exist
  try {
    const labels = Array.from(document.querySelectorAll('label'));
    const hasMT = labels.some(l => l.textContent.includes('MT'));
    const hasBT = labels.some(l => l.textContent.includes('BT'));
    log('T4: Conductor dropdowns exist', hasMT && hasBT, `MT: ${hasMT}, BT: ${hasBT}`);
  } catch (e) { log('T4: Conductor dropdowns', false, e.message); }

  // Test 5: Materials table exists
  try {
    const table = document.querySelector('table');
    const tableHeaders = Array.from(document.querySelectorAll('th')).map(h => h.textContent);
    const hasSAP = tableHeaders.some(h => h.includes('SAP'));
    log('T5: Materials table structure', !!table || hasSAP, `Headers: ${tableHeaders.join(', ')}`);
  } catch (e) { log('T5: Materials table', false, e.message); }

  // Test 6: Footer totals exist
  try {
    const footer = document.body.innerText;
    const hasMaterial = footer.includes('Material') || footer.includes('MATERIAL');
    const hasTotal = footer.includes('Total') || footer.includes('TOTAL');
    log('T6: Footer totals visible', hasMaterial && hasTotal);
  } catch (e) { log('T6: Footer totals', false, e.message); }

  // Test 7: API availability
  try {
    const hasAPI = typeof window.api !== 'undefined';
    const hasSearchKits = hasAPI && typeof window.api.searchKits === 'function';
    const hasGetCustoTotal = hasAPI && typeof window.api.getCustoTotal === 'function';
    log('T7: API available', hasAPI && hasSearchKits, `searchKits: ${hasSearchKits}, getCustoTotal: ${hasGetCustoTotal}`);
  } catch (e) { log('T7: API availability', false, e.message); }

  // Test 8: Search functionality
  try {
    if (window.api && window.api.searchKits) {
      const kits = await window.api.searchKits('P11');
      log('T8: Search returns results', kits && kits.length > 0, `Found ${kits?.length || 0} kits for "P11"`);
    } else {
      log('T8: Search functionality', false, 'API not available');
    }
  } catch (e) { log('T8: Search functionality', false, e.message); }

  // Test 9: Cost calculation
  try {
    if (window.api && window.api.getCustoTotal) {
      const start = performance.now();
      const result = await window.api.getCustoTotal(['13N1']);
      const time = performance.now() - start;
      const hasData = result && typeof result.totalMaterial === 'number';
      log('T9: Cost calculation works', hasData, `Time: ${time.toFixed(0)}ms, Materials: ${result?.materiais?.length || 0}`);
    } else {
      log('T9: Cost calculation', false, 'API not available');
    }
  } catch (e) { log('T9: Cost calculation', false, e.message); }

  // Test 10: Keyboard shortcut hint visible
  try {
    const hasCtrlF = document.body.innerText.includes('Ctrl+F') || document.body.innerHTML.includes('Ctrl+F');
    log('T10: Keyboard hint visible', hasCtrlF);
  } catch (e) { log('T10: Keyboard hint', false, e.message); }

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`📊 Results: ${passed}/${total} tests passed (${Math.round(passed / total * 100)}%)`);

  if (passed === total) {
    console.log('🎉 All tests passed! Ready for manual testing.');
  } else {
    console.log('⚠️ Some tests failed. Review the results above.');
  }

  return results;
})();
