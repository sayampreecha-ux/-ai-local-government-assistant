const APP_VERSION = '2.8';
const CACHE = `lg-assistant-ready-v${APP_VERSION.replace('.', '-')}`;
const ASSETS = [
  './',
  './index.html',
  './assets/css/govprompt.css',
  './assets/css/home-v3.css',
  './assets/js/core/output-format-presets-v1.js',
  './assets/js/home-v3.js',
  './manifest.webmanifest',
];
const PRECACHE_URLS = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
const NETWORK_FRESH_MODULES = Object.freeze([
  '/assets/js/core/prompt-orchestrator.js',
  '/assets/js/ui/quick-action-guided-bridge-v1.js',
  '/assets/js/core/government-workflow-runtime-v5.js',
  '/src/government-workflow-suite.js',
  '/assets/js/ui/workflow-progress-ui-v1.js',
  '/assets/js/ui/status-copy.js',
  '/assets/js/govprompt.js',
  '/assets/js/mic.js',
  '/assets/js/ui/assistant-catalog-accordion-v1.js',
  '/assets/js/ui/pr-image-studio-v1.js',
  '/assets/js/core/pr-image-workflow-v1.js'
]);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('lg-assistant-ready-v') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  if (NETWORK_FRESH_MODULES.some(path => url.pathname.endsWith(path))) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (!PRECACHE_URLS.has(request.url)) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response.ok || response.type !== 'basic') return response;
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
        return response;
      });
    })
  );
});