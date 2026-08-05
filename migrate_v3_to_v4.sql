import { randomBytes } from 'node:crypto';

const token = (bytes = 32) => randomBytes(bytes).toString('base64url');
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const raw = randomBytes(12);
let suffix = '';
for (const byte of raw) suffix += alphabet[byte % alphabet.length];

console.log(`SESSION_SECRET=${token(48)}`);
console.log(`ADMIN_SESSION_SECRET=${token(48)}`);
console.log(`ADMIN_SECRET=${token(32)}`);
console.log(`MASTER_ACCESS_CODE=GP222-OWNER-${suffix}`);
console.log(`IP_HASH_SECRET=${token(48)}`);
