// Daymark service worker: shows reminder notifications pushed by the server,
// even when no Daymark tab is open.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const message = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(message.title || 'Daymark', {
      body: message.body || 'A gentle reminder',
      tag: message.tag,
      icon: '/favicon.svg',
      data: { url: message.url || '/dashboard' },
    }),
  )
})

// Clicking a reminder focuses an open Daymark tab, or opens one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (open) return open.focus().then((client) => client.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
