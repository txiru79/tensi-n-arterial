var CACHE_NAME = "mi-tension-v3";
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
  if(url.origin !== location.origin){
    return;
  }

  // El HTML (la app en sí) se pide siempre por red primero, para que las
  // actualizaciones lleguen enseguida. Solo se usa la copia guardada si no hay conexión.
  var esHTML = event.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("/");
  if(esHTML){
    event.respondWith(
      fetch(event.request).then(function(red){
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, red.clone()); });
        return red;
      }).catch(function(){
        return caches.match(event.request).then(function(r){ return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  // El resto (iconos, manifest, jsPDF) casi nunca cambia: se sirve directo de caché.
  event.respondWith(
    caches.match(event.request).then(function(respuesta){
      return respuesta || fetch(event.request).then(function(red){
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, red.clone());
          return red;
        });
      });
    }).catch(function(){
      return caches.match("./index.html");
    })
  );
});
