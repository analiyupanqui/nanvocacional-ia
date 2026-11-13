// Destello sonoro ORIGINAL de la bienvenida (0.8.1): dos notas suaves sintetizadas en el momento con Web Audio
// (sol y re agudos, ~0,4 s, volumen bajo). No usa archivos de audio ni sonidos de terceros.
// Solo se llama al pulsar «¡Vamos a comenzar!» (Android exige una interacción para reproducir sonido) y nunca si
// la voz de Ñani está silenciada. Si el navegador no lo permite, no pasa nada: la app sigue igual.
export function destello() {
  try {
    const Contexto = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!Contexto) return false;
    const ctx = new Contexto();
    ctx.resume?.();
    const inicio = ctx.currentTime + 0.02;
    for (const [frecuencia, retraso] of [[784, 0], [1175, 0.12]]) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frecuencia;
      const t = inicio + retraso;
      vol.gain.setValueAtTime(0.0001, t);
      vol.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    }
    setTimeout(() => ctx.close?.(), 800); // libera el audio para que la voz de Ñani suene sin competir
    return true;
  } catch {
    return false;
  }
}
