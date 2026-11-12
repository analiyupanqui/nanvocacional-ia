// Lectura en voz alta de los mensajes de Ñani con SpeechSynthesis del navegador.
// Solo se activa cuando el usuario pulsa «Escuchar a Ñani». Por privacidad, SOLO usa voces
// instaladas en el equipo (localService): las voces «en línea» de algunos navegadores envían
// el texto a servidores externos. No es un asistente conversacional ni IA generativa.

const sintesis = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

export function vozSoportada() {
  return typeof window !== 'undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function';
}

/** Primera voz local en español (prefiere es-PE y luego cualquier es-*). */
export function vozLocalEspanol() {
  if (!vozSoportada()) return null;
  const voces = sintesis().getVoices().filter((v) => v.localService && /^es([-_]|$)/i.test(v.lang));
  return voces.find((v) => /^es[-_]PE/i.test(v.lang)) || voces[0] || null;
}

/** Precarga la lista de voces (en Chrome/Brave llega de forma asíncrona). */
export function prepararVoces() {
  if (vozSoportada()) sintesis().getVoices();
}

/**
 * @returns {{ok: boolean, motivo?: string}}
 */
export function hablar(texto, { alTerminar } = {}) {
  if (!vozSoportada()) return { ok: false, motivo: 'Este navegador no ofrece lectura en voz alta.' };
  const voz = vozLocalEspanol();
  if (!voz) {
    return { ok: false, motivo: sintesis().getVoices().length
      ? 'No hay una voz en español instalada en este equipo. Por privacidad no se usan voces en línea.'
      : 'Las voces del navegador aún se están cargando o no están disponibles. Intente de nuevo.' };
  }
  detener();
  const u = new window.SpeechSynthesisUtterance(texto);
  u.voice = voz;
  u.lang = voz.lang;
  u.rate = 1;
  u.onend = () => alTerminar?.();
  u.onerror = () => alTerminar?.();
  sintesis().speak(u);
  return { ok: true };
}

export function detener() {
  if (vozSoportada()) sintesis().cancel();
}
