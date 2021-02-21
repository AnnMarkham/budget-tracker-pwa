//Files to Cache
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/css/style.css",
    "/js/idb.js",
    "/js/index.js",
    "/icons/icon-72x72.png",
    "/icons/icon-96x96.png",
    "/icons/icon-128x128.png",
    "/icons/icon-144x144.png",
    "/icons/icon-152x152.png",
    "/icons/icon-192x192.png",
    "/icons/icon-384x384.png",
    "/icons/icon-512x512.png"
  ];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

//Install the Service Worker -- creates a version specific cache
self.addEventListener("install", function (e) {
  e.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
          console.log("Your files were pre-cached successfully!");
          return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

  //Activate the Service Worker -- event fires after previously cached data has been removed
  self.addEventListener('activate', (e) => {
    //remove old caches
    e.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map((key, i) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log('deleting cache : ' + key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    self.clients.claim();
  });


self.addEventListener("fetch", e => {
    if (e.request.url.includes('/api/') && e.request.method === 'GET') {
        e.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(e.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(e.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        return cache.match(e.request);
                    });
            })
        );
        return;
    }
    //if offline respond with cached data
    e.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(e.request).then(response => {
                return response || fetch(e.request);
            });
        })
    );
});

