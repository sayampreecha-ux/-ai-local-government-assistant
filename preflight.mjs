import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  cleanText, envFlag, envValue, generateAccessCode, generateRequestRef, hashCode, maskCode,
  normalizeCode, secureEqual, signSession, verifyAdminSecret, verifySession
} from "./security.mjs";

let supabaseClient;

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff"
    }
  });
}

export function env(name, required = true) {
  return envValue(name, required);
}

export function isSupabaseConfigured() {
  return Boolean(env("SUPABASE_URL", false) && (env("SUPABASE_SECRET_KEY", false) || env("SUPABASE_SERVICE_ROLE_KEY", false)));
}

export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = env("SUPABASE_URL");
  const secret = env("SUPABASE_SECRET_KEY", false) || env("SUPABASE_SERVICE_ROLE_KEY", false);
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not configured");
  supabaseClient = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  return supabaseClient;
}

export async function readJson(request, maxBytes = 160_000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > maxBytes) {
    const error = new Error("PAYLOAD_TOO_LARGE");
    error.status = 413;
    throw error;
  }
  try {
    return await request.json();
  } catch {
    const error = new Error("INVALID_JSON");
    error.status = 400;
    throw error;
  }
}

export {
  cleanText, envFlag, generateAccessCode, generateRequestRef, hashCode, maskCode,
  normalizeCode, secureEqual, signSession, verifyAdminSecret, verifySession
};

export function verifyAdminRequest(request) {
  return verifySession(bearerToken(request), "admin");
}

export function hashClientIp(request) {
  const raw = String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
    .split(",")[0].trim().slice(0, 120);
  const secret = env("IP_HASH_SECRET", false) || env("SESSION_SECRET");
  return createHmac("sha256", secret).update(raw).digest("hex");
}

export async function enforceRateLimit(request, scope, limit, windowSeconds, discriminator = "") {
  if (!isSupabaseConfigured()) return;
  const source = `${scope}:${hashClientIp(request)}:${String(discriminator || "").slice(0, 120)}`;
  const rateKey = createHmac("sha256", env("IP_HASH_SECRET", false) || env("SESSION_SECRET")).update(source).digest("hex");
  const { data, error } = await getSupabase().rpc("consume_rate_limit", {
    p_rate_key: rateKey,
    p_limit: Math.max(1, Number(limit) || 1),
    p_window_seconds: Math.max(1, Number(windowSeconds) || 60)
  });
  if (error) throw error;
  if (data !== true) {
    const rateError = new Error("RATE_LIMITED");
    rateError.status = 429;
    throw rateError;
  }
}

export function bearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function writeAuditLog({ actorType = "system", actorRef = "", action, entityType = "", entityId = "", details = {} }) {
  try {
    if (!isSupabaseConfigured()) return;
    await getSupabase().from("audit_logs").insert({
      actor_type: cleanText(actorType, 30),
      actor_ref: cleanText(actorRef, 160),
      action: cleanText(action, 100),
      entity_type: cleanText(entityType, 60),
      entity_id: cleanText(entityId, 160),
      details
    });
  } catch (error) {
    console.error("audit log failed", error);
  }
}

export function errorResponse(error, fallback) {
  const status = Number(error?.status) || 500;
  if (error?.message === "PAYLOAD_TOO_LARGE") return json({ error: "ข้อมูลมีขนาดใหญ่เกินกำหนด" }, 413);
  if (error?.message === "INVALID_JSON") return json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, 400);
  if (error?.message === "RATE_LIMITED") return json({ error: "มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" }, 429);
  console.error(error);
  return json({ error: fallback }, status >= 400 && status < 600 ? status : 500);
}
