// SIN USO desde el rediseño de página única (11-11-2026): el resultado usa barras HTML en vistas.js.
// Se conserva por la regla del proyecto de no borrar archivos; no se carga en la aplicación.
// Gráficos SVG de las seis dimensiones (0–40), sin librerías.
import { LETRAS, PUNTAJE_MAX } from '../core/riasec.js';
import { TIPOS_RIASEC } from '../data/tipos-riasec.js';
import { COLOR_LETRA } from './identidad.js';
import { esc, fP } from './formato.js';

const tablaAccesible = (perfil) => `
  <table class="sr-only">
    <caption>Puntajes RIASEC (0 a 40)</caption>
    <tbody>${LETRAS.map((l) => `<tr><th scope="row">${esc(TIPOS_RIASEC[l].nombre)}</th><td>${fP(perfil.puntajes[l])}</td></tr>`).join('')}</tbody>
  </table>`;
const resumen = (perfil) => LETRAS.map((l) => `${TIPOS_RIASEC[l].nombre} ${fP(perfil.puntajes[l])}`).join(', ');

/** Columnas compactas: las tres letras del código a color, las demás atenuadas. */
export function graficoCompacto(perfil) {
  const ancho = 360, alto = 170, base = 140, maxH = 112, col = 36, sep = (ancho - 6 * col) / 7;
  const top3 = new Set(perfil.codigo);
  const columnas = LETRAS.map((l, i) => {
    const v = perfil.puntajes[l];
    const h = Math.max((v / PUNTAJE_MAX) * maxH, 3);
    const x = sep + i * (col + sep);
    const color = top3.has(l) ? COLOR_LETRA[l] : '#c9d3d1';
    return `
    <rect x="${x}" y="${base - maxH}" width="${col}" height="${maxH}" rx="8" fill="#f1ece0"/>
    <rect x="${x}" y="${base - h}" width="${col}" height="${h}" rx="8" fill="${color}"/>
    <text x="${x + col / 2}" y="${base - h - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#1f2a2c">${fP(v)}</text>
    <text x="${x + col / 2}" y="${base + 20}" text-anchor="middle" font-size="15" font-weight="${top3.has(l) ? 800 : 600}" fill="${top3.has(l) ? COLOR_LETRA[l] : '#56656a'}">${l}</text>`;
  }).join('');
  return `<svg class="grafico grafico--compacto" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Puntajes de 0 a 40: ${esc(resumen(perfil))}">${columnas}</svg>${tablaAccesible(perfil)}`;
}

/** Barras horizontales con nombre completo (perfil completo). */
export function graficoPerfil(perfil) {
  const fila = 44, arriba = 28, izq = 170, ancho = 400, der = 52;
  const alto = arriba + LETRAS.length * fila + 6;
  const escala = (v) => (v / PUNTAJE_MAX) * ancho;
  const top3 = new Set(perfil.codigo);
  const guias = [0, 10, 20, 30, 40].map((v) => `
    <line x1="${izq + escala(v)}" y1="${arriba - 6}" x2="${izq + escala(v)}" y2="${alto - 4}" stroke="#e4dccb"/>
    <text x="${izq + escala(v)}" y="${arriba - 11}" text-anchor="middle" font-size="12" fill="#56656a">${v}</text>`).join('');
  const barras = LETRAS.map((l, i) => {
    const y = arriba + i * fila;
    const v = perfil.puntajes[l];
    const w = Math.max(escala(v), 2);
    return `
    <text x="${izq - 12}" y="${y + 26}" text-anchor="end" font-size="15" font-weight="${top3.has(l) ? 750 : 500}" fill="#1f2a2c">${l} · ${esc(TIPOS_RIASEC[l].nombre)}</text>
    <rect x="${izq}" y="${y + 8}" width="${w}" height="26" rx="6" fill="${top3.has(l) ? COLOR_LETRA[l] : '#b7c4c2'}"/>
    <text x="${izq + w + 8}" y="${y + 27}" font-size="15" font-weight="700" fill="#1f2a2c">${fP(v)}</text>`;
  }).join('');
  return `<svg class="grafico" viewBox="0 0 ${izq + ancho + der} ${alto}" role="img" aria-label="Puntajes de 0 a 40: ${esc(resumen(perfil))}">${guias}${barras}</svg>${tablaAccesible(perfil)}`;
}
