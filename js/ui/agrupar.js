// Agrupa visualmente las entradas por sede de una misma carrera. Solo presentación:
// cada sede conserva su propio cálculo (afinidad, P y puntaje) del motor.

/**
 * @param {Array} verificadas  entradas ya ordenadas por el recomendador (una por sede)
 * @returns {Array<{carreraId, carrera, universidad, codigo, coincidencias, afinidad, mejor, sedes}>}
 *   en el orden de su mejor sede; `sedes` conserva el orden del recomendador.
 */
export function agruparPorCarrera(verificadas) {
  const grupos = new Map();
  for (const item of verificadas) {
    if (!grupos.has(item.carreraId)) {
      grupos.set(item.carreraId, {
        carreraId: item.carreraId,
        carrera: item.carrera,
        universidad: item.universidad,
        codigo: item.codigo,
        coincidencias: item.coincidencias,
        afinidad: item.afinidad,
        mejor: item,
        sedes: [],
      });
    }
    grupos.get(item.carreraId).sedes.push(item);
  }
  return [...grupos.values()];
}

/** Grupos que empatan en puntaje con el último destacado y quedan fuera de los destacados. */
export function empatadosFueraDeDestacados(grupos, n = 3) {
  if (grupos.length <= n) return [];
  const ref = grupos[n - 1].mejor;
  const igual = (a, b) => (a.puntaje == null || b.puntaje == null
    ? Math.abs(a.afinidad - b.afinidad) < 1e-9 && a.puntaje == null && b.puntaje == null
    : Math.abs(a.puntaje - b.puntaje) < 1e-9);
  return grupos.slice(n).filter((g) => igual(g.mejor, ref));
}
