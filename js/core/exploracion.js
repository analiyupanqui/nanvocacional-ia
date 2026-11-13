// Exploración de carreras para el ESTUDIANTE (decisiones de la autora del 12-11-2026, tras la auditoría
// de pertinencia). Lógica pura: sin DOM, sin almacenamiento y sin red.
//
// Diferencias con el recomendador del artículo (recomendador.js, que se conserva para el módulo
// técnico/docente con su puntaje combinado 0,80·Ai + 0,20·P):
// - Ninguna carrera se excluye por compartir pocas letras: se listan las 23 filas del catálogo.
// - El ORDEN usa las seis puntuaciones: «afinidad descriptiva» = correlación de Pearson entre los seis
//   puntajes del estudiante y el perfil de la carrera derivado de su código asignado (3, 2 y 1 para su
//   1.ª, 2.ª y 3.ª letra, como los pesos de la ecuación 3; 0 en las otras tres). Mide la semejanza de
//   FORMA entre perfiles (qué áreas son más altas y cuáles más bajas), no el nivel.
//   Es una HEURÍSTICA PROPIA del prototipo: no es una probabilidad, no está validada y no es el
//   algoritmo de O*NET.
// - La cercanía geográfica NO interviene en el orden: se informa aparte (categoría de provincia) y se
//   puede usar como filtro voluntario.
// - Desempates: afinidad Ai de la ecuación 3; después, sede documentada antes que por confirmar
//   (estado de verificación, no cercanía); después, el orden de la Tabla 3.

import { calcularPerfil, LETRAS, NOMBRES, PUNTAJE_MAX, fmtNum } from './riasec.js';
import { calcularAfinidad, calcularProximidad, letrasCoincidentes, P_MISMA_PROVINCIA, P_OTRA_PROVINCIA_REGION_BASE, REGION_BASE } from './recomendador.js';
import { CATALOGO } from '../data/catalogo.js';
import { FUENTES } from '../data/fuentes.js';

export const MOSTRAR_INICIAL = 5;
export const AVISO_NO_APARECE = 'Una carrera que no aparece entre las primeras opciones también puede ser adecuada para ti.';
export const MAX_INTERESADAS = 3;
export const CRITERIO_ORDEN =
  'Orden por afinidad descriptiva: semejanza entre la forma de tus seis puntuaciones RIASEC y el código asignado a cada carrera. ' +
  'Es una heurística propia del prototipo, no una probabilidad de éxito ni una recomendación validada. La ubicación de la sede no cambia el orden.';

/** Perfil de una carrera a partir de su código: 3, 2 y 1 para sus letras; 0 para las demás. */
export function perfilCarrera(codigo) {
  return Object.fromEntries(LETRAS.map((l) => {
    const i = codigo.indexOf(l);
    return [l, i < 0 ? 0 : 3 - i];
  }));
}

/**
 * Afinidad descriptiva: correlación de Pearson entre los seis puntajes y el perfil de la carrera.
 * Va de −1 a 1. Devuelve null si los seis puntajes son iguales (perfil plano: no hay forma que comparar).
 */
export function afinidadDescriptiva(puntajes, codigo) {
  const x = LETRAS.map((l) => puntajes[l]);
  const yP = perfilCarrera(codigo);
  const y = LETRAS.map((l) => yP[l]);
  const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const mx = media(x);
  const my = media(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < 6; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  if (dx === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/** Categoría de cercanía de una sede respecto de la provincia de referencia (solo informativa). */
export function cercaniaTexto(sede, provinciaReferencia) {
  const p = calcularProximidad(sede, provinciaReferencia);
  if (p == null) return null;
  if (p === P_MISMA_PROVINCIA) return 'en tu provincia de referencia';
  if (p === P_OTRA_PROVINCIA_REGION_BASE) return `otra provincia de ${REGION_BASE}`;
  return 'otra región';
}

const lista = (ls) => ls.map((l) => `${l} (${NOMBRES[l]})`).join(', ');

function porQue(perfil, carrera, coincidencias, max) {
  const lineas = [];
  if (coincidencias.length) {
    lineas.push(`Comparte ${coincidencias.length === 1 ? 'la letra' : 'las letras'} ${lista(coincidencias)} con tus tres intereses principales (${perfil.codigo}).`);
  } else {
    lineas.push(`No comparte letras con tu código ${perfil.codigo}; su lugar depende de la forma de tus seis puntuaciones.`);
  }
  const pts = [...carrera.codigo].map((l) => `${l} ${fmtNum(perfil.puntajes[l])}`).join(', ');
  lineas.push(`Su código asignado es ${carrera.codigo}. Tus puntajes en esas áreas: ${pts} (de ${max}).`);
  return lineas;
}

/**
 * Lista las 23 filas del catálogo ordenadas por afinidad descriptiva, sin excluir ninguna.
 * @param {object} puntajes  seis puntajes (0 a escalaMax)
 * @param {{ escalaMax?: number, provinciaReferencia?: string|null, catalogo?: array }} opciones
 */
export function explorarCarreras(puntajes, { escalaMax = PUNTAJE_MAX, provinciaReferencia = null, catalogo = CATALOGO } = {}) {
  const perfil = calcularPerfil(puntajes, { escalaMax });
  const filas = catalogo.map((c, posicionTabla) => {
    const coincidencias = letrasCoincidentes(perfil.codigo, c.codigo);
    return {
      carreraId: c.id,
      universidad: c.universidad,
      carrera: c.carrera,
      codigo: c.codigo,
      estadoSede: c.estadoSede,
      sedes: c.sedes.map((s) => ({ ...s, cercania: cercaniaTexto(s, provinciaReferencia) })),
      coincidencias,
      noCoinciden: [...c.codigo].filter((l) => !coincidencias.includes(l)),
      afinidadDescriptiva: afinidadDescriptiva(perfil.puntajes, c.codigo),
      afinidad: calcularAfinidad(perfil.puntajes, c.codigo, escalaMax),
      fuentes: c.fuentes.map((k) => FUENTES[k]).filter(Boolean),
      valoracionExpertas: c.valoracionExpertas ?? null,
      porQue: porQue(perfil, c, coincidencias, escalaMax),
      _tabla: posicionTabla,
    };
  });
  filas.sort((a, b) =>
    (b.afinidadDescriptiva ?? 0) - (a.afinidadDescriptiva ?? 0)
    || b.afinidad - a.afinidad
    || (a.estadoSede === 'documentada' ? 0 : 1) - (b.estadoSede === 'documentada' ? 0 : 1)
    || a._tabla - b._tabla);
  filas.forEach((f, i) => { f.lugar = i + 1; delete f._tabla; });
  const primera = perfil.codigo[0];
  const avisoCatalogo = catalogo.some((c) => c.codigo[0] === primera)
    ? null
    : `El catálogo de este prototipo no tiene carreras cuyo código empiece por ${primera} (${NOMBRES[primera]}), tu interés más alto. Eso no significa que no existan: el catálogo es limitado.`;
  return { perfil, provinciaReferencia, carreras: filas, total: filas.length, criterio: CRITERIO_ORDEN, aviso: AVISO_NO_APARECE, avisoCatalogo };
}

/** Provincias con al menos una sede documentada en el catálogo (para el filtro voluntario). */
export function provinciasConSede(catalogo = CATALOGO) {
  return [...new Set(catalogo.flatMap((c) => c.sedes.map((s) => s.provincia)))].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Filtro voluntario por ubicación (no cambia el orden):
 *   '' = todas; 'por_confirmar' = solo sede por confirmar; otro valor = carreras con alguna sede documentada en esa provincia.
 */
export function filtrarPorUbicacion(filas, ubicacion = '') {
  if (!ubicacion) return filas;
  if (ubicacion === 'por_confirmar') return filas.filter((f) => f.estadoSede !== 'documentada');
  return filas.filter((f) => f.sedes.some((s) => s.provincia === ubicacion));
}

/** Alterna una carrera en «Carreras que ya me interesan» (máximo 3). No modifica puntajes ni orden. */
export function alternarInteresada(seleccion, carreraId, catalogo = CATALOGO) {
  if (!catalogo.some((c) => c.id === carreraId)) return seleccion;
  if (seleccion.includes(carreraId)) return seleccion.filter((id) => id !== carreraId);
  if (seleccion.length >= MAX_INTERESADAS) return seleccion;
  return [...seleccion, carreraId];
}

/** Mensaje neutral de Ñani para una carrera que el estudiante ya tiene en mente. */
export function mensajeInteresada(fila, perfil, total) {
  const max = perfil.escalaMax;
  const altas = [...fila.codigo].filter((l) => perfil.puntajes[l] >= max / 2);
  const bajas = [...fila.codigo].filter((l) => perfil.puntajes[l] < max / 2);
  const partes = [`${fila.carrera} combina actividades ${[...fila.codigo].join(', ')}.`];
  if (altas.length && bajas.length) partes.push(`En tus respuestas, ${altas.join(', ')} ${altas.length > 1 ? 'salieron' : 'salió'} en la mitad superior y ${bajas.join(', ')} en la mitad inferior.`);
  else if (altas.length) partes.push('En tus respuestas, esas áreas salieron en la mitad superior.');
  else partes.push('En tus respuestas, esas áreas salieron en la mitad inferior.');
  partes.push(`Está en el lugar ${fila.lugar} de ${total} del orden orientativo. Tus intereses pueden crecer con la experiencia: conversa con tu tutor o tutora y conoce más sobre esta carrera.`);
  return partes.join(' ');
}
