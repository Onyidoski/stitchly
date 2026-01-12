self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // Make sure you have an icon in public folder
      badge: '/badge-72x72.png', // Optional: small monochrome icon
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url, // <--- FIX: Store the URL passed from the server
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()

  // FIX: Use the URL we stored in the data object, or fallback to default
  const targetUrl = event.notification.data?.url || 'https://stitchly-app.vercel.app/orders'

  event.waitUntil(
    clients.openWindow(targetUrl)
  )
})