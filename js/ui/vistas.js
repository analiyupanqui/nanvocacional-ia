// Vistas del módulo estudiante. Flujo: Inicio → Perfil (DEMO o puntajes) → página única de
// resultado y carreras. Cada función devuelve HTML; los eventos se manejan en main.js.
// Página del estudiante (11-11-2026): perfil, 3 carreras sugeridas y acciones. Sin listas adicionales:
// el número de otras carreras que cumplen el filtro se informa en una línea; la lista completa irá al módulo docente.
// Descripciones RIASEC, sedes por confirmar y panel técnico están en paneles-orientador.js.
import { LETRAS, PUNTAJE_MAX, calcularPerfil } from '../core/riasec.js';
import { MIN_LETRAS_COINCIDENTES, MENSAJE_SIN_COINCIDENCIAS } from '../core/recomendador.js';
import { PERFILES_DEMO } from '../data/perfiles-demo.js';
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { OPCIONES_PROVINCIA, OTRA_PROVINCIA, etiquetaReferencia } from '../data/provincias-referencia.js';
import { UNIVERSIDADES } from '../data/universidades.js';
import { esc, unirLista, porcentaje } from './formato.js';
import { COLOR_LETRA, conNani, icono, ICONO_SEDE, nani } from './identidad.js';
import { agruparPorCarrera, empatadosFueraDeDestacados } from './agrupar.js';
import { MENSAJE_INICIO, MENSAJE_PERFIL, MENSAJE_NANI_CARRERAS, MENSAJE_NANI_SIN_OPCIONES, mensajeResultados, explicacionTarjeta } from './nani-mensajes.js';

export const DESTACADAS = 3;

const PASOS = ['Perfil', 'Resultados y carreras'];
function pasos(actual) {
  const i = PASOS.indexOf(actual);
  return `<ol class="pasos" aria-label="Progreso: paso ${i + 1} de ${PASOS.length}">${PASOS.map((p, j) =>
    `<li class="${j < i ? 'hecho' : ''}"${p === actual ? ' aria-current="step"' : ''}><span>${j + 1}</span>${p}</li>`).join('')}</ol>`;
}
const titulo = (texto, clase = '') => `<h1 tabindex="-1" data-enfoque class="${clase}">${texto}</h1>`;
const etiquetaOrigen = (s) => (s.demoId
  ? `<span class="etiqueta etiqueta--demo">Perfil DEMO ficticio · ${esc(s.demoId)}</span>`
  : '<span class="etiqueta etiqueta--neutra">Puntajes ingresados · no se guardan</span>');
const letraChip = (l, si = true) => `<span class="letra${si ? '' : ' letra--no'}" style="${si ? `--c:${COLOR_LETRA[l]}` : ''}">${l}</span>`;
const mini = (codigo) => `<span class="mini-codigo">${[...codigo].map((l) => letraChip(l)).join('')}</span>`;

// ---------- Inicio ----------
export function vistaInicio() {
  return `
  <section class="portada">
    <div class="portada__mascota">
      ${nani({ expresion: 'saludo', clase: 'nani--portada' })}
      <p class="burbuja burbuja--arriba"><span class="sr-only">Ñani dice: </span>${MENSAJE_INICIO}</p>
    </div>
    <div class="portada__texto">
      <p class="sobretitulo">ÑanVocacional IA</p>
      ${titulo('Descubre tu camino profesional', 'titulo-portada')}
      <p class="portada__lema">Mira qué carreras de Apurímac se relacionan con tus intereses.</p>
      <a class="boton boton--grande boton--acento" href="#/perfil">Comenzar mi recorrido <span aria-hidden="true">→</span></a>
    </div>
  </section>

  <ol class="pasitos" aria-label="Cómo funciona">
    <li><span class="pasitos__num">1</span><span class="pasitos__texto"><strong>Tu perfil</strong><small>Prueba un perfil o escribe tus puntajes</small></span></li>
    <li><span class="pasitos__num">2</span><span class="pasitos__texto"><strong>Tus intereses</strong><small>Conoce tu código de 3 letras</small></span></li>
    <li><span class="pasitos__num">3</span><span class="pasitos__texto"><strong>Tus carreras</strong><small>Explora opciones en Apurímac</small></span></li>
  </ol>

  <details class="plegable">
    <summary>¿Qué es ÑanVocacional IA?</summary>
    <div class="plegable__cuerpo que-es">
      <div>
        <h3>Qué es</h3>
        <ul>
          <li>Un recomendador con <strong>reglas explícitas</strong> RIASEC (IA simbólica).</li>
          <li>Prioriza la oferta de Apurímac con sede documentada y explica cada coincidencia.</li>
          <li>Ñani responde con mensajes fijos basados en reglas, no conversa.</li>
        </ul>
      </div>
      <div>
        <h3>Qué no es</h3>
        <ul>
          <li>No es un chatbot ni IA generativa; no aprende de datos.</li>
          <li>No es un diagnóstico ni predice tu éxito.</li>
          <li>No pide tu nombre ni guarda tus resultados.</li>
        </ul>
      </div>
      <p class="nota">Prototipo de demostración desarrollado después del artículo científico que lo especifica. No ha sido validado con estudiantes. Los pesos, el umbral D &lt; 6 y el filtro de coincidencias son reglas provisionales.</p>
    </div>
  </details>
  <p class="enlace-docente"><a href="#/docente/asistente">¿Eres docente o tutor? Ir al módulo docente</a></p>`;
}

// ---------- Perfil ----------
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
  ${pasos('Perfil')}
  ${conNani(MENSAJE_PERFIL)}
  ${titulo('¿Cómo quieres empezar?')}
  <p class="nota nota--info"><strong>Cuestionario no disponible en este prototipo:</strong> el cuestionario de 60 ítems aún no se incluye porque falta verificar su edición en español y sus condiciones de uso.</p>

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

// ---------- Página única: resultado + carreras ----------
export function barras(perfil) {
  const filas = LETRAS.map((l) => {
    const pos = perfil.codigo.indexOf(l);
    const top = pos >= 0;
    const pct = porcentaje(perfil.puntajes[l]);
    return `
    <li class="barra-riasec${top ? ' barra-riasec--top' : ''}" style="--c:${COLOR_LETRA[l]}">
      <span class="barra-riasec__nombre">${letraChip(l)} ${esc(TIPOS_RIASEC[l].nombre)}${top ? `<span class="barra-riasec__pos" aria-label="Predominante n.º ${pos + 1}">${pos + 1}.º</span>` : ''}</span>
      <span class="barra-riasec__pista" role="img" aria-label="${esc(TIPOS_RIASEC[l].nombre)}: ${pct} % del puntaje máximo"><span style="width:${pct}%"></span></span>
      <span class="barra-riasec__pct">${pct}&nbsp;%</span>
    </li>`;
  }).join('');
  return `<ul class="barras-riasec">${filas}</ul>`;
}

function seccionResultado(sesion, perfil) {
  const letras = [...perfil.codigo].map((l) => `
    <div class="codigo__letra" style="--c:${COLOR_LETRA[l]}">${icono(l, 'codigo__icono')}<b>${l}</b><small>${esc(TIPOS_RIASEC[l].nombre)}</small></div>`).join('');
  return `
  <section class="tarjeta resultado" aria-labelledby="t-resultado">
    <div class="resultado__cabeza">
      <div>
        ${titulo(`Tu código RIASEC<span class="sr-only"> es ${perfil.codigo}</span>`, 'titulo-codigo')}
        <div class="codigo codigo--compacto" aria-hidden="true">${letras}</div>
      </div>
      ${conNani(esc(mensajeResultados(perfil)), { expresion: perfil.pocoDiferenciado ? 'pensando' : 'feliz' })}
    </div>
    <h2 id="t-resultado" class="h-chico">Tus seis intereses</h2>
    ${barras(perfil)}
    ${perfil.empates.length ? `<p class="nota nota--chica">Empate de puntajes: ${esc(perfil.empates.map((e) => unirLista(e.letras)).join('; '))}. Se ordenó según R-I-A-S-E-C.</p>` : ''}
    <p class="nota nota--chica">Cada porcentaje es tu puntaje normalizado (sobre 40) en ese interés: muestra cuánto te atrae cada área y <strong>no es una probabilidad de éxito</strong>.</p>
  </section>`;
}

function selectorProvincia(sesion) {
  const chips = OPCIONES_PROVINCIA.map((o) => `
    <button type="button" class="boton boton--chip" data-accion="provincia" data-valor="${esc(o.valor)}" aria-pressed="${o.valor === sesion.provincia}">${esc(o.etiqueta)}</button>`).join('');
  return `
  <div class="selector-provincia" id="selector-provincia" role="group" aria-label="Elegir referencia geográfica">
    <div class="chips">${chips}</div>
    <p class="nota nota--chica">Solo se considera si la sede está en la misma provincia, en otra provincia de Apurímac o en otra región. No se calculan distancias reales ni tiempos de viaje. Tu perfil RIASEC no cambia.</p>
  </div>`;
}

const sedeTexto = (s, provincia) => `${esc(s.nombre)}${s.provincia !== s.nombre ? ` (${esc(s.provincia)})` : ''}${provincia && s.provincia === provincia ? ' <em>· misma provincia</em>' : ''}`;

function tarjetaCarrera(g, provincia, destacada) {
  const uni = UNIVERSIDADES[g.universidad];
  return `
  <li class="tarjeta carrera${destacada ? ' carrera--destacada' : ''}">
    <p class="carrera__uni">${esc(g.universidad)} · <span class="gestion gestion--${uni?.gestion === 'Privada' ? 'privada' : 'publica'}">${esc(uni?.gestion ?? 'Gestión no documentada')}</span></p>
    <h3 class="carrera__titulo">${esc(g.carrera)}</h3>
    <p class="carrera__sede">${ICONO_SEDE}<span>${g.sedes.map((s) => sedeTexto(s.sede, provincia)).join(' · ')}</span></p>
    <p class="carrera__por-que">${letrasCarrera(g)} ${esc(explicacionTarjeta(g.coincidencias))}</p>
  </li>`;
}

const letrasCarrera = (x) => `<span class="mini-codigo" aria-label="Código de la carrera ${x.codigo}">${[...x.codigo].map((l) => letraChip(l, x.coincidencias.includes(l))).join('')}</span>`;

function seccionCarreras(sesion, r) {
  const codigo = r.perfil.codigo;
  const grupos = agruparPorCarrera(r.verificadas); // solo sedes documentadas; una tarjeta por carrera
  const destacadas = grupos.slice(0, DESTACADAS);
  const otras = grupos.length - destacadas.length;
  const empatados = empatadosFueraDeDestacados(grupos, DESTACADAS);
  const prov = sesion.provincia && sesion.provincia !== OTRA_PROVINCIA ? sesion.provincia : null;

  return `
  <section class="carreras-seccion" aria-labelledby="t-carreras">
    <h2 id="t-carreras" tabindex="-1">Carreras sugeridas para ti</h2>
    <p class="referencia">${ICONO_SEDE}<span>Referencia: <strong>${esc(etiquetaReferencia(sesion.provincia))}</strong></span> · <button type="button" class="enlace" data-accion="cambiar-provincia" aria-expanded="${!!sesion.cambiandoProvincia}" aria-controls="selector-provincia">${sesion.cambiandoProvincia ? 'Cerrar' : 'Cambiar'}</button></p>
    ${sesion.cambiandoProvincia ? selectorProvincia(sesion) : ''}

    ${r.sinCoincidenciasLocales ? `
    ${conNani(esc(MENSAJE_NANI_SIN_OPCIONES), { expresion: 'pensando' })}
    <div class="vacio" role="status">
      <strong>Sin coincidencias verificadas</strong>
      <p>${esc(MENSAJE_SIN_COINCIDENCIAS)} Esto no significa que la carrera no exista en la región: el catálogo de este prototipo es limitado.</p>
    </div>` : `
    ${conNani(esc(MENSAJE_NANI_CARRERAS))}
    <ul class="destacadas" aria-label="Carreras sugeridas">${destacadas.map((g) => tarjetaCarrera(g, prov, true)).join('')}</ul>
    <p class="nota nota--chica">Sugerencias orientativas que comparten al menos ${MIN_LETRAS_COINCIDENTES} letras con tu código ${codigo}. No son una decisión definitiva ni un ranking oficial.${otras > 0 ? ` Otras ${otras} ${otras === 1 ? 'carrera de Apurímac también cumple' : 'carreras de Apurímac también cumplen'} este criterio; puedes revisarlas con tu tutor.` : ''}</p>
    ${empatados.length ? `<p class="nota nota--chica">Empate: ${esc(unirLista(empatados.map((g) => g.carrera)))} ${empatados.length > 1 ? 'obtuvieron' : 'obtuvo'} el mismo valor que la tercera sugerencia.</p>` : ''}`}
  </section>`;
}

export function vistaResultados(sesion, r) {
  return `
  ${pasos('Resultados y carreras')}
  ${etiquetaOrigen(sesion)}
  ${seccionResultado(sesion, r.perfil)}
  ${seccionCarreras(sesion, r)}
  <div class="acciones acciones--pie">
    <a class="boton boton--secundario" href="#/perfil">Cambiar perfil</a>
    <button type="button" class="boton boton--borrar-pie" data-accion="terminar">Terminar y borrar</button>
  </div>`;
}

export function vistaNoEncontrada() {
  return `${conNani('Uy, esa página no existe.', { expresion: 'pensando' })}${titulo('Página no encontrada')}<a class="boton" href="#/">Ir al inicio</a>`;
}
