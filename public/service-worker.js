const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/js/index.js",
  "/js/idb.js",
  "css/styles.css",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";
 
// install the service worker
self.addEventListener("install", function (e) {
  e.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
          console.log("Your files were pre-cached successfully!");
          return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// activate the service worker -- Promise resolves once old version of cache is deleted
self.addEventListener("activate", function (e) {
  e.waitUntil(
      caches.keys().then(keyList => {
          return Promise.all(
              keyList.map(key => {
                  if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                      console.log("Removing old cache data", key);
                      return caches.delete(key);
                  }
              })
          );
      })
  );

  self.clients.claim();
});

// intercept fetch requests 
self.addEventListener("fetch", e => {
  if (e.request.url.includes('/api/')) {
      e.respondWith(
          caches.open(DATA_CACHE_NAME).then(cache => {
              return fetch(e.request)
                  .then(response => {
                      // If the response was good, clone it and store it in the cache.  
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
  //if offline  -- deliver resource directly from the cache
  e.respondWith(
      caches.open(CACHE_NAME).then(cache => {
          return cache.match(e.request).then(response => {
              return response || fetch(e.request);
          });
      })
  );
});