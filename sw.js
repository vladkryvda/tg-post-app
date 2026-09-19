const CACHE_NAME = 'tg-editor-vercel-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Для Vercel кешуємо лише корінь '/', без /index.html
      const assets = ['/', '/manifest.json'];
      for (const url of assets) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('Кеш пропущено для:', url);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === 'navigate') {
          const root = await caches.match('/');
          if (root) return root;
        }

        return new Response('Офлайн-режим', { status: 503, statusText: 'Offline' });
      })
  );
});
