/**
 * Tests for conductors constants
 */
import { describe, it, expect } from 'vitest';
import { CONDUTORES_MT, CONDUTORES_BT } from '../constants/conductors';

describe('CONDUTORES_MT', () => {
  it('contém ao menos 1 condutor', () => {
    expect(CONDUTORES_MT.length).toBeGreaterThan(0);
  });

  it('cada item tem id, label e tipo', () => {
    for (const c of CONDUTORES_MT) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('tipo');
    }
  });

  it('tipos são Convencional ou Compacta', () => {
    const tipos = new Set(CONDUTORES_MT.map(c => c.tipo));
    const validos = new Set(['Convencional', 'Compacta', 'Isolada']);
    for (const t of tipos) {
      expect(validos.has(t)).toBe(true);
    }
  });

  it('ids são únicos', () => {
    const ids = CONDUTORES_MT.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CONDUTORES_BT', () => {
  it('contém ao menos 1 condutor', () => {
    expect(CONDUTORES_BT.length).toBeGreaterThan(0);
  });

  it('cada item tem id, label e tipo', () => {
    for (const c of CONDUTORES_BT) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('tipo');
    }
  });

  it('tipos são Multiplexada ou Nua', () => {
    const tipos = new Set(CONDUTORES_BT.map(c => c.tipo));
    const validos = new Set(['Multiplexada', 'Nua']);
    for (const t of tipos) {
      expect(validos.has(t)).toBe(true);
    }
  });

  it('ids são únicos', () => {
    const ids = CONDUTORES_BT.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
