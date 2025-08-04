const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

console.log('🔨 Building Android APK...');

try {
    // Build APK
    const isWindows = process.platform === 'win32';
    const gradlewCommand = isWindows ? 'gradlew.bat' : './gradlew';

    process.chdir('android');
    execSync(`${gradlewCommand} assembleRelease`, { stdio: 'inherit' });
    process.chdir('..');

    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    // Copy and rename APK
    const srcPath = path.join(
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        'release',
        'app-release.apk',
    );
    const destPath = `dist/simply-foot-v${pkg.version}.apk`;

    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ APK copied to ${destPath}`);
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
