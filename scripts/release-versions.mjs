// Approved source checkout is the release authority for build and verification.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export const committedIndex = await readFile(new URL('../index.html', import.meta.url), 'utf8');
export function committedAsset(path) {
  const references = [...committedIndex.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1]).filter(value => value.startsWith(path + '?v='));
  assert.equal(references.length,1,`expected one committed version reference for ${path}`);
  const version = references[0].slice(path.length + 3);
  assert.match(version,/^\d+(?:\.\d+)+$/,`invalid committed version for ${path}`);
  return { path:references[0], version };
}

export const RELEASE_VERSIONS = Object.freeze({ home: committedAsset('assets/js/home-v3.js').version, homeCss: "2.6.17", serviceWorker: "3.6.14", quickActionBridge: "1.3.22", guidedIntake: "1.2.3", emergencyProcurementGate: "1.1.0", statusCopy: "1.4.6", mic: "2.4.3", outputFormats: "1.0.1", promptOrchestrator: "7.9.12", automationPilot: "1.0.0", budgetInputRuntime: "1.6.0", budgetOfficialSourceRuntime: "2.1.0", documentStudio: "1.0.0", caseList: "1.0.0", searchTimeoutGuard: "1.1.0", budgetUiWatchdog: "1.2.0", assistanceRoute: "1.1.0" });
