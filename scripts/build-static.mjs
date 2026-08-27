import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { build as bundle } from "esbuild";

const output = "dist";
const RELEASE_VERSIONS = Object.freeze({ home: "6.2.1", homeCss: "2.5.0", serviceWorker: "6.2.1", outputFormats: "1.0.0", promptOrchestrator: "2.6.0", automationPilot: "1.0.0", budgetInputRuntime: "1.6.0", budgetOfficialSourceRuntime: "2.1.0", documentStudio: "1.0.0", caseList: "1.0.0", searchTimeoutGuard: "1.1.0", budgetUiWatchdog: "1.2.0" });
const publicExtensions = new Set([
  ".html", ".htlm", ".css", ".js", ".json", ".webmanifest", ".txt", ".xml"
]);
const publicDirectories = ["assets", "access-system", "Plain text", "knowledge"];
const workflowRuntimeSourceFiles = Object.freeze([
  "budget-balance-validator.js",
  "budget-official-evidence-adapter.js",
  "budget-official-document-parser.js",
  "budget-document-content-ingestion.js",
  "budget-internal-evidence-ingestion.js",
  "budget-browser-file-ingestion.js",
  "budget-browser-file-parser.js",
  "budget-working-draft-planner.js",
  "budget-file-parser-review.js",
  "budget-tabular-parser.js",
  "budget-artifact-factory.js",
  "government-workflow-engine.js",
  "government-workflow-state-machine-v2.js",
  "government-deliverable-contracts-v3.js",
  "government-case-orchestrator-v4.js",
  "government-workflow-suite.js",
  "government-case-memory-v1.js",
  "citizen-service-workflow.js"
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

await bundle({
  absWorkingDir: process.cwd(),
  entryPoints: ["assets/js/organization-automation-v1.js"],
  outfile: join(output, "assets/js/organization-automation-v1.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  legalComments: "none",
  logLevel: "silent"
});

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
const searchTimeoutScript = `<script src="assets/js/core/official-search-timeout-guard-v1.js?v=${RELEASE_VERSIONS.searchTimeoutGuard}" defer></script>`;
if (!distIndex.includes(searchTimeoutScript)) {
  if (!distIndex.includes(outcomeSearchScript)) throw new Error("Outcome-first search policy marker not found in dist/index.html");
  distIndex = distIndex.replace(outcomeSearchScript, `${outcomeSearchScript}${searchTimeoutScript}`);
}

const documentStudioScript = `<script type="module" src="assets/js/core/document-studio-v1.js?v=${RELEASE_VERSIONS.documentStudio}"></script>`;
if (!distIndex.includes(documentStudioScript)) {
  if (!distIndex.includes('</body>')) throw new Error("Document Studio injection marker not found in dist/index.html");
  distIndex = distIndex.replace('</body>', `${documentStudioScript}</body>`);
}

const caseListBootstrapScript = `<script type="module" src="assets/js/ui/case-list-bootstrap-v1.js?v=${RELEASE_VERSIONS.caseList}"></script>`;
if (!distIndex.includes(caseListBootstrapScript)) {
  if (!distIndex.includes('</body>')) throw new Error("Case list bootstrap injection marker not found in dist/index.html");
  distIndex = distIndex.replace('</body>', `${caseListBootstrapScript}</body>`);
}

distIndex = distIndex
  .replace(/assets\/css\/home-v3\.css\?v=[^"'\s<]+/g, `assets/css/home-v3.css?v=${RELEASE_VERSIONS.homeCss}`)
  .replace(/assets\/js\/core\/output-format-presets-v1\.js\?v=[^"'\s<]+/g, `assets/js/core/output-format-presets-v1.js?v=${RELEASE_VERSIONS.outputFormats}`)
  .replace(/assets\/js\/core\/prompt-orchestrator\.js\?v=[^"'\s<]+/g, `assets/js/core/prompt-orchestrator.js?v=${RELEASE_VERSIONS.promptOrchestrator}`)
  .replace(/assets\/js\/home-v3\.js\?v=[^"'\s<]+/g, `assets/js/home-v3.js?v=${RELEASE_VERSIONS.home}`)
  .replace(/service-worker\.js\?v=[^"'\s<)]+/g, `service-worker.js?v=${RELEASE_VERSIONS.serviceWorker}`);

const normalizedHomeScript = `<script src="assets/js/home-v3.js?v=${RELEASE_VERSIONS.home}" defer></script>`;
const budgetWatchdogScript = `<script src="assets/js/core/budget-ui-failclosed-watchdog-v1.js?v=${RELEASE_VERSIONS.budgetUiWatchdog}" defer></script>`;
if (!distIndex.includes(budgetWatchdogScript)) {
  if (!distIndex.includes(normalizedHomeScript)) throw new Error("Home script marker not found for Budget UI watchdog injection");
  distIndex = distIndex.replace(normalizedHomeScript, `${normalizedHomeScript}${budgetWatchdogScript}`);
}
await writeFile(distIndexPath, distIndex);

const distHomePath = join(output, "assets/js/home-v3.js");
let distHome = await readFile(distHomePath, "utf8");
distHome = distHome
  .replace(/budget-browser-input-runtime-v1\.js\?v=[^'"\s)]+/g, `budget-browser-input-runtime-v1.js?v=${RELEASE_VERSIONS.budgetInputRuntime}`)
  .replace(/budget-official-source-runtime-v1\.js\?v=[^'"\s)]+/g, `budget-official-source-runtime-v1.js?v=${RELEASE_VERSIONS.budgetOfficialSourceRuntime}`);
await writeFile(distHomePath, distHome);

if (!distIndex.includes(`assets/js/home-v3.js?v=${RELEASE_VERSIONS.home}`)) throw new Error("Home release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`assets/css/home-v3.css?v=${RELEASE_VERSIONS.homeCss}`)) throw new Error("Home CSS release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/output-format-presets-v1.js?v=${RELEASE_VERSIONS.outputFormats}`)) throw new Error("Output-format presets release script missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/prompt-orchestrator.js?v=${RELEASE_VERSIONS.promptOrchestrator}`)) throw new Error("Prompt orchestrator release version missing from dist/index.html");
if (!distIndex.includes(`service-worker.js?v=${RELEASE_VERSIONS.serviceWorker}`)) throw new Error("Service worker release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/official-search-timeout-guard-v1.js?v=${RELEASE_VERSIONS.searchTimeoutGuard}`)) throw new Error("Official-search timeout guard missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/budget-ui-failclosed-watchdog-v1.js?v=${RELEASE_VERSIONS.budgetUiWatchdog}`)) throw new Error("Budget UI fail-closed watchdog missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/document-studio-v1.js?v=${RELEASE_VERSIONS.documentStudio}`)) throw new Error("Document Studio release script missing from dist/index.html");
if (!distIndex.includes(`assets/js/ui/case-list-bootstrap-v1.js?v=${RELEASE_VERSIONS.caseList}`)) throw new Error("Case list bootstrap release script missing from dist/index.html");
if (!distHome.includes(`budget-browser-input-runtime-v1.js?v=${RELEASE_VERSIONS.budgetInputRuntime}`)) throw new Error("Budget input runtime release version missing from dist Home asset");
if (!distHome.includes(`budget-official-source-runtime-v1.js?v=${RELEASE_VERSIONS.budgetOfficialSourceRuntime}`)) throw new Error("Budget official source runtime release version missing from dist Home asset");
const distHomeCss = await readFile(join(output, "assets/css/home-v3.css"), "utf8");
if (!distHomeCss.includes(".budget-review-overlay") || !distHomeCss.includes(".budget-review-dialog")) throw new Error("Budget review dialog styles missing from dist Home CSS");
if (!distHomeCss.includes(".output-format-control")) throw new Error("Output-format selector styles missing from dist Home CSS");

const distAutomation = await readFile(join(output, "automation-pilot.html"), "utf8");
if (!distAutomation.includes(`assets/js/organization-automation-v1.js?v=${RELEASE_VERSIONS.automationPilot}`)) throw new Error("Organization automation release script missing from dist");
for (const asset of [
  "assets/css/automation-pilot-v1.css",
  "assets/js/core/output-format-presets-v1.js",
  "assets/js/core/automation-pilot-config-v1.js",
  "assets/js/organization-automation-v1.js"
]) {
  const content = await readFile(join(output, asset), "utf8");
  if (!content.trim()) throw new Error(`Automation Pilot asset ${asset} was not copied into dist correctly`);
}
const distAutomationModule = await readFile(join(output, "assets/js/organization-automation-v1.js"), "utf8");
if (/from\s*["']@supabase\/supabase-js/.test(distAutomationModule)) throw new Error("Supabase browser client was not bundled into the Automation Pilot asset");

const distSitemap = await readFile(join(output, "sitemap.xml"), "utf8");
if (!/<urlset\b/.test(distSitemap)) throw new Error("sitemap.xml was not copied into dist correctly");

for (const file of workflowRuntimeSourceFiles) {
  const content = await readFile(join(runtimeOutput, file), "utf8");
  if (!content.trim()) throw new Error(`Workflow runtime module ${file} was not copied into dist correctly`);
}

console.log(`GovPrompt production assets built in dist/ with ${workflowRuntimeSourceFiles.length} workflow runtime modules; release ${JSON.stringify(RELEASE_VERSIONS)}.`);
