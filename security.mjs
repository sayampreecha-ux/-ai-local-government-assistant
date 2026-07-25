import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function envValue(name, required = true) {
  const value = String(process.env[name] || "").trim();
  if (required && !value) throw new Error(`${name} is not configured`);
  return value;
}


export function envFlag(name, defaultValue = false) {
  const value = envValue(name, false).toLowerCase();
  if (!value) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value);
}

export function normalizeCode(input) {
  return String(input ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function hashCode(code) {
  return createHash("sha256").update(String(code ?? "")).digest("hex");
}

export function maskCode(code) {
  const normalized = normalizeCode(code);
  return `${normalized.slice(0, 6)}••••${normalized.slice(-3)}`;
}

export function cleanText(value, max = 500) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max).trim();
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signingSecret(kind = "member") {
  if (kind === "admin") return envValue("ADMIN_SESSION_SECRET", false) || envValue("SESSION_SECRET");
  return envValue("SESSION_SECRET");
}

export function signSession(payload, kind = "member") {
  const secret = signingSecret(kind);
  const body = b64url(JSON.stringify({ ...payload, kind }));
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(token, expectedKind = "member") {
  try {
    const secret = signingSecret(expectedKind);
    const [body, signature] = String(token || "").split(".");
    if (!body || !signature) return null;
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    if (!secureEqual(signature, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.kind !== expectedKind || !payload.exp || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function secureEqual(a, b) {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminSecret(input) {
  const configured = envValue("ADMIN_SECRET", false);
  const supplied = String(input ?? "");
  return Boolean(configured && supplied && secureEqual(configured, supplied));
}

export function generateAccessCode(prefix = "GP222") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  const safePrefix = cleanText(prefix, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "GP";
  return `${safePrefix}-${suffix}`;
}

export function generateRequestRef() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `REQ-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
