import {
  cleanText, enforceRateLimit, errorResponse, generateAccessCode, getSupabase,
  hashCode, json, maskCode, readJson, verifyAdminRequest, writeAuditLog
} from "../lib/server.mjs";
import { notifyActivation } from "../lib/notifications.mjs";

const selectFields = "id,owner_name,customer_email,order_id,package_id,package_name,allowed_tools,masked_code,active,uses,max_uses,created_at,expires_at,last_used_at";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const admin = verifyAdminRequest(request);
      if (!admin) return json({ error: "กรุณาเข้าสู่ระบบผู้ดูแลใหม่" }, 401);
      await enforceRateLimit(request, "admin-codes", 120, 60 * 60);
      const body = await readJson(request, 40_000);
      const supabase = getSupabase();

      if (body.action === "create") {
        let ownerName = cleanText(body.ownerName, 160);
        let customerEmail = cleanText(body.customerEmail, 200).toLowerCase();
        const orderId = cleanText(body.orderId, 80).toUpperCase();
        let packageId = cleanText(body.packageId, 60) || "starter-222";
        if (!orderId) return json({ error: "กรุณาระบุเลขคำสั่งซื้อ" }, 400);

        const { data: order, error: orderError } = await supabase.from("orders")
          .select("id,request_ref,full_name,email,package_id,package_name,status")
          .eq("request_ref", orderId).maybeSingle();
        if (orderError) throw orderError;
        const { data: existingCode, error: existingError } = await supabase.from("access_codes")
          .select("id,masked_code,active").eq("order_id", orderId).maybeSingle();
        if (existingError && existingError.code !== "PGRST116") throw existingError;
        if (existingCode) return json({ error: `คำสั่งซื้อนี้มีรหัสแล้ว (${existingCode.masked_code})` }, 409);
        if (order) {
          ownerName = ownerName || order.full_name;
          customerEmail = customerEmail || order.email;
          packageId = order.package_id;
        }
        if (!ownerName) return json({ error: "กรุณาระบุชื่อผู้ซื้อ" }, 400);

        const { data: pkg, error: packageError } = await supabase.from("packages")
          .select("id,name,max_uses,expiry_days,allowed_tools,active").eq("id", packageId).maybeSingle();
        if (packageError) throw packageError;
        if (!pkg?.active) return json({ error: "ไม่พบแพ็กเกจที่เปิดใช้งาน" }, 400);

        const maxUses = Math.min(5000, Math.max(1, Number(body.maxUses) || pkg.max_uses));
        const expiryDays = Math.min(1095, Math.max(1, Number(body.expiryDays) || pkg.expiry_days));
        const prefix = packageId.includes("222") ? "GP222" : packageId.includes("599") ? "GP599" : packageId.includes("999") ? "GP999" : "GP";

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = generateAccessCode(prefix);
          const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();
          const record = {
            code_hash: hashCode(code), masked_code: maskCode(code), owner_name: ownerName,
            customer_email: customerEmail, order_id: orderId, package_id: pkg.id, package_name: pkg.name,
            allowed_tools: pkg.allowed_tools || [], active: true, uses: 0, max_uses: maxUses, expires_at: expiresAt
          };
          const { data, error } = await supabase.from("access_codes").insert(record).select(selectFields).single();
          if (!error) {
            if (order) await supabase.from("orders").update({ status: "completed", activated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
            const notification = await notifyActivation({ fullName: ownerName, email: customerEmail, requestRef: orderId, packageName: pkg.name, code, expiresAt, maxUses });
            await writeAuditLog({ actorType: "admin", actorRef: "admin", action: "access_code_created", entityType: "access_code", entityId: data.id, details: { orderId, packageId: pkg.id, maxUses, expiryDays } });
            return json({ code, record: mapCode(data), notification });
          }
          if (error.code !== "23505") throw error;
        }
        return json({ error: "ไม่สามารถสุ่มรหัสที่ไม่ซ้ำได้ กรุณาลองใหม่" }, 500);
      }

      if (body.action === "list") {
        const { data, error } = await supabase.from("access_codes").select(selectFields).order("created_at", { ascending: false }).limit(500);
        if (error) throw error;
        return json({ codes: (data || []).map(mapCode) });
      }

      if (body.action === "set-active") {
        const id = cleanText(body.id, 80);
        const active = Boolean(body.active);
        const { data, error } = await supabase.from("access_codes").update({ active }).eq("id", id).select(selectFields).maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "ไม่พบรหัส" }, 404);
        await writeAuditLog({ actorType: "admin", actorRef: "admin", action: active ? "access_code_enabled" : "access_code_disabled", entityType: "access_code", entityId: id });
        return json({ code: mapCode(data) });
      }

      return json({ error: "คำสั่งไม่ถูกต้อง" }, 400);
    } catch (error) {
      return errorResponse(error, "ระบบจัดการรหัสขัดข้อง");
    }
  }
};

function mapCode(row) {
  return {
    id: row.id, ownerName: row.owner_name, customerEmail: row.customer_email, orderId: row.order_id,
    packageId: row.package_id, packageName: row.package_name, allowedTools: row.allowed_tools || [],
    maskedCode: row.masked_code, active: row.active, uses: row.uses, maxUses: row.max_uses,
    createdAt: row.created_at, expiresAt: row.expires_at, lastUsedAt: row.last_used_at
  };
}
