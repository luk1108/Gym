// sw.js — Simple-Update mode
// index.html всегда берётся из сети (если онлайн), кэш — оффлайн-фоллбек.
// Никаких ручных версий/параметров не нужно.

const CACHE = 'app-cache-simple-1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // кладём свежую главную страницу для оффлайна
      const fresh = await fetch('./', { cache: 'reload' });
      await cache.put('./', fresh.clone());
    } catch (e) {
      // если оффлайн при первой установке — пропускаем
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)));
  })());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Для навигации всегда пробуем сеть (network-first)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // index.html всегда свежий при онлайне
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put('./', fresh.clone());
        return fresh;
      } catch (e) {
        // оффлайн — отдаём последнюю версию из кэша
        const cache = await caches.open(CACHE);
        const offline = await cache.match('./');
        return offline || Response.error();
      }
    })());
    return;
  }

  // Остальные запросы: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const netPromise = fetch(req).then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await netPromise) || Response.error();
  })());
});
