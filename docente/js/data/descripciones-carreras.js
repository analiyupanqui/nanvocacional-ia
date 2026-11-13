// Descripciones GENERALES y ORIENTATIVAS de las carreras del catálogo, para «Pregúntale a Ñani».
// - Redacción breve del equipo de ÑanVocacional IA, en lenguaje para 4.º y 5.º de secundaria, sobre lo que suele
//   hacerse en cada profesión. NO es información oficial de las universidades (planes de estudio, perfiles de
//   egreso o campo laboral) y está PENDIENTE DE REVISIÓN profesional.
// - Una entrada por denominación (las 17 denominaciones de la Tabla 3); cada fila del catálogo apunta a una.
// - No contiene datos institucionales: sedes, universidad y código se leen siempre del catálogo (catalogo.js).

export const NOTA_DESCRIPCIONES = 'Descripción general orientativa redactada por el equipo del prototipo; no es información oficial de la universidad y está pendiente de revisión.';

const D = (descripcion, actividades) => Object.freeze({ descripcion, actividades: Object.freeze(actividades) });

export const DESCRIPCIONES = Object.freeze({
  minas: D('Estudia cómo explorar, extraer y procesar minerales de forma segura y cuidando el ambiente.',
    ['Planificar trabajos en una mina', 'Supervisar la seguridad del personal', 'Evaluar el impacto ambiental de la extracción']),
  civil: D('Diseña y construye obras como carreteras, puentes, edificios y sistemas de agua.',
    ['Diseñar estructuras y calcular su resistencia', 'Dirigir obras de construcción', 'Supervisar proyectos de agua y saneamiento']),
  agroecologica: D('Busca mejorar la producción agrícola y la vida en el campo con prácticas sostenibles.',
    ['Asesorar a productores en cultivos sostenibles', 'Formular proyectos de desarrollo rural', 'Promover el cuidado del suelo y del agua']),
  sistemas: D('Desarrolla programas, aplicaciones y sistemas informáticos que resuelven problemas.',
    ['Programar aplicaciones y páginas web', 'Administrar redes y bases de datos', 'Analizar procesos para automatizarlos']),
  agroindustrial: D('Transforma productos del campo en alimentos y otros productos con valor agregado.',
    ['Diseñar procesos para elaborar alimentos', 'Controlar la calidad e higiene de la producción', 'Desarrollar productos con insumos de la región']),
  veterinaria: D('Cuida la salud de los animales y mejora su crianza y producción.',
    ['Diagnosticar y tratar enfermedades de animales', 'Asesorar en la crianza y alimentación del ganado', 'Vigilar la calidad de alimentos de origen animal']),
  'ciencia-politica': D('Estudia cómo funcionan el Estado, el gobierno y la participación ciudadana.',
    ['Analizar políticas públicas', 'Apoyar la gestión de gobiernos locales y regionales', 'Promover la participación y el diálogo ciudadano']),
  'educacion-inicial': D('Forma docentes para acompañar el aprendizaje de niñas y niños pequeños, en castellano y en lengua originaria.',
    ['Planificar actividades de aprendizaje con juegos', 'Acompañar el desarrollo de cada niña y niño', 'Trabajar con las familias y la comunidad']),
  administracion: D('Aprende a organizar y dirigir empresas e instituciones para que funcionen bien.',
    ['Planificar y organizar los recursos de una organización', 'Dirigir equipos de trabajo', 'Elaborar planes de negocio']),
  ambiental: D('Busca prevenir y resolver problemas ambientales y cuidar los recursos naturales.',
    ['Medir la calidad del agua, el aire y el suelo', 'Evaluar el impacto ambiental de proyectos', 'Diseñar planes de manejo de residuos']),
  'educacion-primaria': D('Forma docentes para enseñar a niñas y niños de primaria, valorando la diversidad cultural.',
    ['Planificar y dictar clases', 'Evaluar el aprendizaje de los estudiantes', 'Trabajar con las familias y la comunidad']),
  contabilidad: D('Registra, analiza e informa sobre el dinero y los recursos de empresas e instituciones.',
    ['Llevar los registros contables', 'Elaborar estados financieros', 'Asesorar en impuestos y presupuestos']),
  agronomia: D('Estudia los cultivos y el suelo para producir alimentos de forma eficiente y sostenible.',
    ['Planificar la siembra y el manejo de cultivos', 'Controlar plagas y enfermedades de las plantas', 'Asesorar a productores agrícolas']),
  derecho: D('Estudia las leyes y cómo aplicarlas para defender los derechos de las personas.',
    ['Asesorar y defender a personas o instituciones', 'Redactar documentos legales', 'Participar en procesos judiciales o de conciliación']),
  educacion: D('Forma docentes para enseñar y acompañar el aprendizaje de los estudiantes.',
    ['Planificar y dictar clases', 'Evaluar aprendizajes', 'Orientar a estudiantes y familias']),
  enfermeria: D('Cuida la salud de las personas en hospitales, centros de salud y la comunidad.',
    ['Brindar cuidados a pacientes', 'Aplicar tratamientos y vacunas', 'Educar en salud a la comunidad']),
  estomatologia: D('Cuida la salud de la boca y los dientes de las personas.',
    ['Diagnosticar y tratar problemas dentales', 'Realizar limpiezas y curaciones', 'Enseñar hábitos de higiene bucal']),
});

/** Fila del catálogo (id) → denominación de la descripción. */
export const DESCRIPCION_DE_CARRERA = Object.freeze({
  'unamba-minas': 'minas',
  'unamba-civil': 'civil',
  'utea-civil': 'civil',
  'unamba-agroecologica': 'agroecologica',
  'unamba-informatica': 'sistemas',
  'utea-sistemas': 'sistemas',
  'unamba-agroindustrial': 'agroindustrial',
  'unajma-agroindustrial': 'agroindustrial',
  'unamba-veterinaria': 'veterinaria',
  'unamba-ciencia-politica': 'ciencia-politica',
  'unamba-educacion-inicial': 'educacion-inicial',
  'unamba-administracion': 'administracion',
  'unajma-administracion-empresas': 'administracion',
  'unajma-ambiental': 'ambiental',
  'utea-ambiental': 'ambiental',
  'unajma-educacion-primaria': 'educacion-primaria',
  'unajma-contabilidad': 'contabilidad',
  'utea-contabilidad': 'contabilidad',
  'utea-agronomia': 'agronomia',
  'utea-derecho': 'derecho',
  'utea-educacion': 'educacion',
  'utea-enfermeria': 'enfermeria',
  'utea-estomatologia': 'estomatologia',
});

export const descripcionDe = (carreraId) => DESCRIPCIONES[DESCRIPCION_DE_CARRERA[carreraId]] ?? null;
