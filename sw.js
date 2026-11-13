// Service worker de ÑanVocacional IA (Sprint 3, PWA offline).
// Guarda SOLO los archivos de la aplicación (interfaz, motor RIASEC, catálogo, Ñani e iconos).
// Nunca guarda puntajes ni resultados: esos viven en memoria y no pasan por la red.
// Solo atiende solicitudes GET del mismo origen; no envía datos a terceros.
// IMPORTANTE: cada vez que cambie un archivo de app/, subir VERSION para que la tableta descargue la nueva copia.
const VERSION = '0.8.1';
// Qué aplicación sirve este service worker (separación 0.8.0). En app/ es la completa (desarrollo y pruebas);
// tools/construir-apps.js lo cambia a 'estudiante' (/nanvocacional-ia/) o 'docente' (/nanvocacional-ia/docente/).
const APP = 'estudiante';
// Cada aplicación tiene SU prefijo de caché: ninguna borra la caché de la otra (comparten el origen en GitHub Pages)
// ni cachés de otros sitios.
const PREFIJO = { completa: 'nanvoc-v', estudiante: 'nanvoc-est-v', docente: 'nanvoc-doc-v' }[APP];
const CACHE = `${PREFIJO}${VERSION}`;
// La app del estudiante ocupa la dirección de la app única anterior (0.3.0–0.7.3): al activarse borra esa caché.
const HEREDADA = APP === 'estudiante' ? 'nanvoc-v' : null;
// La app del estudiante no atiende la carpeta docente/: es otra aplicación, con su propio service worker.
const AJENA = APP === 'estudiante' ? 'docente/' : null;

// Lista explícita (rutas relativas a la carpeta de la app). tests/pwa.test.js comprueba que coincide con app/.
const ARCHIVOS = [
  "./",
  "css/app.css",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "iconos/icono-maskable-512.png",
  "iconos/icono.svg",
  "index.html",
  "js/config-app.js",
  "js/core/exploracion.js",
  "js/core/recomendador.js",
  "js/core/riasec.js",
  "js/cuestionarios/provisional.js",
  "js/cuestionarios/puntuacion.js",
  "js/cuestionarios/recorrido.js",
  "js/cuestionarios/registro.js",
  "js/data/catalogo.js",
  "js/data/descripciones-carreras.js",
  "js/data/ejemplos-feria.js",
  "js/data/fuentes.js",
  "js/data/mallas.js",
  "js/data/perfiles-demo.js",
  "js/data/provincias-referencia.js",
  "js/data/tipos-riasec.js",
  "js/data/universidades.js",
  "js/main.js",
  "js/pwa.js",
  "js/ui/catalogo-busqueda.js",
  "js/ui/chat-nani.js",
  "js/ui/destello.js",
  "js/ui/formato.js",
  "js/ui/identidad.js",
  "js/ui/nani-mensajes.js",
  "js/ui/nani-voz.js",
  "js/ui/vistas.js",
  "js/ui/voz.js",
  "js/version.js",
  "mallas/unamba-administracion-plan-estudios.pdf",
  "mallas/unamba-agroindustrial-plan-estudios.pdf",
  "mallas/unamba-ciencia-politica-plan-estudios.pdf",
  "mallas/unamba-educacion-inicial-plan-estudios.pdf",
  "mallas/unamba-informatica-sistemas-plan-estudios.pdf",
  "mallas/unamba-veterinaria-zootecnia-plan-estudios.pdf",
  "manifest.webmanifest"
];

const absoluta = (ruta) => new URL(ruta, self.registration.scope).href;
const INDICE = () => absoluta('index.html');

self.addEventListener('install', (ev) => {
  // cache: 'reload' evita copiar versiones viejas de la caché HTTP del navegador.
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS.map((r) => new Request(absoluta(r), { cache: 'reload' })))),
    // Sin skipWaiting automático (corrección 0.4.2): una versión nueva ESPERA hasta que se cierre la app o hasta
    // que la página pida activarla y se recargue entera. Así nunca se mezclan archivos de dos versiones
    // (antes, la versión nueva tomaba el control a mitad de la carga: interfaz antigua con pie nuevo o página rota).
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => (k.startsWith(PREFIJO) && k !== CACHE) || (HEREDADA && k.startsWith(HEREDADA))).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !req.url.startsWith(self.registration.scope)) return;
  const ruta = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (AJENA && ruta.startsWith(AJENA)) return; // la otra aplicación la atiende su propio service worker

  if (req.mode === 'navigate') {
    if (ruta !== '' && ruta !== 'index.html') {
      // Corrección 0.7.3: un archivo propio abierto en una pestaña (p. ej., el PDF oficial de una malla) se entrega
      // tal cual desde la caché. Antes TODA navegación recibía index.html y el PDF se veía como la app sin estilos.
      ev.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((r) => r || fetch(req)));
      return;
    }
    // La app (/ o /index.html, con o sin #ruta) usa index.html guardado.
    ev.respondWith(caches.match(INDICE(), { cacheName: CACHE }).then((r) => r || fetch(req)));
    return;
  }
  // Recursos propios: primero la caché; si falta alguno, se intenta la red sin guardarlo.
  ev.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((r) => r || fetch(req)));
});

// La página pide activar la versión que espera (y después se recarga entera). Lo hace sola si no hay datos en
// memoria; si hay respuestas o resultados, solo cuando la persona pulsa «Actualizar ahora».
self.addEventListener('message', (ev) => {
  if (ev.data?.tipo === 'activar') self.skipWaiting();
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
