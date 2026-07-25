import { enforceRateLimit, errorResponse, getSupabase, json, verifyAdminRequest } from "../lib/server.mjs";

export default {
  async fetch(request) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    try {
      if (!verifyAdminRequest(request)) return json({ error: "กรุณาเข้าสู่ระบบผู้ดูแลใหม่" }, 401);
      await enforceRateLimit(request, "admin-stats", 120, 60 * 60);
      const supabase = getSupabase();
      const today = new Date(); today.setHours(0,0,0,0);
      const month = new Date(today.getFullYear(), today.getMonth(), 1);

      const [pending, proof, paid, activeCodes, usageToday, paidOrders, toolRows] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending","contacted","awaiting_payment"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "proof_submitted"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
        supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("active", true).gt("expires_at", new Date().toISOString()),
        supabase.from("usage_logs").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("orders").select("price_thb,package_id").in("status", ["paid","completed"]).gte("paid_at", month.toISOString()),
        supabase.from("usage_logs").select("tool_id").gte("created_at", month.toISOString()).limit(5000)
      ]);
      const error = pending.error || proof.error || paid.error || activeCodes.error || usageToday.error || paidOrders.error || toolRows.error;
      if (error) throw error;
      const revenueThisMonth = (paidOrders.data || []).reduce((sum,row)=>sum+Number(row.price_thb||0),0);
      const packageSales = Object.entries((paidOrders.data || []).reduce((acc,row)=>{acc[row.package_id]=(acc[row.package_id]||0)+1;return acc;},{})).map(([packageId,count])=>({packageId,count}));
      const toolUsage = Object.entries((toolRows.data || []).reduce((acc,row)=>{acc[row.tool_id]=(acc[row.tool_id]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([toolId,count])=>({toolId,count}));

      return json({
        pendingOrders: pending.count || 0, proofOrders: proof.count || 0, paidOrders: paid.count || 0,
        activeCodes: activeCodes.count || 0, usageToday: usageToday.count || 0,
        revenueThisMonth, packageSales, toolUsage
      });
    } catch (error) {
      return errorResponse(error, "ไม่สามารถโหลดภาพรวมระบบได้");
    }
  }
};
