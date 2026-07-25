import { bearerToken, enforceRateLimit, errorResponse, getSupabase, isSupabaseConfigured, json, readJson, verifySession } from "../lib/server.mjs";
import { PROMPT_MASTER, PROMPT_COUNT } from "../lib/prompt-master.mjs";
import { assemblePrompt, cleanPromptFields, TONE_MAP } from "../lib/prompt-assembler.mjs";

const ALL_TOOL_IDS = Object.keys(PROMPT_MASTER);

function permittedTools(session) {
  if (session?.master) return new Set(ALL_TOOL_IDS);
  const raw = Array.isArray(session?.allowedTools) ? session.allowedTools : [];
  const matched = raw.filter(id => PROMPT_MASTER[id]);
  if (matched.length) return new Set(matched);
  const packageText = `${session?.packageId || ""} ${session?.packageName || ""}`.toLowerCase();
  if (packageText.includes("starter") || packageText.includes("222")) return new Set(ALL_TOOL_IDS.slice(0, 40));
  if (packageText.includes("professional") || packageText.includes("599")) return new Set(ALL_TOOL_IDS.slice(0, 140));
  return new Set(ALL_TOOL_IDS);
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const session = verifySession(bearerToken(request));
      if (!session) return json({ error: "กรุณาเข้าสู่ระบบใหม่" }, 401);
      const body = await readJson(request);
      const toolId = String(body?.toolId || "").toLowerCase();
      const tool = PROMPT_MASTER[toolId];
      if (!tool) return json({ error: "ไม่พบเครื่องมือที่เลือก" }, 400);
      if (!permittedTools(session).has(toolId)) return json({ error: "แพ็กเกจนี้ไม่มีสิทธิ์ใช้เครื่องมือดังกล่าว" }, 403);
      const fields = cleanPromptFields(body?.fields);
      const tone = TONE_MAP[String(body?.tone)] || TONE_MAP.official;
      await enforceRateLimit(request, "prompt-generate", 60, 10 * 60, session.codeId || session.orderId);

      const output = assemblePrompt(tool, fields, tone);
      try {
        if (isSupabaseConfigured()) await getSupabase().from("usage_logs").insert({
          access_code_id: session.master ? null : session.codeId,
          order_id: session.orderId,
          package_id: session.packageId || "",
          tool_id: toolId,
          demo_mode: false,
          output_chars: output.length
        });
      } catch (logError) {
        console.error("prompt usage log failed", logError);
      }

      return json({
        output,
        demoMode: false,
        generationMode: "prompt",
        usageCharged: false,
        remainingUses: null,
        promptCode: tool.code,
        promptName: tool.name,
        promptVersion: tool.version,
        promptCount: PROMPT_COUNT,
        watermark: {
          ownerName: session.ownerName,
          orderId: session.orderId,
          packageName: session.packageName || ""
        }
      });
    } catch (error) {
      return errorResponse(error, "ระบบประกอบ Prompt ขัดข้อง กรุณาลองใหม่หรือติดต่อผู้ดูแล");
    }
  }
};
