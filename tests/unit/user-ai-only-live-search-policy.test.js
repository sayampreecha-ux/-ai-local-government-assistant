import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SELF = path.relative(ROOT, fileURLToPath(import.meta.url));
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.html', '.css', '.json', '.md', '.txt', '.yml', '.yaml'
]);

function collectFiles(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(fullPath, result);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) result.push(fullPath);
  }
  return result;
}

function findViolations() {
  const patterns = [
    { name: 'GP-side liveSearchRequired=true', regex: /liveSearchRequired\s*:\s*true/giu },
    { name: 'old forced platform Web Search instruction', regex: /ใช้ Web Search ของแพลตฟอร์มนี้ทันที/gu },
    { name: 'GP-side live-search execution wording', regex: /GP\s*(?:เอง)?\s*(?:ทำ|เรียก|ดำเนินการ)\s*(?:ค้นสด|ค้นเว็บสด)/giu },
    { name: 'direct live-search execution flag', regex: /(?:performLiveSearch|executeLiveSearch|runLiveSearch)\s*\(/gu }
  ];
  const violations = [];
  for (const file of collectFiles(ROOT)) {
    const relative = path.relative(ROOT, file);
    if (relative === SELF) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        violations.push(`${relative}: ${pattern.name}`);
        pattern.regex.lastIndex = 0;
      }
    }
  }
  return violations;
}

test('repository-wide policy: live search is delegated to the user-selected AI', () => {
  const violations = findViolations();
  assert.deepEqual(violations, [], `Live-search policy violations found:\n${violations.join('\n')}`);
});
