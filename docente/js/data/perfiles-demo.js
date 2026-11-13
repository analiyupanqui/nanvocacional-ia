// Perfiles DEMO: puntajes FICTICIOS creados para demostrar el sistema.
// No corresponden a ninguna persona ni a registros de estudiantes.
// Escala 0–40 por dimensión (el artículo divide entre 40). DEMO-1 conserva I=38, R=30, C=24
// del caso de prueba P06 del plan original; los otros valores son ficticios.

export const PERFILES_DEMO = Object.freeze([
  Object.freeze({ id: 'DEMO-1', etiqueta: 'Perfil DEMO 1 (ficticio): diferenciado, investigador-realista', demo: true,
    puntajes: Object.freeze({ R: 30, I: 38, A: 8, S: 14, E: 11, C: 24 }) }),
  Object.freeze({ id: 'DEMO-2', etiqueta: 'Perfil DEMO 2 (ficticio): puntajes parecidos (D = 3)', demo: true,
    puntajes: Object.freeze({ R: 20, I: 22, A: 19, S: 21, E: 20, C: 19 }) }),
  Object.freeze({ id: 'DEMO-3', etiqueta: 'Perfil DEMO 3 (ficticio): social-artístico', demo: true,
    puntajes: Object.freeze({ R: 6, I: 12, A: 30, S: 36, E: 25, C: 15 }) }),
  Object.freeze({ id: 'DEMO-4', etiqueta: 'Perfil DEMO 4 (ficticio): emprendedor-convencional', demo: true,
    puntajes: Object.freeze({ R: 10, I: 18, A: 9, S: 22, E: 34, C: 31 }) }),
]);
