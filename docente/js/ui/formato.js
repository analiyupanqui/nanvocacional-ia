// Utilidades de presentación (puras, probadas en Node).
import { fmtNum, PUNTAJE_MAX } from '../core/riasec.js';

// Marcas diacríticas combinadas (U+0300 a U+036F), construidas sin escapes para evitar errores de codificación.
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');
const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);

/** Une elementos con comas e «y», o «e» ante palabra o letra con sonido i (regla ortográfica). */
export function unirLista(xs) {
  if (xs.length <= 1) return xs.join('');
  const ultimo = String(xs[xs.length - 1]);
  const conj = /^(i|hi)(?!e)/i.test(ultimo.normalize('NFD').replace(DIACRITICOS, '')) ? 'e' : 'y';
  return `${xs.slice(0, -1).join(', ')} ${conj} ${ultimo}`;
}

export const f3 = (x) => (x == null ? '—' : fmtNum(x, 3));
export const fP = (x) => (x == null ? '—' : fmtNum(x));

/** Convierte el texto de un campo en número; acepta coma decimal. Vacío → NaN. */
export function leerNumero(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return NaN;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}


/** Índice descriptivo: porcentaje del puntaje máximo de la escala (40 por defecto), redondeado a entero. No es una probabilidad. */
export const porcentaje = (v, escalaMax = PUNTAJE_MAX) => Math.round((v / escalaMax) * 100);
