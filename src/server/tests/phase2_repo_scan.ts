import fs from 'fs';
import path from 'path';

interface ScanResult {
  term: string;
  count: number;
  occurrences: { file: string; line: number; text: string }[];
}

const termsToScan = [
  'TODO',
  'FIXME',
  'placeholder',
  'coming soon',
  'mock',
  'demo',
  'sample',
  'fake',
  'hardcoded',
  'setTimeout',
  'Math.random',
  'random',
  'seed',
  'localStorage',
  'sessionStorage',
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === '.data' || file === '.data_test' || file === '.data_phase2_audit') {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(ts|tsx|js|json|css|html)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runRepoScan() {
  console.log('================================================================');
  console.log('  LIFE OS — REPOSITORY PLACEHOLDER & CODE QUALITY SCAN');
  console.log('================================================================\n');

  const files = scanDirectory(process.cwd());
  console.log(`Scanning ${files.length} source files across codebase...\n`);

  const results: Record<string, ScanResult> = {};
  for (const term of termsToScan) {
    results[term] = { term, count: 0, occurrences: [] };
  }

  for (const filePath of files) {
    const relPath = path.relative(process.cwd(), filePath);
    // Ignore test files for TODO count
    if (relPath.includes('src/server/tests/')) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const term of termsToScan) {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(line)) {
          results[term].count++;
          if (results[term].occurrences.length < 5) {
            results[term].occurrences.push({
              file: relPath,
              line: index + 1,
              text: line.trim().slice(0, 100),
            });
          }
        }
      }
    });
  }

  for (const [term, data] of Object.entries(results)) {
    console.log(`[TERM: "${term}"] Found ${data.count} occurrence(s)`);
    if (data.occurrences.length > 0) {
      data.occurrences.slice(0, 3).forEach((occ) => {
        console.log(`   - ${occ.file}:${occ.line} -> "${occ.text}"`);
      });
    }
  }

  console.log('\n================================================================\n');
}

runRepoScan();
