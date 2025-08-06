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
 * Compte les lignes en séparant le code logique des styles
 */
function countLinesWithStyles(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        let codeLines = 0;
        let styleLines = 0;
        let inStyleSheet = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Ignorer les lignes vides
            if (trimmedLine.length === 0) {
                continue;
            }

            // Détecter le début d'un StyleSheet.create
            if (trimmedLine.includes('StyleSheet.create(')) {
                inStyleSheet = true;
                braceCount = 0;
                styleLines++;
                continue;
            }

            if (inStyleSheet) {
                // Compter les accolades ouvrantes et fermantes
                for (let char of trimmedLine) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                    }
                }

                styleLines++;

                // Si on ferme toutes les accolades, on sort du StyleSheet
                if (braceCount < 0) {
                    inStyleSheet = false;
                }
            } else {
                // Ligne de code normale
                codeLines++;
            }
        }

        return { codeLines, styleLines };
    } catch (error) {
        console.warn(`Erreur lors de la lecture du fichier ${filePath}:`, error.message);
        return { codeLines: 0, styleLines: 0 };
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
    let styleLines = 0;

    // Nouveau: tableau pour stocker le nombre de lignes par fichier avec les détails
    const fileLinesArray = [];
    const fileDetails = []; // Nouveau: pour stocker les détails de chaque fichier

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
            const { codeLines, styleLines: fileStyleLines } = countLinesWithStyles(file);
            const totalFileLines = codeLines + fileStyleLines;
            jsLines += codeLines;
            styleLines += fileStyleLines;
            jsFiles++;
            fileLinesArray.push(totalFileLines);

            // Ajouter les détails du fichier
            fileDetails.push({
                path: path.relative(process.cwd(), file),
                lines: totalFileLines,
                type: 'JS',
            });

            if (verbose) {
                console.log(
                    `   JS: ${path.relative(process.cwd(), file)} (${codeLines} lignes code, ${fileStyleLines} lignes style)`,
                );
            }
        }

        // Analyser les fichiers TypeScript/TSX
        const tsFilesInDir = findFiles(dirPath, TS_EXTENSIONS);
        for (const file of tsFilesInDir) {
            const { codeLines, styleLines: fileStyleLines } = countLinesWithStyles(file);
            const totalFileLines = codeLines + fileStyleLines;
            tsLines += codeLines;
            styleLines += fileStyleLines;
            tsFiles++;
            fileLinesArray.push(totalFileLines);

            // Ajouter les détails du fichier
            fileDetails.push({
                path: path.relative(process.cwd(), file),
                lines: totalFileLines,
                type: 'TS',
            });

            if (verbose) {
                console.log(
                    `   TS: ${path.relative(process.cwd(), file)} (${codeLines} lignes code, ${fileStyleLines} lignes style)`,
                );
            }
        }

        if (verbose) {
            console.log('');
        }
    }

    const totalCodeLines = jsLines + tsLines;
    const totalLines = totalCodeLines + styleLines;
    const jsTotalPercentage = totalCodeLines > 0 ? ((jsLines / totalLines) * 100).toFixed(2) : 0;
    const tsTotalPercentage = totalCodeLines > 0 ? ((tsLines / totalLines) * 100).toFixed(2) : 0;
    const styleTotalPercentage =
        totalCodeLines > 0 ? ((styleLines / totalLines) * 100).toFixed(2) : 0;
    const jsPercentage = totalCodeLines > 0 ? ((jsLines / totalCodeLines) * 100).toFixed(2) : 0;
    const tsPercentage = totalCodeLines > 0 ? ((tsLines / totalCodeLines) * 100).toFixed(2) : 0;

    // Calculer les statistiques par fichier
    const totalFiles = jsFiles + tsFiles;
    let averageLinesPerFile = 0;
    let medianLinesPerFile = 0;

    if (totalFiles > 0) {
        // Moyenne
        averageLinesPerFile = Math.round(totalLines / totalFiles);

        // Médiane
        const sortedFileLinesArray = [...fileLinesArray].sort((a, b) => a - b);
        if (sortedFileLinesArray.length % 2 === 0) {
            // Nombre pair de fichiers
            const mid1 = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2) - 1];
            const mid2 = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2)];
            medianLinesPerFile = Math.round((mid1 + mid2) / 2);
        } else {
            // Nombre impair de fichiers
            medianLinesPerFile = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2)];
        }
    }

    // Génération d'une barre de progression visuelle
    const barLength = 50;
    const jsBarLength = Math.round((jsLines / totalCodeLines) * barLength);
    const tsBarLength = barLength - jsBarLength;

    // Créer le top 5 des plus gros fichiers
    const top5Files = fileDetails.sort((a, b) => b.lines - a.lines).slice(0, 5);

    // Affichage des résultats
    console.log('📊 CODE LINE STATISTICS');
    console.log('=======================');
    console.log(`📄 JavaScript/JSX: ${jsFiles} files, ${jsLines} lines (${jsTotalPercentage}%)`);
    console.log(`📄 TypeScript/TSX: ${tsFiles} files, ${tsLines} lines (${tsTotalPercentage}%)`);
    console.log(`🎨 Style JSX/TSX: ${styleLines} lines (${styleTotalPercentage}%)`);
    console.log(`📄 Total: ${jsFiles + tsFiles} files, ${totalLines} lines`);
    console.log('');
    console.log('📈 RÉPARTITION:');
    console.log(`   JavaScript/JSX: ${jsPercentage}%`);
    console.log(`   TypeScript/TSX: ${tsPercentage}%`);
    console.log('');
    console.log('📊 VISUALISATION:');
    console.log(`[${'█'.repeat(tsBarLength)}${'░'.repeat(jsBarLength)}]`);
    console.log(`  TS/TSX: ${tsPercentage}%           JS/JSX: ${jsPercentage}%`);
    console.log('');
    console.log('📊 STATISTIQUES PAR FICHIER:');
    console.log(`   Médiane: ${medianLinesPerFile} lignes par fichier`);
    console.log(`   Moyenne: ${averageLinesPerFile} lignes par fichier`);
    console.log('');
    console.log('🏆 TOP 5 DES PLUS GROS FICHIERS:');
    top5Files.forEach((file, index) => {
        const rank = index + 1;
        const typeIcon = file.type === 'TS' ? '🔷' : '🔶';
        console.log(`   ${rank}. ${typeIcon} ${file.path} (${file.lines} lignes)`);
    });

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
        styles: {
            lines: styleLines,
        },
        total: {
            files: jsFiles + tsFiles,
            lines: totalLines,
            codeLines: totalCodeLines,
        },
        statistics: {
            averageLinesPerFile,
            medianLinesPerFile,
        },
        // Nouveau: top 5 des fichiers
        top5Files,
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
