// Colour helpers shared by the generators, so the contrast rule is written once.

export const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const channel = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const lum = (h) => { const [r, g, b] = hx(h).map(channel); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
export const mix = (h, towards, part) => hex(hx(h).map((v, i) => v + (hx(towards)[i] - v) * part));

// Darkens a hue until it reaches the target contrast on its own fill.
export function readableInk(color, fill, target) {
  let c = color;
  for (let i = 0; i < 40 && contrast(c, fill) < target; i++) c = mix(c, '#000000', 0.08);
  return c;
}

// The chromatic spread of a colour: the distance between its strongest and its
// weakest channel. Zero for a grey, maximal for a saturated hue.
export const chroma = (h) => { const c = hx(h); return (Math.max(...c) - Math.min(...c)) / 255; };

// The grey of the same luminance as a given colour.
function equivalentGrey(h) {
  const target = lum(h);
  let low = 0, high = 255;
  for (let i = 0; i < 20; i++) {
    const m = (low + high) / 2;
    if (lum(hex([m, m, m])) < target) low = m; else high = m;
  }
  const g = (low + high) / 2;
  return hex([g, g, g]);
}

// Equalising luminance is not enough: at equal luminance a saturated yellow
// carries ten times the chroma of a grey, and therefore shouts far louder.
// Measured across the 191 entries, the median sits at 0.047 and the 95th
// percentile at 0.137; DuckDB's yellow reached 0.698 and Vault's 0.404. The
// 0.20 ceiling touches only those six.
//
// Mixing towards a grey of the same luminance reduces chroma exactly in the
// proportion of the mix — but shifts luminance a little, the mix happening in
// sRGB. Hence the two corrections alternating until they hold together.
export const CHROMA_MAX = 0.20;

function clampChroma(h, ceiling) {
  const c = chroma(h);
  if (c <= ceiling) return h;
  return mix(h, equivalentGrey(h), 1 - ceiling / c);
}

// A fixed share of the hue would give fills of very uneven weight: at 14 %,
// BitTorrent's black drops to 0.72 of luminance while RSS's orange stays at
// 0.90. So we look for the share that brings every fill to the same luminance.
export function tintedFill(color, canvas, target, chromaCeiling = CHROMA_MAX) {
  if (lum(color) >= target) return mix(canvas, color, 0.18);
  let low = 0, high = 1;
  for (let i = 0; i < 30; i++) {
    const m = (low + high) / 2;
    if (lum(mix(canvas, color, m)) > target) low = m; else high = m;
  }
  let t = mix(canvas, color, (low + high) / 2);
  for (let i = 0; i < 8 && chroma(t) > chromaCeiling + 0.001; i++) {
    t = clampChroma(t, chromaCeiling);
    // put luminance back on target, the clamp having moved it
    let b = 0, h2 = 1;
    const towards = lum(t) > target ? '#000000' : '#FFFFFF';
    for (let j = 0; j < 24; j++) {
      const m = (b + h2) / 2;
      const l = lum(mix(t, towards, m));
      if ((towards === '#000000') === (l > target)) b = m; else h2 = m;
    }
    t = mix(t, towards, (b + h2) / 2);
  }
  return t;
}
