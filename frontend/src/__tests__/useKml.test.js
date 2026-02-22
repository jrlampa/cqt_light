/**
 * Testes para o hook useKml — importação de traçados GPS (KML/GPX)
 * via API do backend CQT Light.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKml } from '../hooks/useKml.js';

const MOCK_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <Point><coordinates>-42.92185,-22.15018,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>`;

const MOCK_RESULTADO = {
  formato: 'kml',
  nome_arquivo: 'test.kml',
  total_pontos: 1,
  comprimento_total_m: 0,
  pontos: [{ id: 1, latitude: -22.15018, longitude: -42.92185, altitude_m: 0, nome: '' }],
};

describe('useKml', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Estado inicial ────────────────────────────────────────────────────────────

  it('inicia com loading=false, error=null, resultado=null', () => {
    const { result } = renderHook(() => useKml());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.resultado).toBeNull();
  });

  // ── Arquivo nulo ─────────────────────────────────────────────────────────────

  it('retorna null e seta error quando arquivo é nulo', async () => {
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(null); });
    expect(retorno).toBeNull();
    expect(result.current.error).toBe('Nenhum arquivo selecionado');
  });

  it('não chama fetch quando arquivo é nulo', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(null); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Importação bem-sucedida ───────────────────────────────────────────────────

  it('importa trace com sucesso e salva resultado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(mockFile); });
    expect(retorno).toEqual(MOCK_RESULTADO);
    expect(result.current.resultado).toEqual(MOCK_RESULTADO);
    expect(result.current.error).toBeNull();
  });

  it('chama fetch com método POST no endpoint correto', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    });
    vi.stubGlobal('fetch', mockFetch);
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'trace.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/trace/importar'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('envia Content-Type application/json', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    });
    vi.stubGlobal('fetch', mockFetch);
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'trace.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('envia conteudo_xml no body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    });
    vi.stubGlobal('fetch', mockFetch);
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.conteudo_xml).toBe(MOCK_KML);
  });

  it('envia nome_arquivo correto no body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    });
    vi.stubGlobal('fetch', mockFetch);
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'levantamento.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.nome_arquivo).toBe('levantamento.kml');
  });

  it('usa nome_arquivo vazio quando arquivo não tem name', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    });
    vi.stubGlobal('fetch', mockFetch);
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML) };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.nome_arquivo).toBe('');
  });

  // ── Erros HTTP ───────────────────────────────────────────────────────────────

  it('seta error com detail quando resposta HTTP não é ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ detail: 'Formato inválido' }),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue('<bad/>'), name: 'bad.kml' };
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(mockFile); });
    expect(retorno).toBeNull();
    expect(result.current.error).toBe('Formato inválido');
  });

  it('usa "Erro HTTP N" quando detail está ausente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({}),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'trace.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    expect(result.current.error).toContain('400');
  });

  it('lida com JSON inválido na resposta de erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('JSON inválido')),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    expect(result.current.error).toContain('500');
  });

  it('seta error em falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Falha de rede')));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'trace.kml' };
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(mockFile); });
    expect(retorno).toBeNull();
    expect(result.current.error).toBe('Falha de rede');
  });

  // ── limpar() ─────────────────────────────────────────────────────────────────

  it('limpar() reseta resultado e error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    expect(result.current.resultado).not.toBeNull();
    act(() => { result.current.limpar(); });
    expect(result.current.resultado).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('limpar() remove error anterior', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Erro')));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'trace.kml' };
    const { result } = renderHook(() => useKml());
    await act(async () => { await result.current.importarTrace(mockFile); });
    expect(result.current.error).toBe('Erro');
    act(() => { result.current.limpar(); });
    expect(result.current.error).toBeNull();
  });

  // ── Dados do resultado ────────────────────────────────────────────────────────

  it('resultado retorna pontos com coordenadas de referência', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(MOCK_RESULTADO),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(mockFile); });
    expect(retorno.pontos[0].latitude).toBe(-22.15018);
    expect(retorno.pontos[0].longitude).toBe(-42.92185);
  });

  it('resultado tem comprimento_total_m calculado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ...MOCK_RESULTADO, comprimento_total_m: 523.4 }),
    }));
    const mockFile = { text: vi.fn().mockResolvedValue(MOCK_KML), name: 'test.kml' };
    const { result } = renderHook(() => useKml());
    let retorno;
    await act(async () => { retorno = await result.current.importarTrace(mockFile); });
    expect(retorno.comprimento_total_m).toBe(523.4);
  });
});
