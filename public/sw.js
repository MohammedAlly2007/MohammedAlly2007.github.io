// SmartSoko Fedha — service worker
// Navigation requests are always fetched from the network first so a new build
// never gets hidden behind a stale cached index.html. Only static assets are
// cached, and old caches are removed on activate.
const CACHE = 'smartsoko-fedha-v2'
const OFFLINE = '/index.html'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/manifest.json', '/icon.svg'])).catch(() => {}))
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
  if (url.origin !== self.location.origin) return

  // Never serve HTML from cache for navigations: always try network first.
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

  // Stale-while-revalidate for hashed assets.
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
