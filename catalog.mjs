import { PROMPT_MASTER } from "./prompt-master.mjs";

const toolIds = Object.keys(PROMPT_MASTER);

export const FALLBACK_PACKAGES = [
  {
    id: "starter-222",
    name: "Starter 222",
    priceThb: 222,
    description: "เครื่องมือพื้นฐานสำหรับงานประจำ 40 รายการ",
    maxUses: 60,
    expiryDays: 180,
    allowedTools: toolIds.slice(0, 40)
  },
  {
    id: "professional-599",
    name: "Professional 599",
    priceThb: 599,
    description: "เครื่องมือครอบคลุมงานบริหารและงานวิชาชีพ 140 รายการ",
    maxUses: 250,
    expiryDays: 365,
    allowedTools: toolIds.slice(0, 140)
  },
  {
    id: "agency-999",
    name: "Agency 999",
    priceThb: 999,
    description: "คลังเครื่องมือครบ 222 รายการสำหรับหน่วยงาน",
    maxUses: 800,
    expiryDays: 365,
    allowedTools: toolIds
  }
];
