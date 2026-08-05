import { envFlag, getSupabase, isSupabaseConfigured, json } from "./lib/server.mjs";
import { PROMPT_COUNT } from "./lib/prompt-master.mjs";

const VERSION = "5.0.0-222";
export default {
  async fetch(request) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    let database = false;
    if (isSupabaseConfigured()) {
      try {
        const { error } = await getSupabase().from("packages").select("id").limit(1);
        database = !error;
      } catch {
        database = false;
      }
    }
    const salesEnabled = envFlag("SALES_ENABLED", false);
    const paymentConfigured = Boolean(
      process.env.PAYMENT_ACCOUNT_NAME &&
      (process.env.PAYMENT_PROMPTPAY_ID || process.env.PAYMENT_ACCOUNT_NUMBER)
    );
    return json({
      ok: true,
      database,
      salesEnabled,
      readyForSales: Boolean(database && salesEnabled && paymentConfigured),
      mode: "prompt-only",
      promptCount: PROMPT_COUNT,
      version: VERSION,
      emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      lineConfigured: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_ADMIN_USER_ID),
      paymentConfigured
    });
  }
};
