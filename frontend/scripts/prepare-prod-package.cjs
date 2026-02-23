const fs = require('fs-extra');
const path = require('path');

async function prepare() {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = await fs.readJson(pkgPath);

    // Backup original main
    pkg._originalMain = pkg.main;

    // Switch to obfuscated entry
    // NOTE: Current main is electron/main.cjs
    // Obfuscated is in electron_obfuscated/main.cjs
    pkg.main = 'electron_obfuscated/main.cjs';

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    console.log('--- Switched package.json main to obfuscated entry point ---');
}

prepare().catch(console.error);
