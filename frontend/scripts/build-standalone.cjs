const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs-extra');
const path = require('path');

const OB_CONFIG = {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    debugProtection: true,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

async function build() {
    console.log('--- Starting Zenith Obfuscation ---');

    // Paths
    const sourceDir = path.join(__dirname, '../electron');
    const buildDir = path.join(__dirname, '../electron_obfuscated');

    // 1. Clean & Copy
    if (await fs.pathExists(buildDir)) {
        await fs.remove(buildDir);
    }
    await fs.copy(sourceDir, buildDir);

    // 2. Obfuscate recursively
    async function obfuscateDir(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await obfuscateDir(fullPath);
            } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
                console.log(`Obfuscating: ${path.relative(buildDir, fullPath)}`);
                const content = await fs.readFile(fullPath, 'utf8');
                const result = JavaScriptObfuscator.obfuscate(content, OB_CONFIG);
                await fs.writeFile(fullPath, result.getObfuscatedCode());
            }
        }
    }

    await obfuscateDir(buildDir);
    console.log('--- Zenith Obfuscation Complete ---');
}

build().catch(console.error);
