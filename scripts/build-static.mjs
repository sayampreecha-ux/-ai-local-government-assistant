import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const output = "dist";
const publicExtensions = new Set([
  ".html", ".htlm", ".css", ".js", ".json", ".webmanifest", ".txt", ".xml"
]);
const publicDirectories = ["assets", "access-system", "Plain text", "knowledge"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(".", { withFileTypes: true })) {
  if (!entry.isFile() || !publicExtensions.has(extname(entry.name).toLowerCase())) continue;
  await cp(entry.name, join(output, entry.name));
}

for (const directory of publicDirectories) {
  await cp(directory, join(output, directory), { recursive: true });
}

const distIndexPath = join(output, "index.html");
const distIndex = await readFile(distIndexPath, "utf8");
const hybridScript = '<script src="assets/js/core/hybrid-intent-classifier.js?v=2.4.1" defer></script>';
const hotfixScript = '<script src="assets/js/core/router-real-query-hotfix.js?v=2.4.5" defer></script>';
if (!distIndex.includes(hotfixScript)) {
  if (!distIndex.includes(hybridScript)) throw new Error("Hybrid intent router script marker not found in dist/index.html");
  await writeFile(distIndexPath, distIndex.replace(hybridScript, `${hybridScript}${hotfixScript}`));
}

const distSitemap = await readFile(join(output, "sitemap.xml"), "utf8");
if (!/<urlset\b/.test(distSitemap)) {
  throw new Error("sitemap.xml was not copied into dist correctly");
}

console.log("GovPrompt production assets built in dist/.");
