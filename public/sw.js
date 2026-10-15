// Guarda la app en el dispositivo para que funcione sin conexión en el campo.
// La lista de archivos y la versión las escribe el build (vite.config.ts); cada versión nueva usa otra caché.
const CACHE = 'tacticalpro-__VERSION__'
const FILES = '__PRECACHE__'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(Array.isArray(FILES) ? FILES : ['./', './index.html', './manifest.webmanifest', './icon-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

// Primero la red (para recibir actualizaciones); si no hay conexión, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return
  e.respondWith(
    // Sin la caché HTTP del navegador, para que una versión nueva llegue al momento.
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy))
        return res
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))),
  )
})
