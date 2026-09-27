const CACHE = 'nz-handbook-offline-v2';
const ROOT = new URL('./', self.registration.scope).href;
const ROOT_PATH = new URL(ROOT).pathname;

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const response = await fetch(ROOT, { cache: 'reload' });
  if (!response.ok) throw new Error('Offline download failed');
  await cache.put(ROOT, response);
  await self.skipWaiting();
})()));

self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('nz-handbook-offline-') && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHandbook = url.origin === self.location.origin &&
    (url.pathname === ROOT_PATH || url.pathname === `${ROOT_PATH}index.html`);
  if (event.request.mode !== 'navigate' || !isHandbook) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(event.request, { cache: 'no-cache' });
      if (!fresh.ok) throw new Error('Offline fallback');
      await cache.put(ROOT, fresh.clone());
      return fresh;
    } catch (error) {
      const saved = await cache.match(ROOT);
      if (saved) return saved;
      throw error;
    }
  })());
});
