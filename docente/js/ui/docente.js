// Módulo docente (Sprint 2, cierre): asistente de orientación guiado por Ñani en tres etapas.
// Pestañas: «Asistente de orientación» (principal), «Guía breve» y «Catálogo» (secundario).
// Información técnica en una página discreta (#/docente/tecnico), fuera de la navegación principal.
// Sin cuentas, bases de datos ni historiales: los puntajes viven solo en memoria.
import { LETRAS, UMBRAL_D, umbralD, fmtNum } from '../core/riasec.js';

// ---------- Ajustes finales 0.8.1 ----------
/** Escala del analizador docente: la MISMA del cuestionario del estudiante (0–20 por interés). El motor normaliza
 *  con escalaMax = 20 (Ai con r = puntaje / 20; umbral D = 3): resultados idénticos a los de 0–40 con los puntajes × 2. */
export const ESCALA_DOCENTE = 20;
/** Saludo breve de Ñani al ingresar al módulo docente (se intenta en voz al pulsar «Ingresar»). */
export const SALUDO_DOCENTE = '¡Hola! Soy Ñani. Te acompaño a interpretar los resultados y a explorar el catálogo.';
/** Barrera de acceso DEMOSTRATIVA (GitHub Pages es estático): no es seguridad real; la clave está en el código público. */
const ACCESO_DEMO = Object.freeze({ usuario: 'docente', contrasena: '123456' });
export const credencialesValidas = (usuario, contrasena) => String(usuario ?? '').trim().toLowerCase() === ACCESO_DEMO.usuario && String(contrasena ?? '') === ACCESO_DEMO.contrasena;

/** Pantalla de ingreso del módulo docente (app docente). No guarda datos personales. */
export function vistaAccesoDocente({ error = '' } = {}) {
  return `
  <section class="acceso-docente-vista">
    <h1 tabindex="-1" data-enfoque>Acceso para docentes y tutores</h1>
    <form class="tarjeta" id="form-acceso" novalidate autocomplete="off">
      ${error ? `<p class="errores" role="alert">${esc(error)}</p>` : ''}
      <div class="campo">
        <label for="acceso-usuario">Usuario</label>
        <input id="acceso-usuario" name="usuario" autocomplete="username" autocapitalize="none" spellcheck="false"${error ? ' aria-invalid="true"' : ''}>
      </div>
      <div class="campo">
        <label for="acceso-contrasena">Contraseña</label>
        <input id="acceso-contrasena" name="contrasena" type="password" autocomplete="current-password"${error ? ' aria-invalid="true"' : ''}>
      </div>
      <div class="acciones-centro">
        <button type="submit" class="boton boton--principal">Ingresar</button>
        <a class="boton boton--secundario" href="../">Volver al inicio</a>
      </div>
    </form>
  </section>`;
}
import { MIN_LETRAS_COINCIDENTES, PESO_AFINIDAD, PESO_PROXIMIDAD } from '../core/recomendador.js';
import { CATALOGO } from '../data/catalogo.js';
import { FUENTES } from '../data/fuentes.js';
import { UNIVERSIDADES, FUENTE_UNIVERSIDADES } from '../data/universidades.js';
import { TIPOS_RIASEC, NOTA_TIPOS } from '../data/tipos-riasec.js';
import { OPCIONES_PROVINCIA, OTRA_PROVINCIA, etiquetaReferencia } from '../data/provincias-referencia.js';
import { COLOR_LETRA, icono, ICONO_SEDE, nani } from './identidad.js';
import { esc, porcentaje, unirLista } from './formato.js';
import { agruparPorCarrera } from './agrupar.js';
import { filtrarCatalogo } from './catalogo-busqueda.js';
import { listaPorConfirmar, panelTecnico } from './paneles-orientador.js';
import { ETAPAS, interpretarPerfil, preguntasOrientativas, mensajeEtapa, letrasPorDesempateTecnico, avisoDesempateTecnico } from './orientacion.js';
import { EJEMPLOS_RIASEC } from '../data/ejemplos-riasec.js';

export const PESTANAS = Object.freeze([
  ['asistente', 'Asistente de orientación'],
  ['guia', 'Guía breve'],
  ['catalogo', 'Catálogo'],
]);

const letraChip = (l, si = true) => `<span class="letra${si ? '' : ' letra--no'}" style="${si ? `--c:${COLOR_LETRA[l]}` : ''}">${l}</span>`;
const codigoChips = (codigo) => `<span class="mini-codigo" aria-label="Código ${codigo}">${[...codigo].map((l) => letraChip(l)).join('')}</span>`;
const gestion = (u) => {
  const g = UNIVERSIDADES[u]?.gestion;
  return g ? `<span class="gestion gestion--${g === 'Privada' ? 'privada' : 'publica'}">${esc(g)}</span>` : '';
};
const AVISO_REVISION = '<p class="nota nota--alerta">Contenido orientativo del prototipo, pendiente de revisión por la psicóloga o la tutora del equipo. No es un diagnóstico psicológico ni reemplaza la orientación profesional.</p>';

export function estadoDocenteInicial() {
  return { texto: '', universidad: '', manual: null, errores: [], puntajes: null, provincia: 'Abancay', etapa: 1 };
}

/** Filtro del catálogo: solo texto y universidad. Se muestran las 23 fichas; las de sede por confirmar van identificadas. */
export function filtroCatalogo(est) {
  return { texto: est.texto, universidad: est.universidad };
}

// ---------- Asistente de orientación ----------
function formularioPuntajes(est) {
  const campos = LETRAS.map((l) => {
    const invalido = est.errores.some((e) => e.includes(`puntaje ${l} `));
    return `
    <div class="campo">
      <label for="d-${l}">${letraChip(l)} ${esc(TIPOS_RIASEC[l].nombre)}</label>
      <input id="d-${l}" name="${l}" inputmode="decimal" autocomplete="off" value="${est.manual?.[l] != null ? esc(est.manual[l]) : ''}" placeholder="0–${ESCALA_DOCENTE}"${invalido ? ' aria-invalid="true"' : ''}>
    </div>`;
  }).join('');
  const provincias = OPCIONES_PROVINCIA.map((o) => `<option value="${esc(o.valor)}"${o.valor === est.provincia ? ' selected' : ''}>${esc(o.etiqueta)}</option>`).join('');
  return `
  <form class="tarjeta" id="form-docente" novalidate autocomplete="off">
    <p>Escriba los seis puntajes del estudiante de 0 a ${ESCALA_DOCENTE}, tal como los muestra su cuestionario. <strong>No escriba nombres.</strong> Nada se guarda.</p>
    ${est.errores.length ? `<div class="errores" role="alert"><strong>Revise los puntajes:</strong><ul>${est.errores.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
    <div class="formulario-puntajes">${campos}</div>
    <div class="form-docente__pie">
      <label for="d-provincia">Referencia</label>
      <select id="d-provincia" name="provincia" class="selector selector--chico">${provincias}</select>
      <button type="submit" class="boton">Analizar</button>
      ${est.puntajes || est.manual ? '<button type="button" class="enlace" data-accion="borrar-analizador">Borrar puntajes</button>' : ''}
    </div>
  </form>`;
}

/** Ñani con burbuja animada y controles de voz. El texto leído es exactamente el de la burbuja. */
function naniConVoz(texto, expresion = 'feliz') {
  return `
  <div class="guia guia--animada">
    ${nani({ expresion })}
    <p class="burbuja" data-voz="${esc(texto)}"><span class="sr-only">Ñani dice: </span>${esc(texto)}</p>
  </div>
  <div class="voz">
    <button type="button" class="boton boton--chip voz__escuchar" data-accion="voz-escuchar">
      <svg class="icono-chico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>
      Escuchar a Ñani</button>
    <button type="button" class="boton boton--chip voz__detener" data-accion="voz-detener" hidden>Detener</button>
    <span class="voz__aviso nota nota--chica" role="status"></span>
  </div>`;
}

function etapaComprender(p) {
  const tecnico = letrasPorDesempateTecnico(p);
  const intereses = [...p.codigo].map((l, i) => `
    <li class="interes-chico${tecnico.includes(l) ? ' interes-chico--tecnico' : ''}" style="--c:${COLOR_LETRA[l]}">
      <span class="interes__icono">${icono(l)}</span>
      <span><strong>${i + 1}.º ${esc(TIPOS_RIASEC[l].nombre)}</strong><small>${tecnico.includes(l) ? 'Desempate técnico · 0&nbsp;%' : `${esc(TIPOS_RIASEC[l].corto)} · ${porcentaje(p.puntajes[l], p.escalaMax)}&nbsp;%`}</small></span>
    </li>`).join('');
  const aviso = avisoDesempateTecnico(p);
  return `
  <ul class="intereses-chicos">${intereses}</ul>
  <p class="interpretacion-docente">${esc(interpretarPerfil(p))}</p>
  ${aviso ? `<p class="nota nota--alerta"><strong>Desempate técnico:</strong> ${esc(aviso)}</p>` : ''}
  ${p.pocoDiferenciado ? `<p class="nota nota--alerta"><strong>Perfil poco diferenciado (D &lt; ${fmtNum(p.umbralD ?? UMBRAL_D)}):</strong> converse con el estudiante antes de revisar carreras. Es una regla precautoria, no un diagnóstico.</p>` : ''}`;
}

function etapaConversar(preguntas) {
  return `<ol class="preguntas">${preguntas.map((q) => `
    <li><span class="pregunta__texto">${esc(q.texto)}</span><span class="pregunta__regla">${esc(q.regla)}</span></li>`).join('')}</ol>`;
}

function etapaExplorar(r, tres, otrasTotal, prov, provincia) {
  const tecnico = letrasPorDesempateTecnico(r.perfil);
  if (!tres.length) return `<p class="vacio">${esc(r.mensajeSinCoincidencias)}</p>`;
  return `
  <ul class="carreras-chicas">${tres.map((g) => `
    <li class="carrera-chica">
      <strong>${esc(g.carrera)}</strong>
      <span>${esc(g.universidad)} · ${gestion(g.universidad)}</span>
      <span class="carrera__sede">${ICONO_SEDE}<span>${g.sedes.map((s) => `${esc(s.sede.nombre)}${prov && s.sede.provincia === prov ? ' <em>· misma provincia</em>' : ''}`).join(' · ')}</span></span>
      <span class="carrera-chica__letras">${[...g.codigo].map((l) => letraChip(l, g.coincidencias.includes(l))).join('')}</span>
    </li>`).join('')}</ul>
  <p class="nota nota--chica">Orden del artículo: puntaje combinado 0,80·Ai + 0,20·P (referencia ${esc(etiquetaReferencia(provincia))}). El estudiante ve otro orden: afinidad descriptiva con sus seis puntuaciones, sin usar la cercanía. Son orientativas, no un ranking.${tecnico.length ? ` El motor usa el código completo, incluido el desempate técnico de ${esc(unirLista(tecnico.map((l) => TIPOS_RIASEC[l].nombre)))}.` : ''}</p>
  ${otrasTotal > tres.length ? '<p><a class="enlace" href="#/docente/catalogo">Consultar las 23 carreras en el catálogo →</a></p>' : ''}`;
}

function resultadoAsistente(r, est) {
  const p = r.perfil;
  const etapa = [1, 2, 3].includes(est.etapa) ? est.etapa : 1;
  const grupos = agruparPorCarrera(r.verificadas);
  const tres = grupos.slice(0, 3);
  const total = grupos.length + r.porConfirmar.length;
  const prov = est.provincia && est.provincia !== OTRA_PROVINCIA ? est.provincia : null;
  const preguntas = preguntasOrientativas(p);
  const mensaje = mensajeEtapa(etapa, r, { carreras: tres.length, otras: total - tres.length, preguntas: preguntas.length });
  const contenido = etapa === 1 ? etapaComprender(p) : etapa === 2 ? etapaConversar(preguntas) : etapaExplorar(r, tres, total, prov, est.provincia);
  const pasos = ETAPAS.map((nombreEtapa, i) => `
    <li><button type="button" class="etapa-paso" data-accion="etapa" data-valor="${i + 1}"${i + 1 === etapa ? ' aria-current="step"' : ''}><span>${i + 1}</span>${nombreEtapa}</button></li>`).join('');

  return `
  <section class="tarjeta asistente" aria-labelledby="t-analisis">
    <div class="asistente__cabeza">
      <h2 id="t-analisis" class="h-seccion" tabindex="-1">Código ${codigoChips(p.codigo)}<span class="sr-only"> ${p.codigo}</span></h2>
      ${p.pocoDiferenciado ? `<span class="etiqueta etiqueta--alerta">Perfil poco diferenciado (D &lt; ${fmtNum(p.umbralD ?? UMBRAL_D)})</span>` : ''}
    </div>
    <ol class="etapas" aria-label="Etapas de la orientación">${pasos}</ol>
    <div class="etapa" id="etapa-actual" data-etapa="${etapa}">
      <h3 class="etapa__titulo">${etapa}. ${ETAPAS[etapa - 1]}</h3>
      ${naniConVoz(mensaje, p.pocoDiferenciado && etapa !== 2 ? 'pensando' : 'feliz')}
      ${contenido}
      <div class="etapa__nav">
        ${etapa > 1 ? `<button type="button" class="boton boton--secundario boton--chico" data-accion="etapa" data-valor="${etapa - 1}">← ${ETAPAS[etapa - 2]}</button>` : '<span></span>'}
        ${etapa < 3 ? `<button type="button" class="boton boton--chico" data-accion="etapa" data-valor="${etapa + 1}">${ETAPAS[etapa]} →</button>` : ''}
      </div>
    </div>
  </section>
  ${AVISO_REVISION}`;
}

function pestanaAsistente(est, r) {
  return `
  ${r ? '' : naniConVoz('Escribe los seis puntajes y te acompaño en tres etapas: comprender el perfil, preparar la conversación y explorar alternativas.')}
  ${formularioPuntajes(est)}
  ${r ? resultadoAsistente(r, est) : ''}`;
}

// ---------- Guía breve ----------
function pestanaGuia() {
  const tipos = LETRAS.map((l) => `
    <li class="tipo-chico" style="--c:${COLOR_LETRA[l]}">
      <span class="interes__icono">${icono(l)}</span>
      <span><strong>${l} · ${esc(TIPOS_RIASEC[l].nombre)}.</strong> ${esc(EJEMPLOS_RIASEC[l].idea)}<small>En la escuela o en casa: ${esc(EJEMPLOS_RIASEC[l].ejemplos)}.</small></span>
    </li>`).join('');
  return `
  <h2 class="h-seccion">Los seis intereses, con ejemplos</h2>
  <ul class="tipos-chicos">${tipos}</ul>
  <h2 class="h-seccion">Tres ideas para leer un resultado</h2>
  <ul class="lista-guia lista-guia--corta">
    <li>El código reúne los <strong>tres intereses más altos</strong>, en orden.</li>
    <li>El porcentaje muestra <strong>cuánto le atrae</strong> un área, no lo que sabe hacer.</li>
    <li>Si los puntajes son parecidos (D &lt; ${umbralD(ESCALA_DOCENTE)} en la escala 0–${ESCALA_DOCENTE}; equivale a D &lt; ${UMBRAL_D} en la escala 0–40 del artículo), <strong>conversen primero</strong>.</li>
  </ul>
  <h2 class="h-seccion">Durante la conversación</h2>
  <ul class="lista-guia lista-guia--corta">
    <li>Pregunte por lo que disfruta antes de hablar de carreras.</li>
    <li>Presente las carreras como opciones para explorar, no como una decisión.</li>
    <li>Para admisión, costos o becas, consulten juntos las fuentes oficiales vigentes.</li>
  </ul>
  ${AVISO_REVISION}`;
}

// ---------- Catálogo ----------
export function listaCatalogo(filas) {
  if (!filas.length) return '<p class="vacio">No hay carreras del catálogo que coincidan con la búsqueda. Pruebe con otra palabra o elija «Todas» las universidades.</p>';
  return `<ul class="catalogo">${filas.map((c) => {
    const sede = c.estadoSede === 'documentada'
      ? `<p class="carrera__sede">${ICONO_SEDE}<span>${c.sedes.map((s) => `${esc(s.nombre)}${s.provincia !== s.nombre ? ` (${esc(s.provincia)})` : ''}`).join(' · ')}</span></p>`
      : '<p class="carrera__sede"><span class="etiqueta etiqueta--alerta">Sede por confirmar</span> <span class="nota nota--chica">La fuente no precisa la sede; no es una ubicación verificada.</span></p>';
    return `
    <li class="tarjeta fila-catalogo${c.estadoSede === 'por_confirmar' ? ' fila-catalogo--confirmar' : ''}">
      <p class="carrera__uni">${esc(c.universidad)} · ${gestion(c.universidad)}</p>
      <h3 class="carrera__titulo">${esc(c.carrera)} ${codigoChips(c.codigo)}</h3>
      ${sede}
      <p class="nota nota--chica">Fuente: ${c.fuentes.map((k) => esc(FUENTES[k]?.cita ?? k)).join(' / ')}</p>
    </li>`;
  }).join('')}</ul>`;
}

/** Texto del conteo: cuántas fichas se muestran y cuántas tienen sede por confirmar. */
export function textoConteo(filas) {
  const pc = filas.filter((c) => c.estadoSede === 'por_confirmar').length;
  return `Mostrando ${filas.length} de 23 carreras${pc ? ` (${pc} con sede por confirmar)` : ''}. Catálogo de la Tabla 3 del artículo; una ficha por carrera y universidad.`;
}

function pestanaCatalogo(est) {
  const filas = filtrarCatalogo(filtroCatalogo(est));
  const opciones = [['', 'Todas'], ['UNAMBA', 'UNAMBA'], ['UNAJMA', 'UNAJMA'], ['UTEA', 'UTEA']]
    .map(([v, e]) => `<option value="${v}"${est.universidad === v ? ' selected' : ''}>${e}</option>`).join('');
  return `
  <div class="tarjeta filtros filtros--simples">
    <div class="filtros__campo">
      <label for="buscar-catalogo" class="filtros__etiqueta">Buscar carrera</label>
      <input id="buscar-catalogo" type="search" class="buscador" value="${esc(est.texto)}" placeholder="Ej.: enfermería, minas, contabilidad" autocomplete="off">
    </div>
    <div class="filtros__campo filtros__campo--universidad">
      <label for="filtro-universidad" class="filtros__etiqueta">Universidad</label>
      <select id="filtro-universidad" class="selector">${opciones}</select>
    </div>
  </div>
  <p class="nota nota--chica" id="conteo-catalogo" aria-live="polite">${esc(textoConteo(filas))}</p>
  <div id="resultados-catalogo">${listaCatalogo(filas)}</div>`;
}

// ---------- Información técnica (página discreta) ----------
function paginaTecnica(est, r) {
  const denominaciones = new Map();
  CATALOGO.forEach((c) => c.valoracionExpertas && denominaciones.set(c.valoracionExpertas.denominacion, c.valoracionExpertas.v));
  return `
  <p><a class="volver" href="#/docente/asistente">← Volver al asistente</a></p>
  <h2 class="h-seccion">Información técnica del prototipo</h2>
  <p class="nota nota--info">Pruebas con datos ficticios (modo feria y perfiles DEMO): <a href="#/herramientas">Herramientas técnicas</a>. No forman parte del recorrido del estudiante.</p>
  <h3>Correspondencia con el artículo</h3>
  <div class="tabla-desplazable"><table class="ficha ficha--docente">
    <thead><tr><th>Componente</th><th>Origen</th></tr></thead>
    <tbody>
      <tr><td>Seis puntajes, código, D y aviso al tutor si D &lt; ${UMBRAL_D} (RF04)</td><td>Diseño del artículo (ecuación 1)</td></tr>
      <tr><td>Afinidad Ai y puntaje combinado ${fmtNum(PESO_AFINIDAD, 2)}·Ai + ${fmtNum(PESO_PROXIMIDAD, 2)}·P por sede; sedes por confirmar aparte (RF02, RF03)</td><td>Diseño del artículo (ecuación 3); pesos provisionales</td></tr>
      <tr><td>Catálogo de 23 carreras, códigos asignados, valoración de expertas</td><td>Tablas 3 y 4 del artículo</td></tr>
      <tr><td>Desempate R-I-A-S-E-C, referencia Lambrama (Abancay), 3 sugerencias en este módulo. El filtro de ${MIN_LETRAS_COINCIDENTES} letras ya no se aplica (12-11-2026)</td><td>Reglas provisionales del prototipo (no están en el artículo)</td></tr>
      <tr><td>Página del estudiante: las 23 carreras ordenadas por afinidad descriptiva (correlación entre las seis puntuaciones y el perfil 3-2-1 del código), 5 visibles al inicio, cercanía solo informativa y filtro voluntario por ubicación</td><td>Heurística propia del prototipo (no está en el artículo; no validada). El puntaje combinado del artículo se conserva en este módulo</td></tr>
      <tr><td>Cuestionario provisional de 30 preguntas propias (0–20 por dimensión)</td><td>Implementación exploratoria posterior; el artículo describe 60 ítems. No validado; no es O*NET</td></tr>
      <tr><td>Asistente de orientación: interpretación y preguntas por reglas; guía breve</td><td>Función nueva de apoyo al tutor (pendiente de revisión profesional)</td></tr>
      <tr><td>Cuestionario de 60 ítems del artículo (RF01) u oficial de O*NET, otras regiones (RF06)</td><td>No implementados</td></tr>
    </tbody>
  </table></div>
  <p class="nota nota--alerta">Implementación de demostración posterior al artículo. No se ha validado con estudiantes. Los pesos, el umbral D y los órdenes propuestos son reglas provisionales, no calibradas ni validadas.</p>
  ${r ? `<h3>Cálculo del último análisis (código ${r.perfil.codigo})</h3>${panelTecnico(r.perfil, r, est.provincia)}<h4>Carreras con sede por confirmar</h4>${listaPorConfirmar(r)}` : '<p class="nota">Realice un análisis en el asistente para ver aquí el cálculo por sede.</p>'}
  <h3>Valoración preliminar de dos expertas (17 denominaciones)</h3>
  <div class="tabla-desplazable"><table class="ficha ficha--docente">
    <thead><tr><th>Denominación</th><th>V de Aiken</th></tr></thead>
    <tbody>${[...denominaciones].map(([d, v]) => `<tr><td>${esc(d)}</td><td>${fmtNum(v, 2)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="nota nota--chica">Juicio sobre denominaciones agrupadas, fichas sin firma; no es una validación. ${esc(FUENTE_UNIVERSIDADES)}</p>
  <h3>Fuentes</h3>
  <ul class="fuentes">${Object.values(FUENTES).map((f) => `<li>${esc(f.cita)}${f.url ? ` <a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">Abrir (requiere internet)</a>` : ''} · Fecha de verificación: <span class="pendiente">${f.fechaVerificacion ? esc(f.fechaVerificacion) : 'Por registrar'}</span></li>`).join('')}</ul>`;
}

// ---------- Vista principal ----------
export function vistaDocente(pestana, est, resultado) {
  const tecnico = pestana === 'tecnico';
  const actual = tecnico ? 'tecnico' : (PESTANAS.some(([id]) => id === pestana) ? pestana : 'asistente');
  const nav = PESTANAS.map(([id, nombre]) => `<a class="pestana" href="#/docente/${id}"${id === actual ? ' aria-current="page"' : ''}>${nombre}</a>`).join('');
  const contenido = {
    asistente: () => pestanaAsistente(est, resultado),
    guia: pestanaGuia,
    catalogo: () => pestanaCatalogo(est),
    tecnico: () => paginaTecnica(est, resultado),
  }[actual]();
  return `
  <div class="docente">
    <p class="sobretitulo">Para tutores y orientadores</p>
    <h1 tabindex="-1" data-enfoque>Módulo docente</h1>
    <nav class="pestanas" aria-label="Secciones del módulo docente">${nav}</nav>
    <div class="docente__contenido">${contenido}</div>
    <p class="docente__pie"><a href="#/">← Volver al inicio</a> · <a href="#/docente/tecnico" class="enlace-tecnico">Información técnica del prototipo</a></p>
  </div>`;
}
