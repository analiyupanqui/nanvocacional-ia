// Chat guiado «Pregúntale a Ñani» (0.7.3): conversación con BOTONES de respuesta, sin texto libre.
// Respuestas PROGRAMADAS con reglas a partir del perfil real y del catálogo existente. No es IA generativa:
// no interpreta preguntas abiertas, no aprende y no usa servicios externos. Funciona sin conexión y no guarda nada.
// Dos opciones principales (entender mis resultados, conocer una carrera); después de cada respuesta Ñani pregunta
// «¿Quieres saber algo más?» y vuelve a ofrecerlas. Lenguaje sencillo, sin términos técnicos.
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { UNIVERSIDADES } from '../data/universidades.js';
import { mallaDe, MENSAJE_SIN_MALLA } from '../data/mallas.js';
import { descripcionDe } from '../data/descripciones-carreras.js';
import { COLOR_LETRA, ICONO_SEDE, ICONO_VOZ, nani } from './identidad.js';
import { esc } from './formato.js';

export const NOTA_CHAT = 'Respuestas programadas · sin IA generativa · funciona sin conexión';
export const PREGUNTA_INICIAL = '¡Hola! Estoy aquí para ayudarte a conocer tus resultados. ¿Qué te gustaría saber?';
export const ALGO_MAS = '¿Quieres saber algo más?';
export const SUGERENCIA_TUTOR = 'Si esta carrera te interesa, puedes conversar sobre ella con tu tutor, tutora o psicólogo del colegio.';
export const UNIVERSIDADES_CHAT = Object.freeze(['UNAMBA', 'UTEA', 'UNAJMA']);
export const MAX_MENSAJES = 40;

const op = (id, texto) => Object.freeze({ id, texto });
export const OPCIONES_INICIO = Object.freeze([
  op('resultados', 'Entender mis resultados'),
  op('carrera', 'Conocer una carrera'),
]);

// Actividades de cada interés en palabras sencillas: forma larga (con ejemplos) y corta (para enumerar o comparar).
const ACTIVIDADES = Object.freeze({
  R: ['las actividades prácticas, como reparar, construir o trabajar al aire libre', 'las actividades prácticas'],
  I: ['las actividades para investigar y descubrir cómo funcionan las cosas', 'las de investigar y descubrir'],
  A: ['las actividades creativas, como dibujar, escribir, actuar o diseñar', 'las actividades creativas'],
  S: ['las actividades para ayudar, enseñar y acompañar a otras personas', 'las de ayudar a otras personas'],
  E: ['las actividades que permiten proponer ideas, convencer y dirigir proyectos', 'las que permiten proponer ideas y dirigir proyectos'],
  C: ['las actividades ordenadas, como organizar información, datos o documentos', 'las de organizar información y datos'],
});
const largo = (l) => ACTIVIDADES[l][0];
const corto = (l) => ACTIVIDADES[l][1];
const unir = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

/** Grupos de intereses del código con el mismo puntaje (incluye letras fuera del código empatadas con la tercera). */
function gruposDelCodigo(perfil) {
  const tercera = perfil.puntajes[perfil.codigo[2]];
  const letras = perfil.orden.filter((l, i) => i < 3 || perfil.puntajes[l] === tercera);
  const grupos = [];
  for (const l of letras) {
    const g = grupos.find((x) => perfil.puntajes[x[0]] === perfil.puntajes[l]);
    if (g) g.push(l); else grupos.push([l]);
  }
  return grupos;
}

/** «Entender mis resultados»: dos o tres frases sencillas con el perfil real (sin términos técnicos). */
export function frasesResultados(perfil) {
  const frases = [];
  if (perfil.pocoDiferenciado) {
    frases.push('Tus intereses están muy parejos: te gustan casi por igual varios tipos de actividades, y eso está bien.');
  } else {
    const [primero, ...resto] = gruposDelCodigo(perfil);
    frases.push(primero.length === 1
      ? `Lo que más te gusta son ${largo(primero[0])}.`
      : `Te gustan por igual ${unir(primero.map(corto))}.`);
    const siguientes = resto.flat();
    if (siguientes.length) {
      const porIgual = resto.some((g) => g.length > 1) ? ' por igual' : '';
      frases.push(`También te atraen${porIgual} ${unir(siguientes.map(corto))}.`);
    }
  }
  frases.push('Este resultado te orienta, pero no decide tu profesión: tú eliges.');
  return frases;
}

/** Relación de una carrera con lo que le gusta al estudiante, en palabras sencillas. */
export function relacionSencilla(fila) {
  const propias = unir([...fila.codigo].map(corto));
  const comunes = fila.coincidencias ?? [];
  if (!comunes.length) return `Esta carrera se relaciona con ${propias}. No coincide mucho con tus gustos de hoy, pero puedes conocerla igual.`;
  return `Esta carrera se relaciona con ${propias}. ${comunes.length === 1 ? 'Coincide' : 'Coinciden'} con lo que te gusta: ${unir(comunes.map(corto))}.`;
}

/** Estado inicial del chat (solo memoria). */
export function iniciarChat() {
  return { mensajes: [{ de: 'nani', texto: PREGUNTA_INICIAL }], opciones: OPCIONES_INICIO };
}

const conMensajes = (estado, nuevos, opciones) => ({ mensajes: [...estado.mensajes, ...nuevos].slice(-MAX_MENSAJES), opciones });
const algoMas = { de: 'nani', texto: ALGO_MAS };

/**
 * Avanza la conversación con la opción elegida.
 * @param {{mensajes, opciones}} estado
 * @param {{id: string, texto: string}} opcion  una de estado.opciones
 * @param {object} ex  resultado de explorarCarreras (perfil y las 23 carreras en su orden)
 */
export function elegir(estado, opcion, ex) {
  const yo = { de: 'yo', texto: opcion.texto };
  const [tipo, dato] = opcion.id.split(':');
  const fila = (id) => ex.carreras.find((f) => f.carreraId === id);

  switch (tipo) {
    case 'resultados':
      return conMensajes(estado, [yo, ...frasesResultados(ex.perfil).map((texto) => ({ de: 'nani', texto })), algoMas], OPCIONES_INICIO);
    case 'carrera':
      return conMensajes(estado, [yo, { de: 'nani', texto: '¿De qué universidad?' }], UNIVERSIDADES_CHAT.map((u) => op(`uni:${u}`, u)));
    case 'uni': {
      const filas = ex.carreras.filter((f) => f.universidad === dato).sort((x, y) => x.carrera.localeCompare(y.carrera, 'es'));
      return conMensajes(estado, [yo, { de: 'nani', texto: `Estas son las carreras de ${dato} que conozco. Elige una:` }],
        [...filas.map((f) => op(`ficha:${f.carreraId}`, f.carrera)), op('carrera', 'Otra universidad')]);
    }
    case 'ficha': {
      const f = fila(dato);
      if (!f) return conMensajes(estado, [yo, { de: 'nani', texto: 'No encontré esa carrera.' }, algoMas], OPCIONES_INICIO);
      const d = descripcionDe(f.carreraId);
      return conMensajes(estado, [yo,
        { de: 'nani', tipo: 'ficha', carreraId: f.carreraId, texto: `${f.carrera}. ${d?.descripcion ?? ''} ${relacionSencilla(f)}`.trim() },
        { de: 'nani', texto: SUGERENCIA_TUTOR },
        algoMas],
      [op(`plan:${f.carreraId}`, '¿Qué cursos estudiaré?'), ...OPCIONES_INICIO]);
    }
    case 'plan': {
      const f = fila(dato);
      const m = f ? mallaDe(f.carreraId) : null;
      const nuevos = m
        ? [{ de: 'nani', tipo: 'malla', carreraId: f.carreraId, texto: `Plan de estudios oficial de ${f.carrera} (${m.universidad}): ${m.semestres} semestres. Toca un semestre para ver sus cursos.` }]
        : [{ de: 'nani', texto: MENSAJE_SIN_MALLA }];
      return conMensajes(estado, [yo, ...nuevos, algoMas], OPCIONES_INICIO);
    }
    default:
      return conMensajes(estado, [yo, algoMas], OPCIONES_INICIO);
  }
}

/** Texto de los mensajes nuevos de Ñani (para la voz), desde el índice dado. */
export function textoNuevo(estado, desde) {
  return estado.mensajes.slice(desde).filter((m) => m.de === 'nani').map((m) => m.texto).join(' ');
}

// ---------- Vista ----------
const chip = (l, si = true) => `<span class="letra${si ? '' : ' letra--no'}" style="${si ? `--c:${COLOR_LETRA[l]}` : ''}">${l}</span>`;
const codigoChips = (f) => `<span class="mini-codigo" aria-label="Código RIASEC de la carrera: ${f.codigo}">${[...f.codigo].map((l) => chip(l, !f.coincidencias || f.coincidencias.includes(l))).join('')}</span>`;

function fichaHtml(f) {
  const d = descripcionDe(f.carreraId);
  const c = { descripcion: d?.descripcion ?? null, actividades: d?.actividades ?? [], relacion: relacionSencilla(f) };
  const sede = f.estadoSede !== 'documentada'
    ? '<span class="etiqueta etiqueta--alerta">Sede por confirmar</span>'
    : `${ICONO_SEDE}<span>${f.sedes.map((s) => esc(s.nombre)).join(' · ')}</span>`;
  return `
    <div class="chat-ficha">
      <p class="carrera-compacta__uni">${esc(f.universidad)} · ${esc(UNIVERSIDADES[f.universidad]?.gestion ?? '')}</p>
      <p class="chat-ficha__titulo"><strong>${esc(f.carrera)}</strong> ${codigoChips(f)}</p>
      <p class="carrera-compacta__sede">${sede}</p>
      ${c.descripcion ? `<p>${esc(c.descripcion)}</p>` : ''}
      ${c.actividades.length ? `<ul class="chat-ficha__lista">${c.actividades.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <p class="chat-ficha__relacion">${esc(c.relacion)}</p>
      <p class="chat-ficha__nota">Descripción general del equipo, no oficial de la universidad.</p>
    </div>`;
}

function mallaHtml(f) {
  const m = mallaDe(f.carreraId);
  if (!m) return `<p>${esc(MENSAJE_SIN_MALLA)}</p>`;
  const periodos = [...new Set(m.cursos.map((c) => c.periodo ?? ''))];
  // Sencillo: semestres plegables con los nombres de las asignaturas (sin horas, créditos ni requisitos).
  const curso = (c) => {
    const e = c.nombre.match(/^Electivo \(a elegir: (.+)\)$/);
    return e ? `<li class="chat-malla__electivo">Electivo: elige uno (${esc(e[1].split('; ').join(' · '))})</li>` : `<li>${esc(c.nombre)}</li>`;
  };
  return `
    <div class="chat-malla">
      <p><strong>${esc(f.carrera)}</strong> · ${esc(m.universidad)} · ${m.semestres} semestres</p>
      ${periodos.map((p) => `<details class="chat-malla__periodo"><summary>${esc(p || 'Cursos')} <small>(${m.cursos.filter((c) => (c.periodo ?? '') === p).length})</small></summary><ul>${m.cursos.filter((c) => (c.periodo ?? '') === p).map(curso).join('')}</ul></details>`).join('')}
      ${m.documentoLocal ? `<p class="chat-malla__pdf"><a class="chat-malla__enlace" href="${esc(m.documentoLocal)}" target="_blank" rel="noopener" type="application/pdf">Ver el plan oficial completo (PDF, funciona sin conexión)</a></p>` : ''}
      <p class="chat-ficha__nota">Fuente: plan de estudios oficial, Resolución N° ${esc(m.resoluciones?.[0] ?? '')}. Revisado el ${esc(m.fuente.fechaVerificacion)}. Puede actualizarse: confírmalo con la universidad.</p>
    </div>`;
}

function burbuja(m, ex) {
  if (m.de === 'yo') return `<li class="chat-msg chat-msg--yo"><span class="sr-only">Tú: </span>${esc(m.texto)}</li>`;
  const f = m.carreraId ? ex.carreras.find((x) => x.carreraId === m.carreraId) : null;
  const cuerpo = m.tipo === 'ficha' && f ? fichaHtml(f) : m.tipo === 'malla' && f ? mallaHtml(f) : esc(m.texto);
  return `<li class="chat-msg chat-msg--nani"><span class="sr-only">Ñani: </span>${cuerpo}</li>`;
}

/** Contenido del diálogo (cabecera, mensajes y botones de respuesta). */
export function vistaChat(estado, ex, { vozActiva = true } = {}) {
  return `
    <div class="chat__cabeza">
      <span class="nani-vivo chat__nani">${nani({ expresion: 'feliz' })}</span>
      <div class="chat__titulo"><h2 id="chat-titulo">Pregúntale a Ñani</h2><p>${esc(NOTA_CHAT)}</p></div>
      <button type="button" class="chat__icono" data-chat="voz" aria-pressed="${vozActiva}" aria-label="${vozActiva ? 'Silenciar a Ñani' : 'Activar la voz de Ñani'}">${ICONO_VOZ}${vozActiva ? '' : '<span class="chat__tachado" aria-hidden="true"></span>'}</button>
      <button type="button" class="chat__icono" data-chat="cerrar" aria-label="Cerrar el chat">×</button>
    </div>
    <ol class="chat__mensajes" id="chat-mensajes" role="log" aria-live="polite" aria-label="Conversación con Ñani">${estado.mensajes.map((m) => burbuja(m, ex)).join('')}</ol>
    <div class="chat__opciones" role="group" aria-label="Elige una respuesta">${estado.opciones.map((o, i) => `<button type="button" class="chat__opcion" data-chat="opcion" data-indice="${i}">${esc(o.texto)}</button>`).join('')}</div>`;
}
