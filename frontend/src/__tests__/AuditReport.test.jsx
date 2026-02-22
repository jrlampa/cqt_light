import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuditReport from '../components/AuditReport';
import React from 'react';

describe('AuditReport Component', () => {
    const mockReport = [
        { severity: 'CRITICAL', code: 'TEST_01', message: 'Critical Error Message', element_id: '123' },
        { severity: 'WARNING', code: 'TEST_02', message: 'Warning Message' },
    ];

    it('renders correctly when open', () => {
        render(
            <AuditReport
                isOpen={true}
                onClose={() => { }}
                report={mockReport}
                isLoading={false}
            />
        );

        expect(screen.getByText('Auditoria Técnica')).toBeDefined();
        expect(screen.getByText('Critical Error Message')).toBeDefined();
        expect(screen.getByText('Warning Message')).toBeDefined();
        expect(screen.getByText('TEST_01')).toBeDefined();
    });

    it('shows loading state', () => {
        render(
            <AuditReport
                isOpen={true}
                onClose={() => { }}
                report={[]}
                isLoading={true}
            />
        );

        expect(screen.getByText('Consultando Audit Engine...')).toBeDefined();
    });

    it('shows success message when report is empty', () => {
        render(
            <AuditReport
                isOpen={true}
                onClose={() => { }}
                report={[]}
                isLoading={false}
            />
        );

        expect(screen.getByText('Tudo em Conformidade')).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <AuditReport
                isOpen={true}
                onClose={onClose}
                report={[]}
                isLoading={false}
            />
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });
});
