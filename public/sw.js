// public/sw.js

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? "/icon-192x192.png",
      badge: payload.badge ?? "/badge-72x72.png",
      tag: payload.tag,
      data: { url: payload.url },
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url;

  if (!url) return;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existingClient = clientList.find((c) => c.url.includes(url));

        if (existingClient) {
          return existingClient.focus();
        }

        return clients.openWindow(url);
      }),
  );
});
