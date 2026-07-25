import { envFlag, isSupabaseConfigured, json } from "../lib/server.mjs";

const VERSION = "5.0.0-222";

export default {
  async fetch(request) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const salesEnabled = envFlag("SALES_ENABLED", false);
    const databaseConfigured = isSupabaseConfigured();
    const paymentConfigured = Boolean(
      process.env.PAYMENT_ACCOUNT_NAME &&
      (process.env.PAYMENT_PROMPTPAY_ID || process.env.PAYMENT_ACCOUNT_NUMBER)
    );
    return json({
      version: VERSION,
      salesEnabled,
      databaseConfigured,
      paymentConfigured,
      readyForSales: Boolean(salesEnabled && databaseConfigured && paymentConfigured),
      aiMode: "prompt-only",
      promptCount: 222
    });
  }
};
