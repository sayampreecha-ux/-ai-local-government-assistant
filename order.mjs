import { enforceRateLimit, errorResponse, getSupabase, hashCode, json, normalizeCode, readJson, signSession } from "./lib/server.mjs";

const allTools = ["official-letter","memo","meeting-invite","inquiry-letter","executive-summary","project-outline","risk-analysis","public-news","speech","document-review"];

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      await enforceRateLimit(request, "member-auth", 10, 15 * 60);
      const body = await readJson(request, 10_000);
      const code = normalizeCode(body?.code);
      if (!/^GP[A-Z0-9]{0,6}-[A-Z0-9-]{6,24}$/.test(code)) return json({ error: "รูปแบบรหัสไม่ถูกต้อง" }, 400);

      const masterCode = normalizeCode(process.env.MASTER_ACCESS_CODE);
      if (masterCode && code === masterCode) {
        const member = { ownerName: "ผู้ดูแลระบบ", orderId: "OWNER", packageId: "master", packageName: "Master", allowedTools: allTools, remainingUses: null, expiresAt: null };
        const token = signSession({ ...member, codeId: "MASTER", master: true, exp: Date.now() + 8 * 60 * 60 * 1000 });
        return json({ token, member });
      }

      const supabase = getSupabase();
      const { data: record, error } = await supabase.from("access_codes")
        .select("id,owner_name,order_id,package_id,package_name,allowed_tools,active,uses,max_uses,expires_at")
        .eq("code_hash", hashCode(code)).maybeSingle();
      if (error) throw error;
      if (!record || !record.active) return json({ error: "ไม่พบรหัสหรือสิทธิ์ถูกระงับ" }, 401);
      if (Date.now() >= Date.parse(record.expires_at)) return json({ error: "รหัสหมดอายุแล้ว" }, 401);
      if (record.uses >= record.max_uses) return json({ error: "รหัสใช้ครบตามจำนวนที่กำหนดแล้ว" }, 401);

      const member = {
        ownerName: record.owner_name,
        orderId: record.order_id,
        packageId: record.package_id,
        packageName: record.package_name,
        allowedTools: Array.isArray(record.allowed_tools) ? record.allowed_tools : [],
        remainingUses: Math.max(0, record.max_uses - record.uses),
        expiresAt: record.expires_at
      };
      const token = signSession({ ...member, codeId: record.id, exp: Date.now() + 8 * 60 * 60 * 1000 });
      return json({ token, member });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถตรวจสอบรหัสได้");
    }
  }
};
