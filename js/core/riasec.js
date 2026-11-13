// Motor RIASEC: validación de seis puntajes, código de tres letras, empates y amplitud D.
// Lógica pura (sin DOM ni almacenamiento): nada se guarda.

export const LETRAS = Object.freeze(['R', 'I', 'A', 'S', 'E', 'C']);
export const NOMBRES = Object.freeze({
  R: 'Realista', I: 'Investigador', A: 'Artístico', S: 'Social', E: 'Emprendedor', C: 'Convencional',
});
export const PUNTAJE_MIN = 0;
/** Escala de referencia del artículo (0–40; Ai divide entre 40). Es la escala de los DEMO y de la entrada manual. */
export const PUNTAJE_MAX = 40;
/** Umbral precautorio del artículo (ecuación 1) en la escala 0–40: regla de diseño, no punto de corte validado. */
export const UMBRAL_D = 6;

/**
 * Umbral D para otra escala: proporcional al de 0–40 (6/40 del máximo). Con 0–20 da D < 3.
 * Regla PROVISIONAL del prototipo (12-11-2026), pendiente de confirmación; no es regla del artículo ni de O*NET.
 */
export function umbralD(escalaMax = PUNTAJE_MAX) {
  return (UMBRAL_D * escalaMax) / PUNTAJE_MAX;
}

function escalaValida(escalaMax) {
  if (typeof escalaMax !== 'number' || !Number.isFinite(escalaMax) || escalaMax <= 0) {
    throw new RangeError('La escala máxima debe ser un número positivo.');
  }
  return escalaMax;
}

export const MENSAJE_TUTOR =
  'Tus puntajes son parecidos entre sí. Te sugerimos conversar estos resultados con tu tutor o tutora. ' +
  'Esto no es un diagnóstico ni una clasificación vocacional concluyente.';

export function validarPuntajes(p, { escalaMax = PUNTAJE_MAX } = {}) {
  escalaValida(escalaMax);
  if (p === null || typeof p !== 'object' || Array.isArray(p)) {
    return { ok: false, errores: ['Se requieren seis puntajes: R, I, A, S, E y C.'] };
  }
  const errores = [];
  for (const l of LETRAS) {
    const v = p[l];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errores.push(`Falta el puntaje ${l} (${NOMBRES[l]}) o no es un número.`);
    } else if (v < PUNTAJE_MIN || v > escalaMax) {
      errores.push(`El puntaje ${l} (${NOMBRES[l]}) debe estar entre ${PUNTAJE_MIN} y ${escalaMax}.`);
    }
  }
  const extras = Object.keys(p).filter((k) => !LETRAS.includes(k));
  if (extras.length) errores.push(`Claves no reconocidas: ${extras.join(', ')}.`);
  return { ok: errores.length === 0, errores };
}

const idx = (l) => LETRAS.indexOf(l);

/**
 * Calcula el perfil. Empates: se ordenan según R-I-A-S-E-C (decisión D3 del prototipo)
 * y se informan cuando afectan al código de tres letras.
 * escalaMax: máximo de cada dimensión (40 por defecto: DEMO y entrada manual; 20: cuestionario provisional).
 * El orden, el código y los empates no dependen de la escala; solo el umbral D se ajusta a ella.
 */
export function calcularPerfil(p, { escalaMax = PUNTAJE_MAX } = {}) {
  const v = validarPuntajes(p, { escalaMax });
  if (!v.ok) throw new RangeError(v.errores.join(' '));

  const puntajes = Object.fromEntries(LETRAS.map((l) => [l, p[l]]));
  const orden = [...LETRAS].sort((a, b) => puntajes[b] - puntajes[a] || idx(a) - idx(b));
  const codigo = orden.slice(0, 3).join('');

  const grupos = new Map();
  for (const l of LETRAS) {
    if (!grupos.has(puntajes[l])) grupos.set(puntajes[l], []);
    grupos.get(puntajes[l]).push(l);
  }
  const empates = [];
  for (const [puntaje, letras] of grupos) {
    if (letras.length < 2) continue;
    const posiciones = letras.map((l) => orden.indexOf(l));
    if (Math.min(...posiciones) > 2) continue; // no toca el código
    const fueraDelCodigo = letras.filter((l) => orden.indexOf(l) > 2);
    let mensaje = `Empate entre ${unir(letras)} con ${fmtNum(puntaje)} puntos: se ordenaron según la secuencia R-I-A-S-E-C (regla provisional del prototipo).`;
    if (fueraDelCodigo.length && fueraDelCodigo.length < letras.length) {
      mensaje += ` Por esa regla, ${unir(fueraDelCodigo)} no ${fueraDelCodigo.length > 1 ? 'entran' : 'entra'} en el código de tres letras.`;
    }
    empates.push({ puntaje, letras, fueraDelCodigo, mensaje });
  }
  empates.sort((a, b) => b.puntaje - a.puntaje);

  const D = puntajes[orden[0]] - puntajes[orden[5]];
  const umbral = umbralD(escalaMax);
  const pocoDiferenciado = D < umbral;

  return {
    puntajes,
    escalaMax,
    orden,
    codigo,
    empates,
    D,
    umbralD: umbral,
    pocoDiferenciado,
    avisoTutor: pocoDiferenciado ? `${MENSAJE_TUTOR} (D = ${fmtNum(D)}; umbral provisional D < ${fmtNum(umbral)}.)` : null,
  };
}

function unir(letras) {
  return letras.length <= 1 ? letras.join('') : `${letras.slice(0, -1).join(', ')} y ${letras[letras.length - 1]}`;
}

export function fmtNum(x, decimales = null) {
  const s = decimales == null ? String(x) : x.toFixed(decimales);
  return s.replace('.', ',');
}
