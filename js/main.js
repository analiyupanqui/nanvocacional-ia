// Navegación y estado en memoria de los módulos estudiante (#/perfil, #/resultados) y docente (#/docente/...).
// Privacidad: el estado vive SOLO en memoria (sin almacenamiento del navegador, sin cookies, sin red).
// Las rutas (#/...) nunca contienen puntajes; recargar la página borra la sesión.
import { LETRAS, validarPuntajes } from './core/riasec.js';
import { recomendar } from './core/recomendador.js';
import { PERFILES_DEMO } from './data/perfiles-demo.js';
import { REFERENCIA_PREDETERMINADA } from './data/provincias-referencia.js';
import { leerNumero } from './ui/formato.js';
import { nani } from './ui/identidad.js';
import * as V from './ui/vistas.js';
import * as D from './ui/docente.js';
import { filtrarCatalogo } from './ui/catalogo-busqueda.js';
import * as Voz from './ui/voz.js';
import { iniciarPWA } from './pwa.js';

const app = document.getElementById('app');
const avisoFlotante = document.getElementById('aviso-flotante');
const menuBoton = document.getElementById('menu-boton');
const menuPanel = document.getElementById('menu-panel');
const dialogo = document.getElementById('dialogo-borrar');
document.getElementById('marca-logo').innerHTML = nani({ expresion: 'feliz' });

// provincia: por defecto Abancay (referencia Lambrama, Abancay); '' = sin referencia; texto = otra provincia.
let sesion = null; // { puntajes, demoId|null, provincia, cambiandoProvincia }
let borrador = { manual: null, errores: [] };
let destinoTrasBorrar = '#/';
let docente = D.estadoDocenteInicial(); // módulo docente: solo memoria, sin cuentas ni historiales

function borrarTodo() {
  Voz.detener();
  sesion = null;
  borrador = { manual: null, errores: [] };
  docente = D.estadoDocenteInicial();
}

function ir(ruta, { reemplazar = false } = {}) {
  if (location.hash === ruta) render();
  else if (reemplazar) { location.replace(ruta); }
  else location.hash = ruta;
}

function avisar(texto) {
  avisoFlotante.textContent = texto;
  avisoFlotante.classList.add('visible');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => avisoFlotante.classList.remove('visible'), 3000);
}

const recomendacion = () => recomendar(sesion.puntajes, { provinciaReferencia: sesion.provincia || null });

function render() {
  const [pantalla = '', sub = ''] = location.hash.replace(/^#\/?/, '').split('/');
  if (['resultados', 'carreras', 'detalle'].includes(pantalla) && !sesion) {
    location.replace('#/perfil');
    return;
  }
  // Rutas de versiones anteriores (carreras, detalle): ahora todo está en la página única.
  if (pantalla === 'carreras' || pantalla === 'detalle') {
    location.replace('#/resultados');
    return;
  }

  let html;
  switch (pantalla) {
    case '': html = V.vistaInicio(); break;
    case 'perfil': html = V.vistaPerfil(borrador); break;
    case 'resultados': html = V.vistaResultados(sesion, recomendacion()); break;
    case 'docente': {
      const r = docente.puntajes ? recomendar(docente.puntajes, { provinciaReferencia: docente.provincia || null }) : null;
      html = D.vistaDocente(sub, docente, r);
      break;
    }
    default: html = V.vistaNoEncontrada();
  }

  Voz.detener(); // la voz nunca continúa al cambiar o redibujar la pantalla
  app.innerHTML = html;
  cerrarMenu();
  window.scrollTo(0, 0);
  const h = app.querySelector('[data-enfoque]');
  if (h) h.focus({ preventScroll: true });
  document.title = `${h ? h.textContent.trim() : ''} · ÑanVocacional IA`.replace(/^ · /, '');
}

function rerenderConservandoScroll(selectorFoco) {
  const y = window.scrollY;
  const abiertos = [...app.querySelectorAll('details[open][id]')].map((d) => d.id);
  render();
  abiertos.forEach((id) => { const d = document.getElementById(id); if (d) d.open = true; });
  window.scrollTo(0, y);
  const el = selectorFoco && app.querySelector(selectorFoco);
  if (el) el.focus({ preventScroll: true });
}

// ---- Menú discreto ----
function cerrarMenu() { menuPanel.hidden = true; menuBoton.setAttribute('aria-expanded', 'false'); }
menuBoton.addEventListener('click', (ev) => {
  ev.stopPropagation();
  const abrir = menuPanel.hidden;
  menuPanel.hidden = !abrir;
  menuBoton.setAttribute('aria-expanded', String(abrir));
  if (abrir) menuPanel.querySelector('.menu__item')?.focus();
});
menuPanel.addEventListener('click', (ev) => { if (ev.target.closest('[data-cierra-menu]')) cerrarMenu(); });
document.addEventListener('click', (ev) => { if (!menuPanel.hidden && !ev.target.closest('.menu')) cerrarMenu(); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !menuPanel.hidden) { cerrarMenu(); menuBoton.focus(); } });

// ---- Borrado con confirmación ----
function pedirBorrado(destino) {
  destinoTrasBorrar = destino;
  cerrarMenu();
  dialogo.returnValue = '';
  dialogo.showModal();
  dialogo.querySelector('[value="cancelar"]').focus();
}
dialogo.addEventListener('close', () => {
  if (dialogo.returnValue !== 'borrar') return;
  borrarTodo();
  ir(destinoTrasBorrar, { reemplazar: true });
  avisar('Listo: se borraron los datos de esta sesión.');
});
document.getElementById('menu-terminar').addEventListener('click', () => pedirBorrado('#/'));

// ---- Acciones de las vistas ----
app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-accion]');
  if (!el) return;
  switch (el.dataset.accion) {
    case 'demo': {
      const d = PERFILES_DEMO.find((p) => p.id === el.dataset.id);
      if (!d) return;
      sesion = { puntajes: { ...d.puntajes }, demoId: d.id, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false };
      borrador = { manual: null, errores: [] };
      ir('#/resultados');
      break;
    }
    case 'provincia':
      sesion.provincia = el.dataset.valor;
      sesion.cambiandoProvincia = false;
      rerenderConservandoScroll('#t-carreras');
      break;
    case 'cambiar-provincia':
      sesion.cambiandoProvincia = !sesion.cambiandoProvincia;
      rerenderConservandoScroll(sesion.cambiandoProvincia ? '[data-accion="provincia"][aria-pressed="true"]' : '[data-accion="cambiar-provincia"]');
      break;
    case 'terminar':
      pedirBorrado('#/');
      break;
    case 'nuevo':
      pedirBorrado('#/perfil');
      break;
    case 'borrar-analizador':
      Voz.detener();
      docente = { ...D.estadoDocenteInicial(), texto: docente.texto, universidad: docente.universidad };
      render();
      avisar('Se borraron los puntajes.');
      break;
    case 'etapa': {
      docente.etapa = Number(el.dataset.valor);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      document.querySelector('#etapa-actual .etapa__titulo')?.scrollIntoView({ block: 'nearest' });
      app.querySelector('.etapa-paso[aria-current="step"]')?.focus({ preventScroll: true });
      break;
    }
    case 'voz-escuchar': {
      const etapa = el.closest('.voz')?.previousElementSibling;
      const texto = etapa?.querySelector('.burbuja')?.dataset.voz ?? '';
      const aviso = el.parentElement.querySelector('.voz__aviso');
      const detenerBtn = el.parentElement.querySelector('.voz__detener');
      const res = Voz.hablar(texto, {
        alTerminar: () => { detenerBtn.hidden = true; el.hidden = false; etapa?.classList.remove('hablando'); },
      });
      if (res.ok) {
        aviso.textContent = '';
        el.hidden = true;
        detenerBtn.hidden = false;
        etapa?.classList.add('hablando');
        detenerBtn.focus();
      } else {
        aviso.textContent = res.motivo;
      }
      break;
    }
    case 'voz-detener': {
      Voz.detener();
      el.hidden = true;
      const escuchar = el.parentElement.querySelector('.voz__escuchar');
      escuchar.hidden = false;
      el.closest('.voz')?.previousElementSibling?.classList.remove('hablando');
      escuchar.focus();
      break;
    }
    default:
  }
});

// Catálogo docente: buscador y selector de universidad. Actualiza solo la lista para no perder el foco.
function actualizarCatalogo() {
  const filas = filtrarCatalogo(D.filtroCatalogo(docente));
  document.getElementById('resultados-catalogo').innerHTML = D.listaCatalogo(filas);
  document.getElementById('conteo-catalogo').textContent = D.textoConteo(filas);
}
app.addEventListener('input', (ev) => {
  if (ev.target.id !== 'buscar-catalogo') return;
  docente.texto = ev.target.value;
  actualizarCatalogo();
});
app.addEventListener('change', (ev) => {
  if (ev.target.id !== 'filtro-universidad') return;
  docente.universidad = ev.target.value;
  actualizarCatalogo();
});

// Analizador docente: valida con el motor existente; los puntajes no se guardan.
app.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-docente') return;
  ev.preventDefault();
  const datos = new FormData(ev.target);
  const crudo = Object.fromEntries(LETRAS.map((l) => [l, String(datos.get(l) ?? '')]));
  const puntajes = Object.fromEntries(LETRAS.map((l) => [l, leerNumero(crudo[l])]));
  const v = validarPuntajes(puntajes);
  docente.provincia = String(datos.get('provincia') ?? '');
  docente.manual = crudo;
  docente.errores = v.ok ? [] : v.errores;
  docente.puntajes = v.ok ? puntajes : null;
  docente.etapa = 1;
  render();
  if (v.ok) {
    const t = document.getElementById('t-analisis');
    t?.focus({ preventScroll: true });
    t?.scrollIntoView({ block: 'start' });
  } else app.querySelector('[aria-invalid="true"]')?.focus();
});

app.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-manual') return;
  ev.preventDefault();
  const datos = new FormData(ev.target);
  const crudo = Object.fromEntries(LETRAS.map((l) => [l, String(datos.get(l) ?? '')]));
  const puntajes = Object.fromEntries(LETRAS.map((l) => [l, leerNumero(crudo[l])]));
  const v = validarPuntajes(puntajes);
  if (!v.ok) {
    borrador = { manual: crudo, errores: v.errores };
    render();
    app.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  sesion = { puntajes, demoId: null, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false };
  borrador = { manual: crudo, errores: [] };
  ir('#/resultados');
});

window.addEventListener('hashchange', render);
// La voz se detiene al abandonar u ocultar la página.
window.addEventListener('pagehide', () => Voz.detener());
document.addEventListener('visibilitychange', () => { if (document.hidden) Voz.detener(); });
Voz.prepararVoces();
render();
iniciarPWA(document.getElementById('estado-offline')); // service worker: solo archivos de la app, nunca resultados
