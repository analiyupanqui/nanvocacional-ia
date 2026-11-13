// Vistas del módulo estudiante (rediseño compacto 0.5.0, 12-11-2026).
// Flujo: Bienvenida con Ñani → Portada → Cuestionario provisional (30 preguntas, una por pantalla) → Resultados
// compactos → Explorar las 23 carreras. Secundarios: Modo feria (#/feria, ejemplos ficticios) y Perfiles DEMO (#/perfil).
// Cada función devuelve HTML; los eventos y la voz se manejan en main.js. Menos texto: los detalles quedan en
// desplegables opcionales y en el módulo docente, sin ocultar empates, sedes por confirmar ni límites.
import { LETRAS, PUNTAJE_MAX, calcularPerfil, fmtNum } from '../core/riasec.js';
import { MENSAJE_SIN_COINCIDENCIAS } from '../core/recomendador.js';
import { MOSTRAR_INICIAL, MAX_INTERESADAS, provinciasConSede, filtrarPorUbicacion, mensajeInteresada } from '../core/exploracion.js';
import { CATALOGO } from '../data/catalogo.js';
import { filtrarCatalogo } from './catalogo-busqueda.js';
import { PERFILES_DEMO } from '../data/perfiles-demo.js';
import { EJEMPLOS_FERIA } from '../data/ejemplos-feria.js';
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { OPCIONES_PROVINCIA, etiquetaReferencia } from '../data/provincias-referencia.js';
import { UNIVERSIDADES } from '../data/universidades.js';
import { esc, porcentaje } from './formato.js';
import { COLOR_LETRA, conNani, icono, ICONO_SEDE, nani, ICONO_VOZ, botonEscuchar } from './identidad.js';
export { ICONO_VOZ };
import { ENLACE_DOCENTE } from '../config-app.js';
import { MENSAJE_PERFIL, SALUDO, MENSAJES_HITO, EXPLICACION_FERIA, fraseResultado, PUNTOS_INTERPRETACION } from './nani-mensajes.js';
import { progreso, respuestaActual, esUltima } from '../cuestionarios/recorrido.js';

export const DESTACADAS = MOSTRAR_INICIAL;
const unirNombres = (letras) => { const n = letras.map((l) => TIPOS_RIASEC[l].nombre); return n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`; };
export const AVISO_EXPLORATORIO = 'Resultado exploratorio · cuestionario propio no validado · no es un diagnóstico.';

const titulo = (texto, clase = '') => `<h1 tabindex="-1" data-enfoque class="${clase}">${texto}</h1>`;
const letraChip = (l, si = true) => `<span class="letra${si ? '' : ' letra--no'}" style="${si ? `--c:${COLOR_LETRA[l]}` : ''}">${l}</span>`;
const mini = (codigo) => `<span class="mini-codigo">${[...codigo].map((l) => letraChip(l)).join('')}</span>`;
/** Ñani animado con su mensaje (la animación se desactiva con prefers-reduced-motion). */
const naniVivo = (texto, { expresion = 'feliz', clase = '', voz = true } = {}) => `
  <div class="guia guia--viva ${clase}">
    <span class="nani-vivo">${nani({ expresion })}</span>
    <p class="burbuja"><span class="sr-only">Ñani dice: </span>${esc(texto)}${voz ? ` ${botonEscuchar(texto)}` : ''}</p>
  </div>`;

// ---------- Bienvenida (se muestra una vez al abrir la app en la portada) ----------
export function vistaBienvenida() {
  return `
  <div class="bienvenida__tarjeta">
    <span class="nani-vivo nani-vivo--bienvenida">${nani({ expresion: 'saludo' })}</span>
    <p class="bienvenida__saludo" id="bienvenida-texto">${esc(SALUDO)}</p>
    <p class="bienvenida__pista" id="bienvenida-pista" hidden>${ICONO_VOZ} Toca para escucharme</p>
  </div>`;
}

// ---------- Portada ----------
export function vistaInicio() {
  return `
  <section class="portada portada--compacta">
    <div class="portada__escena">
      <span class="nani-vivo nani-vivo--portada">${nani({ expresion: 'saludo', clase: 'nani--portada' })}</span>
      <p class="burbuja burbuja--portada"><span class="sr-only">Ñani dice: </span>${esc(SALUDO)} ${botonEscuchar(SALUDO)}</p>
    </div>
    <div class="portada__texto">
      <p class="sobretitulo">ÑanVocacional IA</p>
      ${titulo('Descubre tu camino profesional', 'titulo-portada')}
      <p class="portada__lema">Responde 30 preguntas y explora carreras universitarias de Apurímac.</p>
      <a class="boton boton--grande boton--principal" href="#/cuestionario">Comenzar cuestionario <span aria-hidden="true">→</span></a>
      <ul class="chips-info" aria-label="Antes de empezar">
        <li>30 preguntas · 5–10 min</li><li>Voluntario</li><li>No guarda datos</li><li>Exploratorio · no validado</li>
      </ul>
    </div>
  </section>
  <details class="plegable" id="plegable-que-es">
    <summary>¿Qué es ÑanVocacional IA?</summary>
    <div class="plegable__cuerpo">
      <ul class="lista-puntos">
        <li>Usa <strong>reglas computacionales</strong> y el modelo de intereses <strong>RIASEC</strong> (Holland). No es IA generativa ni aprende de datos.</li>
        <li>El cuestionario es <strong>propio, exploratorio y no validado</strong> (30 preguntas; el artículo científico describe un diseño de 60).</li>
        <li>Las carreras son opciones para explorar, no recomendaciones validadas ni predicciones de éxito.</li>
        <li>Es voluntario: no pide tu nombre y nada se guarda ni se envía. Puedes salir con «Terminar y borrar».</li>
      </ul>
    </div>
  </details>
  <p class="acceso-docente"><a href="${ENLACE_DOCENTE}">Acceso para docentes y tutores</a></p>`;
}

// ---------- Cuestionario: una pregunta por pantalla ----------
function barraProgreso(pr, inst) {
  const porBloque = 6;
  const bloques = Math.ceil(pr.total / porBloque);
  const segmentos = Array.from({ length: bloques }, (_, b) => {
    const ids = inst.preguntas.slice(b * porBloque, (b + 1) * porBloque).map((p) => p.id);
    const hechas = ids.filter((id) => !pr.faltantes.some((f) => f.id === id)).length;
    return `<span class="progreso__seg"><span style="width:${Math.round((hechas / ids.length) * 100)}%"></span></span>`;
  }).join('');
  return `<div class="progreso__barra" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin="0" aria-valuemax="${pr.total}" aria-valuenow="${pr.respondidas}">${segmentos}</div>`;
}

export function vistaPregunta(inst, rec, { animar = false } = {}) {
  const p = inst.preguntas[rec.indice];
  const elegido = respuestaActual(inst, rec);
  const pr = progreso(inst, rec);
  const ultima = esUltima(inst, rec);
  const hito = MENSAJES_HITO[rec.indice];
  const opciones = inst.escala.opciones.map((o) => `
      <button type="button" class="respuesta" role="radio" aria-checked="${o.valor === elegido}" data-accion="responder" data-valor="${o.valor}">
        <span class="respuesta__marca" aria-hidden="true"></span><span class="respuesta__texto">${esc(o.etiqueta)}</span>
      </button>`).join('');
  const siguienteBtn = ultima
    ? '<button type="button" class="boton" data-accion="finalizar">Ver mis resultados</button>'
    : '<button type="button" class="boton" data-accion="siguiente">Siguiente <span aria-hidden="true">→</span></button>';
  return `
  <section class="cuestionario" aria-label="Cuestionario exploratorio">
    <div class="cuestionario__cabeza">
      <span class="nani-vivo nani-vivo--mini">${nani({ expresion: hito ? 'saludo' : 'feliz' })}</span>
      <div class="progreso">
        <p class="progreso__texto">Pregunta <strong>${pr.numero}</strong> de ${pr.total}</p>
        ${barraProgreso(pr, inst)}
      </div>
    </div>
    ${hito ? `<p class="burbuja burbuja--hito" role="status"><span class="sr-only">Ñani dice: </span>${esc(hito)}</p>` : ''}
    <div class="tarjeta pregunta${animar ? ' pregunta--entra' : ''}">
      <p class="pregunta__consigna" id="consigna">${esc(inst.consigna)}</p>
      ${titulo(esc(p.texto), 'pregunta__texto')}
      <div class="respuestas" role="radiogroup" aria-labelledby="consigna">${opciones}
      </div>
      ${rec.aviso ? `<p class="aviso-pregunta" role="alert">${esc(rec.aviso)}</p>` : ''}
    </div>
    <div class="navegacion-cuestionario">
      <button type="button" class="boton boton--secundario" data-accion="anterior"${rec.indice === 0 ? ' disabled' : ''}><span aria-hidden="true">←</span> Anterior</button>
      ${siguienteBtn}
    </div>
  </section>`;
}

// ---------- Perfiles DEMO (pruebas) ----------
export function vistaPerfil({ manual = null, errores = [] } = {}) {
  const demos = PERFILES_DEMO.map((d) => {
    const p = calcularPerfil(d.puntajes);
    return `
    <button type="button" class="demo" data-accion="demo" data-id="${esc(d.id)}">
      <span class="etiqueta etiqueta--demo">DEMO · ficticio</span>
      ${mini(p.codigo)}
      <span class="demo__nombre">${esc(d.id)}</span>
      <span class="demo__desc">${esc(d.etiqueta.replace(/^Perfil DEMO \d \(ficticio\):\s*/, ''))}</span>
    </button>`;
  }).join('');

  const campos = LETRAS.map((l) => {
    const invalido = errores.some((e) => e.includes(`puntaje ${l} `));
    return `
    <div class="campo">
      <label for="p-${l}">${letraChip(l)} ${esc(TIPOS_RIASEC[l].nombre)}</label>
      <input id="p-${l}" name="${l}" inputmode="decimal" autocomplete="off" enterkeyhint="next"
        value="${manual && manual[l] != null ? esc(manual[l]) : ''}" placeholder="0–${PUNTAJE_MAX}"
        aria-describedby="ayuda-manual"${invalido ? ' aria-invalid="true"' : ''}>
    </div>`;
  }).join('');

  return `
  ${conNani(MENSAJE_PERFIL)}
  ${titulo('Modo demostración')}
  <p class="nota nota--info"><strong>Solo para pruebas:</strong> perfiles ficticios y entrada manual de seis puntajes en la escala 0–40 del artículo. Para el recorrido del estudiante usa el <a href="#/cuestionario">cuestionario</a>.</p>

  <h2>Prueba con un perfil ficticio</h2>
  <div class="demos">${demos}</div>

  <details class="plegable" id="plegable-manual"${errores.length || manual ? ' open' : ''}>
    <summary>Tengo mis seis puntajes</summary>
    <form class="plegable__cuerpo" id="form-manual" novalidate autocomplete="off">
      <p id="ayuda-manual">Escribe un número entre 0 y ${PUNTAJE_MAX} para cada dimensión. No se guardan.</p>
      ${errores.length ? `<div class="errores" role="alert"><strong>Revisa los puntajes:</strong><ul>${errores.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
      <div class="formulario-puntajes">${campos}</div>
      <button type="submit" class="boton">Ver mi perfil</button>
    </form>
  </details>`;
}

// ---------- Resultados compactos ----------
export function barras(perfil) {
  const max = perfil.escalaMax ?? PUNTAJE_MAX;
  const filas = LETRAS.map((l) => {
    const pos = perfil.codigo.indexOf(l);
    const top = pos >= 0;
    const v = perfil.puntajes[l];
    const pct = porcentaje(v, max);
    return `
    <li class="barra-riasec${top ? ' barra-riasec--top' : ''}" style="--c:${COLOR_LETRA[l]}">
      <span class="barra-riasec__nombre">${letraChip(l)} ${esc(TIPOS_RIASEC[l].nombre)}</span>
      <span class="barra-riasec__pista" role="img" aria-label="${esc(TIPOS_RIASEC[l].nombre)}: ${fmtNum(v)} de ${max} puntos (índice ${pct} %)"><span style="width:${pct}%"></span></span>
      <span class="barra-riasec__puntaje">${fmtNum(v)}/${max}</span>
    </li>`;
  }).join('');
  return `<ul class="barras-riasec barras-riasec--compactas">${filas}</ul>`;
}

const etiquetaOrigen = (s) => {
  if (s.origen === 'feria') return `<p class="etiqueta-origen etiqueta-origen--ficticio">Ejemplo con respuestas ficticias · no es un resultado real${s.ejemploId ? ` · ${esc(s.ejemploTitulo ?? s.ejemploId)}` : ''}</p>`;
  if (s.demoId) return `<p class="etiqueta-origen etiqueta-origen--ficticio">Perfil DEMO ficticio · ${esc(s.demoId)}</p>`;
  if (s.origen === 'manual') return '<p class="etiqueta-origen">Puntajes ingresados · no se guardan</p>';
  return '';
};

function seccionResultado(sesion, perfil) {
  const letras = [...perfil.codigo].map((l) => `
    <div class="codigo__letra" style="--c:${COLOR_LETRA[l]}">${icono(l, 'codigo__icono')}<b>${l}</b><small>${esc(TIPOS_RIASEC[l].nombre)}</small></div>`).join('');
  const empates = perfil.empates.length
    ? `<p class="linea-aviso linea-aviso--empate">Empate: ${perfil.empates.map((e) => esc(unirNombres(e.letras))).join('; ')} obtuvieron el mismo puntaje.</p>` : '';
  const parejos = perfil.pocoDiferenciado
    ? `<p class="linea-aviso">Puntajes parejos (D = ${fmtNum(perfil.D)}): conversa tus resultados con tu tutor o tutora.</p>` : '';
  return `
  <section class="tarjeta resultado resultado--compacto" aria-labelledby="t-resultado">
    ${titulo(`Tu código RIASEC<span class="sr-only"> es ${perfil.codigo}</span>`, 'titulo-codigo')}
    <div class="resultado__cabeza">
      <div class="codigo codigo--compacto" aria-hidden="true">${letras}</div>
      ${naniVivo(fraseResultado(perfil), { expresion: perfil.pocoDiferenciado ? 'pensando' : 'feliz', clase: 'guia--resultado' })}
    </div>
    <p class="aviso-exploratorio" role="note">${esc(AVISO_EXPLORATORIO)}</p>
    ${empates}${parejos}
    <h2 id="t-resultado" class="h-chico">Tus seis intereses</h2>
    ${barras(perfil)}
  </section>`;
}

/** Sede compacta: nombres de sedes documentadas (marca la provincia de referencia) o «Sede por confirmar». */
function sedeCompacta(f) {
  if (f.estadoSede !== 'documentada') return '<span class="etiqueta etiqueta--alerta">Sede por confirmar</span>';
  return `${ICONO_SEDE}<span>${f.sedes.map((s) => `${esc(s.nombre)}${s.cercania === 'en tu provincia de referencia' ? ' <em>(tu provincia)</em>' : ''}`).join(' · ')}</span>`;
}

const letrasCarrera = (x) => `<span class="mini-codigo" aria-label="Código RIASEC de la carrera: ${x.codigo}">${[...x.codigo].map((l) => letraChip(l, !x.coincidencias || x.coincidencias.includes(l))).join('')}</span>`;

/** Tarjeta compacta: carrera, universidad, sede o «Sede por confirmar» y código. */
function tarjetaCompacta(f) {
  return `
  <li class="carrera-compacta${f.estadoSede !== 'documentada' ? ' carrera-compacta--confirmar' : ''}" data-carrera="${esc(f.carreraId)}">
    <div class="carrera-compacta__cuerpo">
      <h3 class="carrera__titulo">${esc(f.carrera)}</h3>
      <p class="carrera-compacta__uni">${esc(f.universidad)}</p>
      <p class="carrera-compacta__sede">${sedeCompacta(f)}</p>
    </div>
    ${letrasCarrera(f)}
  </li>`;
}

function seccionCarreras(sesion, ex) {
  const primeras = ex.carreras.slice(0, MOSTRAR_INICIAL);
  return `
  <section class="carreras-seccion" aria-labelledby="t-carreras">
    <h2 id="t-carreras" tabindex="-1">Carreras universitarias para explorar</h2>
    <p class="linea-aviso">Ideas para conocer según tus intereses; no una probabilidad de éxito.</p>
    ${ex.avisoCatalogo ? `<p class="linea-aviso">${esc(ex.avisoCatalogo)}</p>` : ''}
    <ul class="destacadas destacadas--compactas" aria-label="Primeras ${primeras.length} carreras para explorar">${primeras.map(tarjetaCompacta).join('')}</ul>
    <p class="nota nota--chica aviso-no-aparece-breve">${esc(ex.aviso)}</p>
  </section>`;
}

function selectorProvincia(sesion) {
  const chips = OPCIONES_PROVINCIA.map((o) => `
    <button type="button" class="boton boton--chip" data-accion="provincia" data-valor="${esc(o.valor)}" aria-pressed="${o.valor === sesion.provincia}">${esc(o.etiqueta)}</button>`).join('');
  return `<div class="selector-provincia" id="selector-provincia" role="group" aria-label="Elegir provincia de referencia"><div class="chips">${chips}</div></div>`;
}

/** Desplegable opcional: cómo se calcula, límites y referencia geográfica (sin ocultar nada relevante). */
function seccionCalculo(sesion, ex) {
  return `
  <details class="plegable" id="plegable-calculo">
    <summary>Cómo se calcula y sus límites</summary>
    <div class="plegable__cuerpo">
      <ul class="lista-puntos">
        <li>${esc(ex.criterio)}</li>
        <li>Las carreras con «Sede por confirmar» figuran en las fuentes, pero sin una sede verificada: no se afirma que se ofrezcan en una sede concreta.</li>
        <li>Si hay empates, se ordenan R-I-A-S-E-C (regla del prototipo). Los códigos de las carreras son asignaciones de diseño, no clasificaciones oficiales.</li>
        ${PUNTOS_INTERPRETACION.map((t) => `<li>${esc(t)}</li>`).join('')}
        <li>Cuestionario propio de 30 preguntas, no validado; el artículo científico describe un diseño de 60 preguntas.</li>
      </ul>
      <p class="referencia">${ICONO_SEDE}<span>Provincia de referencia: <strong>${esc(etiquetaReferencia(sesion.provincia))}</strong> (solo para indicar «tu provincia»)</span> · <button type="button" class="enlace" data-accion="cambiar-provincia" aria-expanded="${!!sesion.cambiandoProvincia}" aria-controls="selector-provincia">${sesion.cambiandoProvincia ? 'Cerrar' : 'Cambiar'}</button></p>
      ${sesion.cambiandoProvincia ? selectorProvincia(sesion) : ''}
    </div>
  </details>`;
}

// ---------- «Carreras que ya me interesan» (desplegable; no altera puntajes ni orden) ----------
function seccionInteresadas(sesion, ex) {
  const elegidas = (sesion.interesadas ?? []).map((id) => ex.carreras.find((f) => f.carreraId === id)).filter(Boolean);
  const llenas = elegidas.length >= MAX_INTERESADAS;
  const lista = [...ex.carreras].sort((a, b) => a.carrera.localeCompare(b.carrera, 'es') || a.universidad.localeCompare(b.universidad)).map((f) => {
    const marcada = elegidas.some((e) => e.carreraId === f.carreraId);
    return `<li><button type="button" class="boton boton--chip elegir" data-accion="interesada" data-id="${esc(f.carreraId)}" aria-pressed="${marcada}"${!marcada && llenas ? ' disabled' : ''}>${esc(f.carrera)} · ${esc(f.universidad)}</button></li>`;
  }).join('');
  const tarjetas = elegidas.map((f) => `
    <li class="tarjeta interesada">
      <p class="carrera-compacta__uni">${esc(f.universidad)}</p>
      <h3 class="carrera__titulo">${esc(f.carrera)} ${letrasCarrera(f)}</h3>
      <p class="carrera-compacta__sede">${sedeCompacta(f)}</p>
      <p class="interesada__mensaje"><span class="sr-only">Ñani dice: </span>${esc(mensajeInteresada(f, ex.perfil, ex.total))}</p>
    </li>`).join('');
  return `
  <details class="plegable" id="plegable-interesadas"${elegidas.length ? ' open' : ''}>
    <summary>Carreras que ya me interesan <small>(opcional)</small></summary>
    <div class="plegable__cuerpo interesadas">
      <p class="nota nota--chica">Elige hasta ${MAX_INTERESADAS}. No cambia tu perfil ni el orden de las carreras, y no se guarda.</p>
      ${tarjetas ? `<ul class="interesadas__lista">${tarjetas}</ul>` : ''}
      <ul class="elegir-lista">${lista}</ul>
    </div>
  </details>`;
}

export function vistaResultados(sesion, ex) {
  const volver = sesion.origen === 'cuestionario'
    ? '<button type="button" class="boton boton--secundario" data-accion="reiniciar">Realizar nuevamente</button>'
    : sesion.origen === 'feria'
      ? '<a class="boton boton--secundario" href="#/feria">Volver al modo feria</a>'
      : '<a class="boton boton--secundario" href="#/perfil">Cambiar perfil</a>';
  return `
  ${etiquetaOrigen(sesion)}
  ${seccionResultado(sesion, ex.perfil)}
  ${seccionCarreras(sesion, ex)}
  <div class="acciones acciones--pie">
    ${volver}
    <button type="button" class="boton boton--borrar-pie" data-accion="terminar">Terminar y borrar</button>
  </div>`;
}

// ---------- Herramientas técnicas (pruebas): no forman parte del recorrido del estudiante ----------
export function vistaHerramientas() {
  return `
  <p class="etiqueta-origen etiqueta-origen--ficticio">Herramientas técnicas · datos ficticios · para el equipo y el jurado</p>
  ${titulo('Herramientas técnicas')}
  <p class="nota nota--chica">Pruebas del prototipo con datos ficticios. No son parte del recorrido del estudiante.</p>
  <ul class="feria-pasos">
    <li class="tarjeta feria-paso"><div><h2 class="h-chico">Modo feria</h2><p>Demostración guiada con dos resultados de ejemplo.</p><a class="boton boton--chico" href="#/feria">Abrir modo feria</a></div></li>
    <li class="tarjeta feria-paso"><div><h2 class="h-chico">Perfiles DEMO</h2><p>Cuatro perfiles ficticios y entrada manual de seis puntajes (0–40).</p><a class="boton boton--chico boton--secundario" href="#/perfil">Abrir perfiles DEMO</a></div></li>
  </ul>
  <p class="acciones-centro"><a class="boton boton--secundario" href="#/docente/tecnico">← Volver a la información técnica</a></p>`;
}

// ---------- Modo feria: demostración guiada con respuestas ficticias ----------
export function vistaFeria() {
  const ejemplos = EJEMPLOS_FERIA.map((e) => `<button type="button" class="boton boton--secundario" data-accion="feria-ejemplo" data-id="${esc(e.id)}">${esc(e.titulo)}: ${esc(e.descripcion)}</button>`).join('');
  return `
  <p class="etiqueta-origen etiqueta-origen--ficticio">Modo feria · demostración guiada · respuestas ficticias</p>
  ${titulo('Modo feria')}
  ${naniVivo(EXPLICACION_FERIA, { clase: 'guia--feria' })}
  <ol class="feria-pasos">
    <li class="tarjeta feria-paso"><span class="feria-paso__num" aria-hidden="true">1</span><div>
      <h2 class="h-chico">El proyecto</h2>
      <p>Reglas computacionales + modelo RIASEC + 23 carreras de Apurímac. Sin IA generativa y sin datos personales.</p></div></li>
    <li class="tarjeta feria-paso"><span class="feria-paso__num" aria-hidden="true">2</span><div>
      <h2 class="h-chico">El cuestionario</h2>
      <p>30 preguntas propias, exploratorias y no validadas (el artículo describe 60).</p>
      <a class="boton boton--chico" href="#/cuestionario">Ver el cuestionario</a></div></li>
    <li class="tarjeta feria-paso"><span class="feria-paso__num" aria-hidden="true">3</span><div>
      <h2 class="h-chico">Un resultado de ejemplo</h2>
      <p>Respuestas ficticias puntuadas con el mismo motor. No son de ninguna persona.</p>
      <div class="feria-ejemplos">${ejemplos}</div></div></li>
    <li class="tarjeta feria-paso"><span class="feria-paso__num" aria-hidden="true">4</span><div>
      <h2 class="h-chico">El catálogo</h2>
      <a class="boton boton--chico boton--secundario" href="#/carreras">Explorar las 23 carreras</a></div></li>
    <li class="tarjeta feria-paso"><span class="feria-paso__num" aria-hidden="true">5</span><div>
      <h2 class="h-chico">Reiniciar</h2>
      <button type="button" class="boton boton--chico boton--borrar-pie" data-accion="terminar-feria">Reiniciar y borrar</button></div></li>
  </ol>`;
}

// ---------- Explorar las 23 carreras ----------
/** Tarjeta de la exploración: compacta y con «por qué aparece» en una línea (si hay perfil). */
function tarjetaExploracion(f, { conPerfil = true } = {}) {
  return `
  <li class="carrera-compacta${f.estadoSede !== 'documentada' ? ' carrera-compacta--confirmar' : ''}" data-carrera="${esc(f.carreraId)}">
    <div class="carrera-compacta__cuerpo">
      <h3 class="carrera__titulo">${esc(f.carrera)}</h3>
      <p class="carrera-compacta__uni">${esc(f.universidad)} · ${esc(UNIVERSIDADES[f.universidad]?.gestion ?? '')}</p>
      <p class="carrera-compacta__sede">${sedeCompacta(f)}</p>
      ${conPerfil && f.porQue ? `<p class="carrera-compacta__por-que"><strong>Por qué aparece:</strong> ${esc(f.porQue[0])}</p>` : ''}
    </div>
    ${letrasCarrera(f)}
  </li>`;
}

/** Lista filtrada (búsqueda, universidad, ubicación) en el orden elegido. Solo presentación. */
export function filasExploracion(ex, filtros, catalogo = CATALOGO) {
  let filas = ex ? ex.carreras : catalogo.map((c) => ({
    carreraId: c.id, universidad: c.universidad, carrera: c.carrera, codigo: c.codigo, estadoSede: c.estadoSede,
    sedes: c.sedes.map((s) => ({ ...s, cercania: null })), coincidencias: null,
  }));
  const ids = new Set(filtrarCatalogo({ texto: filtros.texto, universidad: filtros.universidad }, catalogo).map((c) => c.id));
  filas = filtrarPorUbicacion(filas.filter((f) => ids.has(f.carreraId)), filtros.ubicacion);
  if (!ex || filtros.orden === 'alfabetico') filas = [...filas].sort((a, b) => a.carrera.localeCompare(b.carrera, 'es') || a.universidad.localeCompare(b.universidad));
  return filas;
}

export function listaExploracion(ex, filas) {
  if (!filas.length) {
    return `<div class="vacio" role="status"><strong>Sin resultados</strong><p>${esc(MENSAJE_SIN_COINCIDENCIAS)} Esto no significa que la carrera no exista en la región: el catálogo de este prototipo es limitado.</p></div>`;
  }
  return `<ul class="lista-exploracion">${filas.map((f) => tarjetaExploracion(f, { conPerfil: !!ex })).join('')}</ul>`;
}

export const textoConteoExploracion = (filas, total) => `Se ${filas.length === 1 ? 'muestra' : 'muestran'} ${filas.length} de ${total} carreras.`;

export function vistaExplorar(sesion, ex, filtros) {
  const filas = filasExploracion(ex, filtros);
  const unis = Object.keys(UNIVERSIDADES);
  const opcion = (v, t, sel) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`;
  return `
  ${titulo('Explorar las 23 carreras')}
  ${ex
    ? `<p class="nota nota--chica">Tu perfil: <strong>${esc(ex.perfil.codigo)}</strong> · ${esc(ex.criterio)}</p>
  <p class="aviso-no-aparece-breve nota nota--chica">${esc(ex.aviso)}</p>`
    : '<p class="nota nota--chica">Orden alfabético. Si respondes el cuestionario, podrás ordenarlas según tus intereses.</p>'}
  <form class="filtros-exploracion" role="search" onsubmit="return false">
    <div class="campo"><label for="buscar-carreras">Buscar carrera, universidad o sede</label>
      <input id="buscar-carreras" type="search" autocomplete="off" value="${esc(filtros.texto)}" placeholder="Por ejemplo: sistemas, UTEA, Andahuaylas"></div>
    <div class="campo"><label for="filtro-uni-est">Universidad</label>
      <select id="filtro-uni-est">${opcion('', 'Todas', filtros.universidad)}${unis.map((u) => opcion(u, `${u} · ${UNIVERSIDADES[u].gestion}`, filtros.universidad)).join('')}</select></div>
    <div class="campo"><label for="filtro-ubicacion">Ubicación de la sede (opcional)</label>
      <select id="filtro-ubicacion">${opcion('', 'Todas las ubicaciones', filtros.ubicacion)}${provinciasConSede().map((p) => opcion(p, `Sede documentada en ${p}`, filtros.ubicacion)).join('')}${opcion('por_confirmar', 'Solo sede por confirmar', filtros.ubicacion)}</select></div>
    ${ex ? `<div class="campo"><label for="orden-carreras">Orden</label>
      <select id="orden-carreras">${opcion('afinidad', 'Relación con mis intereses', filtros.orden)}${opcion('alfabetico', 'Alfabético', filtros.orden)}</select></div>` : ''}
  </form>
  <p class="nota nota--chica">La ubicación solo filtra: no cambia el orden. Las carreras con sede por confirmar no se pueden ubicar en una provincia.</p>
  <p class="conteo" id="conteo-exploracion" role="status">${textoConteoExploracion(filas, CATALOGO.length)}</p>
  <div id="lista-exploracion">${listaExploracion(ex, filas)}</div>
  <div class="acciones acciones--pie">
    ${ex ? '<a class="boton boton--secundario" href="#/resultados">← Volver a mis resultados</a>' : '<a class="boton boton--secundario" href="#/">← Ir al inicio</a>'}
  </div>`;
}

export function vistaNoEncontrada() {
  return `${conNani('Uy, esa página no existe.', { expresion: 'pensando' })}${titulo('Página no encontrada')}<a class="boton" href="#/">Ir al inicio</a>`;
}
