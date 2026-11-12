// Registro del service worker e indicador discreto de preparación sin conexión (pie de página).
// «Lista para usar sin conexión» solo se muestra cuando el service worker confirma que TODOS los archivos están guardados.
// No guarda datos del usuario: solo pregunta al service worker por los archivos de la app.

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

export function iniciarPWA(el) {
  if (!el) return;
  const estado = { estado: 'preparando', version: '' };
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

  const consultar = () => {
    const sw = navigator.serviceWorker.controller ?? null;
    navigator.serviceWorker.ready.then((reg) => {
      const destino = reg.active ?? sw;
      if (!destino) return;
      const canal = new MessageChannel();
      canal.port1.onmessage = (ev) => {
        estado.version = ev.data.version;
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

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const vigilar = (w) => w?.addEventListener('statechange', () => {
      if (w.state === 'redundant' && !reg.active) { estado.estado = 'error'; pintar(); }
      if (w.state === 'activated') consultar();
    });
    vigilar(reg.installing);
    reg.addEventListener('updatefound', () => vigilar(reg.installing));
    consultar();
  }).catch(() => { estado.estado = 'error'; pintar(); });
  navigator.serviceWorker.addEventListener('controllerchange', consultar);
}
