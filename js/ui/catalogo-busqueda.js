// Búsqueda en el catálogo de 23 carreras (módulo docente). Solo lectura: no modifica el catálogo.
import { CATALOGO } from '../data/catalogo.js';
import { UNIVERSIDADES } from '../data/universidades.js';
import { esPertinente } from '../core/recomendador.js';

// Marcas diacríticas combinadas (U+0300 a U+036F), construidas sin escapes para evitar errores de codificación.
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');
const normalizar = (t) => String(t ?? '').normalize('NFD').replace(DIACRITICOS, '').toLowerCase().trim();

/**
 * Filtra por texto (carrera, universidad, sede, provincia o código RIASEC), universidad, estado de sede
 * y, opcionalmente, pertinencia con el código de un perfil (mismo filtro del motor: esPertinente)
 * o una letra RIASEC presente en el código de la carrera.
 * @param {{texto?: string, universidad?: string, estadoSede?: ''|'documentada'|'por_confirmar', codigoPerfil?: string}} filtro
 * @returns {Array} filas del catálogo en su orden original (Tabla 3)
 */
export function filtrarCatalogo({ texto = '', universidad = '', estadoSede = '', codigoPerfil = '', letra = '' } = {}, catalogo = CATALOGO) {
  const q = normalizar(texto);
  return catalogo.filter((c) => {
    if (universidad && c.universidad !== universidad) return false;
    if (estadoSede && c.estadoSede !== estadoSede) return false;
    if (codigoPerfil && !esPertinente(codigoPerfil, c.codigo)) return false;
    if (letra && !c.codigo.includes(letra)) return false;
    if (!q) return true;
    const campos = [c.carrera, c.universidad, UNIVERSIDADES[c.universidad]?.nombre, c.codigo, c.sedeSegunFuente,
      ...c.sedes.flatMap((s) => [s.nombre, s.provincia])];
    return campos.some((v) => normalizar(v).includes(q));
  });
}
