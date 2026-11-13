// Paneles para el orientador o docente (futuro módulo docente).
// Se retiraron de la página del estudiante el 11-11-2026 por decisión de la autora, y se
// conservan aquí para consulta técnica y trazabilidad. NO se importan en la vista del estudiante.
// Contienen: descripciones RIASEC completas, carreras con sede por confirmar, fórmulas,
// cálculo por sede, valoración de expertas y fuentes.
import { LETRAS, UMBRAL_D, fmtNum } from '../core/riasec.js';
import { MIN_LETRAS_COINCIDENTES } from '../core/recomendador.js';
import { afinidadDescriptiva } from '../core/exploracion.js';
import { TIPOS_RIASEC, NOTA_TIPOS } from '../data/tipos-riasec.js';
import { UNIVERSIDADES, FUENTE_UNIVERSIDADES } from '../data/universidades.js';
import { etiquetaReferencia } from '../data/provincias-referencia.js';
import { COLOR_LETRA } from './identidad.js';
import { esc, f3, fP } from './formato.js';

const letraChip = (l) => `<span class="letra" style="--c:${COLOR_LETRA[l]}">${l}</span>`;

/** Descripciones completas de los seis tipos RIASEC. */
export function descripcionesRiasec() {
  return `
  <ul class="descripciones">${LETRAS.map((l) => `<li>${letraChip(l)} <strong>${esc(TIPOS_RIASEC[l].nombre)}</strong>: ${esc(TIPOS_RIASEC[l].descripcion)}</li>`).join('')}</ul>
  <p class="nota nota--chica">${esc(NOTA_TIPOS)}</p>`;
}

/** Carreras pertinentes con sede por confirmar (nunca se presentan como confirmadas). */
export function listaPorConfirmar(r) {
  if (!r.porConfirmar.length) return '<p>No hay carreras relacionadas con sede por confirmar.</p>';
  return `
  <p class="nota nota--chica">La fuente no precisa la sede: no reciben cercanía (P) ni puntaje combinado y se ordenan solo por afinidad.</p>
  <ul class="filas">${r.porConfirmar.map((x) => `
    <li class="fila fila--confirmar"><div class="fila__texto">
      <h3 class="carrera__titulo">${esc(x.carrera)}</h3>
      <p class="carrera__uni">${esc(x.universidad)} · ${esc(UNIVERSIDADES[x.universidad]?.gestion ?? '')} · <span class="etiqueta etiqueta--alerta">Sede por confirmar</span> · afinidad ${f3(x.afinidad)}</p>
    </div></li>`).join('')}</ul>`;
}

/** Panel técnico: perfil, reglas, cálculo por sede, valoración de expertas y fuentes. */
export function panelTecnico(perfil, r, provincia) {
  const filas = r.verificadas.map((x) => `
    <tr><td>${esc(x.carrera)}</td><td>${esc(x.universidad)}</td><td>${esc(x.sede.nombre)}</td><td>${esc(x.coincidencias.join("") || "—")}</td><td>${f3(afinidadDescriptiva(perfil.puntajes, x.codigo))}</td><td>${f3(x.afinidad)}</td><td>${fP(x.proximidad)}</td><td>${f3(x.puntaje)}</td></tr>`).join('');
  const filasPC = r.porConfirmar.map((x) => `
    <tr><td>${esc(x.carrera)}</td><td>${esc(x.universidad)}</td><td>Por confirmar</td><td>${esc(x.coincidencias.join("") || "—")}</td><td>${f3(afinidadDescriptiva(perfil.puntajes, x.codigo))}</td><td>${f3(x.afinidad)}</td><td>—</td><td>—</td></tr>`).join('');
  const claves = new Map();
  [...r.verificadas, ...r.porConfirmar].forEach((x) => x.fuentes.forEach((f) => claves.set(f.clave, f)));
  const fuentes = [...claves.values()].map((f) => `<li>${esc(f.cita)}${f.url ? ` <a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">Abrir (requiere internet)</a>` : ''} · Fecha de verificación: <span class="pendiente">${f.fechaVerificacion ? esc(f.fechaVerificacion) : 'Por registrar'}</span></li>`).join('');
  const valoradas = new Map();
  [...r.verificadas, ...r.porConfirmar].forEach((x) => x.valoracionExpertas && valoradas.set(x.valoracionExpertas.denominacion, x.valoracionExpertas.v));

  const max = perfil.escalaMax ?? 40;
  return `
  <h3>Perfil</h3>
  <p>Puntajes (0–${max}): ${LETRAS.map((l) => `${l} = ${fP(perfil.puntajes[l])}`).join(' · ')}. Código: ${perfil.codigo}. Diferenciación D = ${fP(perfil.D)}; si D &lt; ${fmtNum(perfil.umbralD ?? UMBRAL_D)} se sugiere conversar con el tutor (regla precautoria, no validada).</p>
  ${perfil.empates.map((e) => `<p class="nota nota--chica">${esc(e.mensaje)}</p>`).join('')}
  <p class="nota nota--chica">Porcentaje = puntaje / ${max} × 100. La escala 0–40 es la del artículo (Ai divide entre 40): la usan los perfiles DEMO y la entrada manual. El cuestionario provisional del estudiante (30 preguntas propias, no validadas) da 0–20 por dimensión; en ese caso r = puntaje / 20 y el umbral D se ajusta en proporción (D &lt; 3), regla provisional del prototipo.</p>
  <h3>Cómo se eligen y ordenan las carreras</h3>
  <p>Referencia geográfica: ${esc(etiquetaReferencia(provincia))}. Lambrama pertenece a la provincia de Abancay; por eso, de forma predeterminada, las sedes de Abancay reciben P = 1. P es una categoría por provincia, no una distancia ni un tiempo de viaje.</p>
  <p>Se calculan las 23 carreras: el filtro de ${MIN_LETRAS_COINCIDENTES} letras en común dejó de aplicarse el 12-11-2026 (decisión de la autora). Afinidad Ai = (3·r1 + 2·r2 + r3) / 6, con r = puntaje / ${max} en el orden del código de la carrera. Puntaje combinado = 0,80 × Ai + 0,20 × P, con P = 1 (misma provincia), 0,5 (otra provincia de Apurímac) o 0,3 (otra región). Sin provincia elegida, el orden es solo por afinidad. Las sedes por confirmar no reciben P ni puntaje.</p>
  <p class="nota nota--chica"><strong>Diferencia de presentación:</strong> este módulo conserva el orden del artículo (puntaje combinado). La página del estudiante ordena por <em>afinidad descriptiva</em> (r): correlación de Pearson entre las seis puntuaciones y el perfil del código de la carrera (3, 2 y 1 en sus letras; 0 en las demás), sin usar la cercanía. Es una heurística propia del prototipo, no validada y no es una probabilidad.</p>
  <div class="tabla-desplazable"><table class="ficha ficha--calculos">
    <caption class="sr-only">Cálculo por sede</caption>
    <thead><tr><th>Carrera</th><th>Univ.</th><th>Sede</th><th>Letras en común</th><th>r (6 puntajes)</th><th>Ai</th><th>P</th><th>Puntaje</th></tr></thead>
    <tbody>${filas}${filasPC}</tbody>
  </table></div>
  <p class="nota nota--chica">${esc(r.aviso)}</p>
  <h3>Catálogo y fuentes</h3>
  <p>Catálogo propuesto de 23 carreras (Tabla 3 del artículo final). Los códigos RIASEC son asignaciones de diseño de los autores, no clasificaciones oficiales de las universidades. ${esc(FUENTE_UNIVERSIDADES)} Duración, campo laboral, costos, licenciamiento y ranking no están documentados en las fuentes del catálogo y no se muestran. ${esc(r.otrasRegiones.mensaje)}</p>
  ${valoradas.size ? `<p>Denominaciones valoradas preliminarmente por dos expertas (V de Aiken): ${[...valoradas].map(([d, v]) => `${esc(d)} (${fmtNum(v, 2)})`).join('; ')}. Es un juicio sobre la denominación agrupada, no una validación.</p>` : ''}
  <ul class="fuentes">${fuentes}</ul>`;
}
