const CACHE_NAME = 'maechaem-db-shell-v2'
const APP_SHELL = ['/index.html', '/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  const isNavigationRequest = event.request.mode === 'navigate'

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', responseCopy)
          })
          return networkResponse
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html')
          return cachedShell || Response.error()
        })
    )
    return
  }

  const isStaticAsset = ['script', 'style', 'image', 'font'].includes(event.request.destination)

  if (!isStaticAsset) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        const responseCopy = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy)
        })

        return networkResponse
      })
    })
  )
})
