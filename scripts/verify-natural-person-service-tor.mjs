import { loadGP223Core, requiredCases, verifyCase } from '../tests/fixtures/gp223-test-helper.mjs';
const core = await loadGP223Core();
for (const item of requiredCases) {
  verifyCase(core, item);
  console.log(`GP223 case ${item.id}: PASS — ${item.question}`);
}
console.log('GP223 verification: 5/5 PASS (routing and generated prompt contracts; no legal eligibility certification).');
