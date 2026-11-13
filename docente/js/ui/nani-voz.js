// Voz de Ñani para el recorrido del estudiante (rediseño 0.5.0). Solo memoria: nada se guarda.
// - Habla solo en momentos clave (bienvenida, inicio, mitad y final del cuestionario, resultados), nunca en cada pregunta.
// - Cada mensaje con «clave» se dice una sola vez por sesión (no se repite al redibujar la pantalla).
// - «Silenciar» detiene la voz y evita los mensajes automáticos; «Escuchar» siempre lee el mensaje visible.
// - Si no hay voz local en español o el navegador la bloquea, todo sigue por texto, sin errores.
import { intentarHablar, detener } from './voz.js';

let activa = true;
const dichos = new Set();
const pendientes = new Set(); // evita repetir un mensaje si la pantalla se redibuja antes de que la voz empiece
const oyentes = new Set();
const avisar = (hablando) => oyentes.forEach((f) => f(hablando));

export const vozActiva = () => activa;
export function alCambiarHabla(f) { oyentes.add(f); return () => oyentes.delete(f); }

export function silenciar() { activa = false; detener(); avisar(false); }
export function activar() { activa = true; }
export function alternar() { if (activa) silenciar(); else activar(); return activa; }

/** Olvida los mensajes ya dichos (por ejemplo, con «Realizar nuevamente» o «Terminar y borrar»). */
export function olvidar(prefijo = '') { for (const k of [...dichos]) if (k.startsWith(prefijo)) dichos.delete(k); }
export const yaDicho = (clave) => dichos.has(clave);

/**
 * @param {string} texto
 * @param {{ clave?: string|null, forzar?: boolean }} op  forzar = pulsación explícita de «Escuchar»
 * @returns {Promise<'iniciada'|'bloqueada'|'sin-voz'|'error'|'silenciada'|'repetido'>}
 */
export async function decir(texto, { clave = null, forzar = false } = {}) {
  if (!activa && !forzar) return 'silenciada';
  if (clave && (dichos.has(clave) || pendientes.has(clave)) && !forzar) return 'repetido';
  if (forzar) activa = true;
  if (clave) pendientes.add(clave);
  const r = await intentarHablar(texto, { alIniciar: () => avisar(true), alTerminar: () => avisar(false) });
  if (clave) pendientes.delete(clave);
  if (r === 'iniciada' && clave) dichos.add(clave);
  return r;
}

export function callar() { detener(); avisar(false); }
