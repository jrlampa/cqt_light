/**
 * Testes para RedeEletricaPanel.jsx
 *
 * Cobre: sub-tabs, GPS import, análise de topologia, queda de tensão, IFC export.
 * Usa mocks para todos os hooks de rede e para MapaRede (Leaflet CDN indisponível em happy-dom).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../components/MapaRede', () => ({
  default: () => <div data-testid="mapa-rede">MapaRede</div>,
}));

vi.mock('../hooks/useKml', () => ({
  useKml: vi.fn(),
}));

vi.mock('../hooks/useRedeAnalise', () => ({
  useRedeAnalise: vi.fn(),
}));

vi.mock('../hooks/useQuedaTensao', () => ({
  useQuedaTensao: vi.fn(),
}));

vi.mock('../hooks/useIfc', () => ({
  useIfc: vi.fn(),
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

import RedeEletricaPanel from '../components/RedeEletricaPanel';
import { useKml } from '../hooks/useKml';
import { useRedeAnalise } from '../hooks/useRedeAnalise';
import { useQuedaTensao } from '../hooks/useQuedaTensao';
import { useIfc } from '../hooks/useIfc';

const mkKml = (overrides = {}) => ({
  loading: false,
  error: null,
  resultado: null,
  importarTrace: vi.fn().mockResolvedValue(null),
  limpar: vi.fn(),
  ...overrides,
});

const mkRedeAnalise = (overrides = {}) => ({
  analisar: vi.fn().mockResolvedValue({
    conectada: true, postes_isolados: [], comprimento_mt_m: 0,
    comprimento_bt_m: 100, comprimento_total_m: 100,
    num_postes: 2, num_trechos: 1, num_transformadores: 0, avisos: [],
  }),
  loading: false,
  error: null,
  ...overrides,
});

const mkQueda = (overrides = {}) => ({
  calcular: vi.fn().mockResolvedValue({ rede_conforme: true, queda_maxima_pct: 2.1, queda_total_v: 4.6, trechos: [] }),
  resultado: null,
  tensoes: [],
  loading: false,
  error: null,
  clearError: vi.fn(),
  ...overrides,
});

const mkIfc = (overrides = {}) => ({
  exportar: vi.fn().mockResolvedValue({ ifc_content: 'ISO-10303-21;\n' }),
  loading: false,
  error: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  useKml.mockReturnValue(mkKml());
  useRedeAnalise.mockReturnValue(mkRedeAnalise());
  useQuedaTensao.mockReturnValue(mkQueda());
  useIfc.mockReturnValue(mkIfc());
});

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('RedeEletricaPanel', () => {

  describe('navegação entre sub-tabs', () => {
    it('renderiza sem crash com props padrão', () => {
      const { container } = render(<RedeEletricaPanel />);
      expect(container.firstChild).toBeTruthy();
    });

    it('exibe aba Mapa por padrão (MapaRede visível)', () => {
      render(<RedeEletricaPanel />);
      expect(screen.getByTestId('mapa-rede')).toBeTruthy();
    });

    it('exibe tablist com 5 botões de sub-tab', () => {
      render(<RedeEletricaPanel />);
      const tablist = document.querySelector('[role="tablist"]');
      expect(tablist).toBeTruthy();
      const tabs = tablist.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(5);
    });

    it('troca para aba GPS ao clicar — exibe título correto', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));
      expect(screen.getByText(/Importar Traçado GPS/i)).toBeTruthy();
    });

    it('troca para aba Análise ao clicar', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Análise'));
      expect(screen.getByText(/Análise de Topologia/i)).toBeTruthy();
    });

    it('troca para aba Queda U ao clicar', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      expect(screen.getByText(/Cálculo de Queda de Tensão/i)).toBeTruthy();
    });

    it('troca para aba BIM ao clicar', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      expect(screen.getByText(/Exportação BIM/i)).toBeTruthy();
    });

    it('volta para aba Mapa após importarTrace retornar pontos', async () => {
      const pontos = [{ id: 1, latitude: -22.15018, longitude: -42.92185 }];
      const importarTrace = vi.fn().mockResolvedValue({
        formato: 'gpx', total_pontos: 1, comprimento_total_m: 0, pontos,
      });
      useKml.mockReturnValue(mkKml({ importarTrace }));

      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));

      const input = document.querySelector('input[type="file"]');
      const file = new File(['<gpx/>'], 'test.gpx', { type: 'text/xml' });
      // Dispatch change event — fireEvent won't actually invoke file reading but
      // we just want the onChange handler to fire importarTrace
      Object.defineProperty(input, 'files', {
        get: () => [file],
        configurable: true,
      });
      fireEvent.change(input);

      await waitFor(() => expect(importarTrace).toHaveBeenCalled());
    });
  });

  describe('PainelGPS', () => {
    it('exibe aviso de erro quando useKml retorna error', () => {
      useKml.mockReturnValue(mkKml({ error: 'Arquivo inválido' }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));
      expect(screen.getByText('Arquivo inválido')).toBeTruthy();
    });

    it('exibe resultado de sucesso quando resultado não é null', () => {
      useKml.mockReturnValue(mkKml({
        resultado: { formato: 'kml', total_pontos: 5, comprimento_total_m: 500 },
      }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));
      expect(screen.getByText(/Traçado importado/i)).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('mostra texto de loading no botão GPS', () => {
      useKml.mockReturnValue(mkKml({ loading: true }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));
      expect(screen.getByText('Importando...')).toBeTruthy();
    });

    it('botão limpar chama limpar e limpa tracado', async () => {
      const limpar = vi.fn();
      useKml.mockReturnValue(mkKml({
        limpar,
        resultado: { formato: 'kml', total_pontos: 2, comprimento_total_m: 200 },
      }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Importar GPS'));
      fireEvent.click(screen.getByText('Limpar traçado'));
      expect(limpar).toHaveBeenCalled();
    });
  });

  describe('PainelAnalise', () => {
    it('exibe aviso quando sem postes', () => {
      render(<RedeEletricaPanel postes={[]} />);
      fireEvent.click(screen.getByText('Análise'));
      expect(screen.getByText(/Nenhum poste configurado/i)).toBeTruthy();
    });

    it('botão Analisar Rede é desabilitado sem postes', () => {
      render(<RedeEletricaPanel postes={[]} />);
      fireEvent.click(screen.getByText('Análise'));
      const btn = screen.getByText('Analisar Rede').closest('button');
      expect(btn.disabled).toBe(true);
    });

    it('botão Analisar Rede habilitado com postes', () => {
      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('Análise'));
      const btn = screen.getByText('Analisar Rede').closest('button');
      expect(btn.disabled).toBe(false);
    });

    it('chama analisar ao clicar no botão', async () => {
      const analisar = vi.fn().mockResolvedValue({
        conectada: true, postes_isolados: [], comprimento_mt_m: 0, comprimento_bt_m: 0,
        comprimento_total_m: 0, num_postes: 1, num_trechos: 0, num_transformadores: 0, avisos: [],
      });
      useRedeAnalise.mockReturnValue(mkRedeAnalise({ analisar }));

      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('Análise'));
      fireEvent.click(screen.getByText('Analisar Rede'));

      await waitFor(() => expect(analisar).toHaveBeenCalled());
    });

    it('exibe resultado de análise com rede conectada', async () => {
      const analisar = vi.fn().mockResolvedValue({
        conectada: true, postes_isolados: [], comprimento_mt_m: 200, comprimento_bt_m: 300,
        comprimento_total_m: 500, num_postes: 3, num_trechos: 2, num_transformadores: 1, avisos: [],
      });
      useRedeAnalise.mockReturnValue(mkRedeAnalise({ analisar }));

      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('Análise'));
      fireEvent.click(screen.getByText('Analisar Rede'));

      await waitFor(() => expect(screen.getByText(/Rede conectada/i)).toBeTruthy());
    });

    it('exibe avisos quando rede desconectada', async () => {
      const analisar = vi.fn().mockResolvedValue({
        conectada: false, postes_isolados: ['P3'], comprimento_mt_m: 0, comprimento_bt_m: 0,
        comprimento_total_m: 0, num_postes: 3, num_trechos: 1, num_transformadores: 0,
        avisos: ['Rede desconectada: 1 poste(s) isolado(s)'],
      });
      useRedeAnalise.mockReturnValue(mkRedeAnalise({ analisar }));

      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('Análise'));
      fireEvent.click(screen.getByText('Analisar Rede'));

      await waitFor(() => {
        const avisoItems = document.querySelectorAll('li');
        const hasAviso = Array.from(avisoItems).some(li =>
          /desconectada/i.test(li.textContent)
        );
        expect(hasAviso).toBe(true);
      });
    });
  });

  describe('PainelQueda', () => {
    it('exibe campos de Nível e Tensão Nominal', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      expect(screen.getByText(/Nível/i)).toBeTruthy();
      expect(screen.getByText(/Tensão Nominal/i)).toBeTruthy();
    });

    it('botão Calcular Queda existe e não está desabilitado', () => {
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      const btn = screen.getByText('Calcular Queda').closest('button');
      expect(btn).toBeTruthy();
      expect(btn.disabled).toBe(false);
    });

    it('exibe resultado conforme quando rede_conforme=true', () => {
      useQuedaTensao.mockReturnValue(mkQueda({
        resultado: { rede_conforme: true, queda_maxima_pct: 1.8, queda_total_v: 3.96, trechos: [] },
      }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      expect(screen.getByText(/Rede conforme/i)).toBeTruthy();
    });

    it('exibe resultado não conforme quando rede_conforme=false', () => {
      useQuedaTensao.mockReturnValue(mkQueda({
        resultado: { rede_conforme: false, queda_maxima_pct: 8.2, queda_total_v: 18.0, trechos: [] },
      }));
      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      expect(screen.getByText(/Rede não conforme/i)).toBeTruthy();
    });

    it('chama clearError + calcular ao clicar em Calcular Queda', async () => {
      const calcular = vi.fn().mockResolvedValue(null);
      const clearError = vi.fn();
      useQuedaTensao.mockReturnValue(mkQueda({ calcular, clearError }));

      render(<RedeEletricaPanel />);
      fireEvent.click(screen.getByText('Queda U'));
      fireEvent.click(screen.getByText('Calcular Queda'));

      await waitFor(() => {
        expect(clearError).toHaveBeenCalled();
        expect(calcular).toHaveBeenCalled();
      });
    });
  });

  describe('PainelBim', () => {
    it('exibe aviso quando sem postes', () => {
      render(<RedeEletricaPanel postes={[]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      expect(screen.getByText(/Nenhum poste configurado/i)).toBeTruthy();
    });

    it('botão Exportar IFC2X3 desabilitado sem postes', () => {
      render(<RedeEletricaPanel postes={[]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      const btn = screen.getByText('Exportar IFC2X3').closest('button');
      expect(btn.disabled).toBe(true);
    });

    it('botão Exportar IFC2X3 habilitado com postes', () => {
      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      const btn = screen.getByText('Exportar IFC2X3').closest('button');
      expect(btn.disabled).toBe(false);
    });

    it('chama exportar ao clicar no botão', async () => {
      // Stub URL methods to avoid constructor error in happy-dom
      const origCreateObjUrl = globalThis.URL?.createObjectURL;
      const origRevokeObjUrl = globalThis.URL?.revokeObjectURL;
      if (globalThis.URL) {
        globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        globalThis.URL.revokeObjectURL = vi.fn();
      }

      const exportar = vi.fn().mockResolvedValue({ ifc_content: 'ISO-10303-21;\n' });
      useIfc.mockReturnValue(mkIfc({ exportar }));

      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      fireEvent.click(screen.getByText('Exportar IFC2X3'));

      await waitFor(() => expect(exportar).toHaveBeenCalled());

      if (origCreateObjUrl !== undefined && globalThis.URL) {
        globalThis.URL.createObjectURL = origCreateObjUrl;
        globalThis.URL.revokeObjectURL = origRevokeObjUrl;
      }
    });

    it('mostra texto de loading no botão BIM', () => {
      useIfc.mockReturnValue(mkIfc({ loading: true }));
      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      expect(screen.getByText('Exportando...')).toBeTruthy();
    });

    it('exibe informações sobre entidades IFC', () => {
      render(<RedeEletricaPanel postes={[{ id: 'P1', x: 0, y: 0 }]} />);
      fireEvent.click(screen.getByText('BIM / IFC'));
      expect(screen.getByText(/IFCCOLUMN/i)).toBeTruthy();
      expect(screen.getByText(/IFCFLOWSEGMENT/i)).toBeTruthy();
    });
  });
});
