import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { extname, join } from "node:path";

const output = "dist";
const publicExtensions = new Set([
  ".html", ".htlm", ".css", ".js", ".json", ".webmanifest", ".txt"
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

console.log("GovPrompt production assets built in dist/.");
