import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const output = "dist";
const publicExtensions = new Set([
  ".html", ".htlm", ".css", ".js", ".json", ".webmanifest", ".txt", ".xml"
]);
const publicDirectories = ["assets", "access-system", "Plain text", "knowledge"];
const workflowRuntimeSourceFiles = Object.freeze([
  "budget-balance-validator.js",
  "government-workflow-engine.js",
  "government-workflow-state-machine-v2.js",
  "government-deliverable-contracts-v3.js",
  "government-case-orchestrator-v4.js",
  "government-workflow-suite.js"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(".", { withFileTypes: true })) {
  if (!entry.isFile() || !publicExtensions.has(extname(entry.name).toLowerCase())) continue;
  await cp(entry.name, join(output, entry.name));
}

for (const directory of publicDirectories) {
  await cp(directory, join(output, directory), { recursive: true });
}

const runtimeOutput = join(output, "src");
await mkdir(runtimeOutput, { recursive: true });
for (const file of workflowRuntimeSourceFiles) {
  await cp(join("src", file), join(runtimeOutput, file));
}

const distIndexPath = join(output, "index.html");
let distIndex = await readFile(distIndexPath, "utf8");
const hybridScript = '<script src="assets/js/core/hybrid-intent-classifier.js?v=2.4.1" defer></script>';
const hotfixScript = '<script src="assets/js/core/router-real-query-hotfix.js?v=2.4.5" defer></script>';
if (!distIndex.includes(hotfixScript)) {
  if (!distIndex.includes(hybridScript)) throw new Error("Hybrid intent router script marker not found in dist/index.html");
  distIndex = distIndex.replace(hybridScript, `${hybridScript}${hotfixScript}`);
}

const officialSearchScript = '<script src="assets/js/core/official-search-connector.js?v=2.4.2" defer></script>';
const outcomeSearchScript = '<script src="assets/js/core/outcome-first-search-policy.js?v=1.0.0" defer></script>';
if (!distIndex.includes(outcomeSearchScript)) {
  if (!distIndex.includes(officialSearchScript)) throw new Error("Official search connector script marker not found in dist/index.html");
  distIndex = distIndex.replace(officialSearchScript, `${officialSearchScript}${outcomeSearchScript}`);
}
await writeFile(distIndexPath, distIndex);

const distSitemap = await readFile(join(output, "sitemap.xml"), "utf8");
if (!/<urlset\b/.test(distSitemap)) {
  throw new Error("sitemap.xml was not copied into dist correctly");
}

for (const file of workflowRuntimeSourceFiles) {
  const content = await readFile(join(runtimeOutput, file), "utf8");
  if (!content.trim()) throw new Error(`Workflow runtime module ${file} was not copied into dist correctly`);
}

console.log(`GovPrompt production assets built in dist/ with ${workflowRuntimeSourceFiles.length} workflow runtime modules.`);
