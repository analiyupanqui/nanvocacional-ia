// Información documental de las universidades del catálogo.
// Fuente: Tabla 5 del artículo final («Información documental de contexto»): gestión.
// Nombres completos: lista de referencias del artículo.
// Régimen de costos y puesto en el ranking de Sunedu figuran en la Tabla 5 como
// «Por documentar» / «Por verificar en fuente oficial»: se dejan en null y la interfaz los OMITE.

export const UNIVERSIDADES = Object.freeze({
  UNAMBA: Object.freeze({ sigla: 'UNAMBA', nombre: 'Universidad Nacional Micaela Bastidas de Apurímac', gestion: 'Pública', costos: null, ranking: null }),
  UNAJMA: Object.freeze({ sigla: 'UNAJMA', nombre: 'Universidad Nacional José María Arguedas', gestion: 'Pública', costos: null, ranking: null }),
  UTEA: Object.freeze({ sigla: 'UTEA', nombre: 'Universidad Tecnológica de los Andes', gestion: 'Privada', costos: null, ranking: null }),
});

export const FUENTE_UNIVERSIDADES = 'Gestión según la Tabla 5 del artículo final. Costos y ranking: por documentar o verificar en fuente oficial; no se muestran.';
