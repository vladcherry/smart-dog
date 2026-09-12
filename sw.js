// Service worker: офлайн-режим для прогулки без сети
const VERSION = 'smartdog-v2';
const SHELL = [
  './', 'index.html', 'manifest.json',
  'assets/css/app.css',
  'assets/js/main.js', 'assets/js/state.js', 'assets/js/ui.js', 'assets/js/algo.js',
  'assets/js/training.js', 'assets/js/dayplan.js', 'assets/js/chart.js', 'assets/js/demo.js',
  'assets/js/install.js',
  'assets/js/data/breeds.js', 'assets/js/data/skills.js', 'assets/js/data/weeks.js',
  'assets/js/data/articles.js',
  'assets/js/views/onboarding.js', 'assets/js/views/today.js', 'assets/js/views/walk.js',
  'assets/js/views/plan.js', 'assets/js/views/book.js', 'assets/js/views/schedule.js',
  'assets/js/views/profile.js', 'assets/js/views/skill.js',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png', 'assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.allSettled(SHELL.map(u => cache.add(new Request(u, { cache:'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // шрифты и прочее — мимо кэша

  // Страница: сначала сеть, чтобы обновления доезжали; без сети — из кэша
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('index.html', fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(VERSION);
        return (await cache.match('index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Остальное: отдаём из кэша сразу, в фоне подтягиваем свежее
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch:true });
    const net = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
