// Identidad visual de ÑanVocacional IA: mascota «Ñani» e íconos RIASEC, en SVG original y local.
// Ñani: guía con forma de piedra de camino andino, birrete universitario y banda de motivo andino.

/** Color propio de cada dimensión RIASEC (contraste suficiente con texto blanco grande). */
export const COLOR_LETRA = Object.freeze({
  R: '#b9502a', I: '#2862a8', A: '#7e47a8', S: '#1f7f55', E: '#b85e0f', C: '#3f5f69',
});

/**
 * Ñani en SVG. expresion: 'saludo' (brazo arriba), 'feliz', 'pensando'.
 * Decorativo por defecto (aria-hidden); el mensaje va siempre en texto aparte.
 */
export function nani({ expresion = 'feliz', clase = '' } = {}) {
  const brazoDer = expresion === 'saludo'
    ? '<path d="M98 82 C110 72 114 60 112 50" stroke="#0a3f45" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="112" cy="48" r="7" fill="#0f5c63"/>'
    : '<path d="M100 92 C108 98 110 104 108 110" stroke="#0a3f45" stroke-width="9" fill="none" stroke-linecap="round"/>';
  const boca = expresion === 'pensando'
    ? '<circle cx="60" cy="88" r="3.5" fill="#1f2a2c"/>'
    : '<path d="M50 85 Q60 96 70 85" stroke="#1f2a2c" stroke-width="4" fill="none" stroke-linecap="round"/>';
  const pupilaY = expresion === 'pensando' ? 68 : 71;
  return `
<svg class="nani ${clase}" viewBox="0 0 124 150" aria-hidden="true" focusable="false">
  <ellipse cx="60" cy="142" rx="34" ry="6" fill="#0a3f45" opacity=".15"/>
  <ellipse cx="44" cy="134" rx="11" ry="7" fill="#0a3f45"/>
  <ellipse cx="76" cy="134" rx="11" ry="7" fill="#0a3f45"/>
  <path d="M20 92 C12 98 10 104 12 110" stroke="#0a3f45" stroke-width="9" fill="none" stroke-linecap="round"/>
  ${brazoDer}
  <path d="M60 36 C92 36 104 62 104 88 C104 116 86 132 60 132 C34 132 16 116 16 88 C16 62 28 36 60 36Z" fill="#0f5c63"/>
  <path d="M60 46 C84 48 92 66 92 88 C92 110 80 122 60 122 C40 122 28 110 28 88 C28 66 36 48 60 46Z" fill="#f8f2e4"/>
  <path d="M22 104 l8 -7 8 7 8 -7 8 7 8 -7 8 7 8 -7 8 7 8 -7 8 7" stroke="#e3b23c" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <path d="M52 122 C52 114 68 112 66 104" stroke="#e07a1f" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="2 5"/>
  <g class="nani__ojos">
  <circle cx="47" cy="70" r="9" fill="#fff"/><circle cx="73" cy="70" r="9" fill="#fff"/>
  <circle cx="48" cy="${pupilaY}" r="5" fill="#1f2a2c"/><circle cx="74" cy="${pupilaY}" r="5" fill="#1f2a2c"/>
  <circle cx="50" cy="${pupilaY - 2}" r="1.8" fill="#fff"/><circle cx="76" cy="${pupilaY - 2}" r="1.8" fill="#fff"/>
  </g>
  <circle cx="38" cy="84" r="5" fill="#e07a1f" opacity=".35"/><circle cx="82" cy="84" r="5" fill="#e07a1f" opacity=".35"/>
  ${boca}
  <path d="M38 30 v10 c0 7 44 7 44 0 v-10z" fill="#13292c"/>
  <polygon points="60,10 102,26 60,40 18,26" fill="#1f3b40"/>
  <polygon points="60,10 102,26 60,40 18,26" fill="none" stroke="#2d5258" stroke-width="1.5"/>
  <path d="M60 25 L94 31 L94 46" stroke="#e3b23c" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="25" r="3" fill="#e3b23c"/>
  <path d="M90 46 h8 l-1 9 h-6z" fill="#e3b23c"/>
</svg>`;
}

/** Burbuja de diálogo de Ñani. El texto lo generan reglas locales (nani-mensajes.js). */
export function conNani(texto, { expresion = 'feliz', grande = false } = {}) {
  return `
  <div class="guia${grande ? ' guia--grande' : ''}">
    ${nani({ expresion })}
    <p class="burbuja"><span class="sr-only">Ñani dice: </span>${texto}</p>
  </div>`;
}

const TRAZOS = {
  R: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a2 2 0 0 0 3 3l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  I: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  A: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.3 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15" cy="8" r="1.2"/>',
  S: '<path d="M12 20s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.7 12 20 12 20z"/>',
  E: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  C: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M8.5 10.5l1.5 1.5 3-3M8.5 16h7"/>',
};

export function icono(letra, clase = 'icono') {
  return `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TRAZOS[letra] ?? ''}</svg>`;
}

export const ICONO_SEDE = '<svg class="icono-chico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/></svg>';
