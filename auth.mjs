import { errorResponse, getSupabase, isSupabaseConfigured, json } from "./lib/server.mjs";
import { FALLBACK_PACKAGES } from "./lib/catalog.mjs";

export default {
  async fetch(request) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    if (!isSupabaseConfigured()) {
      return json({ packages: FALLBACK_PACKAGES, source: "fallback" });
    }
    try {
      const { data, error } = await getSupabase().from("packages")
        .select("id,name,price_thb,description,max_uses,expiry_days,allowed_tools,sort_order")
        .eq("active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return json({ packages: (data || []).map(row => ({
        id: row.id, name: row.name, priceThb: row.price_thb, description: row.description,
        maxUses: row.max_uses, expiryDays: row.expiry_days, allowedTools: row.allowed_tools || []
      })), source: "database" });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถโหลดแพ็กเกจได้");
    }
  }
};
