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

self.addEventListener("fetch", function(e) {
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