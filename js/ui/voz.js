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

/** Espera a que el navegador cargue la lista de voces (en Chrome/Brave llega de forma asíncrona). */
export function esperarVoces(ms = 900) {
  if (!vozSoportada()) return Promise.resolve([]);
  const s = sintesis();
  if (s.getVoices().length) return Promise.resolve(s.getVoices());
  return new Promise((res) => {
    const fin = () => { s.removeEventListener?.('voiceschanged', fin); res(s.getVoices()); };
    s.addEventListener?.('voiceschanged', fin);
    setTimeout(fin, ms);
  });
}

/**
 * Intenta hablar e informa qué pasó:
 *   'iniciada'  → la voz empezó;
 *   'lenta'     → todavía no empezó (el motor de Android puede tardar 3–5 s en frío): sigue en cola y sonará;
 *   'bloqueada' → el navegador no permite hablar sin una interacción previa («not-allowed»);
 *   'sin-voz'   → no hay síntesis o no hay una voz LOCAL en español (no se usan voces en línea);
 *   'error'     → otro error de la síntesis.
 * El texto siempre se muestra en pantalla aparte: la voz es opcional. Nunca bloquea la interfaz.
 */
// Correcciones 0.8.1 para Chrome de Android (voz que a veces no sonaba y sí después de recargar):
//   1. Las voces llegan tarde la primera vez (el motor de texto a voz arranca en frío): se espera más (hasta 3 s).
//   2. Chrome puede descartar el SpeechSynthesisUtterance por recolección de basura antes de que empiece y entonces
//      no avisa nada: se guarda una referencia hasta que termina.
//   3. cancel() seguido de inmediato por speak() a veces se traga la frase nueva: solo se cancela si hay algo sonando
//      y se espera un instante antes de hablar.
//   4. El arranque en frío puede tardar más que la espera: antes se CANCELABA la frase («bloqueada»); ahora se deja
//      en cola (si empieza tarde, suena igual) y solo se informa que no empezó a tiempo.
//   5. (versión definitiva 0.8.1, tras el diagnóstico en la Lenovo: la voz tarda 3,3–4,0 s en empezar en frío y
//      0,25 s en caliente) En Chrome, speechSynthesis.speaking es true DESDE QUE SE PIDE la frase, no desde que suena:
//      otra petición o un cambio de pantalla durante el arranque la cancelaban. Ahora la app lleva su propio registro:
//      solo se cancela una frase que YA SUENA; las que Android aún está arrancando se respetan y lo nuevo se pone en cola.
const vivas = new Set(); // referencias fuertes a nuestras frases hasta que terminan (ver 2)
let sonando = null; // frase nuestra que ya empezó a sonar (onstart) y no ha terminado
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const hayFrasesArrancando = () => [...vivas].some((u) => u !== sonando);

export async function intentarHablar(texto, { alIniciar, alTerminar, espera = 8000, esperaVoces = 3000 } = {}) {
  if (!vozSoportada()) return 'sin-voz';
  await esperarVoces(esperaVoces);
  const voz = vozLocalEspanol();
  if (!voz) return 'sin-voz';
  const s = sintesis();
  if (sonando || (s.speaking && !vivas.size)) { s.cancel(); await pausa(80); } // reemplaza lo que se está oyendo
  // Si solo hay una frase nuestra arrancando (Android en frío), NO se cancela: la nueva queda en cola detrás.
  if (s.paused) s.resume();
  return new Promise((resolver) => {
    let resuelto = false;
    const responder = (r) => { if (!resuelto) { resuelto = true; clearTimeout(t); resolver(r); } };
    const u = new window.SpeechSynthesisUtterance(texto);
    vivas.add(u);
    u.voice = voz;
    u.lang = voz.lang;
    u.rate = 1;
    let empezo = false; // «terminar» solo cuenta si la voz llegó a empezar (un bloqueo no es un final de voz)
    const soltar = () => { vivas.delete(u); if (sonando === u) sonando = null; };
    u.onstart = () => { empezo = true; sonando = u; alIniciar?.(); responder('iniciada'); };
    u.onend = () => { soltar(); if (empezo) alTerminar?.(); };
    u.onerror = (e) => { soltar(); if (empezo) alTerminar?.(); responder(e?.error === 'not-allowed' ? 'bloqueada' : 'error'); };
    const t = setTimeout(() => responder('lenta'), espera); // no se cancela: si empieza más tarde, se oye igual
    s.speak(u);
  });
}

/** Al cambiar de pantalla: calla lo que ya suena, pero respeta una frase que Android todavía está arrancando. */
export function detenerSiSuena() {
  if (!vozSoportada()) return;
  if (sonando || (sintesis().speaking && !hayFrasesArrancando())) sintesis().cancel();
}
