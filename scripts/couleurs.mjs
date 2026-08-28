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

// Une part de teinte fixe donnerait des fonds de poids très inégal : à 14 %, le
// noir de BitTorrent tombe à 0,72 de luminance quand l'orange de RSS reste à
// 0,90. On cherche donc la part qui amène chaque fond à la même luminance.
export function fondTeinte(couleur, canvas, cible) {
  if (lum(couleur) >= cible) return melange(canvas, couleur, 0.18);
  let bas = 0, haut = 1;
  for (let i = 0; i < 30; i++) {
    const m = (bas + haut) / 2;
    if (lum(melange(canvas, couleur, m)) > cible) bas = m; else haut = m;
  }
  return melange(canvas, couleur, (bas + haut) / 2);
}
