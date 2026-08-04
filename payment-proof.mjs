import { enforceRateLimit, errorResponse, json, readJson, signSession, verifyAdminSecret } from "./lib/server.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      await enforceRateLimit(request, "admin-auth", 5, 15 * 60);
      const body = await readJson(request, 10_000);
      if (!verifyAdminSecret(body?.adminSecret)) return json({ error: "รหัสผู้ดูแลไม่ถูกต้อง" }, 401);
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
      const token = signSession({ role: "admin", exp: expiresAt }, "admin");
      return json({ token, expiresAt });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถเข้าสู่ระบบผู้ดูแลได้");
    }
  }
};
