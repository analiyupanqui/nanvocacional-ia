// Catálogo regional transcrito fielmente de la Tabla 3 del artículo final.
// - 23 filas: UNAMBA 9, UNAJMA 5, UTEA 9.
// - «Por confirmar» = sede no documentada: sedes vacías, sin proximidad ni puntaje combinado.
// - Los códigos RIASEC son asignaciones de diseño de los autores, NO clasificaciones oficiales
//   de las universidades.
// - `provincia` de cada sede documentada: referencia aprobada por la autora el 11-11-2026
//   (Abancay→Abancay; Haquira y Tambobamba→Cotabambas; Vilcabamba de Apurímac→Grau;
//   Andahuaylas→Andahuaylas). Se usa solo para P; no verifica sedes pendientes.
// - valoracionExpertas: denominación agrupada (apartado 5.5) y V de Aiken (Tabla 4). El juicio
//   fue sobre la denominación, no sobre cada fila; no es validación.
// - duracion y campoLaboral: no figuran en la Tabla 3 → null («Por documentar»).

const AP = 'Apurímac';
const sede = (nombre, provincia) => ({ nombre, provincia, region: AP });

const ABANCAY = sede('Abancay', 'Abancay');
const ANDAHUAYLAS = sede('Andahuaylas', 'Andahuaylas');
const HAQUIRA = sede('Haquira', 'Cotabambas');
const TAMBOBAMBA = sede('Tambobamba', 'Cotabambas');
const VILCABAMBA = sede('Vilcabamba', 'Grau');

const val = (denominacion, v) => ({ denominacion, v });

const FILAS = [
  // UNAMBA
  { id: 'unamba-minas', universidad: 'UNAMBA', carrera: 'Ingeniería de Minas', sedeSegunFuente: 'Abancay y Haquira', sedes: [ABANCAY, HAQUIRA], codigo: 'RIC', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Minas', 1.0) },
  { id: 'unamba-civil', universidad: 'UNAMBA', carrera: 'Ingeniería Civil', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'RIC', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Civil', 1.0) },
  { id: 'unamba-agroecologica', universidad: 'UNAMBA', carrera: 'Ingeniería Agroecológica y Desarrollo Rural', sedeSegunFuente: 'Vilcabamba', sedes: [VILCABAMBA], codigo: 'RIS', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Agroecológica y Desarrollo Rural', 1.0) },
  { id: 'unamba-informatica', universidad: 'UNAMBA', carrera: 'Ingeniería Informática y Sistemas', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'ICR', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Informática y Sistemas / Sistemas e Informática', 0.83) },
  { id: 'unamba-agroindustrial', universidad: 'UNAMBA', carrera: 'Ingeniería Agroindustrial', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'RIC', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Agroindustrial', 1.0) },
  { id: 'unamba-veterinaria', universidad: 'UNAMBA', carrera: 'Medicina Veterinaria y Zootecnia', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'IRS', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Veterinaria y Zootecnia', 0.83) },
  { id: 'unamba-ciencia-politica', universidad: 'UNAMBA', carrera: 'Ciencia Política y Gobernabilidad', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'ESI', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Ciencia Política y Gobernabilidad', 1.0) },
  { id: 'unamba-educacion-inicial', universidad: 'UNAMBA', carrera: 'Educación Inicial Intercultural Bilingüe', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'SAE', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Educación Inicial Intercultural Bilingüe', 1.0) },
  { id: 'unamba-administracion', universidad: 'UNAMBA', carrera: 'Administración', sedeSegunFuente: 'Abancay y Tambobamba', sedes: [ABANCAY, TAMBOBAMBA], codigo: 'ECS', fuentes: ['UNAMBA2026'], valoracionExpertas: val('Administración / Administración de Empresas', 1.0) },
  // UNAJMA (sedes por confirmar hasta verificar la oferta por programa)
  { id: 'unajma-ambiental', universidad: 'UNAJMA', carrera: 'Ingeniería Ambiental', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'IRC', fuentes: ['UNAJMA2025a', 'UNAJMA2025b'], valoracionExpertas: val('Ambiental / Ambiental y Recursos Naturales', 1.0) },
  { id: 'unajma-agroindustrial', universidad: 'UNAJMA', carrera: 'Ingeniería Agroindustrial', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'RIC', fuentes: ['UNAJMA2025a', 'UNAJMA2025b'], valoracionExpertas: val('Agroindustrial', 1.0) },
  { id: 'unajma-educacion-primaria', universidad: 'UNAJMA', carrera: 'Educación Primaria Intercultural', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'SAE', fuentes: ['UNAJMA2025a', 'UNAJMA2025b'], valoracionExpertas: val('Educación Primaria Intercultural', 1.0) },
  { id: 'unajma-administracion-empresas', universidad: 'UNAJMA', carrera: 'Administración de Empresas', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'ECS', fuentes: ['UNAJMA2025a', 'UNAJMA2025b'], valoracionExpertas: val('Administración / Administración de Empresas', 1.0) },
  { id: 'unajma-contabilidad', universidad: 'UNAJMA', carrera: 'Contabilidad', sedeSegunFuente: 'Por confirmar', sedes: [], codigo: 'CEI', fuentes: ['UNAJMA2025a', 'UNAJMA2025b'], valoracionExpertas: val('Contabilidad', 1.0) },
  // UTEA
  { id: 'utea-agronomia', universidad: 'UTEA', carrera: 'Agronomía', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'RIC', fuentes: ['UTEA2025'], valoracionExpertas: val('Agronomía', 0.83) },
  { id: 'utea-civil', universidad: 'UTEA', carrera: 'Ingeniería Civil', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'RIC', fuentes: ['UTEA2025'], valoracionExpertas: val('Civil', 1.0) },
  { id: 'utea-contabilidad', universidad: 'UTEA', carrera: 'Contabilidad', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'CEI', fuentes: ['UTEA2025'], valoracionExpertas: val('Contabilidad', 1.0) },
  { id: 'utea-derecho', universidad: 'UTEA', carrera: 'Derecho', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'EIS', fuentes: ['UTEA2025'], valoracionExpertas: val('Derecho', 1.0) },
  { id: 'utea-educacion', universidad: 'UTEA', carrera: 'Educación', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'SAE', fuentes: ['UTEA2025'], valoracionExpertas: val('Educación', 0.67) },
  { id: 'utea-enfermeria', universidad: 'UTEA', carrera: 'Enfermería', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'SIC', fuentes: ['UTEA2025'], valoracionExpertas: val('Enfermería', 1.0) },
  { id: 'utea-ambiental', universidad: 'UTEA', carrera: 'Ingeniería Ambiental y Recursos Naturales', sedeSegunFuente: 'Abancay y Andahuaylas', sedes: [ABANCAY, ANDAHUAYLAS], codigo: 'IRC', fuentes: ['UTEA2025'], valoracionExpertas: val('Ambiental / Ambiental y Recursos Naturales', 1.0) },
  { id: 'utea-estomatologia', universidad: 'UTEA', carrera: 'Estomatología', sedeSegunFuente: 'Abancay', sedes: [ABANCAY], codigo: 'ISR', fuentes: ['UTEA2025'], valoracionExpertas: val('Estomatología', 1.0) },
  { id: 'utea-sistemas', universidad: 'UTEA', carrera: 'Ingeniería de Sistemas e Informática', sedeSegunFuente: 'Abancay', sedes: [ABANCAY], codigo: 'ICR', fuentes: ['UTEA2025'], valoracionExpertas: val('Informática y Sistemas / Sistemas e Informática', 0.83) },
];

function congelar(o) {
  Object.values(o).forEach((v) => { if (v && typeof v === 'object' && !Object.isFrozen(v)) congelar(v); });
  return Object.freeze(o);
}

export const CATALOGO = congelar(FILAS.map((f) => ({
  ...f,
  sedes: f.sedes.map((s) => ({ ...s })),
  estadoSede: f.sedes.length > 0 ? 'documentada' : 'por_confirmar',
  region: AP,
  duracion: null,
  campoLaboral: null,
})));

export const META_CATALOGO = Object.freeze({
  origen: 'Tabla 3 del artículo final',
  filas: 23,
  nota: 'Catálogo propuesto; cobertura y vigencia requieren verificación antes de cualquier uso operativo.',
});
