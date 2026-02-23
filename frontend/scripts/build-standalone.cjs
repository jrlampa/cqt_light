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
    const frontendAssetsDir = path.join(__dirname, '../dist/assets');

    // 1. Clean & Copy Backend
    if (await fs.pathExists(buildDir)) {
        await fs.remove(buildDir);
    }
    await fs.copy(sourceDir, buildDir);

    // 2. Obfuscate Backend recursively
    async function obfuscateDir(dir, isFrontend = false) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await obfuscateDir(fullPath, isFrontend);
            } else if (file.endsWith('.js') || file.endsWith('.cjs')) {
                console.log(`Obfuscating ${isFrontend ? '[Front]' : '[Back]'}: ${path.relative(isFrontend ? frontendAssetsDir : buildDir, fullPath)}`);
                const content = await fs.readFile(fullPath, 'utf8');
                try {
                    const result = JavaScriptObfuscator.obfuscate(content, OB_CONFIG);
                    await fs.writeFile(fullPath, result.getObfuscatedCode());
                } catch (err) {
                    console.error(`Error obfuscating ${file}:`, err.message);
                }
            }
        }
    }

    await obfuscateDir(buildDir, false);

    // 3. Obfuscate Frontend Assets (Extra Layer)
    if (await fs.pathExists(frontendAssetsDir)) {
        console.log('--- Obfuscating Frontend Assets ---');
        await obfuscateDir(frontendAssetsDir, true);
    }

    console.log('--- Zenith Obfuscation Complete ---');
}

build().catch(console.error);
