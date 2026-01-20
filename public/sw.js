self.addEventListener("push", function (event) {
  if (event.data) {
    const data = JSON.parse(event.data.text())
    const options = {
      body: data.message,
      icon: "/icon-192x192.png", // Make sure this exists
      badge: "/badge-72x72.png", // Make sure this exists
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow("/"))
})
