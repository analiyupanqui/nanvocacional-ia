// Registro del service worker, indicador discreto de preparación sin conexión (pie de página) y aviso de
// actualización. No guarda datos del usuario: solo pregunta al service worker por los archivos de la app.
//
// Corrección 0.4.2: el pie muestra la versión del CÓDIGO QUE ESTÁ EN EJECUCIÓN (version.js), no la del service
// worker más reciente. Una versión nueva espera («waiting») y se aplica recargando la página entera:
//   - sin datos en memoria (portada, sin respuestas): se aplica sola;
//   - con respuestas o resultados: aviso con «Actualizar ahora» (nunca se borra nada sin que la persona lo pida).
import { VERSION_APP } from './version.js';

export { VERSION_APP };

/** Texto del indicador según el estado. Función pura (probada en tests/pwa.test.js). */
export function textoEstadoOffline({ estado, enLinea = true, version = '' }) {
  const v = version ? ` · versión ${version}` : '';
  switch (estado) {
    case 'lista':
      return enLinea ? `✓ Lista para usar sin conexión${v}` : `Sin conexión: funcionando con la copia guardada${v}`;
    case 'preparando':
      return enLinea ? 'Preparando el uso sin conexión… mantén la conexión unos segundos.' : 'Sin conexión: el uso sin conexión aún no estaba listo.';
    case 'error':
      return 'No se pudo preparar el uso sin conexión. Vuelve a abrir la página con conexión.';
    case 'no-disponible':
      return 'Este navegador o esta dirección no permiten el uso sin conexión (se requiere HTTPS).';
    default:
      return '';
  }
}

/**
 * @param {HTMLElement} el  indicador del pie
 * @param {{ aviso?: HTMLElement|null, hayDatosEnMemoria?: () => boolean }} opciones
 */
export function iniciarPWA(el, { aviso = null, hayDatosEnMemoria = () => true } = {}) {
  if (!el) return;
  const estado = { estado: 'preparando', version: VERSION_APP };
  el.dataset.version = VERSION_APP;
  const pintar = () => {
    el.dataset.estado = estado.estado;
    el.textContent = textoEstadoOffline({ ...estado, enLinea: navigator.onLine });
    el.hidden = false;
  };
  window.addEventListener('online', pintar);
  window.addEventListener('offline', pintar);

  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    estado.estado = 'no-disponible';
    pintar();
    return;
  }
  pintar();

  // Pregunta al service worker que SIRVE esta página (o al activo, en la primera instalación) si todo está guardado.
  const consultar = () => {
    navigator.serviceWorker.ready.then((reg) => {
      const destino = navigator.serviceWorker.controller ?? reg.active;
      if (!destino) return;
      const canal = new MessageChannel();
      canal.port1.onmessage = (ev) => {
        el.dataset.versionServiceWorker = ev.data.version;
        estado.estado = ev.data.completo ? 'lista' : 'preparando';
        pintar();
        if (ev.data.completo) {
          // Pide al navegador que no borre la caché por falta de espacio (puede negarlo; no es un error).
          navigator.storage?.persist?.().then((p) => { el.dataset.persistente = String(p); }).catch(() => {});
        } else setTimeout(consultar, 1500);
      };
      destino.postMessage({ tipo: 'estado' }, [canal.port2]);
    });
  };

  // ---- Actualización segura ----
  let recargarAlCambiar = false;
  const aplicar = (w) => {
    recargarAlCambiar = true;
    w.postMessage({ tipo: 'activar' });
  };
  const ofrecer = (reg) => {
    const w = reg.waiting;
    if (!w || !navigator.serviceWorker.controller) return; // primera instalación: no hay nada que reemplazar
    el.dataset.actualizacion = 'disponible';
    if (!hayDatosEnMemoria()) { aplicar(w); return; }
    if (!aviso) return;
    aviso.hidden = false;
    aviso.querySelector('button')?.addEventListener('click', () => aplicar(reg.waiting ?? w), { once: true });
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargarAlCambiar) { recargarAlCambiar = false; location.reload(); return; }
    consultar();
  });

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const vigilar = (w) => w?.addEventListener('statechange', () => {
      if (w.state === 'installed') ofrecer(reg);
      if (w.state === 'activated') consultar();
      if (w.state === 'redundant' && !reg.active) { estado.estado = 'error'; pintar(); }
    });
    vigilar(reg.installing);
    reg.addEventListener('updatefound', () => vigilar(reg.installing));
    ofrecer(reg);
    consultar();
  }).catch(() => { estado.estado = 'error'; pintar(); });
}
