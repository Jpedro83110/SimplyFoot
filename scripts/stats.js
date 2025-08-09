const fs = require('fs');
const path = require('path');

// Directories to analyze
const SOURCE_DIRS = ['app', 'components', 'context', 'helpers', 'hooks', 'types', 'lib', 'utils'];

// File extensions
const JS_EXTENSIONS = ['.js', '.jsx'];
const TS_EXTENSIONS = ['.ts', '.tsx'];

// Patterns to exclude test files
const TEST_PATTERNS = [/__tests__/, /\.test\./, /\.spec\./];

/**
 * Checks if a file is a test file
 */
function isTestFile(filePath) {
    return TEST_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Checks if a line should be excluded from code counting
 */
function shouldExcludeLine(trimmedLine) {
    // Exclude empty lines
    if (trimmedLine.length === 0) {
        return true;
    }

    // Exclude comment lines (single-line and multi-line)
    if (
        trimmedLine.startsWith('//') ||
        trimmedLine.startsWith('/*') ||
        trimmedLine.startsWith('*') ||
        trimmedLine.endsWith('*/')
    ) {
        return true;
    }

    // Exclude lines containing only console statements
    const consoleRegex = /^\s*console\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?\s*$/;
    if (consoleRegex.test(trimmedLine)) {
        return true;
    }

    return false;
}

/**
 * Counts lines by separating logical code from styles, excluding comments and console statements
 */
function countLinesWithStyles(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        let codeLines = 0;
        let styleLines = 0;
        let inStyleSheet = false;
        let inMultiLineComment = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Handle multi-line comments
            if (trimmedLine.includes('/*') && !trimmedLine.includes('*/')) {
                inMultiLineComment = true;
                continue;
            }
            if (inMultiLineComment) {
                if (trimmedLine.includes('*/')) {
                    inMultiLineComment = false;
                }
                continue;
            }

            // Check if line should be excluded
            if (shouldExcludeLine(trimmedLine)) {
                continue;
            }

            // Detect the beginning of a StyleSheet.create
            if (trimmedLine.includes('StyleSheet.create(')) {
                inStyleSheet = true;
                braceCount = 0;
                styleLines++;
                continue;
            }

            if (inStyleSheet) {
                // Count opening and closing braces
                for (let char of trimmedLine) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                    }
                }

                styleLines++;

                // If we close all braces, we exit the StyleSheet
                if (braceCount < 0) {
                    inStyleSheet = false;
                }
            } else {
                // Normal code line
                codeLines++;
            }
        }

        return { codeLines, styleLines };
    } catch (error) {
        console.warn(`Error reading file ${filePath}:`, error.message);
        return { codeLines: 0, styleLines: 0 };
    }
}

/**
 * Recursively traverses a directory and finds all files
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
            console.warn(`Error traversing directory ${currentDir}:`, error.message);
        }
    }

    traverse(dir);
    return files;
}

/**
 * Analyzes files in source directories
 */
function analyzeCodebase(options = {}) {
    const { verbose = false } = options;
    let jsLines = 0;
    let jsFiles = 0;
    let tsLines = 0;
    let tsFiles = 0;
    let styleLines = 0;

    // New: array to store line count per file with details
    const fileLinesArray = [];
    const fileDetails = []; // New: to store details of each file

    if (verbose) {
        console.log('🔍 Analyzing source files (excluding comments and console statements)...\n');
    }

    for (const sourceDir of SOURCE_DIRS) {
        const dirPath = path.resolve(sourceDir);

        if (!fs.existsSync(dirPath)) {
            if (verbose) {
                console.warn(`⚠️  Directory ${sourceDir} does not exist`);
            }
            continue;
        }

        if (verbose) {
            console.log(`📁 Analyzing directory: ${sourceDir}`);
        }

        // Analyze JavaScript/JSX files
        const jsFilesInDir = findFiles(dirPath, JS_EXTENSIONS);
        for (const file of jsFilesInDir) {
            const { codeLines, styleLines: fileStyleLines } = countLinesWithStyles(file);
            const totalFileLines = codeLines + fileStyleLines;
            jsLines += codeLines;
            styleLines += fileStyleLines;
            jsFiles++;
            fileLinesArray.push(totalFileLines);

            // Add file details
            fileDetails.push({
                path: path.relative(process.cwd(), file),
                lines: totalFileLines,
                type: 'JS',
            });

            if (verbose) {
                console.log(
                    `   JS: ${path.relative(process.cwd(), file)} (${codeLines} code lines, ${fileStyleLines} style lines)`,
                );
            }
        }

        // Analyze TypeScript/TSX files
        const tsFilesInDir = findFiles(dirPath, TS_EXTENSIONS);
        for (const file of tsFilesInDir) {
            const { codeLines, styleLines: fileStyleLines } = countLinesWithStyles(file);
            const totalFileLines = codeLines + fileStyleLines;
            tsLines += codeLines;
            styleLines += fileStyleLines;
            tsFiles++;
            fileLinesArray.push(totalFileLines);

            // Add file details
            fileDetails.push({
                path: path.relative(process.cwd(), file),
                lines: totalFileLines,
                type: 'TS',
            });

            if (verbose) {
                console.log(
                    `   TS: ${path.relative(process.cwd(), file)} (${codeLines} code lines, ${fileStyleLines} style lines)`,
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

    // Calculate statistics per file
    const totalFiles = jsFiles + tsFiles;
    let averageLinesPerFile = 0;
    let medianLinesPerFile = 0;

    if (totalFiles > 0) {
        // Average
        averageLinesPerFile = Math.round(totalLines / totalFiles);

        // Median
        const sortedFileLinesArray = [...fileLinesArray].sort((a, b) => a - b);
        if (sortedFileLinesArray.length % 2 === 0) {
            // Even number of files
            const mid1 = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2) - 1];
            const mid2 = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2)];
            medianLinesPerFile = Math.round((mid1 + mid2) / 2);
        } else {
            // Odd number of files
            medianLinesPerFile = sortedFileLinesArray[Math.floor(sortedFileLinesArray.length / 2)];
        }
    }

    // Generate a visual progress bar
    const barLength = 50;
    const jsBarLength = Math.round((jsLines / totalCodeLines) * barLength);
    const tsBarLength = barLength - jsBarLength;

    // Create top 5 largest files
    const top5Files = fileDetails.sort((a, b) => b.lines - a.lines).slice(0, 5);

    // Display results
    console.log('📊 CODE LINE STATISTICS (excluding comments and console statements)');
    console.log('====================================================================');
    console.log(`📄 JavaScript/JSX: ${jsFiles} files, ${jsLines} lines (${jsTotalPercentage}%)`);
    console.log(`📄 TypeScript/TSX: ${tsFiles} files, ${tsLines} lines (${tsTotalPercentage}%)`);
    console.log(`🎨 Style JSX/TSX: ${styleLines} lines (${styleTotalPercentage}%)`);
    console.log(`📄 Total: ${jsFiles + tsFiles} files, ${totalLines} lines`);
    console.log('');
    console.log('📈 DISTRIBUTION:');
    console.log(`   JavaScript/JSX: ${jsPercentage}%`);
    console.log(`   TypeScript/TSX: ${tsPercentage}%`);
    console.log('');
    console.log('📊 VISUALIZATION:');
    console.log(`[${'█'.repeat(tsBarLength)}${'▁'.repeat(jsBarLength)}]`);
    console.log(`  TS/TSX: ${tsPercentage}%           JS/JSX: ${jsPercentage}%`);
    console.log('');
    console.log('📊 STATISTICS PER FILE:');
    console.log(`   Median: ${medianLinesPerFile} lines per file`);
    console.log(`   Average: ${averageLinesPerFile} lines per file`);
    console.log('');
    console.log('🏆 TOP 5 LARGEST FILES:');
    top5Files.forEach((file, index) => {
        const rank = index + 1;
        const typeIcon = file.type === 'TS' ? '🔷' : '🔶';
        console.log(`   ${rank}. ${typeIcon} ${file.path} (${file.lines} lines)`);
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
        // New: top 5 files
        top5Files,
    };
}

// Script execution
if (require.main === module) {
    // Check if verbose option is passed as argument
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

    try {
        analyzeCodebase({ verbose });
    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        process.exit(1);
    }
}

module.exports = { analyzeCodebase };
