var CACHE_NAME = "mi-tension-v2";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./vendor/jspdf.umd.min.js"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(nombres){
      return Promise.all(
        nombres.filter(function(n){ return n !== CACHE_NAME; })
               .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  var url = new URL(event.request.url);
  // Todos los archivos, incluido jsPDF, son locales: todo se sirve desde caché una vez instalada.
  if(url.origin !== location.origin){
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(respuesta){
      return respuesta || fetch(event.request).then(function(red){
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, red.clone());
          return red;
        });
      }).catch(function(){
        return caches.match("./index.html");
      });
    })
  );
});
