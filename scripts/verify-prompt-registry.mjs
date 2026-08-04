import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(await readFile('assets/js/core/prompt-registry.js', 'utf8'), sandbox);

const { PROMPT_REGISTRY, PROMPT_REGISTRY_BY_ID, getPromptDefinition } = sandbox.window.GovPromptCore;
assert.equal(PROMPT_REGISTRY.length, 12);
assert.equal(Object.isFrozen(PROMPT_REGISTRY), true);
assert.equal(Object.isFrozen(PROMPT_REGISTRY_BY_ID), true);

const expectedTypes = [
  'records', 'legal', 'procurement', 'planning-budget', 'finance', 'human-resources',
  'engineering', 'public-health', 'education', 'internal-audit', 'executive', 'public-relations'
];

for (let index = 0; index < 12; index += 1) {
  const moduleId = `GP${String(index + 1).padStart(3, '0')}`;
  const definition = getPromptDefinition(moduleId.toLowerCase());
  assert.equal(definition.moduleId, moduleId);
  assert.equal(definition.path, `${moduleId.toLowerCase()}.html`);
  assert.deepEqual(Array.from(definition.transactionTypes), [expectedTypes[index]]);
  assert.equal(definition.promptSource, 'legacy-inline');
  assert.equal(definition.status, 'active');
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.transactionTypes), true);
  assert.equal(PROMPT_REGISTRY_BY_ID[moduleId], definition);
}

assert.equal(getPromptDefinition('GP013'), undefined);
assert.throws(() => PROMPT_REGISTRY.push({}), /object is not extensible/);
assert.throws(() => { PROMPT_REGISTRY[0].title = 'changed'; }, /read only property/);

console.log('Prompt Registry verification passed for GP001-GP012.');
