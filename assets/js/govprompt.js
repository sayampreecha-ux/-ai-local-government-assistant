(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const events = app.events || new EventTarget();

  app.version = '2.0.0';
  app.events = events;
  app.on = (type, listener, options) => events.addEventListener(type, listener, options);
  app.off = (type, listener, options) => events.removeEventListener(type, listener, options);
  app.emit = (type, detail) => events.dispatchEvent(new CustomEvent(type, { detail }));

  app.toast = message => {
    let toast = document.querySelector('.gp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'gp-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(app.toastTimer);
    app.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  function initializeLayout() {
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    if (document.querySelector('.gp-skip')) return;

    const skip = document.createElement('a');
    skip.className = 'gp-skip';
    skip.href = `#${main.id}`;
    skip.textContent = 'ข้ามไปยังเนื้อหาหลัก';
    document.body.prepend(skip);
  }

  function initializeBrand() {
    const brand = document.querySelector('.bar b,.brand b');
    if (!brand || document.querySelector('.gp-release-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'gp-release-badge';
    badge.textContent = 'Release 2.0';
    brand.after(badge);
  }

  function initializeAccessibleNames() {
    document.querySelectorAll('button[title]:not([aria-label])').forEach(button => {
      button.setAttribute('aria-label', button.title);
    });
  }

  function initializeNavigation() {
    document.querySelectorAll('[data-panel]').forEach(button => {
      button.addEventListener('click', () => {
        app.emit('shell:panel', { panel: button.dataset.panel, trigger: button });
      });
    });
  }

  function initializeDialogs() {
    document.querySelectorAll('[data-dialog-close]').forEach(button => {
      button.addEventListener('click', () => button.closest('dialog')?.close());
    });
    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function initializeShell() {
    if (app.shellInitialized) return;
    app.shellInitialized = true;
    document.documentElement.lang = 'th';
    initializeLayout();
    initializeBrand();
    initializeAccessibleNames();
    initializeNavigation();
    initializeDialogs();
  }

  app.initializeShell = initializeShell;
  initializeShell();

  window.addEventListener('unhandledrejection', () => {
    app.toast('เกิดข้อขัดข้อง กรุณาลองใหม่อีกครั้ง');
  });
})();
