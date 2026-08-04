import { cleanText, enforceRateLimit, errorResponse, getSupabase, json, readJson, verifyAdminRequest, writeAuditLog } from "./lib/server.mjs";

const allowedStatuses = new Set(["pending","contacted","awaiting_payment","proof_submitted","paid","completed","cancelled"]);
const fields = "id,request_ref,package_id,package_name,price_thb,full_name,organization,phone,email,contact,customer_note,status,payment_proof_path,payment_note,proof_submitted_at,paid_at,activated_at,submitted_at,updated_at";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      if (!verifyAdminRequest(request)) return json({ error: "กรุณาเข้าสู่ระบบผู้ดูแลใหม่" }, 401);
      await enforceRateLimit(request, "admin-orders", 180, 60 * 60);
      const body = await readJson(request, 30_000);
      const supabase = getSupabase();

      if (body.action === "list") {
        let query = supabase.from("orders").select(fields).order("submitted_at", { ascending: false }).limit(300);
        const status = cleanText(body.status, 30);
        if (status && allowedStatuses.has(status)) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) throw error;
        return json({ orders: (data || []).map(mapOrder) });
      }

      if (body.action === "set-status") {
        const id = cleanText(body.id, 80);
        const status = cleanText(body.status, 30);
        if (!allowedStatuses.has(status)) return json({ error: "สถานะไม่ถูกต้อง" }, 400);
        const now = new Date().toISOString();
        const patch = { status, updated_at: now };
        if (status === "paid") patch.paid_at = now;
        if (status === "completed") patch.activated_at = now;
        const { data, error } = await supabase.from("orders").update(patch).eq("id", id).select(fields).maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "ไม่พบคำขอสั่งซื้อ" }, 404);
        await writeAuditLog({ actorType: "admin", actorRef: "admin", action: "order_status_changed", entityType: "order", entityId: id, details: { status } });
        return json({ order: mapOrder(data) });
      }

      if (body.action === "proof-url") {
        const id = cleanText(body.id, 80);
        const { data: order, error } = await supabase.from("orders").select("payment_proof_path").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!order?.payment_proof_path) return json({ error: "คำสั่งซื้อนี้ยังไม่มีหลักฐาน" }, 404);
        const { data, error: signedError } = await supabase.storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 300);
        if (signedError) throw signedError;
        return json({ url: data.signedUrl, expiresIn: 300 });
      }

      return json({ error: "คำสั่งไม่ถูกต้อง" }, 400);
    } catch (error) {
      return errorResponse(error, "ระบบจัดการคำสั่งซื้อขัดข้อง");
    }
  }
};

function mapOrder(row) {
  return {
    id: row.id, requestRef: row.request_ref, packageId: row.package_id, packageName: row.package_name,
    priceThb: row.price_thb, fullName: row.full_name, organization: row.organization, phone: row.phone,
    email: row.email, contact: row.contact, customerNote: row.customer_note, status: row.status,
    hasPaymentProof: Boolean(row.payment_proof_path), paymentNote: row.payment_note,
    proofSubmittedAt: row.proof_submitted_at, paidAt: row.paid_at, activatedAt: row.activated_at,
    submittedAt: row.submitted_at, updatedAt: row.updated_at
  };
}
