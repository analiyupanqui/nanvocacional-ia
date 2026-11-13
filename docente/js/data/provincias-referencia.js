// Opciones de provincia de referencia para calcular P (proximidad).
// Las cuatro provincias con nombre son las de las sedes documentadas, aprobadas por la autora
// el 11-11-2026. No se incluye una lista completa de provincias de Apurímac hasta tener fuente.
// «Otra provincia de Apurímac» hace que toda sede documentada reciba P = 0,5 (regla del artículo).

export const OTRA_PROVINCIA = 'Otra provincia de Apurímac';

// Referencia predeterminada (decisión de la autora, 11-11-2026): el proyecto se dirige
// inicialmente a estudiantes de Lambrama, distrito de la provincia de Abancay (contexto del
// artículo). Se aplica la regla provincial existente para Abancay; no se calculan distancias.
export const REFERENCIA_PREDETERMINADA = 'Abancay';

/** Texto visible de la referencia geográfica elegida. */
export function etiquetaReferencia(valor) {
  if (valor === 'Abancay') return 'Lambrama, Abancay';
  if (valor === '' || valor == null) return 'Sin referencia geográfica';
  return valor;
}

export const OPCIONES_PROVINCIA = Object.freeze([
  Object.freeze({ valor: 'Abancay', etiqueta: 'Lambrama, Abancay' }),
  Object.freeze({ valor: 'Andahuaylas', etiqueta: 'Andahuaylas' }),
  Object.freeze({ valor: 'Cotabambas', etiqueta: 'Cotabambas' }),
  Object.freeze({ valor: 'Grau', etiqueta: 'Grau' }),
  Object.freeze({ valor: OTRA_PROVINCIA, etiqueta: 'Otra provincia de Apurímac' }),
  Object.freeze({ valor: '', etiqueta: 'Sin referencia (solo afinidad)' }),
]);
