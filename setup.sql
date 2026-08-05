import { existsSync, readFileSync } from 'node:fs';
const required = ['index.html','package.json','vercel.json','api/health.mjs','api/public-config.mjs','setup.html','setup.js','owner-check.html','owner-check.js','supabase/setup.sql','catalog-public.js','lib/prompt-master.mjs'];
let failed = false;
for (const file of required) {
  if (!existsSync(file)) { console.error(`✗ missing ${file}`); failed = true; }
  else console.log(`✓ drop package ${file}`);
}
const forbidden = ['GovPrompt-Owner-Secrets', '.env.local', 'service-role-key.txt'];
for (const name of forbidden) {
  if (existsSync(name)) { console.error(`✗ secret file must not be included: ${name}`); failed = true; }
}
const envExample = readFileSync('.env.example','utf8');
if (/sk-[A-Za-z0-9_-]{20,}/.test(envExample)) { console.error('✗ possible OpenAI key in .env.example'); failed = true; }
if (failed) process.exit(1);
console.log('Vercel Drop package check passed.');
