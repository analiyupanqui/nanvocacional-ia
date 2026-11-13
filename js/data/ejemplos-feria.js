// Ejemplos del MODO FERIA: respuestas FICTICIAS al cuestionario provisional (no son de ninguna persona).
// Se puntúan con el mismo motor que un cuestionario real, pero el resultado se etiqueta siempre como
// «Ejemplo con respuestas ficticias · no es un resultado real».
// valores: respuesta (0–4) que recibe cada pregunta de esa dimensión.
export const EJEMPLOS_FERIA = Object.freeze([
  Object.freeze({ id: 'ejemplo-a', titulo: 'Ejemplo A', descripcion: 'Interés por ciencia y tecnología', valores: Object.freeze({ R: 3, I: 4, A: 1, S: 1, E: 1, C: 3 }) }),
  Object.freeze({ id: 'ejemplo-b', titulo: 'Ejemplo B', descripcion: 'Interés por personas y organización', valores: Object.freeze({ R: 1, I: 1, A: 2, S: 4, E: 3, C: 3 }) }),
]);

/** Respuestas ficticias completas para un instrumento: { idPregunta: valor }. */
export function respuestasDeEjemplo(inst, ejemplo) {
  return Object.fromEntries(inst.preguntas.map((p) => [p.id, ejemplo.valores[p.dimension]]));
}
