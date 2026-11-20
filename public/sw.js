// SmartSoko Fedha — service worker
// - App shell + assets cached for offline use.
// - Navigations: network first, fall back to cached index.html (SPA).
// - Supabase (cross-origin) GETs: network first, fall back to cache so the
//   last known data is still visible offline.
// - Old caches are removed on activate.
const CACHE = 'smartsoko-fedha-v4'
const OFFLINE = '/index.html'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/manifest.json', '/icon.svg', '/404.html']).catch(() => {})))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Supabase / other cross-origin: network first, cache fallback (offline data).
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match(req).then((r) => r || Response.error()))
    )
    return
  }

  // Navigations: always try network first.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(OFFLINE, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(OFFLINE).then((r) => r || Response.error()))
    )
    return
  }

  // Hashed assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})

// Allow the page to ask the SW to sync now (best-effort).
self.addEventListener('message', (event) => {
  if (event.data === 'sync-now') {
    // Nothing to do here; the client performs the sync.
    event.source && event.source.postMessage('sync-ack')
  }
})