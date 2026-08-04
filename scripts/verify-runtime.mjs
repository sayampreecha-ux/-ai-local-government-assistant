import { readFile, readdir } from "node:fs/promises";

const apiFiles = (await readdir("api")).filter(file => file.endsWith(".mjs"));
for (const file of apiFiles) {
  const module = await import(`../api/${file}`);
  if (!module.default || typeof module.default.fetch !== "function") {
    throw new Error(`api/${file} does not export a fetch handler`);
  }
}

const promptModule = await import("../lib/prompt-master.mjs");
if (promptModule.PROMPT_COUNT !== 222 || Object.keys(promptModule.PROMPT_MASTER).length !== 222) {
  throw new Error("The 222-prompt catalogue was not preserved");
}

const html = await readFile("index.html", "utf8");
const config = JSON.parse(await readFile("vercel.json", "utf8"));
const policy = config.headers[0].headers.find(header => header.key === "Content-Security-Policy")?.value || "";
if (html.includes("<script>") && !policy.includes("sha256-uLdDhtC4dP0w9t+xluN7Sx7CJChdfiCK/BGLxijtg54=")) {
  throw new Error("The home page inline script is blocked by CSP");
}

console.log(`Runtime verification passed for ${apiFiles.length} API handlers and 222 prompts.`);
