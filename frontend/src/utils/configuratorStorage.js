/**
 * CQT Light — Hook de persistência de estado do configurador
 * Responsabilidade: carregar e salvar o estado no localStorage.
 */

const STORAGE_KEY = 'cqt_state_v3';

/**
 * Carrega o estado salvo do configurador no localStorage.
 * @returns {Object} estado salvo ou objeto vazio
 */
export function loadConfiguratorState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error('Falha ao carregar estado:', err);
    return {};
  }
}

/**
 * Salva o estado atual do configurador no localStorage.
 * @param {Object} state - estado a persistir
 */
export function saveConfiguratorState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Falha ao salvar estado:', err);
  }
}

/**
 * Remove o estado persistido do localStorage.
 */
export function clearConfiguratorState() {
  localStorage.removeItem(STORAGE_KEY);
}
