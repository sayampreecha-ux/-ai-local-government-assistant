import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('trusted internal result prompt bypasses privacy submit guard exactly once', async () => {
  const source = await readFile('assets/js/core/privacy-submit-guard.js', 'utf8');
  const nodes = new Map();
  const listeners = {};
  const form = {
    dataset: {},
    addEventListener(type, listener) { listeners[type] = listener; },
    insertAdjacentElement(_where, node) { nodes.set(node.id, node); }
  };
  const input = {
    value: 'HN 1234 ข้อมูลสุขภาพ',
    dispatchEvent() {},
    focus() {}
  };
  const document = {
    readyState: 'complete',
    getElementById(id) {
      if (id === 'chatForm') return form;
      if (id === 'promptInput') return input;
      return nodes.get(id) || null;
    },
    createElement() {
      return {
        id: '',
        className: '',
        hidden: false,
        textContent: '',
        style: {},
        setAttribute() {}
      };
    },
    addEventListener() {}
  };
  class FakeEvent {
    constructor(type) { this.type = type; }
  }
  const window = {
    GovPromptCore: {
      sanitizeExternalContent(value) {
        return Object.freeze({
          original: String(value ?? ''),
          safeText: String(value ?? ''),
          changed: false,
          blocked: false,
          redactions: Object.freeze([]),
          blockingRisks: Object.freeze([]),
          residualRisks: Object.freeze([]),
          sensitiveContext: Object.freeze([])
        });
      }
    },
    setTimeout() { return 1; },
    clearTimeout() {}
  };
  const sandbox = { window, document, Event: FakeEvent };
  vm.runInNewContext(source, sandbox, { filename: 'privacy-submit-guard.js' });

  assert.equal(typeof listeners.submit, 'function');

  let prevented = false;
  form.dataset.trustedInternalPrompt = 'true';
  listeners.submit({
    preventDefault() { prevented = true; },
    stopImmediatePropagation() {}
  });

  assert.equal(prevented, false);
  assert.equal(form.dataset.trustedInternalPrompt, undefined);
  assert.equal(document.getElementById('privacySubmitWarning'), null);

  prevented = false;
  input.value = 'HN 1234 ข้อมูลสุขภาพ';
  listeners.submit({
    preventDefault() { prevented = true; },
    stopImmediatePropagation() {}
  });

  assert.equal(prevented, true);
  assert.match(document.getElementById('privacySubmitWarning')?.textContent || '', /GovPrompt บล็อกข้อมูลส่วนบุคคล/);
});

test('catalog handoff marks static prompts trusted but keeps user-authored PR topic untrusted', async () => {
  const [bridge, home] = await Promise.all([
    readFile('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8'),
    readFile('assets/js/home-v3.js', 'utf8')
  ]);

  assert.match(bridge, /RESULT_TRUSTED_INTERNAL_KEY = 'govprompt\.resultPromptTrustedInternal\.v1'/);
  assert.match(bridge, /openResultPage\(prompt, \{ trustedInternal: true \}\)/);
  assert.match(bridge, /openResultPage\(prompt, \{ forceIntake: false \}\);/);
  assert.match(home, /trustedInternalPrompt = sessionStorage\.getItem\(resultTrustedInternalKey\) === 'true'/);
  assert.match(home, /form\.dataset\.trustedInternalPrompt = 'true'/);
});
