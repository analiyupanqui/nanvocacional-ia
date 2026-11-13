// Cuestionario PROVISIONAL de intereses de ÑanVocacional IA (12-11-2026).
// - 30 preguntas ORIGINALES del equipo, 5 por dimensión RIASEC, basadas conceptualmente en Holland (1997).
// - NO es el O*NET Mini Interest Profiler ni deriva de él: no copia, traduce ni parafrasea ítems de O*NET
//   ni de ningún otro instrumento.
// - NO está validado psicométricamente (sin estudio de confiabilidad, validez ni baremos, ni en Perú
//   ni en otro lugar). Es una actividad exploratoria para la demostración de FERCYT.
// - Los identificadores de las preguntas son estables: no dependen del orden de presentación.

const congelar = (o) => {
  Object.values(o).forEach((v) => { if (v && typeof v === 'object' && !Object.isFrozen(v)) congelar(v); });
  return Object.freeze(o);
};

// Orden de presentación: seis bloques con las seis dimensiones, en orden rotado.
// Nunca hay dos preguntas seguidas de la misma dimensión.
const PREGUNTAS = [
  // Bloque 1: R I A S E C
  { id: 'nvp-r1', dimension: 'R', texto: 'Ajustar los frenos de una bicicleta.' },
  { id: 'nvp-i1', dimension: 'I', texto: 'Investigar por qué se están secando los manantiales de una comunidad.' },
  { id: 'nvp-a1', dimension: 'A', texto: 'Pintar un mural sobre la historia de tu pueblo.' },
  { id: 'nvp-s1', dimension: 'S', texto: 'Explicar un tema de clase a alguien que no lo entendió.' },
  { id: 'nvp-e1', dimension: 'E', texto: 'Dirigir la campaña de una lista para el municipio escolar.' },
  { id: 'nvp-c1', dimension: 'C', texto: 'Llevar el registro de ingresos y gastos de la tesorería del aula.' },
  // Bloque 2: S E C R I A
  { id: 'nvp-s2', dimension: 'S', texto: 'Orientar a las familias que llegan a un centro de salud.' },
  { id: 'nvp-e2', dimension: 'E', texto: 'Convencer a una empresa de que apoye una actividad del colegio.' },
  { id: 'nvp-c2', dimension: 'C', texto: 'Clasificar por temas los libros de la biblioteca del colegio.' },
  { id: 'nvp-r2', dimension: 'R', texto: 'Instalar un panel solar en el techo de una casa.' },
  { id: 'nvp-i6', dimension: 'I', texto: 'Analizar los datos de una encuesta para entender un problema del colegio.' },
  { id: 'nvp-a2', dimension: 'A', texto: 'Escribir un cuento corto inspirado en una leyenda andina.' },
  // Bloque 3: I A S E C R
  { id: 'nvp-i3', dimension: 'I', texto: 'Estudiar las propiedades de una planta medicinal de la región.' },
  { id: 'nvp-a3', dimension: 'A', texto: 'Diseñar el logotipo de un emprendimiento local.' },
  { id: 'nvp-s3', dimension: 'S', texto: 'Ayudar a resolver un conflicto entre dos estudiantes.' },
  { id: 'nvp-e3', dimension: 'E', texto: 'Planificar cómo hacer crecer un pequeño negocio familiar.' },
  { id: 'nvp-c6', dimension: 'C', texto: 'Organizar en una hoja de cálculo las inscripciones de un taller.' },
  { id: 'nvp-r3', dimension: 'R', texto: 'Cuidar las plantas pequeñas de un vivero forestal.' },
  // Bloque 4: E C R I A S
  { id: 'nvp-e4', dimension: 'E', texto: 'Representar a tu comunidad en una reunión con autoridades.' },
  { id: 'nvp-c4', dimension: 'C', texto: 'Elaborar el horario de turnos para la limpieza del aula.' },
  { id: 'nvp-r4', dimension: 'R', texto: 'Revisar el motor de una motocicleta.' },
  { id: 'nvp-i4', dimension: 'I', texto: 'Descubrir por qué falla un programa de computadora.' },
  { id: 'nvp-a4', dimension: 'A', texto: 'Filmar un video corto sobre una festividad de tu provincia.' },
  { id: 'nvp-s4', dimension: 'S', texto: 'Enseñar a usar un celular a una persona que nunca lo ha usado.' },
  // Bloque 5: A S E C R I
  { id: 'nvp-a6', dimension: 'A', texto: 'Preparar una danza para el aniversario del colegio.' },
  { id: 'nvp-s5', dimension: 'S', texto: 'Participar como voluntario o voluntaria en una campaña de ayuda después de una helada.' },
  { id: 'nvp-e5', dimension: 'E', texto: 'Coordinar a un equipo para organizar un campeonato deportivo.' },
  { id: 'nvp-c7', dimension: 'C', texto: 'Ordenar en carpetas digitales los archivos de un proyecto escolar.' },
  { id: 'nvp-r6', dimension: 'R', texto: 'Construir la maqueta de un puente que resista peso.' },
  { id: 'nvp-i5', dimension: 'I', texto: 'Investigar cómo actúa una vacuna dentro del cuerpo humano.' },
];

export const INSTRUMENTO_PROVISIONAL = congelar({
  id: 'nanvoc-intereses-provisional-30',
  nombre: 'Cuestionario exploratorio de intereses ÑanVocacional (provisional)',
  nombreCorto: 'Cuestionario exploratorio',
  version: '0.2.0',
  fecha: '2026-11-12',
  tipo: 'provisional',
  fuente: 'Redacción original del equipo de ÑanVocacional IA, basada conceptualmente en las seis dimensiones RIASEC de Holland (1997). No copia, traduce ni parafrasea ítems de O*NET ni de otro instrumento.',
  autoria: 'Equipo de ÑanVocacional IA (prototipo de demostración, FERCYT 2026)',
  estadoValidacion: Object.freeze({
    validado: false,
    resumen: 'Exploratorio, propio y no validado',
    texto: 'Cuestionario propio y exploratorio. No ha sido validado psicométricamente (sin estudios de confiabilidad, validez ni baremos) y no equivale a ningún instrumento publicado. Sus resultados sirven para conversar y explorar, no para diagnosticar ni decidir.',
  }),
  licencia: Object.freeze({
    id: 'contenido-propio',
    texto: 'Contenido original del proyecto ÑanVocacional IA, de uso en este prototipo. La licencia de distribución está por definir por la autora. No contiene material de O*NET.',
  }),
  consigna: '¿Cuánto te gustaría realizar esta actividad?',
  escala: Object.freeze({
    min: 0,
    max: 4,
    opciones: [
      { valor: 0, etiqueta: 'No me gustaría nada' },
      { valor: 1, etiqueta: 'Me gustaría poco' },
      { valor: 2, etiqueta: 'No estoy seguro/a' },
      { valor: 3, etiqueta: 'Me gustaría' },
      { valor: 4, etiqueta: 'Me gustaría mucho' },
    ],
  }),
  dimensiones: ['R', 'I', 'A', 'S', 'E', 'C'],
  preguntas: PREGUNTAS,
  // Historial de la redacción (auditoría de pertinencia del 12-11-2026). Una pregunta con otra actividad
  // recibe un ID nuevo; un cambio solo de vocabulario conserva el ID.
  cambios: [
    { version: '0.2.0', id: 'nvp-i6', reemplaza: 'nvp-i2', motivo: 'I tenía 4 de 5 actividades de ciencias naturales o salud; se añade análisis de datos.' },
    { version: '0.2.0', id: 'nvp-c6', reemplaza: 'nvp-c3', motivo: 'C era solo de oficina en papel y «sistema de códigos» era abstracto; se añade una tarea digital con hoja de cálculo.' },
    { version: '0.2.0', id: 'nvp-c7', reemplaza: 'nvp-c5', motivo: 'Facturas de una tienda era poco cercano; se añade organización digital de archivos.' },
    { version: '0.2.0', id: 'nvp-r6', reemplaza: 'nvp-r5', motivo: 'El dron para cultivos era especializado y repetía lo agropecuario; se añade construcción.' },
    { version: '0.2.0', id: 'nvp-a6', reemplaza: 'nvp-a5', motivo: 'A no tenía música ni danza, muy presentes en Apurímac.' },
    { version: '0.2.0', id: 'nvp-e2', reemplaza: 'nvp-e2', motivo: 'Vocabulario: «auspicie» → «apoye».' },
    { version: '0.2.0', id: 'nvp-r3', reemplaza: 'nvp-r3', motivo: 'Vocabulario: «plantones» → «plantas pequeñas».' },
  ],
  puntuacion: Object.freeze({
    metodo: 'suma-por-dimension',
    itemsPorDimension: 5,
    rango: [0, 20],
    indice: 'Índice descriptivo = puntuación / 20 × 100 (no es una probabilidad de éxito)',
    orden: 'De mayor a menor puntuación; los empates se ordenan R-I-A-S-E-C y se muestran (regla propia del prototipo)',
    reglaPropia: true,
  }),
});
