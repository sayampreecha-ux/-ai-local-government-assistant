import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const publicRoots = ['.', 'access-system', 'Plain text', 'assets'];
const publicExtensions = new Set(['.html', '.htlm', '.js', '.json', '.txt', '.webmanifest']);
const excludedRootDirectories = new Set(['.git', '.github', '.pnpm-store', '.vercel', '.wrangler', 'api', 'dist', 'docs', 'lib', 'node_modules', 'scripts', 'src', 'supabase', 'test', 'tests']);
const forbiddenPatterns = [
  /const\s+SECRET\s*=/u,
  /const\s+ADMIN_HASH\s*=/u,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"\s]{16,}['"]/iu
];

async function walk(directory, isRoot = false) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || (isRoot && excludedRootDirectories.has(entry.name))) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (publicExtensions.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

const files = new Set();
for (const root of publicRoots) {
  for (const file of await walk(root, root === '.')) files.add(file);
}

const findings = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (forbiddenPatterns.some(pattern => pattern.test(content))) findings.push(file);
  if (/target\s*=\s*['"]_blank['"]/iu.test(content)) {
    for (const tag of content.match(/<a\b[^>]*target\s*=\s*['"]_blank['"][^>]*>/giu) || []) {
      if (!/rel\s*=\s*['"][^'"]*\bnoopener\b[^'"]*['"]/iu.test(tag)) findings.push(file);
    }
  }
}

assert.deepEqual(findings, [], `Security audit found unsafe public files: ${[...new Set(findings)].join(', ')}`);
const accessWorker = await readFile('src/search-worker.js', 'utf8');
assert.match(accessWorker, /env\.ACCESS_CODE_SECRET/u);
assert.match(accessWorker, /env\.ACCESS_ADMIN_PASSWORD_HASH/u);
assert.match(accessWorker, /env\.ACCESS_ADMIN_SESSION_SECRET/u);
assert.doesNotMatch(accessWorker, /console\.(?:log|warn|error)\([^\n]*(?:password|authorization|ACCESS_)/iu);
console.log('Public asset credential, external-link and Worker secret-binding audit passed.');
