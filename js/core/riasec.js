// Motor RIASEC: validación de seis puntajes, código de tres letras, empates y amplitud D.
// Lógica pura (sin DOM ni almacenamiento): nada se guarda.

export const LETRAS = Object.freeze(['R', 'I', 'A', 'S', 'E', 'C']);
export const NOMBRES = Object.freeze({
  R: 'Realista', I: 'Investigador', A: 'Artístico', S: 'Social', E: 'Emprendedor', C: 'Convencional',
});
export const PUNTAJE_MIN = 0;
export const PUNTAJE_MAX = 40;
/** Umbral precautorio del artículo (ecuación 1): regla de diseño, no punto de corte validado. */
export const UMBRAL_D = 6;

export const MENSAJE_TUTOR =
  'Tus puntajes son parecidos entre sí. Te sugerimos conversar estos resultados con tu tutor o tutora. ' +
  'Esto no es un diagnóstico ni una clasificación vocacional concluyente.';

export function validarPuntajes(p) {
  if (p === null || typeof p !== 'object' || Array.isArray(p)) {
    return { ok: false, errores: ['Se requieren seis puntajes: R, I, A, S, E y C.'] };
  }
  const errores = [];
  for (const l of LETRAS) {
    const v = p[l];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errores.push(`Falta el puntaje ${l} (${NOMBRES[l]}) o no es un número.`);
    } else if (v < PUNTAJE_MIN || v > PUNTAJE_MAX) {
      errores.push(`El puntaje ${l} (${NOMBRES[l]}) debe estar entre ${PUNTAJE_MIN} y ${PUNTAJE_MAX}.`);
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
 */
export function calcularPerfil(p) {
  const v = validarPuntajes(p);
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
  const pocoDiferenciado = D < UMBRAL_D;

  return {
    puntajes,
    orden,
    codigo,
    empates,
    D,
    pocoDiferenciado,
    avisoTutor: pocoDiferenciado ? `${MENSAJE_TUTOR} (D = ${fmtNum(D)}; umbral provisional D < ${UMBRAL_D}.)` : null,
  };
}

function unir(letras) {
  return letras.length <= 1 ? letras.join('') : `${letras.slice(0, -1).join(', ')} y ${letras[letras.length - 1]}`;
}

export function fmtNum(x, decimales = null) {
  const s = decimales == null ? String(x) : x.toFixed(decimales);
  return s.replace('.', ',');
}
