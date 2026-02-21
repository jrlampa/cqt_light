/**
 * Tests for configuratorStorage utility
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadConfiguratorState,
  saveConfiguratorState,
  clearConfiguratorState,
} from '../utils/configuratorStorage';

const STORAGE_KEY = 'cqt_state_v3';

describe('loadConfiguratorState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna objeto vazio quando não há estado salvo', () => {
    const state = loadConfiguratorState();
    expect(state).toEqual({});
  });

  it('retorna o estado salvo do localStorage', () => {
    const mockState = { estruturas: [{ id: 1 }] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    const state = loadConfiguratorState();
    expect(state).toEqual(mockState);
  });

  it('retorna objeto vazio quando o JSON salvo é inválido', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json');
    const state = loadConfiguratorState();
    expect(state).toEqual({});
  });
});

describe('saveConfiguratorState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva o estado no localStorage', () => {
    const mockState = { condutorMT: { id: 'mt1', label: 'CAA 35' } };
    saveConfiguratorState(mockState);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toEqual(mockState);
  });

  it('sobrescreve estado anterior', () => {
    saveConfiguratorState({ a: 1 });
    saveConfiguratorState({ b: 2 });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toEqual({ b: 2 });
  });
});

describe('clearConfiguratorState', () => {
  it('remove o estado do localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: 1 }));
    clearConfiguratorState();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
