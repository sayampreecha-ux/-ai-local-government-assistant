import { cleanText, env, getSupabase, isSupabaseConfigured } from "./lib/server.mjs";

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

async function logNotification(channel, event, recipient, status, detail = "") {
  try {
    if (!isSupabaseConfigured()) return;
    await getSupabase().from("notification_logs").insert({
      channel: cleanText(channel, 30), event: cleanText(event, 80), recipient: cleanText(recipient, 220),
      status: cleanText(status, 30), detail: cleanText(detail, 1000)
    });
  } catch (error) {
    console.error("notification log failed", error);
  }
}

export async function sendEmail({ to, subject, html, text, event = "general", idempotencyKey = "" }) {
  const apiKey = env("RESEND_API_KEY", false);
  const from = env("EMAIL_FROM", false);
  const recipient = cleanText(to, 300);
  if (!apiKey || !from || !recipient) return { skipped: true, reason: "email_not_configured" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        ...(idempotencyKey ? { "idempotency-key": cleanText(idempotencyKey, 250) } : {})
      },
      body: JSON.stringify({ from, to: [recipient], subject: cleanText(subject, 200), html, text }),
      signal: AbortSignal.timeout(10_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `Resend ${response.status}`);
    await logNotification("email", event, recipient, "sent", data?.id || "");
    return { sent: true, id: data?.id || null };
  } catch (error) {
    await logNotification("email", event, recipient, "failed", error.message);
    console.error("email notification failed", error);
    return { sent: false, error: error.message };
  }
}

export async function sendLineAdmin(text, event = "general") {
  const token = env("LINE_CHANNEL_ACCESS_TOKEN", false);
  const to = env("LINE_ADMIN_USER_ID", false);
  if (!token || !to) return { skipped: true, reason: "line_not_configured" };
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ to, messages: [{ type: "text", text: cleanText(text, 4900) }] }),
      signal: AbortSignal.timeout(10_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `LINE ${response.status}`);
    await logNotification("line", event, to, "sent", "");
    return { sent: true };
  } catch (error) {
    await logNotification("line", event, to, "failed", error.message);
    console.error("LINE notification failed", error);
    return { sent: false, error: error.message };
  }
}

export async function notifyNewOrder(order) {
  const adminEmail = env("ADMIN_EMAIL", false);
  const packageLabel = `${order.packageName} (${Number(order.priceThb || 0).toLocaleString("th-TH")} บาท)`;
  const customerHtml = `<h2>รับคำขอสั่งซื้อ GovPrompt Thailand แล้ว</h2><p>เรียน ${htmlEscape(order.fullName)}</p><p>เลขอ้างอิง: <strong>${htmlEscape(order.requestRef)}</strong></p><p>แพ็กเกจ: ${htmlEscape(packageLabel)}</p><p>กรุณาเก็บเลขอ้างอิงไว้ใช้ส่งหลักฐานการชำระเงินและติดต่อผู้ดูแลระบบ</p>`;
  const tasks = [
    sendEmail({
      to: order.email, subject: `รับคำขอสั่งซื้อ ${order.requestRef}`,
      html: customerHtml, text: `รับคำขอสั่งซื้อแล้ว เลขอ้างอิง ${order.requestRef} แพ็กเกจ ${packageLabel}`,
      event: "new_order_customer", idempotencyKey: `order-customer-${order.requestRef}`
    }),
    sendLineAdmin(`🛒 GovPrompt มีคำสั่งซื้อใหม่\n${order.requestRef}\n${order.fullName}\n${packageLabel}\n${order.phone}` , "new_order_admin")
  ];
  if (adminEmail) tasks.push(sendEmail({
    to: adminEmail, subject: `คำสั่งซื้อใหม่ ${order.requestRef}`,
    html: `<h2>คำสั่งซื้อใหม่</h2><p>${htmlEscape(order.fullName)} • ${htmlEscape(order.organization)}</p><p>${htmlEscape(packageLabel)}</p><p>${htmlEscape(order.phone)} • ${htmlEscape(order.email)}</p>`,
    text: `คำสั่งซื้อใหม่ ${order.requestRef} ${order.fullName} ${packageLabel}`,
    event: "new_order_admin", idempotencyKey: `order-admin-${order.requestRef}`
  }));
  return Promise.allSettled(tasks);
}

export async function notifyActivation({ fullName, email, requestRef, packageName, code, expiresAt, maxUses }) {
  if (!email) return [{ status: "fulfilled", value: { skipped: true } }];
  const expiry = new Date(expiresAt).toLocaleDateString("th-TH");
  return Promise.allSettled([
    sendEmail({
      to: email,
      subject: `เปิดสิทธิ์ GovPrompt Thailand แล้ว — ${requestRef}`,
      html: `<h2>เปิดสิทธิ์ใช้งานเรียบร้อยแล้ว</h2><p>เรียน ${htmlEscape(fullName)}</p><p>แพ็กเกจ: ${htmlEscape(packageName)}</p><p>รหัสใช้งาน: <strong style="font-size:20px">${htmlEscape(code)}</strong></p><p>ใช้ได้สูงสุด ${Number(maxUses).toLocaleString("th-TH")} ครั้ง ถึงวันที่ ${htmlEscape(expiry)}</p><p>รหัสเป็นสิทธิ์เฉพาะผู้ซื้อ โปรดเก็บเป็นความลับและห้ามส่งต่อ</p>`,
      text: `เปิดสิทธิ์แล้ว รหัส ${code} ใช้ได้ ${maxUses} ครั้ง ถึง ${expiry}`,
      event: "activation_customer",
      idempotencyKey: `activation-${requestRef}`
    }),
    sendLineAdmin(`✅ เปิดสิทธิ์ GovPrompt แล้ว\n${requestRef}\n${fullName}\n${packageName}`, "activation_admin")
  ]);
}

export async function notifyPaymentProof(order) {
  const adminEmail = env("ADMIN_EMAIL", false);
  const text = `💳 มีหลักฐานการชำระเงินใหม่\n${order.requestRef}\n${order.fullName}\n${order.packageName} ${Number(order.priceThb || 0).toLocaleString("th-TH")} บาท`;
  const tasks = [sendLineAdmin(text, "payment_proof_admin")];
  if (adminEmail) tasks.push(sendEmail({
    to: adminEmail,
    subject: `หลักฐานการชำระเงิน ${order.requestRef}`,
    html: `<h2>มีหลักฐานการชำระเงินใหม่</h2><p>${htmlEscape(order.requestRef)}</p><p>${htmlEscape(order.fullName)} • ${htmlEscape(order.packageName)}</p><p>ตรวจสอบได้จากหน้า Admin</p>`,
    text,
    event: "payment_proof_admin",
    idempotencyKey: `payment-proof-${order.requestRef}`
  }));
  return Promise.allSettled(tasks);
}
