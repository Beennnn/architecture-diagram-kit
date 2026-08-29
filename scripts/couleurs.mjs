// Outils de couleur partagés par les générateurs, pour que la règle de
// contraste soit écrite une seule fois.

export const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const canal = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const lum = (h) => { const [r, g, b] = hx(h).map(canal); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
export const melange = (h, vers, part) => hex(hx(h).map((v, i) => v + (hx(vers)[i] - v) * part));

// Assombrit une teinte jusqu'à atteindre le contraste visé sur son fond.
export function encreLisible(couleur, fond, cible) {
  let c = couleur;
  for (let i = 0; i < 40 && contraste(c, fond) < cible; i++) c = melange(c, '#000000', 0.08);
  return c;
}

// L'écart chromatique d'une couleur : la distance entre son canal le plus fort
// et le plus faible. Zéro pour un gris, maximal pour une teinte saturée.
export const chroma = (h) => { const c = hx(h); return (Math.max(...c) - Math.min(...c)) / 255; };

// Le gris de même luminance qu'une couleur donnée.
function grisEquivalent(h) {
  const cible = lum(h);
  let bas = 0, haut = 255;
  for (let i = 0; i < 20; i++) {
    const m = (bas + haut) / 2;
    if (lum(hex([m, m, m])) < cible) bas = m; else haut = m;
  }
  const g = (bas + haut) / 2;
  return hex([g, g, g]);
}

// Égaliser la luminance ne suffit pas : à luminance égale, un jaune saturé porte
// dix fois plus de chroma qu'un gris et crie donc bien plus fort. Mesuré sur les
// 163 entrées, la médiane est à 0,047 et le 95e centile à 0,137 ; le jaune de
// DuckDB montait à 0,698 et celui de Vault à 0,404. Le plafond de 0,20 ne touche
// que ces six-là.
//
// Mélanger vers un gris de même luminance réduit le chroma exactement dans la
// proportion du mélange — mais déplace un peu la luminance, le mélange se faisant
// en sRGB. D'où l'alternance des deux corrections jusqu'à ce qu'elles tiennent
// ensemble.
export const CHROMA_MAX = 0.20;

function ecreterChroma(h, plafond) {
  const c = chroma(h);
  if (c <= plafond) return h;
  return melange(h, grisEquivalent(h), 1 - plafond / c);
}

// Une part de teinte fixe donnerait des fonds de poids très inégal : à 14 %, le
// noir de BitTorrent tombe à 0,72 de luminance quand l'orange de RSS reste à
// 0,90. On cherche donc la part qui amène chaque fond à la même luminance.
export function fondTeinte(couleur, canvas, cible, plafondChroma = CHROMA_MAX) {
  if (lum(couleur) >= cible) return melange(canvas, couleur, 0.18);
  let bas = 0, haut = 1;
  for (let i = 0; i < 30; i++) {
    const m = (bas + haut) / 2;
    if (lum(melange(canvas, couleur, m)) > cible) bas = m; else haut = m;
  }
  let t = melange(canvas, couleur, (bas + haut) / 2);
  for (let i = 0; i < 8 && chroma(t) > plafondChroma + 0.001; i++) {
    t = ecreterChroma(t, plafondChroma);
    // remettre la luminance sur sa cible, l'écrêtage l'ayant déplacée
    let b = 0, h2 = 1;
    const vers = lum(t) > cible ? '#000000' : '#FFFFFF';
    for (let j = 0; j < 24; j++) {
      const m = (b + h2) / 2;
      const l = lum(melange(t, vers, m));
      if ((vers === '#000000') === (l > cible)) b = m; else h2 = m;
    }
    t = melange(t, vers, (b + h2) / 2);
  }
  return t;
}
