import {
  cleanText, enforceRateLimit, envFlag, errorResponse, generateRequestRef, getSupabase,
  hashClientIp, json, readJson, signSession, writeAuditLog
} from "./lib/server.mjs";
import { notifyNewOrder } from "./lib/notifications.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      if (!envFlag("SALES_ENABLED", false)) {
        return json({ error: "ระบบยังไม่เปิดรับคำสั่งซื้อ กรุณารอประกาศเปิดขาย" }, 503);
      }
      const body = await readJson(request, 50_000);
      if (cleanText(body?.botField, 200)) return json({ ok: true, requestRef: "RECEIVED" });

      const packageId = cleanText(body?.packageId, 60);
      const fullName = cleanText(body?.fullName, 160);
      const organization = cleanText(body?.organization, 200);
      const phone = cleanText(body?.phone, 50);
      const email = cleanText(body?.email, 200).toLowerCase();
      const contact = cleanText(body?.contact, 200);
      const customerNote = cleanText(body?.customerNote, 1000);
      const acceptTerms = body?.acceptTerms === true;
      const acceptPrivacy = body?.acceptPrivacy === true;

      if (!packageId || !fullName || !organization || !phone || !email || !contact) return json({ error: "กรุณากรอกข้อมูลให้ครบ" }, 400);
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, 400);
      if (!acceptTerms || !acceptPrivacy) return json({ error: "กรุณายอมรับเงื่อนไขและประกาศความเป็นส่วนตัว" }, 400);

      await enforceRateLimit(request, "order", 5, 60 * 60);
      const supabase = getSupabase();
      const { data: pkg, error: packageError } = await supabase.from("packages")
        .select("id,name,price_thb,max_uses,expiry_days,active").eq("id", packageId).maybeSingle();
      if (packageError) throw packageError;
      if (!pkg?.active) return json({ error: "แพ็กเกจนี้ไม่เปิดรับคำสั่งซื้อ" }, 400);

      const ipHash = hashClientIp(request);
      let requestRef;
      let order;
      let insertError;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        requestRef = generateRequestRef();
        const { data, error } = await supabase.from("orders").insert({
          request_ref: requestRef,
          package_id: pkg.id,
          package_name: pkg.name,
          price_thb: pkg.price_thb,
          full_name: fullName,
          organization,
          phone,
          email,
          contact,
          customer_note: customerNote,
          status: "awaiting_payment",
          accepted_terms: true,
          accepted_privacy: true,
          terms_version: "2026-07-22-v4",
          privacy_version: "2026-07-22-v4",
          ip_hash: ipHash,
          user_agent: cleanText(request.headers.get("user-agent"), 500)
        }).select("id,request_ref,package_id,package_name,price_thb,full_name,organization,phone,email,contact,status,submitted_at").single();
        if (!error) { order = data; insertError = null; break; }
        insertError = error;
        if (error.code !== "23505") break;
      }
      if (insertError) throw insertError;

      const proofToken = signSession({ orderId: order.id, requestRef: order.request_ref, exp: Date.now() + 30 * 60 * 1000 }, "proof");
      await writeAuditLog({ actorType: "customer", actorRef: order.request_ref, action: "order_created", entityType: "order", entityId: order.id, details: { packageId: pkg.id, priceThb: pkg.price_thb } });
      await notifyNewOrder({
        requestRef: order.request_ref, packageName: order.package_name, priceThb: order.price_thb,
        fullName: order.full_name, organization: order.organization, phone: order.phone, email: order.email
      });

      return json({
        ok: true,
        requestRef: order.request_ref,
        proofToken,
        package: { id: pkg.id, name: pkg.name, priceThb: pkg.price_thb, maxUses: pkg.max_uses, expiryDays: pkg.expiry_days },
        payment: {
          accountName: cleanText(process.env.PAYMENT_ACCOUNT_NAME, 160),
          promptPayId: cleanText(process.env.PAYMENT_PROMPTPAY_ID, 50),
          bankName: cleanText(process.env.PAYMENT_BANK_NAME, 100),
          accountNumber: cleanText(process.env.PAYMENT_ACCOUNT_NUMBER, 80)
        }
      }, 201);
    } catch (error) {
      return errorResponse(error, "ไม่สามารถบันทึกคำขอสั่งซื้อได้ กรุณาลองใหม่");
    }
  }
};
