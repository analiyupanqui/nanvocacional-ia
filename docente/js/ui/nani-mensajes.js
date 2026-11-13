// Mensajes de Ñani generados con REGLAS LOCALES fijas (plantillas + condiciones).
// No es IA generativa, no es un chatbot y no hace llamadas externas.
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { unirLista as unir } from './formato.js';

const nombre = (l) => TIPOS_RIASEC[l].nombre;

export const MENSAJE_INICIO = '¡Hola! Soy Ñani. Te acompaño a descubrir caminos de estudio que van con tus intereses.';
export const MENSAJE_PERFIL = 'Elige un perfil de prueba o escribe tus seis puntajes. No guardo nada.';

export const MENSAJE_NANI_CARRERAS = 'Encontré algunas opciones relacionadas con lo que te gusta.';
export const MENSAJE_NANI_SIN_OPCIONES = 'Esta vez no encontré opciones verificadas en mi catálogo de Apurímac.';

/** Máximo dos frases (requisito de la autora). */
export function mensajeResultados(perfil) {
  const [a, b, c] = perfil.codigo;
  if (perfil.pocoDiferenciado) return 'Tus intereses son parecidos. Puedes conversar con tu tutor para explorarlos mejor.';
  return `¡Descubriste tus intereses! El más fuerte es ${nombre(a)}, seguido de ${nombre(b)} y ${nombre(c)}.`;
}

/** Orientación de Ñani para interpretar los resultados (máximo dos frases, por reglas). */
export function mensajeInterpretacion(perfil) {
  if (perfil.pocoDiferenciado) {
    return 'Tus puntajes están muy cerca entre sí: todavía estás explorando, y eso está bien. Conversa con tu tutor o tutora para descubrir qué actividades te entusiasman más.';
  }
  if (perfil.empates.length) {
    return `Tu interés más fuerte es ${nombre(perfil.codigo[0])}, pero algunos intereses empataron. Míralos juntos: ninguno vale menos por el orden.`;
  }
  return `Tus respuestas muestran más interés por actividades de tipo ${nombre(perfil.codigo[0])}. Úsalo como una pista para explorar, no como una decisión.`;
}

/** Puntos fijos para leer los resultados (los muestra la página de resultados). */
export const PUNTOS_INTERPRETACION = Object.freeze([
  'Tus resultados muestran qué actividades te atraen hoy; los intereses pueden cambiar con el tiempo y la experiencia.',
  'No miden tu capacidad ni tus notas, y no dicen si te irá bien en una carrera.',
  'Las carreras son opciones para explorar en Apurímac, no una lista obligatoria ni completa.',
  'Conversa tus resultados con tu familia y con tu tutor o tutora antes de decidir.',
]);

/** Explicación muy breve de la coincidencia (tarjetas). */
export function explicacionTarjeta(coincidencias) {
  return `Coincide con tus intereses ${unir(coincidencias.map(nombre))}.`;
}

// ---------- Rediseño 0.5.0: mensajes breves de Ñani en momentos clave (nunca en cada pregunta) ----------
export const SALUDO = '¡Hola! Soy Ñani. Descubramos juntos lo que te gusta.';
export const GLOBO_FLOTANTE = '¿Tienes alguna duda?';
export const MENSAJES_HITO = Object.freeze({
  0: '¡Empecemos! Elige lo que sientas: no hay respuestas buenas ni malas.',
  15: '¡Vas a la mitad! Sigue así.',
  29: '¡Última pregunta!',
});
export const EXPLICACION_FERIA = 'Soy Ñani. Uso reglas computacionales y el modelo de intereses RIASEC para relacionar respuestas con 23 carreras de Apurímac. Es una exploración, no un diagnóstico.';

/** Una sola frase personalizada para los resultados; incluye el recordatorio de que es exploratorio. */
export function fraseResultado(perfil) {
  if (perfil.pocoDiferenciado) return 'Tus intereses están muy parejos: es un buen momento para explorar y conversar con tu tutor o tutora.';
  const [a, b, c] = perfil.codigo;
  return `Te atraen más las actividades de tipo ${nombre(a)}, ${nombre(b)} y ${nombre(c)}: tómalo como una pista para explorar, no como un diagnóstico.`;
}
