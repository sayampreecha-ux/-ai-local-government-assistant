import { randomUUID } from "node:crypto";
import { cleanText, enforceRateLimit, errorResponse, getSupabase, json, verifySession, writeAuditLog } from "./lib/server.mjs";
import { notifyPaymentProof } from "./lib/notifications.mjs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["application/pdf", "pdf"]
]);
const maxFileBytes = 2_500_000;

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 3_200_000) return json({ error: "ไฟล์มีขนาดใหญ่เกิน 2.5 MB" }, 413);
      await enforceRateLimit(request, "payment-proof", 8, 60 * 60);
      const form = await request.formData();
      const token = String(form.get("proofToken") || "");
      const requestRef = cleanText(form.get("requestRef"), 80).toUpperCase();
      const note = cleanText(form.get("paymentNote"), 500);
      const file = form.get("file");
      const proofSession = verifySession(token, "proof");
      if (!proofSession || proofSession.requestRef !== requestRef) return json({ error: "สิทธิ์ส่งหลักฐานหมดอายุ กรุณาส่งคำขอสั่งซื้อใหม่หรือติดต่อผู้ดูแล" }, 401);
      if (!file || typeof file.arrayBuffer !== "function") return json({ error: "กรุณาเลือกไฟล์หลักฐานการชำระเงิน" }, 400);
      if (!allowedTypes.has(file.type)) return json({ error: "รองรับเฉพาะ JPG, PNG, WEBP หรือ PDF" }, 400);
      if (file.size < 1 || file.size > maxFileBytes) return json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 2.5 MB" }, 400);

      const supabase = getSupabase();
      const { data: order, error: orderError } = await supabase.from("orders")
        .select("id,request_ref,full_name,package_name,price_thb,payment_proof_path,status")
        .eq("id", proofSession.orderId).eq("request_ref", requestRef).maybeSingle();
      if (orderError) throw orderError;
      if (!order || order.status === "cancelled" || order.status === "completed") return json({ error: "คำสั่งซื้อนี้ไม่สามารถส่งหลักฐานเพิ่มได้" }, 400);

      const extension = allowedTypes.get(file.type);
      const date = new Date().toISOString().slice(0, 10);
      const path = `${date}/${order.id}-${randomUUID()}.${extension}`;
      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, bytes, {
        contentType: file.type, cacheControl: "3600", upsert: false
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from("orders").update({
        payment_proof_path: path,
        payment_note: note,
        proof_submitted_at: new Date().toISOString(),
        status: "proof_submitted",
        updated_at: new Date().toISOString()
      }).eq("id", order.id);
      if (updateError) {
        await supabase.storage.from("payment-proofs").remove([path]).catch(() => {});
        throw updateError;
      }
      if (order.payment_proof_path) await supabase.storage.from("payment-proofs").remove([order.payment_proof_path]).catch(() => {});

      await writeAuditLog({ actorType: "customer", actorRef: requestRef, action: "payment_proof_uploaded", entityType: "order", entityId: order.id, details: { contentType: file.type, size: file.size } });
      await notifyPaymentProof({ requestRef, fullName: order.full_name, packageName: order.package_name, priceThb: order.price_thb });
      return json({ ok: true, requestRef, status: "proof_submitted" });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถอัปโหลดหลักฐานการชำระเงินได้");
    }
  }
};
