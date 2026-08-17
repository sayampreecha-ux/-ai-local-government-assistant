(() => {
  'use strict';

  const form = document.getElementById('chatForm');
  const input = document.getElementById('promptInput');
  if (!form || !input) return;

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-prompt]');
    if (!button) return;
    const prompt = String(button.dataset.prompt || '').trim();
    if (!prompt) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    input.value = prompt;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.requestSubmit();
  }, true);
})();