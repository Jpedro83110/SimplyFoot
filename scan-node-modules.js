const fs = require('fs');
const path = require('path');

const forbiddenModules = ['ws', 'stream', 'events', 'http', 'net', 'tls', 'zlib'];
const nodeModulesPath = path.join(__dirname, 'node_modules');

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);

        try {
            if (fs.statSync(fullPath).isDirectory()) {
                scanDirectory(fullPath);
            } else if (file.endsWith('.js')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                forbiddenModules.forEach((mod) => {
                    if (content.includes(`require('${mod}'`) || content.includes(`from '${mod}'`)) {
                        console.log(`⚠️  Found '${mod}' in: ${fullPath}`);
                    }
                });
            }
        } catch (e) {
            // ignore permission issues
        }
    }
}

console.log('🔍 Scanning node_modules for forbidden Node.js modules...');
scanDirectory(nodeModulesPath);
console.log('✅ Scan terminé');
