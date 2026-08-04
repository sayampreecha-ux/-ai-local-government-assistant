import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html", "admin.html", "app.js", "admin.js", "styles.css",
  "api/auth.mjs", "api/generate.mjs", "api/packages.mjs", "api/order.mjs",
  "api/order-lookup.mjs", "api/payment-proof.mjs", "api/admin-auth.mjs",
  "api/admin-codes.mjs", "api/admin-orders.mjs", "api/admin-stats.mjs",
  "api/health.mjs", "api/public-config.mjs", "lib/server.mjs",
  "lib/security.mjs", "lib/notifications.mjs", "lib/catalog.mjs",
  "lib/prompt-master.mjs", "lib/prompt-assembler.mjs", "catalog-public.js",
  "PROMPT_CATALOG_222.json", "supabase/setup.sql",
  "supabase/migrate_v3_to_v4.sql", ".env.example", "vercel.json"
];

let failed = false;
for (const file of requiredFiles) {
  try { await access(file); }
  catch { failed = true; console.error(`missing ${file}`); }
}

const envExample = await readFile(".env.example", "utf8").catch(() => "");
for (const name of [
  "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SESSION_SECRET",
  "ADMIN_SESSION_SECRET", "ADMIN_SECRET", "MASTER_ACCESS_CODE",
  "IP_HASH_SECRET", "RESEND_API_KEY", "EMAIL_FROM", "ADMIN_EMAIL",
  "LINE_CHANNEL_ACCESS_TOKEN", "LINE_ADMIN_USER_ID",
  "PAYMENT_PROMPTPAY_ID", "SALES_ENABLED"
]) {
  if (!envExample.includes(`${name}=`)) {
    failed = true;
    console.error(`.env.example missing ${name}`);
  }
}

if (failed) process.exit(1);
console.log("Enterprise structure check passed.");
