// Asistente de orientación (módulo docente): interpretación, preguntas y mensajes de Ñani por etapa,
// generados con REGLAS EXPLÍCITAS. Función nueva de apoyo al tutor; no figura en el artículo.
// No es IA generativa, no es un diagnóstico psicológico y no usa servicios externos.
// Redacción del prototipo pendiente de revisión profesional (psicóloga o tutora del equipo).
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { fmtNum, UMBRAL_D } from '../core/riasec.js';
import { unirLista, porcentaje } from './formato.js';

const nombre = (l) => TIPOS_RIASEC[l].nombre;
const corto = (l) => TIPOS_RIASEC[l].corto.toLowerCase();

export const ETAPAS = Object.freeze(['Comprender el perfil', 'Preparar la conversación', 'Explorar alternativas']);

/** Banco de preguntas por interés: dos por letra (la primera es la principal). */
export const BANCO_PREGUNTAS = Object.freeze({
  R: ['¿Qué actividades prácticas disfrutas más: reparar, construir, cultivar, trabajar con animales o con máquinas?',
    '¿Te gustaría un trabajo con actividad al aire libre, en el campo o en talleres?'],
  I: ['¿Qué temas te despiertan curiosidad y te gustaría investigar más?',
    '¿Disfrutas resolver problemas de matemática o de ciencias? ¿Cuáles recuerdas?'],
  A: ['¿Qué actividades creativas realizas o te gustaría realizar: dibujo, música, escritura, diseño u otras?',
    '¿Prefieres tareas en las que puedas proponer ideas propias?'],
  S: ['¿Te gusta ayudar, enseñar o cuidar a otras personas? ¿En qué situaciones lo has hecho?',
    '¿Te imaginas trabajando con niños, pacientes o comunidades?'],
  E: ['¿Has organizado alguna actividad o dirigido un grupo? ¿Cómo te sentiste?',
    '¿Te interesaría emprender un negocio o un proyecto en tu comunidad?'],
  C: ['¿Te sientes cómodo organizando información, cuentas o registros?',
    '¿Prefieres tareas con pasos claros y ordenados?'],
});

/** Preguntas generales para completar cuando una letra del código no expresa interés (puntaje 0). */
export const PREGUNTAS_GENERALES = Object.freeze([
  '¿Qué actividades disfrutas más fuera de la escuela?',
  '¿En qué cursos o tareas sientes que el tiempo se te pasa volando?',
  '¿A qué persona de tu comunidad admiras por su trabajo, y por qué?',
]);

/** Letras que están en el código solo por el desempate R-I-A-S-E-C con puntaje 0. */
export function letrasPorDesempateTecnico(perfil) {
  return [...perfil.codigo].filter((l) => perfil.puntajes[l] === 0);
}

export function avisoDesempateTecnico(perfil) {
  const ls = letrasPorDesempateTecnico(perfil);
  if (!ls.length) return null;
  return `${unirLista(ls.map(nombre))} ${ls.length > 1 ? 'entran' : 'entra'} en el código solo por el desempate R-I-A-S-E-C con puntaje 0: es un desempate técnico, no un interés demostrado.`;
}

/** Interpretación breve y específica (solo describe letras con puntaje mayor que 0). */
export function interpretarPerfil(perfil) {
  if (perfil.pocoDiferenciado) {
    return `Los seis intereses tienen puntajes parecidos (D = ${fmtNum(perfil.D)}, menor que ${fmtNum(perfil.umbralD ?? UMBRAL_D)}). El código ${perfil.codigo} es solo orientativo: conviene explorarlo conversando, sin sacar conclusiones.`;
  }
  const reales = [...perfil.codigo].filter((l) => perfil.puntajes[l] > 0);
  const base = `${reales.length > 1 ? `Predominan los intereses ${unirLista(reales.map(nombre))}` : `Predomina el interés ${nombre(reales[0])}`}: suele atraerle ${reales.map(corto).join('; ')}.`;
  // Si hay desempate técnico, la interfaz lo muestra en un aviso aparte (no se repite aquí).
  if (letrasPorDesempateTecnico(perfil).length) return base;
  return `${base} La diferencia entre su interés más alto y el más bajo es de ${fmtNum(perfil.D)} puntos (D), por encima del umbral provisional de ${fmtNum(perfil.umbralD ?? UMBRAL_D)}.`;
}

/**
 * Selecciona de 3 a 5 preguntas con reglas explícitas, en este orden de prioridad:
 *  1. D < 6 → pregunta para explorar intereses parecidos.
 *  2. Empate con puntaje mayor que 0 que afecta al código → pregunta para distinguir las letras.
 *  3. Primera pregunta del 1.er, 2.º y 3.er interés (se omiten letras con puntaje 0).
 *  4. Segunda pregunta del 1.er interés (si su puntaje es mayor que 0).
 *  5. Preguntas generales hasta llegar a 3 como mínimo.
 * Se toman las primeras 5.
 * @returns {Array<{texto: string, regla: string}>}
 */
export function preguntasOrientativas(perfil) {
  const [a, b, c] = perfil.codigo;
  const lista = [];
  if (perfil.pocoDiferenciado) {
    lista.push({ texto: 'Tus puntajes son parecidos: ¿qué actividades de la escuela o de tu comunidad disfrutas más, y por qué?', regla: `Perfil poco diferenciado (D < ${fmtNum(perfil.umbralD ?? UMBRAL_D)})` });
  }
  const empate = perfil.empates.find((e) => e.letras.length >= 2 && e.puntaje > 0);
  if (empate) {
    const nombres = empate.letras.map(nombre);
    const opciones = `${nombres.slice(0, -1).join(', ')} o ${nombres[nombres.length - 1]}`;
    lista.push({ texto: `¿Qué describe mejor lo que te gusta hacer: ${opciones}?`, regla: `Empate entre ${unirLista(empate.letras)}` });
  }
  const conInteres = (l) => perfil.puntajes[l] > 0;
  if (conInteres(a)) lista.push({ texto: BANCO_PREGUNTAS[a][0], regla: `Interés predominante: ${nombre(a)} (1.º)` });
  if (conInteres(b)) lista.push({ texto: BANCO_PREGUNTAS[b][0], regla: `Segundo interés: ${nombre(b)}` });
  if (conInteres(c)) lista.push({ texto: BANCO_PREGUNTAS[c][0], regla: `Tercer interés: ${nombre(c)}` });
  if (conInteres(a)) lista.push({ texto: BANCO_PREGUNTAS[a][1], regla: `Interés predominante: ${nombre(a)} (1.º)` });
  for (const texto of PREGUNTAS_GENERALES) {
    if (lista.length >= 3) break;
    lista.push({ texto, regla: 'Pregunta general (hay letras con desempate técnico)' });
  }
  return lista.slice(0, 5);
}

/**
 * Mensaje breve de Ñani para cada etapa (máximo dos frases), según reglas.
 * @param {1|2|3} etapa
 * @param {object} r resultado del recomendador
 * @param {{carreras: number, otras: number, preguntas: number}} datos
 */
export function mensajeEtapa(etapa, r, { carreras = 0, otras = 0, preguntas = 0 } = {}) {
  const p = r.perfil;
  const [a, b, c] = p.codigo;
  const tecnico = letrasPorDesempateTecnico(p);
  if (etapa === 1) {
    if (p.pocoDiferenciado) return `Sus seis intereses están parejos (D = ${fmtNum(p.D)}). Tómalo como un punto de partida para conversar, no como una conclusión.`;
    const siguen = [b, c].filter((l) => !tecnico.includes(l));
    return `Su interés más fuerte es ${nombre(a)} (${porcentaje(p.puntajes[a], p.escalaMax)} %)${siguen.length ? `; le ${siguen.length > 1 ? 'siguen' : 'sigue'} ${unirLista(siguen.map(nombre))}` : ''}.` +
      (tecnico.length ? ` Ojo: ${unirLista(tecnico.map(nombre))} ${tecnico.length > 1 ? 'aparecen' : 'aparece'} solo por desempate técnico.` : '');
  }
  if (etapa === 2) {
    if (p.pocoDiferenciado) return `Te propongo ${preguntas} preguntas. Empieza por la primera: ayuda a descubrir qué disfruta más.`;
    return `Te propongo ${preguntas} preguntas. Empieza por lo que disfruta: la primera trata sobre su interés ${nombre(a)}.`;
  }
  if (r.sinCoincidenciasLocales) return 'No encontré carreras verificadas para este código en el catálogo local. Eso no significa que no existan en la región.';
  if (p.pocoDiferenciado) return 'Revisa estas opciones solo después de conversar: sus intereses son parecidos.';
  return `Estas ${carreras} carreras de Apurímac tienen el mayor puntaje combinado del artículo para ${p.codigo}.${otras > 0 ? ` En el catálogo hay ${otras} más para revisar.` : ''}`;
}
