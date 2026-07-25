import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html','admin.html','app.js','admin.js','styles.css',
  'api/auth.mjs','api/generate.mjs','api/packages.mjs','api/order.mjs','api/order-lookup.mjs','api/payment-proof.mjs',
  'api/admin-auth.mjs','api/admin-codes.mjs','api/admin-orders.mjs','api/admin-stats.mjs','api/health.mjs','api/public-config.mjs',
  'lib/server.mjs','lib/security.mjs','lib/notifications.mjs','lib/catalog.mjs','lib/prompt-master.mjs','lib/prompt-assembler.mjs','catalog-public.js','PROMPT_CATALOG_222.json',
  'supabase/setup.sql','supabase/migrate_v3_to_v4.sql','vercel.json','package.json','setup.html','setup.js','GO_LIVE_NEXT.md','RELEASE_NOTES_V4.2.md'
];
let failed=false;
for(const file of requiredFiles){try{await access(file);console.log(`✓ ${file}`);}catch{failed=true;console.error(`✗ missing ${file}`);}}
const envExample=await readFile('.env.example','utf8');
for(const name of ['SUPABASE_URL','SUPABASE_SECRET_KEY','SESSION_SECRET','ADMIN_SESSION_SECRET','ADMIN_SECRET','MASTER_ACCESS_CODE','IP_HASH_SECRET','RESEND_API_KEY','EMAIL_FROM','ADMIN_EMAIL','LINE_CHANNEL_ACCESS_TOKEN','LINE_ADMIN_USER_ID','PAYMENT_PROMPTPAY_ID','SALES_ENABLED']){
  if(!envExample.includes(`${name}=`)){failed=true;console.error(`✗ .env.example missing ${name}`);}
}
const sourceFiles=['index.html','app.js','admin.js','api/order.mjs','api/payment-proof.mjs','api/generate.mjs'];
for(const file of sourceFiles){const text=await readFile(file,'utf8');if(/sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|service_role\s*=\s*['"][^'"]+/i.test(text)){failed=true;console.error(`✗ possible secret in ${file}`);}}
if(failed)process.exit(1);
console.log('\nPreflight passed. GovPrompt Thailand Enterprise 5.0 / 222 Prompt is structurally ready for Vercel deployment.');
