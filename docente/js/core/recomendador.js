// Recomendador simbólico basado en reglas RIASEC (artículo final, ecuación 3 y apartado de diseño).
// No es IA generativa ni aprendizaje automático. Las afinidades son orientativas, no probabilidades.
// Son HEURÍSTICAS PROPIAS del prototipo (artículo + decisiones de la autora), no recomendaciones
// psicométricamente validadas ni reglas de O*NET.
// Lógica pura: no guarda ni envía datos.

import { calcularPerfil, NOMBRES, LETRAS, PUNTAJE_MAX, fmtNum } from './riasec.js';
import { CATALOGO } from '../data/catalogo.js';
import { FUENTES } from '../data/fuentes.js';

// Reglas provisionales del artículo (no calibradas ni validadas).
export const PESO_AFINIDAD = 0.8;
export const PESO_PROXIMIDAD = 0.2;
export const P_MISMA_PROVINCIA = 1;
export const P_OTRA_PROVINCIA_REGION_BASE = 0.5;
export const P_OTRA_REGION = 0.3;
export const REGION_BASE = 'Apurímac';

// Filtro de pertinencia de 2 letras: decisión D2 del prototipo (11-11-2026), NO regla del artículo ni validada.
// Desde el 12-11-2026 (decisión 1 de la autora tras la auditoría de pertinencia) YA NO es obligatorio:
// minCoincidencias vale 0 por defecto y ninguna carrera se excluye por compartir pocas letras.
// La constante se conserva solo para quien quiera reproducir el criterio anterior de forma explícita.
// Orden de sedes verificadas: puntaje combinado de la ecuación 3 (módulo técnico/docente).
export const MIN_LETRAS_COINCIDENTES = 2;

export const MENSAJE_SIN_COINCIDENCIAS = 'No encontramos coincidencias en el catálogo local verificado.';
export const MENSAJE_OTRAS_REGIONES = 'Alternativas de otras regiones pendientes de verificación.';
export const AVISO_GENERAL =
  'Las afinidades son orientativas y no son probabilidades de éxito ni de admisión. ' +
  'Son heurísticas propias del prototipo, no recomendaciones validadas psicométricamente: los pesos 0,80 y 0,20, ' +
  'el umbral D (D < 6 en la escala 0–40) y el orden propuesto son reglas provisionales, no validadas.';

export function validarCodigo(codigo) {
  return typeof codigo === 'string' && codigo.length === 3 &&
    new Set(codigo).size === 3 && [...codigo].every((l) => LETRAS.includes(l));
}

/**
 * Ai = (3·r1 + 2·r2 + r3) / 6, con r = puntaje / escalaMax en el orden del código de la carrera.
 * Con escalaMax = 40 es literalmente la ecuación 3 del artículo; con otra escala, r se normaliza
 * entre su máximo (generalización del prototipo: Ai sigue entre 0 y 1).
 */
export function calcularAfinidad(puntajes, codigoCarrera, escalaMax = PUNTAJE_MAX) {
  if (!validarCodigo(codigoCarrera)) throw new RangeError(`Código RIASEC no válido: ${codigoCarrera}`);
  const [r1, r2, r3] = [...codigoCarrera].map((l) => puntajes[l] / escalaMax);
  return (3 * r1 + 2 * r2 + r3) / 6;
}

/**
 * P: 1 misma provincia; 0,5 otra provincia de Apurímac; 0,3 otra región.
 * Devuelve null si la sede no está documentada o no se eligió provincia de referencia.
 */
export function calcularProximidad(sede, provinciaReferencia) {
  if (!sede || !sede.provincia || !sede.region) return null;
  if (provinciaReferencia == null || provinciaReferencia === '') return null;
  if (sede.region !== REGION_BASE) return P_OTRA_REGION;
  return sede.provincia === provinciaReferencia ? P_MISMA_PROVINCIA : P_OTRA_PROVINCIA_REGION_BASE;
}

/** Puntaje = 0,80·Ai + 0,20·P; null si P no está disponible. */
export function calcularPuntaje(afinidad, proximidad) {
  return proximidad == null ? null : PESO_AFINIDAD * afinidad + PESO_PROXIMIDAD * proximidad;
}

/** Letras del código de la carrera presentes en el código del estudiante (en el orden de la carrera). */
export function letrasCoincidentes(codigoEstudiante, codigoCarrera) {
  return [...codigoCarrera].filter((l) => codigoEstudiante.includes(l));
}

export function esPertinente(codigoEstudiante, codigoCarrera) {
  return letrasCoincidentes(codigoEstudiante, codigoCarrera).length >= MIN_LETRAS_COINCIDENTES;
}

const f3 = (x) => fmtNum(x, 3);

function motivoProximidad(p) {
  if (p === P_MISMA_PROVINCIA) return 'Está en la provincia que elegiste';
  if (p === P_OTRA_PROVINCIA_REGION_BASE) return `Está en otra provincia de ${REGION_BASE}`;
  return 'Está en otra región';
}

function explicar(perfil, carrera, coincidencias, afinidad, sede, proximidad, puntaje) {
  const lineas = [];
  const letras = coincidencias.map((l) => `${l} (${NOMBRES[l]})`).join(', ');
  lineas.push(`Tu código RIASEC es ${perfil.codigo}. ${carrera.carrera} tiene el código asignado ${carrera.codigo} y comparte ${coincidencias.length} letras contigo: ${letras}.`);
  lineas.push(`Afinidad orientativa: ${f3(afinidad)} (escala de 0 a 1). No es una probabilidad de éxito ni de admisión.`);
  if (!sede) {
    lineas.push('Sede por confirmar: la fuente no precisa la sede; por eso no se calcula proximidad ni puntaje combinado.');
  } else if (proximidad == null) {
    lineas.push(`Sede documentada: ${sede.nombre} (provincia ${sede.provincia}). Elige una provincia de referencia para calcular el puntaje combinado.`);
  } else {
    lineas.push(`Sede documentada: ${sede.nombre} (provincia ${sede.provincia}). ${motivoProximidad(proximidad)}: P = ${fmtNum(proximidad)}. ` +
      `Puntaje combinado = 0,80 × ${f3(afinidad)} + 0,20 × ${fmtNum(proximidad)} = ${f3(puntaje)}.`);
  }
  const v = carrera.valoracionExpertas;
  lineas.push(`El código ${carrera.codigo} es una asignación de diseño de los autores, no una clasificación oficial de ${carrera.universidad}.` +
    (v ? ` La denominación «${v.denominacion}» fue valorada preliminarmente por dos expertas (V de Aiken = ${fmtNum(v.v, 2)}); el juicio fue sobre la denominación agrupada, no sobre esta fila, y no constituye validación.` : ''));
  return lineas;
}

function item(perfil, carrera, coincidencias, afinidad, sede, proximidad, puntaje, posicion) {
  return {
    carreraId: carrera.id,
    universidad: carrera.universidad,
    carrera: carrera.carrera,
    codigo: carrera.codigo,
    estadoSede: carrera.estadoSede,
    sede: sede ? { ...sede } : null,
    coincidencias,
    afinidad,
    proximidad,
    puntaje,
    fuentes: carrera.fuentes.map((k) => FUENTES[k]).filter(Boolean),
    valoracionExpertas: carrera.valoracionExpertas ?? null,
    explicacion: explicar(perfil, carrera, coincidencias, afinidad, sede, proximidad, puntaje),
    _posicion: posicion,
  };
}

function ordenar(lista, ordenarPor) {
  const nulosAlFinal = (a, b) => (a == null) - (b == null) || (b ?? 0) - (a ?? 0);
  lista.sort((a, b) => {
    if (ordenarPor === 'puntaje') {
      return nulosAlFinal(a.puntaje, b.puntaje) || b.afinidad - a.afinidad || a._posicion - b._posicion;
    }
    return b.afinidad - a.afinidad || nulosAlFinal(a.puntaje, b.puntaje) || a._posicion - b._posicion;
  });
  lista.forEach((x) => delete x._posicion);
  return lista;
}

/**
 * Genera recomendaciones filtradas y explicadas.
 * @param {object} puntajes  seis puntajes R,I,A,S,E,C (0 a escalaMax)
 * @param {object} opciones  { provinciaReferencia?: string|null, catalogo?: array, ordenarPor?: 'afinidad'|'puntaje', escalaMax?: number (40) }
 *   ordenarPor 'puntaje' (por defecto, ecuación 3): puntaje combinado descendente; Ai desempata.
 *   Sin provincia de referencia el puntaje no existe y el orden queda por Ai.
 */
export function recomendar(puntajes, { provinciaReferencia = null, catalogo = CATALOGO, ordenarPor = 'puntaje', escalaMax = PUNTAJE_MAX, minCoincidencias = 0 } = {}) {
  const perfil = calcularPerfil(puntajes, { escalaMax });
  const verificadas = [];
  const porConfirmar = [];
  let posicion = 0;

  for (const carrera of catalogo) {
    const coincidencias = letrasCoincidentes(perfil.codigo, carrera.codigo);
    if (coincidencias.length < minCoincidencias) continue;
    const afinidad = calcularAfinidad(perfil.puntajes, carrera.codigo, escalaMax);
    if (carrera.estadoSede === 'documentada' && carrera.sedes.length > 0) {
      for (const sede of carrera.sedes) { // cada sede se evalúa por separado
        const p = calcularProximidad(sede, provinciaReferencia);
        verificadas.push(item(perfil, carrera, coincidencias, afinidad, sede, p, calcularPuntaje(afinidad, p), posicion++));
      }
    } else {
      porConfirmar.push(item(perfil, carrera, coincidencias, afinidad, null, null, null, posicion++));
    }
  }

  ordenar(verificadas, ordenarPor);
  ordenar(porConfirmar, 'afinidad');

  return {
    perfil,
    provinciaReferencia,
    criterio: minCoincidencias > 0
      ? `Se muestran solo carreras cuyo código comparte al menos ${minCoincidencias} letras con el código ${perfil.codigo} (criterio anterior, aplicado de forma explícita).`
      : `Se calculan todas las carreras del catálogo, sin excluir ninguna por compartir pocas letras con el código ${perfil.codigo}.`,
    verificadas,
    porConfirmar,
    sinCoincidenciasLocales: verificadas.length === 0,
    mensajeSinCoincidencias: verificadas.length === 0 ? MENSAJE_SIN_COINCIDENCIAS : null,
    otrasRegiones: { estado: 'pendiente_de_verificacion', mensaje: MENSAJE_OTRAS_REGIONES, carreras: [] },
    aviso: AVISO_GENERAL,
  };
}
