import { cleanText, enforceRateLimit, errorResponse, getSupabase, json, readJson, secureEqual, signSession } from "../lib/server.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      await enforceRateLimit(request, "order-lookup", 8, 60 * 60);
      const body = await readJson(request, 20_000);
      const requestRef = cleanText(body?.requestRef, 80).toUpperCase();
      const email = cleanText(body?.email, 200).toLowerCase();
      const phoneLast4 = cleanText(body?.phoneLast4, 4);
      if (!requestRef || !email || !/^\d{4}$/.test(phoneLast4)) return json({ error: "กรุณากรอกเลขอ้างอิง อีเมล และเลขท้ายโทรศัพท์ 4 หลัก" }, 400);
      const { data: order, error } = await getSupabase().from("orders")
        .select("id,request_ref,email,phone,package_name,price_thb,status")
        .eq("request_ref", requestRef).maybeSingle();
      if (error) throw error;
      if (!order || !secureEqual(order.email.toLowerCase(), email) || !String(order.phone).replace(/\D/g, "").endsWith(phoneLast4)) return json({ error: "ไม่พบคำสั่งซื้อหรือข้อมูลยืนยันไม่ตรงกัน" }, 404);
      if (["completed","cancelled"].includes(order.status)) return json({ error: "คำสั่งซื้อนี้ไม่สามารถส่งหลักฐานเพิ่มได้" }, 400);
      const proofToken = signSession({ orderId: order.id, requestRef: order.request_ref, exp: Date.now() + 30 * 60 * 1000 }, "proof");
      return json({
        proofToken, requestRef: order.request_ref, packageName: order.package_name, priceThb: order.price_thb,
        payment: {
          accountName: cleanText(process.env.PAYMENT_ACCOUNT_NAME, 160),
          promptPayId: cleanText(process.env.PAYMENT_PROMPTPAY_ID, 50),
          bankName: cleanText(process.env.PAYMENT_BANK_NAME, 100),
          accountNumber: cleanText(process.env.PAYMENT_ACCOUNT_NUMBER, 80)
        }
      });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถค้นหาคำสั่งซื้อได้");
    }
  }
};
