(() => {
  'use strict';
  const API = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/access/validate';
  const CODE_KEY = 'gp_simple_code';

  function showApp() {
    document.getElementById('gate').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  async function validate(code) {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return response.ok;
  }

  async function restoreSession() {
    const savedCode = sessionStorage.getItem(CODE_KEY);
    if (savedCode && await validate(savedCode).catch(() => false)) showApp();
    else sessionStorage.removeItem(CODE_KEY);
  }

  document.getElementById('login').onclick = async () => {
    const button = document.getElementById('login');
    const message = document.getElementById('msg');
    button.disabled = true;
    message.className = 'msg';
    const code = document.getElementById('code').value.trim().toUpperCase();
    try {
      if (await validate(code)) {
        sessionStorage.setItem(CODE_KEY, code);
        message.className = 'msg ok';
        setTimeout(showApp, 250);
        return;
      }
    } catch {}
    message.className = 'msg bad';
    button.disabled = false;
  };

  document.getElementById('code').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/\s+/g, ''); });
  document.getElementById('code').addEventListener('keydown', event => { if (event.key === 'Enter') document.getElementById('login').click(); });
  document.getElementById('logout').onclick = () => { sessionStorage.removeItem(CODE_KEY); location.reload(); };
  void restoreSession();
})();
