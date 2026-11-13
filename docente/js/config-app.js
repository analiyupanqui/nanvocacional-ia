// Qué aplicación es esta copia (separación 0.8.0).
// En app/ (desarrollo y pruebas) es la COMPLETA. tools/construir-apps.js genera, a partir del mismo código:
//   - la del ESTUDIANTE en /nanvocacional-ia/ (sin el módulo docente en sus archivos), y
//   - la DOCENTE en /nanvocacional-ia/docente/,
// cada una con su propio service worker y su propia caché. La construcción solo cambia la línea siguiente.
export const APP = 'docente';

// «Acceso para docentes»: en la app del estudiante abre la app docente, que es independiente.
export const ENLACE_DOCENTE = APP === 'estudiante' ? 'docente/' : '#/docente/asistente';

// Protección para tabletas que tienen instalada la app única anterior (0.3.0–0.7.3) en /nanvocacional-ia/:
// su service worker puede entregar su index.html antiguo la primera vez que se abre docente/. Si el HTML no es el
// de esta app, se registra el service worker propio y se recarga UNA sola vez; mientras tanto no se ejecuta nada más.
const propia = APP === 'completa' || document.querySelector('meta[name="nanvoc-app"]')?.content === APP;
if (!propia) {
  const yaRecargada = performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload';
  if (!yaRecargada && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(r, 8000))]);
    } catch { /* se recarga igual: la red puede entregar la página correcta */ }
    location.reload();
  } else {
    document.body.innerHTML = '<p style="padding:1rem;font:1.1rem system-ui">Cierra esta pestaña y vuelve a abrir la aplicación para terminar de actualizarla.</p>';
  }
  await new Promise(() => {}); // detiene el resto de la carga de esta copia antigua de la página
}
