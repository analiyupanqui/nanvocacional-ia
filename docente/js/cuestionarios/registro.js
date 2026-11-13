// Registro de instrumentos de intereses disponibles en la aplicación.
// Hoy solo contiene el cuestionario PROVISIONAL propio. Punto de integración futuro: un instrumento
// oficial autorizado (por ejemplo, el O*NET Mini-IP) se agregaría como un módulo nuevo con la misma
// estructura (id, nombre, versión, fuente, autoría, estado de validación, licencia, escala,
// dimensiones, preguntas y reglas de puntuación propias), SOLO cuando su licencia y su
// especificación de puntuación estén confirmadas por escrito. No se incluyen aquí sus ítems.

import { INSTRUMENTO_PROVISIONAL } from './provisional.js';
import { LETRAS } from '../core/riasec.js';

const CAMPOS = ['id', 'nombre', 'version', 'fuente', 'autoria', 'estadoValidacion', 'licencia', 'consigna', 'escala', 'dimensiones', 'preguntas', 'puntuacion'];

/** Comprueba la estructura de un instrumento. Devuelve la lista de problemas (vacía si es válido). */
export function validarInstrumento(inst) {
  const errores = [];
  if (!inst || typeof inst !== 'object') return ['El instrumento no es un objeto.'];
  for (const c of CAMPOS) if (inst[c] === undefined || inst[c] === null || inst[c] === '') errores.push(`Falta el campo «${c}».`);
  if (errores.length) return errores;

  if (typeof inst.estadoValidacion.validado !== 'boolean') errores.push('estadoValidacion.validado debe ser verdadero o falso.');
  if (JSON.stringify([...inst.dimensiones]) !== JSON.stringify(LETRAS)) errores.push('Las dimensiones deben ser R, I, A, S, E y C.');

  const valores = inst.escala.opciones.map((o) => o.valor);
  const esperados = Array.from({ length: inst.escala.max - inst.escala.min + 1 }, (_, i) => inst.escala.min + i);
  if (JSON.stringify(valores) !== JSON.stringify(esperados)) errores.push('La escala debe tener una opción por cada valor entero entre min y max.');
  if (inst.escala.opciones.some((o) => !o.etiqueta)) errores.push('Cada opción de la escala necesita una etiqueta.');

  const ids = inst.preguntas.map((p) => p.id);
  if (new Set(ids).size !== ids.length) errores.push('Hay identificadores de pregunta repetidos.');
  const textos = inst.preguntas.map((p) => p.texto.trim().toLowerCase());
  if (new Set(textos).size !== textos.length) errores.push('Hay textos de pregunta repetidos.');
  if (inst.preguntas.some((p) => !LETRAS.includes(p.dimension))) errores.push('Hay preguntas con una dimensión desconocida.');
  const n = inst.puntuacion.itemsPorDimension;
  for (const l of LETRAS) {
    const k = inst.preguntas.filter((p) => p.dimension === l).length;
    if (k !== n) errores.push(`La dimensión ${l} tiene ${k} preguntas; se esperaban ${n}.`);
  }
  if (!inst.puntuacion.metodo) errores.push('Falta el método de puntuación.');
  return errores;
}

const INSTRUMENTOS = new Map([[INSTRUMENTO_PROVISIONAL.id, INSTRUMENTO_PROVISIONAL]]);

/** Instrumento que usa el recorrido del estudiante. */
export const ID_PREDETERMINADO = INSTRUMENTO_PROVISIONAL.id;

export function obtenerInstrumento(id = ID_PREDETERMINADO) {
  const inst = INSTRUMENTOS.get(id);
  if (!inst) throw new Error(`Instrumento no registrado: ${id}`);
  return inst;
}

export function listarInstrumentos() {
  return [...INSTRUMENTOS.values()].map((i) => ({ id: i.id, nombre: i.nombre, version: i.version, validado: i.estadoValidacion.validado }));
}
