import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import React, { Suspense } from 'react';

// Simplified Lucide Mock
vi.mock('lucide-react', () => {
    const DummyIcon = ({ name, className }) => <div className={className}>{name}</div>;
    return {
        Calculator: (p) => <DummyIcon name="Calc" {...p} />,
        Layers: (p) => <DummyIcon name="Layers" {...p} />,
        Package: (p) => <DummyIcon name="Pack" {...p} />,
        DollarSign: (p) => <DummyIcon name="$$" {...p} />,
        Map: (p) => <DummyIcon name="Map" {...p} />,
        Database: (p) => <DummyIcon name="DB" {...p} />,
        BarChart3: (p) => <DummyIcon name="Bar" {...p} />,
        FileText: (p) => <DummyIcon name="File" {...p} />,
        ShieldCheck: (p) => <DummyIcon name="Shield" {...p} />,
    };
});

// Mock all lazy components WITHOUT referencing outside variables in factory
vi.mock('./components/Dashboard', () => ({ default: () => <div data-testid="dashboard">Dashboard</div> }));
vi.mock('./components/Configurator', () => ({ default: () => <div data-testid="configurator">Configurator</div> }));
vi.mock('./components/MaterialManager', () => ({ default: () => <div data-testid="materials">Materials</div> }));
vi.mock('./components/KitEditor', () => ({ default: () => <div data-testid="kiteditor">KitEditor</div> }));
vi.mock('./components/LaborManager', () => ({ default: () => <div data-testid="labor">Labor</div> }));
vi.mock('./components/StructuralMap', () => ({ default: () => <div data-testid="map">Map</div> }));
vi.mock('./components/AnalyticsManager', () => ({ default: () => <div data-testid="analytics">Analytics</div> }));
vi.mock('./components/ReportsDashboard', () => ({ default: () => <div data-testid="reports">Reports</div> }));

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

        expect(screen.getByText(/CQT Light/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('configurator')).toBeInTheDocument();
        });
    });

    it('should toggle modes', async () => {
        await act(async () => {
            render(<App />);
        });

        const biBtn = screen.getByText(/ANALYTICS \(BI\)/i);
        fireEvent.click(biBtn);

        await waitFor(() => {
            expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        });
    });
});
