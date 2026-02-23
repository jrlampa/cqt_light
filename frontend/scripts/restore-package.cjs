const fs = require('fs-extra');
const path = require('path');

async function restore() {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = await fs.readJson(pkgPath);

    if (pkg._originalMain) {
        pkg.main = pkg._originalMain;
        delete pkg._originalMain;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
        console.log('--- Restored original package.json main ---');
    }
}

restore().catch(console.error);
