// Service worker de ÑanVocacional IA (Sprint 3, PWA offline).
// Guarda SOLO los archivos de la aplicación (interfaz, motor RIASEC, catálogo, Ñani e iconos).
// Nunca guarda puntajes ni resultados: esos viven en memoria y no pasan por la red.
// Solo atiende solicitudes GET del mismo origen; no envía datos a terceros.
// IMPORTANTE: cada vez que cambie un archivo de app/, subir VERSION para que la tableta descargue la nueva copia.
const VERSION = '0.3.0';
const CACHE = `nanvoc-v${VERSION}`;
const PREFIJO = 'nanvoc-';

// Lista explícita (rutas relativas a la carpeta de la app). tests/pwa.test.js comprueba que coincide con app/.
const ARCHIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "iconos/icono.svg",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "iconos/icono-maskable-512.png",
  "js/main.js",
  "js/pwa.js",
  "js/core/recomendador.js",
  "js/core/riasec.js",
  "js/data/catalogo.js",
  "js/data/ejemplos-riasec.js",
  "js/data/fuentes.js",
  "js/data/perfiles-demo.js",
  "js/data/provincias-referencia.js",
  "js/data/tipos-riasec.js",
  "js/data/universidades.js",
  "js/ui/agrupar.js",
  "js/ui/catalogo-busqueda.js",
  "js/ui/docente.js",
  "js/ui/formato.js",
  "js/ui/grafico.js",
  "js/ui/identidad.js",
  "js/ui/nani-mensajes.js",
  "js/ui/orientacion.js",
  "js/ui/paneles-orientador.js",
  "js/ui/vistas.js",
  "js/ui/voz.js"
];

const absoluta = (ruta) => new URL(ruta, self.registration.scope).href;
const INDICE = () => absoluta('index.html');

self.addEventListener('install', (ev) => {
  // cache: 'reload' evita copiar versiones viejas de la caché HTTP del navegador.
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS.map((r) => new Request(absoluta(r), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith(PREFIJO) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !req.url.startsWith(self.registration.scope)) return;

  if (req.mode === 'navigate') {
    // Cualquier navegación dentro de la app (/, /index.html, con o sin #ruta) usa index.html guardado.
    ev.respondWith(caches.match(INDICE(), { cacheName: CACHE }).then((r) => r || fetch(req)));
    return;
  }
  // Recursos propios: primero la caché; si falta alguno, se intenta la red sin guardarlo.
  ev.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((r) => r || fetch(req)));
});

// Estado para el indicador del pie de página: responde si TODOS los archivos están guardados.
self.addEventListener('message', (ev) => {
  if (ev.data?.tipo !== 'estado' || !ev.ports[0]) return;
  caches.open(CACHE)
    .then((c) => Promise.all(ARCHIVOS.map((r) => c.match(absoluta(r)))))
    .then((rs) => {
      const guardados = rs.filter(Boolean).length;
      ev.ports[0].postMessage({ version: VERSION, guardados, total: ARCHIVOS.length, completo: guardados === ARCHIVOS.length });
    })
    .catch(() => ev.ports[0].postMessage({ version: VERSION, guardados: 0, total: ARCHIVOS.length, completo: false }));
});
