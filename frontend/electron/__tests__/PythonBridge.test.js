import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs';
const PythonBridge = require('../src/infrastructure/services/PythonBridge');

vi.mock('child_process', () => ({
    spawn: vi.fn()
}));
vi.mock('fs');
vi.mock('../src/infrastructure/services/Logger');

describe('PythonBridge (100% Coverage)', () => {
    let mockProcess;

    beforeEach(() => {
        vi.clearAllMocks();
        mockProcess = {
            stdin: { write: vi.fn(), end: vi.fn() },
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn()
        };
        vi.mocked(spawn).mockReturnValue(mockProcess);
        PythonBridge.isDev = true;
    });

    it('should successfully parse JSON from stdout', async () => {
        const promise = PythonBridge.run('test', { key: 'val' });

        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(c => c[0] === 'data')[1];
        stdoutCallback(Buffer.from('{"ok":true}'));

        const closeCallback = mockProcess.on.mock.calls.find(c => c[0] === 'close')[1];
        closeCallback(0);

        const result = await promise;
        expect(result.ok).toBe(true);
    });

    it('should handle process failure with non-zero code', async () => {
        const promise = PythonBridge.run('test', {});
        const stderrCallback = mockProcess.stderr.on.mock.calls.find(c => c[0] === 'data')[1];
        stderrCallback(Buffer.from('Error message'));

        const closeCallback = mockProcess.on.mock.calls.find(c => c[0] === 'close')[1];
        closeCallback(1);

        await expect(promise).rejects.toThrow('Process test failed (code 1): Error message');
    });

    it('should extract JSON fragments from noisy output', async () => {
        const promise = PythonBridge.run('test', {});
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(c => c[0] === 'data')[1];
        stdoutCallback(Buffer.from('Noise prefix {"extracted":true} noise suffix'));

        const closeCallback = mockProcess.on.mock.calls.find(c => c[0] === 'close')[1];
        closeCallback(0);

        const result = await promise;
        expect(result.extracted).toBe(true);
    });

    it('should throw error on malformed extractions', async () => {
        const promise = PythonBridge.run('test', {});
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(c => c[0] === 'data')[1];
        stdoutCallback(Buffer.from('{ broken }'));

        const closeCallback = mockProcess.on.mock.calls.find(c => c[0] === 'close')[1];
        closeCallback(0);

        await expect(promise).rejects.toThrow('Failed to parse output');
    });

    it('should handle production binary execution', async () => {
        PythonBridge.isDev = false;
        vi.mocked(fs.existsSync).mockReturnValue(true);
        process.resourcesPath = '/tmp';

        const promise = PythonBridge.run('engine', {});
        const closeCallback = mockProcess.on.mock.calls.find(c => c[0] === 'close')[1];
        closeCallback(0);
        await promise;

        expect(spawn).toHaveBeenCalledWith(expect.stringContaining('engine.exe'), []);
    });
});
