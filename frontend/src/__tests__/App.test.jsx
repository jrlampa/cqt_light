import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import React, { Suspense } from 'react';

// Redundant mock removed (now global in setupTests.js)

// Mock all lazy components
vi.mock('../components/Dashboard', () => ({ default: () => <div data-testid="dashboard">Dashboard</div> }));
vi.mock('../components/Configurator', () => ({ default: () => <div data-testid="configurator">Configurator</div> }));
vi.mock('../components/MaterialManager', () => ({ default: () => <div data-testid="materials">Materials</div> }));
vi.mock('../components/KitEditor', () => ({ default: () => <div data-testid="kiteditor">KitEditor</div> }));
vi.mock('../components/LaborManager', () => ({ default: () => <div data-testid="labor">Labor</div> }));
vi.mock('../components/StructuralMap', () => ({ default: () => <div data-testid="map">Map</div> }));
vi.mock('../components/AnalyticsManager', () => ({ default: () => <div data-testid="analytics">Analytics</div> }));
vi.mock('../components/ReportsDashboard', () => ({ default: () => <div data-testid="reports">Reports</div> }));
vi.mock('../components/MaintenanceBacklog', () => ({ default: () => <div data-testid="backlog">Backlog</div> }));

// Mock window.api
global.window.api = {
    getStats: vi.fn().mockResolvedValue({ materials: 10, kits: 5, servicos: 2 }),
    getGovernanceStats: vi.fn().mockResolvedValue({ total: 10, open: 5, resolved: 5 }),
    getConfig: vi.fn().mockResolvedValue(null),
};

describe('App Component - Minimal Stability Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the header and default tab', async () => {
        await act(async () => {
            render(<App />);
        });

        expect(screen.getByText(/CQT Light/i)).toBeTruthy();

        await waitFor(() => {
            expect(screen.getByTestId('configurator')).toBeTruthy();
        });
    });

    it('should toggle modes', async () => {
        await act(async () => {
            render(<App />);
        });

        const biBtn = screen.getByText(/ANALYTICS \(BI\)/i);
        fireEvent.click(biBtn);

        await waitFor(() => {
            expect(screen.getByTestId('dashboard')).toBeTruthy();
        });
    });
});
