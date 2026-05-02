self.addEventListener("install", function(e) {
    self.skipWaiting();
});

self.addEventListener("activate", function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) { return caches.delete(k); }));
        })
    );
    self.clients.claim();
});

self.addEventListener("push", function(e) {
    if (!e.data) return;
    var payload = e.data.json();
    e.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: "/assets/icon-192.png",
            badge: "/assets/badge-96.png",
            data: payload.data || {},
            tag: payload.data && payload.data.timerId ? "timer-" + payload.data.timerId : "la-notification",
            renotify: true
        })
    );
});

self.addEventListener("notificationclick", function(e) {
    e.notification.close();
    var data = e.notification.data || {};
    var url = "/little-arrivals.html";
    e.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(list) {
            for (var c of list) {
                if (c.url.includes("little-arrivals") && "focus" in c) {
                    return c.focus().then(function(client) {
                        return client.postMessage({ type: "OPEN_TIMER", data: data });
                    });
                }
            }
            return clients.openWindow(url).then(function(client) {
                if (!client) return;
                // Delay to allow page scripts to finish loading and register listeners
                setTimeout(function() {
                    client.postMessage({ type: "OPEN_TIMER", data: data });
                }, 1000);
            });
        })
    );
});

self.addEventListener("fetch", function(e) {
    var url = e.request.url;
    if (url.includes("supabase.co") || url.includes("supabase.io")) return;
    e.respondWith(
        fetch(e.request).then(function(response) {
            var clone = response.clone();
            caches.open("la-cache").then(function(cache) {
                cache.put(e.request, clone);
            });
            return response;
        }).catch(function() {
            return caches.match(e.request);
        })
    );
});