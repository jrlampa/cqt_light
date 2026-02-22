/**
 * Tests for useKeyboardNav hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

function fireKey(key, extra = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
}

describe('useKeyboardNav', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna refs e estados de highlight iniciais', () => {
    const { result } = renderHook(() => useKeyboardNav());
    expect(result.current.posteHighlight).toBe(0);
    expect(result.current.structureHighlight).toBe(0);
    expect(result.current.materialHighlight).toBe(0);
    expect(result.current.mtHighlight).toBe(0);
    expect(result.current.btHighlight).toBe(0);
    expect(result.current.posteInputRef).toBeDefined();
    expect(result.current.structureRef).toBeDefined();
    expect(result.current.materialRef).toBeDefined();
    expect(result.current.qtyInputRef).toBeDefined();
  });

  it('chama onEscape ao pressionar Escape', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardNav({ onEscape }));
    act(() => fireKey('Escape'));
    expect(onEscape).toHaveBeenCalledOnce();
  });

  it('chama onCopy ao pressionar Ctrl+P', () => {
    const onCopy = vi.fn();
    renderHook(() => useKeyboardNav({ onCopy }));
    act(() => fireKey('p', { ctrlKey: true }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('chama onCalculate ao pressionar Ctrl+Enter', () => {
    const onCalculate = vi.fn();
    renderHook(() => useKeyboardNav({ onCalculate }));
    act(() => fireKey('Enter', { ctrlKey: true }));
    expect(onCalculate).toHaveBeenCalledOnce();
  });

  it('não lança erro quando actions estão ausentes (defaults)', () => {
    renderHook(() => useKeyboardNav());
    expect(() => act(() => fireKey('Escape'))).not.toThrow();
    expect(() => act(() => fireKey('p', { ctrlKey: true }))).not.toThrow();
    expect(() => act(() => fireKey('Enter', { ctrlKey: true }))).not.toThrow();
  });

  it('setPosteHighlight atualiza estado', () => {
    const { result } = renderHook(() => useKeyboardNav());
    act(() => result.current.setPosteHighlight(3));
    expect(result.current.posteHighlight).toBe(3);
  });

  it('setStructureHighlight atualiza estado', () => {
    const { result } = renderHook(() => useKeyboardNav());
    act(() => result.current.setStructureHighlight(5));
    expect(result.current.structureHighlight).toBe(5);
  });

  it('remove listener ao desmontar', () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useKeyboardNav({ onEscape }));
    unmount();
    act(() => fireKey('Escape'));
    expect(onEscape).not.toHaveBeenCalled();
  });
});
