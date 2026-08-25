import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const output = "dist";
const RELEASE_VERSIONS = Object.freeze({ home: "6.1.1", homeCss: "2.4.6", serviceWorker: "6.1.1", budgetInputRuntime: "1.6.0", budgetOfficialSourceRuntime: "2.1.0", documentStudio: "1.0.0" });
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

const documentStudioScript = `<script type="module" src="assets/js/core/document-studio-v1.js?v=${RELEASE_VERSIONS.documentStudio}"></script>`;
if (!distIndex.includes(documentStudioScript)) {
  if (!distIndex.includes('</body>')) throw new Error("Document Studio injection marker not found in dist/index.html");
  distIndex = distIndex.replace('</body>', `${documentStudioScript}</body>`);
}

distIndex = distIndex
  .replace(/assets\/css\/home-v3\.css\?v=[^"'\s<]+/g, `assets/css/home-v3.css?v=${RELEASE_VERSIONS.homeCss}`)
  .replace(/assets\/js\/home-v3\.js\?v=[^"'\s<]+/g, `assets/js/home-v3.js?v=${RELEASE_VERSIONS.home}`)
  .replace(/service-worker\.js\?v=[^"'\s<)]+/g, `service-worker.js?v=${RELEASE_VERSIONS.serviceWorker}`);
await writeFile(distIndexPath, distIndex);

const distHomePath = join(output, "assets/js/home-v3.js");
let distHome = await readFile(distHomePath, "utf8");
distHome = distHome
  .replace(/budget-browser-input-runtime-v1\.js\?v=[^'"\s)]+/g, `budget-browser-input-runtime-v1.js?v=${RELEASE_VERSIONS.budgetInputRuntime}`)
  .replace(/budget-official-source-runtime-v1\.js\?v=[^'"\s)]+/g, `budget-official-source-runtime-v1.js?v=${RELEASE_VERSIONS.budgetOfficialSourceRuntime}`);
await writeFile(distHomePath, distHome);

if (!distIndex.includes(`assets/js/home-v3.js?v=${RELEASE_VERSIONS.home}`)) throw new Error("Home release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`assets/css/home-v3.css?v=${RELEASE_VERSIONS.homeCss}`)) throw new Error("Home CSS release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`service-worker.js?v=${RELEASE_VERSIONS.serviceWorker}`)) throw new Error("Service worker release cache-bust version missing from dist/index.html");
if (!distIndex.includes(`assets/js/core/document-studio-v1.js?v=${RELEASE_VERSIONS.documentStudio}`)) throw new Error("Document Studio release script missing from dist/index.html");
if (!distHome.includes(`budget-browser-input-runtime-v1.js?v=${RELEASE_VERSIONS.budgetInputRuntime}`)) throw new Error("Budget input runtime release version missing from dist Home asset");
if (!distHome.includes(`budget-official-source-runtime-v1.js?v=${RELEASE_VERSIONS.budgetOfficialSourceRuntime}`)) throw new Error("Budget official source runtime release version missing from dist Home asset");
const distHomeCss = await readFile(join(output, "assets/css/home-v3.css"), "utf8");
if (!distHomeCss.includes(".budget-review-overlay") || !distHomeCss.includes(".budget-review-dialog")) throw new Error("Budget review dialog styles missing from dist Home CSS");

const distSitemap = await readFile(join(output, "sitemap.xml"), "utf8");
if (!/<urlset\b/.test(distSitemap)) throw new Error("sitemap.xml was not copied into dist correctly");

for (const file of workflowRuntimeSourceFiles) {
  const content = await readFile(join(runtimeOutput, file), "utf8");
  if (!content.trim()) throw new Error(`Workflow runtime module ${file} was not copied into dist correctly`);
}

console.log(`GovPrompt production assets built in dist/ with ${workflowRuntimeSourceFiles.length} workflow runtime modules; release ${JSON.stringify(RELEASE_VERSIONS)}.`);
