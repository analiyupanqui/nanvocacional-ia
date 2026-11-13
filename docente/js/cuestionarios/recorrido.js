// Estado del recorrido por el cuestionario: lógica pura, solo en memoria.
// Sin almacenamiento del navegador, sin cookies, sin URL con respuestas y sin red.
// Las funciones devuelven un estado NUEVO (no modifican el anterior).

import { revisarRespuestas, puntuar } from './puntuacion.js';

export function crearRecorrido(inst) {
  return { instrumentoId: inst.id, indice: 0, respuestas: {}, aviso: null };
}

export const preguntaActual = (inst, rec) => inst.preguntas[rec.indice];
export const respuestaActual = (inst, rec) => rec.respuestas[preguntaActual(inst, rec).id];
export const esUltima = (inst, rec) => rec.indice === inst.preguntas.length - 1;

/** Guarda la respuesta de la pregunta actual (solo valores de la escala). */
export function responder(inst, rec, valor) {
  if (!inst.escala.opciones.some((o) => o.valor === valor)) throw new RangeError(`Respuesta no válida: ${valor}`);
  const id = preguntaActual(inst, rec).id;
  return { ...rec, respuestas: { ...rec.respuestas, [id]: valor }, aviso: null };
}

/** Avanza solo si la pregunta actual tiene respuesta. */
export function siguiente(inst, rec) {
  if (respuestaActual(inst, rec) === undefined) return { ...rec, aviso: 'Elige una opción para continuar.' };
  if (esUltima(inst, rec)) return { ...rec, aviso: null };
  return { ...rec, indice: rec.indice + 1, aviso: null };
}

/** Retrocede conservando todas las respuestas. */
export function anterior(inst, rec) {
  return { ...rec, indice: Math.max(0, rec.indice - 1), aviso: null };
}

export function progreso(inst, rec) {
  const rev = revisarRespuestas(inst, rec.respuestas);
  return { numero: rec.indice + 1, total: inst.preguntas.length, respondidas: rev.respondidas, faltantes: rev.faltantes };
}

/**
 * Intenta terminar. Con preguntas pendientes NO hay resultado: se lleva a la primera pendiente
 * y se informa cuántas faltan.
 */
export function finalizar(inst, rec) {
  const rev = revisarRespuestas(inst, rec.respuestas);
  if (!rev.ok) {
    const primera = rev.faltantes[0] ?? rev.invalidas[0];
    const n = rev.faltantes.length;
    return {
      ok: false,
      recorrido: {
        ...rec,
        indice: primera ? primera.numero - 1 : rec.indice,
        aviso: `Aún ${n === 1 ? 'falta 1 pregunta' : `faltan ${n} preguntas`} por responder (${rev.faltantes.map((f) => f.numero).join(', ')}). Te llevo a la primera.`,
      },
    };
  }
  return { ok: true, resultado: puntuar(inst, rec.respuestas) };
}
