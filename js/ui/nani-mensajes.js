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

/** Explicación muy breve de la coincidencia (tarjetas). */
export function explicacionTarjeta(coincidencias) {
  return `Coincide con tus intereses ${unir(coincidencias.map(nombre))}.`;
}
