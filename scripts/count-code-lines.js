const fs = require('fs');
const path = require('path');

// Répertoires à analyser
const SOURCE_DIRS = ['app', 'components', 'helpers', 'hooks', 'lib', 'utils'];

// Extensions de fichiers
const JS_EXTENSIONS = ['.js', '.jsx'];
const TS_EXTENSIONS = ['.ts', '.tsx'];

// Patterns pour exclure les fichiers de test
const TEST_PATTERNS = [/__tests__/, /\.test\./, /\.spec\./];

/**
 * Vérifie si un fichier est un fichier de test
 */
function isTestFile(filePath) {
    return TEST_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Compte les lignes non-vides dans un fichier
 */
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        // Compter seulement les lignes non-vides (après suppression des espaces)
        return lines.filter((line) => line.trim().length > 0).length;
    } catch (error) {
        console.warn(`Erreur lors de la lecture du fichier ${filePath}:`, error.message);
        return 0;
    }
}

/**
 * Parcourt récursivement un répertoire et trouve tous les fichiers
 */
function findFiles(dir, extensions) {
    const files = [];

    function traverse(currentDir) {
        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    traverse(itemPath);
                } else if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (extensions.includes(ext) && !isTestFile(itemPath)) {
                        files.push(itemPath);
                    }
                }
            }
        } catch (error) {
            console.warn(`Erreur lors du parcours du répertoire ${currentDir}:`, error.message);
        }
    }

    traverse(dir);
    return files;
}

/**
 * Analyse les fichiers dans les répertoires source
 */
function analyzeCodebase(options = {}) {
    const { verbose = false } = options;
    let jsLines = 0;
    let jsFiles = 0;
    let tsLines = 0;
    let tsFiles = 0;

    if (verbose) {
        console.log('🔍 Analyse des fichiers sources...\n');
    }

    for (const sourceDir of SOURCE_DIRS) {
        const dirPath = path.resolve(sourceDir);

        if (!fs.existsSync(dirPath)) {
            if (verbose) {
                console.warn(`⚠️  Le répertoire ${sourceDir} n'existe pas`);
            }
            continue;
        }

        if (verbose) {
            console.log(`📁 Analyse du répertoire: ${sourceDir}`);
        }

        // Analyser les fichiers JavaScript/JSX
        const jsFilesInDir = findFiles(dirPath, JS_EXTENSIONS);
        for (const file of jsFilesInDir) {
            const lines = countLines(file);
            jsLines += lines;
            jsFiles++;
            if (verbose) {
                console.log(`   JS: ${path.relative(process.cwd(), file)} (${lines} lignes)`);
            }
        }

        // Analyser les fichiers TypeScript/TSX
        const tsFilesInDir = findFiles(dirPath, TS_EXTENSIONS);
        for (const file of tsFilesInDir) {
            const lines = countLines(file);
            tsLines += lines;
            tsFiles++;
            if (verbose) {
                console.log(`   TS: ${path.relative(process.cwd(), file)} (${lines} lignes)`);
            }
        }

        if (verbose) {
            console.log('');
        }
    }

    const totalLines = jsLines + tsLines;
    const jsPercentage = totalLines > 0 ? ((jsLines / totalLines) * 100).toFixed(2) : 0;
    const tsPercentage = totalLines > 0 ? ((tsLines / totalLines) * 100).toFixed(2) : 0;

    // Affichage des résultats
    console.log('📊 AVANCEMENT DE LA MIGRATION TYPESCRIPT');
    console.log('========================================');
    console.log(
        `📄 Fichiers JavaScript/JSX: ${jsFiles} fichiers, ${jsLines} lignes (${jsPercentage}%)`,
    );
    console.log(
        `📄 Fichiers TypeScript/TSX: ${tsFiles} fichiers, ${tsLines} lignes (${tsPercentage}%)`,
    );
    console.log(`📄 Total: ${jsFiles + tsFiles} fichiers, ${totalLines} lignes`);
    console.log('');
    console.log('📈 RÉPARTITION:');
    console.log(`   JavaScript/JSX: ${jsPercentage}%`);
    console.log(`   TypeScript/TSX: ${tsPercentage}%`);

    // Génération d'une barre de progression visuelle
    const barLength = 50;
    const jsBarLength = Math.round((jsLines / totalLines) * barLength);
    const tsBarLength = barLength - jsBarLength;

    console.log('');
    console.log('📊 VISUALISATION:');
    console.log(`[${'█'.repeat(tsBarLength)}${'░'.repeat(jsBarLength)}]`);
    console.log(`  TS/TSX: ${tsPercentage}%           JS/JSX: ${jsPercentage}%`);

    return {
        javascript: {
            files: jsFiles,
            lines: jsLines,
            percentage: parseFloat(jsPercentage),
        },
        typescript: {
            files: tsFiles,
            lines: tsLines,
            percentage: parseFloat(tsPercentage),
        },
        total: {
            files: jsFiles + tsFiles,
            lines: totalLines,
        },
    };
}

// Exécution du script
if (require.main === module) {
    // Vérifier si l'option verbose est passée en argument
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

    try {
        analyzeCodebase({ verbose });
    } catch (error) {
        console.error("❌ Erreur lors de l'analyse:", error.message);
        process.exit(1);
    }
}

module.exports = { analyzeCodebase };
