// Puntuación de instrumentos de intereses: lógica pura, sin DOM, sin almacenamiento y sin red.
// Cada instrumento declara su método en `puntuacion.metodo`. Aquí solo existe el método del
// cuestionario provisional («suma-por-dimension»). Un instrumento oficial futuro (por ejemplo, el
// O*NET Mini-IP, si se autoriza) deberá declarar y documentar su propio método: NO se presupone
// que su algoritmo sea igual al provisional. Un método desconocido produce un error.
//
// Respuestas: objeto { idPregunta: valor }. No contiene datos personales.

/** Puntaje máximo por dimensión = ítems por dimensión × valor máximo de la escala (provisional: 5 × 4 = 20). */
export function escalaMaxima(inst) {
  return inst.puntuacion.itemsPorDimension * inst.escala.max;
}

const valoresValidos = (inst) => new Set(inst.escala.opciones.map((o) => o.valor));

/** Revisa respuestas: faltantes (en orden de presentación), inválidas y claves desconocidas. */
export function revisarRespuestas(inst, respuestas = {}) {
  const validos = valoresValidos(inst);
  const ids = new Set(inst.preguntas.map((p) => p.id));
  const faltantes = [];
  const invalidas = [];
  inst.preguntas.forEach((p, i) => {
    const v = respuestas[p.id];
    if (v === undefined || v === null) faltantes.push({ id: p.id, numero: i + 1 });
    else if (!validos.has(v)) invalidas.push({ id: p.id, numero: i + 1, valor: v });
  });
  const desconocidas = Object.keys(respuestas).filter((k) => !ids.has(k));
  return {
    ok: faltantes.length === 0 && invalidas.length === 0 && desconocidas.length === 0,
    respondidas: inst.preguntas.length - faltantes.length - invalidas.length,
    total: inst.preguntas.length,
    faltantes,
    invalidas,
    desconocidas,
  };
}

function sumaPorDimension(inst, respuestas) {
  const puntajes = Object.fromEntries(inst.dimensiones.map((d) => [d, 0]));
  for (const p of inst.preguntas) puntajes[p.dimension] += respuestas[p.id];
  return puntajes;
}

const METODOS = Object.freeze({ 'suma-por-dimension': sumaPorDimension });

/** Índice descriptivo = puntuación / máximo × 100 (sin redondear). No es una probabilidad. */
export function indiceDescriptivo(puntaje, max) {
  return (puntaje * 100) / max; // multiplicar primero evita errores de redondeo (11 / 20 → 55, no 55,000…1)
}

/**
 * Calcula las puntuaciones. Exige todas las respuestas y que sean válidas: con preguntas
 * pendientes no hay resultado (RangeError).
 * @returns {{ instrumentoId, version, puntajes, escalaMax, indices }}
 */
export function puntuar(inst, respuestas) {
  const metodo = METODOS[inst.puntuacion?.metodo];
  if (!metodo) throw new Error(`Método de puntuación no implementado: ${inst.puntuacion?.metodo ?? '(ninguno)'}.`);
  const rev = revisarRespuestas(inst, respuestas);
  if (!rev.ok) {
    const partes = [];
    if (rev.faltantes.length) partes.push(`faltan ${rev.faltantes.length} respuestas (preguntas ${rev.faltantes.map((f) => f.numero).join(', ')})`);
    if (rev.invalidas.length) partes.push(`${rev.invalidas.length} respuestas no válidas`);
    if (rev.desconocidas.length) partes.push(`claves desconocidas: ${rev.desconocidas.join(', ')}`);
    throw new RangeError(`No se puede calcular el resultado: ${partes.join('; ')}.`);
  }
  const escalaMax = escalaMaxima(inst);
  const puntajes = metodo(inst, respuestas);
  const indices = Object.fromEntries(Object.entries(puntajes).map(([d, v]) => [d, indiceDescriptivo(v, escalaMax)]));
  return { instrumentoId: inst.id, version: inst.version, puntajes, escalaMax, indices };
}
