/**
 * App.jsx — testes unitários
 * Faz mock dos sub-componentes pesados para testar o shell da aplicação.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { defaultApi } from './setup';

// Mocka os sub-componentes pesados (Electron/IPC) para isolar o App
vi.mock('../components/Configurator', () => ({ default: () => <div data-testid="configurator">Configurator</div> }));
vi.mock('../components/MaterialManager', () => ({ default: () => <div data-testid="materialmanager">MaterialManager</div> }));
vi.mock('../components/KitEditor', () => ({ default: () => <div data-testid="kiteditor">KitEditor</div> }));
vi.mock('../components/LaborManager', () => ({ default: () => <div data-testid="labormanager">LaborManager</div> }));
vi.mock('../components/MapaRede', () => ({ default: () => <div data-testid="maparede">MapaRede</div> }));
vi.mock('../components/RedeEletricaPanel', () => ({ default: () => <div data-testid="rede-eletrica-panel">RedeEletricaPanel</div> }));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getStats.mockResolvedValue({ materials: 123, kits: 45, servicos: 6 });
  });

  it('renderiza o cabeçalho com título CQT Light', () => {
    render(<App />);
    expect(screen.getByText('CQT Light')).toBeTruthy();
  });

  it('renderiza os 4 botões de aba', () => {
    render(<App />);
    expect(screen.getByText('Montagem')).toBeTruthy();
    expect(screen.getByText('Materiais')).toBeTruthy();
    expect(screen.getByText('Kits')).toBeTruthy();
    expect(screen.getByText('Mão de Obra')).toBeTruthy();
  });

  it('renderiza o botão da aba Mapa', () => {
    render(<App />);
    expect(screen.getByText('Mapa')).toBeTruthy();
  });

  it('exibe Configurator por padrão (aba Montagem)', () => {
    render(<App />);
    expect(screen.getByTestId('configurator')).toBeTruthy();
  });

  it('troca para MaterialManager ao clicar em Materiais', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Materiais'));
    await waitFor(() => expect(screen.getByTestId('materialmanager')).toBeTruthy());
  });

  it('troca para KitEditor ao clicar em Kits', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Kits'));
    await waitFor(() => expect(screen.getByTestId('kiteditor')).toBeTruthy());
  });

  it('troca para LaborManager ao clicar em Mão de Obra', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Mão de Obra'));
    await waitFor(() => expect(screen.getByTestId('labormanager')).toBeTruthy());
  });

  it('tecla Ctrl+2 muda para aba Materiais', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '2', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('materialmanager')).toBeTruthy());
  });

  it('tecla Ctrl+3 muda para aba Kits', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '3', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('kiteditor')).toBeTruthy());
  });

  it('tecla Ctrl+4 muda para aba Mão de Obra', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '4', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('labormanager')).toBeTruthy());
  });

  it('tecla Ctrl+1 retorna para aba Montagem', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '2', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('materialmanager')).toBeTruthy());
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('configurator')).toBeTruthy());
  });

  it('carrega e exibe estatísticas do banco via window.api.getStats', async () => {
    render(<App />);
    await waitFor(() => expect(defaultApi.getStats).toHaveBeenCalled());
  });

  it('não crasha quando window.api não está disponível', async () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<App />)).not.toThrow();
    window.api = backup;
  });

  it('remove listener de teclado ao desmontar', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<App />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('troca para RedeEletricaPanel ao clicar em Mapa', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Mapa'));
    await waitFor(() => expect(screen.getByTestId('rede-eletrica-panel')).toBeTruthy());
  });

  it('tecla Ctrl+5 muda para aba Mapa', async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '5', ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId('rede-eletrica-panel')).toBeTruthy());
  });
});
