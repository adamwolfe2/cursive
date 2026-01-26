// LeadMe Service Worker
// Handles caching, offline support, and push notifications

const CACHE_NAME = 'leadme-v1'
const STATIC_CACHE = 'leadme-static-v1'
const DYNAMIC_CACHE = 'leadme-dynamic-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/leads',
  '/offline',
  '/manifest.json',
]

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/leads',
  '/api/queries',
  '/api/team/members',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Dynamic content - stale while revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return caches.match('/offline')
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    const cache = caches.open(DYNAMIC_CACHE)
    cache.then(c => c.put(request, response.clone()))
    return response
  }).catch(() => null)

  return cached || fetchPromise || caches.match('/offline')
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      ...data.data
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'default',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Open new window
        return clients.openWindow(url)
      })
  )
})

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads())
  }
})

// Sync offline changes
async function syncLeads() {
  const cache = await caches.open('leadme-offline-actions')
  const requests = await cache.keys()

  for (const request of requests) {
    try {
      const response = await cache.match(request)
      const data = await response.json()

      await fetch(data.url, {
        method: data.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body)
      })

      await cache.delete(request)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}
