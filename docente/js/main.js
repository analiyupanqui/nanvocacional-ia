// Navegación y estado en memoria de los módulos estudiante (#/cuestionario, #/resultados; modo demostración
// #/perfil) y docente (#/docente/...).
// Privacidad: el estado vive SOLO en memoria (sin almacenamiento del navegador, sin cookies, sin red).
// Las rutas (#/...) nunca contienen respuestas ni puntajes; recargar la página borra la sesión.
// Las respuestas del cuestionario se descartan en cuanto se calcula el resultado.
// Separación 0.8.0: el código exclusivo del módulo docente está marcado (líneas y bloques; ver la sintaxis en
// tools/construir-apps.js), que lo elimina en la app del estudiante: no viaja en sus archivos.
import { APP } from './config-app.js';
import { LETRAS, validarPuntajes } from './core/riasec.js';
import { recomendar } from './core/recomendador.js'; // @docente
import { PERFILES_DEMO } from './data/perfiles-demo.js';
import { REFERENCIA_PREDETERMINADA } from './data/provincias-referencia.js';
import { leerNumero } from './ui/formato.js';
import { nani } from './ui/identidad.js';
import * as V from './ui/vistas.js';
import * as D from './ui/docente.js'; // @docente
import { filtrarCatalogo } from './ui/catalogo-busqueda.js'; // @docente
import * as Voz from './ui/voz.js';
import { iniciarPWA } from './pwa.js';
import { obtenerInstrumento } from './cuestionarios/registro.js';
import * as R from './cuestionarios/recorrido.js';
import { explorarCarreras, alternarInteresada } from './core/exploracion.js';
import * as NaniVoz from './ui/nani-voz.js';
import { SALUDO, MENSAJES_HITO, fraseResultado } from './ui/nani-mensajes.js';
import { EJEMPLOS_FERIA, respuestasDeEjemplo } from './data/ejemplos-feria.js';
import { puntuar } from './cuestionarios/puntuacion.js';
import * as Chat from './ui/chat-nani.js';
import { destello } from './ui/destello.js';

const instrumento = obtenerInstrumento(); // cuestionario provisional propio (no O*NET)

const app = document.getElementById('app');
const avisoFlotante = document.getElementById('aviso-flotante');
const menuBoton = document.getElementById('menu-boton');
const menuPanel = document.getElementById('menu-panel');
const dialogo = document.getElementById('dialogo-borrar');
document.getElementById('marca-logo').innerHTML = nani({ expresion: 'feliz' });

// provincia: por defecto Abancay (referencia Lambrama, Abancay); '' = sin referencia; texto = otra provincia.
let sesion = null; // { puntajes, escalaMax, origen: 'cuestionario'|'demo'|'manual', demoId|null, provincia, cambiandoProvincia }
let recorrido = null; // cuestionario en curso: { indice, respuestas } solo en memoria
let borrador = { manual: null, errores: [] };
const FILTROS_INICIALES = { texto: '', universidad: '', ubicacion: '', orden: 'afinidad' };
let filtrosExplorar = { ...FILTROS_INICIALES }; // exploración de las 23 carreras: solo memoria
let destinoTrasBorrar = '#/';
let docente = D.estadoDocenteInicial(); // @docente (módulo docente: solo memoria, sin cuentas ni historiales)
const datosDeOtrosModulos = []; // funciones que indican si otro módulo tiene datos en memoria
datosDeOtrosModulos.push(() => !!docente.puntajes); // @docente
// @docente-inicio
const CLAVE_ACCESO_DOCENTE = 'nanvoc-acceso-docente'; // indicador de sesión (sin datos personales)
let accesoDocente = (() => { try { return sessionStorage.getItem(CLAVE_ACCESO_DOCENTE) === '1'; } catch { return false; } })();
let errorAcceso = '';
// @docente-fin
let ultimaPantalla = null; // para animar solo el cambio de pregunta y no cortar la voz al redibujar la misma pantalla
let ultimoIndice = -1;
let ultimaClaveVista = null;
let contadorSesion = 0; // identifica cada resultado para que Ñani diga su frase una sola vez
const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function borrarTodo() {
  Voz.detener();
  sesion = null;
  recorrido = null;
  borrador = { manual: null, errores: [] };
  docente = D.estadoDocenteInicial(); // @docente
  filtrosExplorar = { ...FILTROS_INICIALES };
  NaniVoz.olvidar('cuest-');
  NaniVoz.olvidar('res-');
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

// Página del estudiante: las 23 carreras por afinidad descriptiva (seis puntuaciones), sin cercanía en el orden.
const exploracion = () => explorarCarreras(sesion.puntajes, { provinciaReferencia: sesion.provincia || null, escalaMax: sesion.escalaMax ?? 40 });

function render() {
  const [pantalla = '', sub = ''] = location.hash.replace(/^#\/?/, '').split('/');
  // App docente: su inicio es el módulo docente (sin portada del estudiante ni bienvenida).
  if (APP === 'docente' && pantalla === '') { location.replace('#/docente/asistente'); return; }
  if (['resultados', 'detalle'].includes(pantalla) && !sesion) {
    location.replace('#/');
    return;
  }
  // Sin cuestionario en curso, #/cuestionario empieza uno nuevo (las respuestas anteriores ya se descartaron).
  if (pantalla === 'cuestionario' && !recorrido) recorrido = R.crearRecorrido(instrumento);
  const animarPregunta = pantalla === 'cuestionario' && recorrido.indice !== ultimoIndice && !movimientoReducido();
  // Ruta de versiones anteriores (detalle): ahora está en la página única.
  if (pantalla === 'detalle') {
    location.replace('#/resultados');
    return;
  }

  let html;
  switch (pantalla) {
    case '': html = V.vistaInicio(); break;
    case 'cuestionario': html = V.vistaPregunta(instrumento, recorrido, { animar: animarPregunta }); break;
    case 'feria': html = V.vistaFeria(); break;
    case 'herramientas': html = V.vistaHerramientas(); break; // @docente
    case 'perfil': html = V.vistaPerfil(borrador); break;
    case 'resultados': html = V.vistaResultados(sesion, exploracion()); break;
    case 'carreras': html = V.vistaExplorar(sesion, sesion ? exploracion() : null, filtrosExplorar); break;
    // @docente-inicio
    case 'docente': {
      // App docente: sin pasar por «Ingresar» solo se ve la pantalla de acceso (barrera demostrativa, no seguridad real).
      if (APP === 'docente' && !accesoDocente) { html = D.vistaAccesoDocente({ error: errorAcceso }); break; }
      // Escala 0–20, la misma del cuestionario del estudiante (equivale a 0–40 con los puntajes × 2).
      const r = docente.puntajes ? recomendar(docente.puntajes, { provinciaReferencia: docente.provincia || null, escalaMax: D.ESCALA_DOCENTE }) : null;
      html = D.vistaDocente(sub, docente, r);
      break;
    }
    // @docente-fin
    default: html = V.vistaNoEncontrada();
  }

  // La voz se detiene al cambiar de vista (en el módulo docente también al cambiar de sección o de etapa),
  // pero no al redibujar la misma vista (elegir una respuesta, abrir un desplegable).
  let claveVista = pantalla;
  if (pantalla === 'docente') claveVista = `docente/${sub}/${docente.etapa ?? ''}`; // @docente
  // Estudiante: respeta una frase que Android todavía está arrancando. Módulo docente: sin cambios (detiene todo).
  if (claveVista !== ultimaClaveVista) { if (pantalla === 'docente') Voz.detener(); else Voz.detenerSiSuena(); }
  ultimaClaveVista = claveVista;
  app.innerHTML = html;
  cerrarMenu();
  window.scrollTo(0, 0);
  const h = app.querySelector('[data-enfoque]');
  if (h) h.focus({ preventScroll: true });
  document.title = `${h ? h.textContent.trim() : ''} · ÑanVocacional IA`.replace(/^ · /, '');
  ultimaPantalla = pantalla;
  ultimoIndice = pantalla === 'cuestionario' ? recorrido.indice : -1;
  hablarSegunPantalla(pantalla);
  actualizarNaniFlotante(pantalla);
}

// Ñani habla solo en momentos clave y cada mensaje una sola vez (clave): inicio, mitad y final del
// cuestionario, y una frase en resultados. Nunca en cada pregunta.
function hablarSegunPantalla(pantalla) {
  if (pantalla === 'cuestionario') {
    const m = MENSAJES_HITO[recorrido.indice];
    if (m) NaniVoz.decir(m, { clave: `cuest-${recorrido.indice}` });
  } else if (pantalla === 'resultados' && sesion) {
    NaniVoz.decir(fraseResultado(exploracion().perfil), { clave: `res-${sesion.id}` });
  }
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
const TEXTOS_DIALOGO = {
  terminar: ['¿Terminar y borrar?', 'Se borrarán las respuestas, el perfil y los resultados de esta sesión. No se podrán recuperar.', 'Sí, borrar'],
  reiniciar: ['¿Realizar nuevamente?', 'Se borrarán tus respuestas y tus resultados. Empezarás otra vez desde la pregunta 1.', 'Sí, empezar de nuevo'],
};
function pedirBorrado(destino) {
  destinoTrasBorrar = destino;
  const [t, p, b] = TEXTOS_DIALOGO[destino === '#/cuestionario' ? 'reiniciar' : 'terminar'];
  document.getElementById('dialogo-titulo').textContent = t;
  document.getElementById('dialogo-texto').textContent = p;
  document.getElementById('confirmar-borrar').textContent = b;
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
    // ---- Cuestionario ----
    case 'responder': {
      recorrido = R.responder(instrumento, recorrido, Number(el.dataset.valor));
      render();
      app.querySelector('.respuesta[aria-checked="true"]')?.focus({ preventScroll: true });
      break;
    }
    case 'siguiente':
      recorrido = R.siguiente(instrumento, recorrido);
      render();
      if (recorrido.aviso) app.querySelector('.respuesta')?.focus({ preventScroll: true });
      break;
    case 'anterior':
      recorrido = R.anterior(instrumento, recorrido);
      render();
      break;
    case 'finalizar': {
      const fin = R.finalizar(instrumento, recorrido);
      if (!fin.ok) {
        recorrido = fin.recorrido;
        render();
        return;
      }
      const { puntajes, escalaMax, instrumentoId } = fin.resultado;
      sesion = { puntajes, escalaMax, id: ++contadorSesion, origen: 'cuestionario', instrumentoId, demoId: null, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false, interesadas: [], eligiendoInteresadas: false, chat: null };
      recorrido = null; // las respuestas se descartan: solo quedan las seis puntuaciones, en memoria
      filtrosExplorar = { ...FILTROS_INICIALES }; // un resultado nuevo empieza con el orden por afinidad
      ir('#/resultados', { reemplazar: true });
      break;
    }
    // ---- Carreras que ya me interesan (no cambia puntajes ni orden) ----
    case 'elegir-interesadas':
      sesion.eligiendoInteresadas = !sesion.eligiendoInteresadas;
      rerenderConservandoScroll('[data-accion="elegir-interesadas"]');
      break;
    case 'interesada': {
      sesion.interesadas = alternarInteresada(sesion.interesadas ?? [], el.dataset.id);
      rerenderConservandoScroll(`[data-accion="interesada"][data-id="${el.dataset.id}"]`);
      break;
    }
    case 'reiniciar':
      pedirBorrado('#/cuestionario');
      break;
    case 'voz-silenciar':
      NaniVoz.silenciar();
      actualizarBotonVoz();
      avisar('Voz de Ñani silenciada.');
      break;
    // ---- Voz de Ñani: «Escuchar» lee el mensaje visible (pulsación explícita) ----
    case 'escuchar':
      NaniVoz.decir(el.dataset.mensaje ?? '', { forzar: true }).then((r) => {
        actualizarBotonVoz();
        if (r === 'sin-voz') avisar('No hay una voz en español instalada en este equipo: Ñani te acompaña con texto.');
        else if (r === 'bloqueada' || r === 'error') avisar('El navegador no permitió la voz. Puedes leer el mensaje de Ñani.');
      });
      break;
    // ---- Modo feria: ejemplos con respuestas FICTICIAS, siempre etiquetados ----
    case 'feria-ejemplo': {
      const e = EJEMPLOS_FERIA.find((x) => x.id === el.dataset.id);
      if (!e) return;
      const r = puntuar(instrumento, respuestasDeEjemplo(instrumento, e));
      sesion = { puntajes: r.puntajes, escalaMax: r.escalaMax, id: ++contadorSesion, origen: 'feria', ejemploId: e.id, ejemploTitulo: `${e.titulo}: ${e.descripcion}`, instrumentoId: r.instrumentoId, demoId: null, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false, interesadas: [], eligiendoInteresadas: false, chat: null };
      recorrido = null;
      filtrosExplorar = { ...FILTROS_INICIALES };
      ir('#/resultados');
      break;
    }
    case 'terminar-feria':
      pedirBorrado('#/feria');
      break;
    case 'demo': {
      const d = PERFILES_DEMO.find((p) => p.id === el.dataset.id);
      if (!d) return;
      sesion = { puntajes: { ...d.puntajes }, escalaMax: 40, id: ++contadorSesion, origen: 'demo', demoId: d.id, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false, interesadas: [], eligiendoInteresadas: false, chat: null };
      borrador = { manual: null, errores: [] };
      filtrosExplorar = { ...FILTROS_INICIALES };
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
    // @docente-inicio
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
    // @docente-fin
    default:
  }
});

// Exploración del estudiante: búsqueda, universidad, ubicación y orden. Actualiza solo la lista (conserva el foco).
function actualizarExploracion() {
  const ex = sesion ? exploracion() : null;
  const filas = V.filasExploracion(ex, filtrosExplorar);
  document.getElementById('lista-exploracion').innerHTML = V.listaExploracion(ex, filas);
  document.getElementById('conteo-exploracion').textContent = V.textoConteoExploracion(filas, 23);
}
const CAMPOS_EXPLORAR = { 'buscar-carreras': 'texto', 'filtro-uni-est': 'universidad', 'filtro-ubicacion': 'ubicacion', 'orden-carreras': 'orden' };
for (const tipo of ['input', 'change']) {
  app.addEventListener(tipo, (ev) => {
    const campo = CAMPOS_EXPLORAR[ev.target.id];
    if (!campo) return;
    filtrosExplorar[campo] = ev.target.value;
    actualizarExploracion();
  });
}

// @docente-inicio
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
  const v = validarPuntajes(puntajes, { escalaMax: D.ESCALA_DOCENTE });
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

// Acceso docente (app docente): «Ingresar» con la clave de demostración. Solo se recuerda en esta sesión del
// navegador (almacenamiento de sesión: un indicador sin datos personales). Al ingresar, Ñani saluda (el toque permite la voz).
app.addEventListener('submit', (ev) => {
  if (ev.target.id !== 'form-acceso') return;
  ev.preventDefault();
  const datos = new FormData(ev.target);
  if (!D.credencialesValidas(datos.get('usuario'), datos.get('contrasena'))) {
    errorAcceso = 'Usuario o contraseña incorrectos.';
    render();
    app.querySelector('#acceso-usuario')?.focus();
    return;
  }
  accesoDocente = true;
  errorAcceso = '';
  try { sessionStorage.setItem(CLAVE_ACCESO_DOCENTE, '1'); } catch { /* sin almacenamiento: vale para esta página */ }
  render(); // primero la vista (un cambio de vista no debe cortar el saludo), luego la voz
  NaniVoz.decir(D.SALUDO_DOCENTE, { clave: 'saludo-docente' }).then((r) => {
    if (r === 'sin-voz' || r === 'bloqueada' || r === 'error') avisar('La voz de Ñani no empezó: puedes usar «Escuchar a Ñani».');
  });
});
// @docente-fin

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
  sesion = { puntajes, escalaMax: 40, id: ++contadorSesion, origen: 'manual', demoId: null, provincia: REFERENCIA_PREDETERMINADA, cambiandoProvincia: false, interesadas: [], eligiendoInteresadas: false, chat: null };
  filtrosExplorar = { ...FILTROS_INICIALES };
  borrador = { manual: crudo, errores: [] };
  ir('#/resultados');
});

// ---- Voz de Ñani: interruptor visible en la barra superior (solo memoria) ----
const vozBoton = document.getElementById('voz-boton');
function actualizarBotonVoz() {
  const on = NaniVoz.vozActiva();
  vozBoton.setAttribute('aria-pressed', String(on));
  vozBoton.setAttribute('aria-label', on ? 'Voz de Ñani activada. Pulsa para silenciar' : 'Voz de Ñani silenciada. Pulsa para activar');
  vozBoton.classList.toggle('voz-boton--off', !on);
  if (!chatEl.hidden) pintarChat();
}
vozBoton.addEventListener('click', () => {
  NaniVoz.alternar();
  actualizarBotonVoz();
  avisar(NaniVoz.vozActiva() ? 'Voz de Ñani activada.' : 'Voz de Ñani silenciada.');
});
NaniVoz.alCambiarHabla((hablando) => {
  document.querySelectorAll('.nani-vivo').forEach((n) => n.classList.toggle('hablando', hablando));
});

// ---- Bienvenida 0.8.1: una sola vez por apertura, en la portada; un solo toque para entrar ----
// No hay voz automática: la voz y el destello sonoro se intentan al pulsar «¡Vamos a comenzar!» (interacción que
// Android exige). Si no hay voz, el saludo sigue escrito en la portada y la app funciona igual.
const bienvenida = document.getElementById('bienvenida');
function cerrarBienvenida() {
  if (bienvenida.hidden) return;
  const fin = () => { bienvenida.hidden = true; bienvenida.classList.remove('bienvenida--sale'); bienvenida.innerHTML = ''; app.querySelector('[data-enfoque]')?.focus({ preventScroll: true }); };
  if (movimientoReducido()) fin();
  else { bienvenida.classList.add('bienvenida--sale'); setTimeout(fin, 260); }
}
function mostrarBienvenida() {
  bienvenida.innerHTML = V.vistaBienvenida();
  bienvenida.hidden = false;
  bienvenida.querySelector('[data-bienvenida="comenzar"]')?.focus({ preventScroll: true });
}
function comenzarConSonido() {
  cerrarBienvenida();
  if (!NaniVoz.vozActiva()) return; // silenciada: ni destello ni voz
  destello(); // dentro del toque: permitido por Android
  // La voz se pide en el MISMO toque (candidata final 0.8.1): antes esperaba 420 ms. Si falla, la app ya está abierta.
  NaniVoz.decir(SALUDO).then((r) => {
    if (r === 'sin-voz') avisar('No hay una voz en español instalada: Ñani te acompaña con texto.');
    else if (r === 'bloqueada' || r === 'error') avisar('La voz no empezó. Puedes leer a Ñani o tocar «Escuchar».');
  });
}
bienvenida.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-bienvenida="comenzar"]')) comenzarConSonido();
});
bienvenida.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Tab') return; // el foco no sale de la bienvenida mientras está abierta
  const botones = [...bienvenida.querySelectorAll('button')];
  const i = botones.indexOf(document.activeElement);
  ev.preventDefault();
  botones[(i + (ev.shiftKey ? botones.length - 1 : 1)) % botones.length]?.focus();
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !bienvenida.hidden) cerrarBienvenida(); });
window.addEventListener('hashchange', cerrarBienvenida);

// ---- Ñani flotante y chat guiado (solo en resultados y en «Explorar» con resultado; solo memoria) ----
const flotante = document.getElementById('nani-flotante');
const flotanteBoton = document.getElementById('nani-flotante-boton');
const chatEl = document.getElementById('chat-nani');
document.getElementById('nani-flotante-figura').innerHTML = nani({ expresion: 'saludo' });
let temporizadorGlobo = null;
function actualizarNaniFlotante(pantalla) {
  const mostrar = !!sesion && (pantalla === 'resultados' || pantalla === 'carreras');
  if (!mostrar) { cerrarChat({ devolverFoco: false }); flotante.hidden = true; document.body.classList.remove('con-nani-flotante'); return; }
  if (flotante.hidden) {
    flotante.hidden = false;
    flotante.classList.remove('nani-flotante--plegado');
    clearTimeout(temporizadorGlobo);
    temporizadorGlobo = setTimeout(() => flotante.classList.add('nani-flotante--plegado'), 7000); // el globo se pliega solo
  }
  document.body.classList.add('con-nani-flotante');
}
function pintarChat() {
  chatEl.innerHTML = `<div class="chat__panel">${Chat.vistaChat(sesion.chat, exploracion(), { vozActiva: NaniVoz.vozActiva() })}</div>`;
  const lista = document.getElementById('chat-mensajes');
  if (lista) lista.scrollTop = lista.scrollHeight;
}
function abrirChat() {
  if (!sesion) return;
  const nuevo = !sesion.chat;
  if (nuevo) sesion.chat = Chat.iniciarChat();
  pintarChat();
  chatEl.hidden = false;
  document.body.classList.add('chat-abierto');
  flotanteBoton.setAttribute('aria-expanded', 'true');
  flotante.classList.add('nani-flotante--plegado');
  chatEl.querySelector('.chat__opcion')?.focus();
  if (nuevo) NaniVoz.decir(Chat.PREGUNTA_INICIAL);
}
function cerrarChat({ devolverFoco = true } = {}) {
  if (chatEl.hidden) return;
  Voz.detener();
  chatEl.hidden = true;
  chatEl.innerHTML = '';
  document.body.classList.remove('chat-abierto');
  flotanteBoton.setAttribute('aria-expanded', 'false');
  if (devolverFoco) flotanteBoton.focus();
}
flotanteBoton.addEventListener('click', () => (chatEl.hidden ? abrirChat() : cerrarChat()));
chatEl.addEventListener('click', (ev) => {
  if (ev.target === chatEl) { cerrarChat(); return; } // toque fuera del panel
  const b = ev.target.closest('[data-chat]');
  if (!b) return;
  if (b.dataset.chat === 'cerrar') { cerrarChat(); return; }
  if (b.dataset.chat === 'voz') { NaniVoz.alternar(); actualizarBotonVoz(); chatEl.querySelector('[data-chat="voz"]')?.focus(); return; }
  if (b.dataset.chat === 'opcion') {
    const opcion = sesion.chat.opciones[Number(b.dataset.indice)];
    if (!opcion) return;
    sesion.chat = Chat.elegir(sesion.chat, opcion, exploracion());
    pintarChat();
    chatEl.querySelector('.chat__opcion')?.focus({ preventScroll: true });
    const ultimoYo = sesion.chat.mensajes.map((m) => m.de).lastIndexOf('yo');
    NaniVoz.decir(Chat.textoNuevo(sesion.chat, ultimoYo + 1)); // la persona acaba de tocar: no es audio inesperado
  }
});
// Diálogo accesible: Esc cierra y el foco no sale del chat con Tab.
chatEl.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { ev.stopPropagation(); cerrarChat(); return; }
  if (ev.key !== 'Tab') return;
  const focos = [...chatEl.querySelectorAll('button, [href], summary, [tabindex]:not([tabindex="-1"])')].filter((e) => e.offsetParent !== null);
  if (!focos.length) return;
  const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
  if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
  else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
});

window.addEventListener('hashchange', render);
// La voz se detiene al abandonar u ocultar la página.
window.addEventListener('pagehide', () => Voz.detener());
document.addEventListener('visibilitychange', () => { if (document.hidden) Voz.detener(); });
Voz.prepararVoces();
render();
document.documentElement.dataset.appLista = '1'; // el aviso «No terminó de cargar» (index.html) ya no hace falta
if (APP !== 'docente' && (location.hash === '' || location.hash === '#/')) mostrarBienvenida();
// Service worker: solo archivos de la app, nunca resultados. Una versión nueva se aplica sola si no hay datos en
// memoria; si los hay, se muestra el aviso «Actualizar ahora» (no se borra nada sin que la persona lo pida).
iniciarPWA(document.getElementById('estado-offline'), {
  aviso: document.getElementById('aviso-actualizacion'),
  hayDatosEnMemoria: () => !!(sesion || recorrido || borrador.manual) || datosDeOtrosModulos.some((f) => f()),
});
