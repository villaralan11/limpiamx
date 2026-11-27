/*
 * Service Worker de LimpiaMX (PWA instalable).
 * Estrategia:
 *  - App shell (index.html): network-first con caché de respaldo para que la
 *    última versión gane, pero la app abra sin conexión.
 *  - Assets estáticos (/assets/... e imágenes del sitio): cache-first.
 *  - Todo lo demás (Firebase, Google Maps, APIs): nunca se intercepta.
 */
const CACHE_NAME = 'limpiamx-pwa-v1';
const APP_SHELL = [
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isOwnStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.svg'
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Maps, Firebase, fuentes
  if (url.pathname.startsWith('/src/')) return; // módulos dev de Vite

  if (url.pathname === '/' || url.pathname === '/index.html') {
    // Network-first para el shell: siempre intenta la versión nueva.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (isOwnStaticAsset(url)) {
    // Cache-first para estáticos.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
