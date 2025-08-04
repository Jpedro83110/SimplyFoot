const fs = require('fs');
const path = require('path');

const forbiddenModules = ['ws', 'stream', 'events', 'http', 'net', 'tls', 'zlib'];
const projectRoot = __dirname;

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules') continue; // ignore node_modules to avoid slow scan
            scanDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            forbiddenModules.forEach((mod) => {
                if (content.includes(`require('${mod}'`) || content.includes(`from '${mod}'`)) {
                    console.log(`⚠️  Found usage of '${mod}' in ${fullPath}`);
                }
            });
        }
    }
}

console.log('🔍 Scanning for forbidden Node.js modules...');
scanDirectory(projectRoot);
console.log('✅ Scan terminé');
