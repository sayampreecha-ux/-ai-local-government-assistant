{
  "name": "govprompt-thailand-enterprise",
  "version": "5.0.0-222.1",
  "private": true,
  "type": "module",
  "engines": {
    "node": "24.x"
  },
  "scripts": {
    "dev": "npx vercel dev",
    "check": "node --check api/auth.mjs && node --check api/generate.mjs && node --check api/packages.mjs && node --check api/order.mjs && node --check api/order-lookup.mjs && node --check api/payment-proof.mjs && node --check api/admin-auth.mjs && node --check api/admin-codes.mjs && node --check api/admin-orders.mjs && node --check api/admin-stats.mjs && node --check api/health.mjs && node --check api/public-config.mjs && node --check lib/server.mjs && node --check lib/security.mjs && node --check lib/notifications.mjs && node --check lib/prompt-master.mjs && node --check lib/prompt-assembler.mjs && node --check catalog-public.js && node --check app.js && node --check setup.js && node --check admin.js",
    "test": "node --test",
    "preflight": "node scripts/preflight.mjs && node scripts/verify-drop-package.mjs",
    "validate": "npm run check && npm test && npm run preflight",
    "secrets": "node scripts/generate-secrets.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.110.7"
  }
}
