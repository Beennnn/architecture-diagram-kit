// Decision sheet: A against A + widened fills. The other questions are settled —
// B adds nothing over A, F and G detach the name of the technology from its
// image, C's accent is kept. One variable remains, the fill of the boxes, which
// the seven-row sheet could not isolate: E differed from A in two ways at once,
// and the two rows were far apart. Here the content is rigorously identical and
// only the fill changes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, STROKE, RULE, esc, symbol, arrowHead } from './diagram.mjs';
import { contrast } from './colors.mjs';
import { FRAG, LINKS, SH, MONO, shell, usableTop, txt, LAYER_INK, CURRENT_FILL, PROPOSED_FILL } from './fragment.mjs';

const W = 1460, ACCENT = 'springboot';
const SHAPE_NAME = { service: 'service', application: 'application', store: 'store', stream: 'stream',
  actor: 'actor', device: 'device', external: 'external', boundary: 'zone', node: 'node' };

// Rendering A, with a set of fills passed as a parameter. The symbol stays above
// its label: the name of the technology never detaches from its image.
function renderNode(n, fills) {
  const featured = n.slug === ACCENT;
  const ink = LAYER_INK(n.layer);
  const sh = shell(n.shape, n.x, n.y, n.w, n.h, {
    fill: fills[n.shape] || '#FFFFFF',
    stroke: featured ? ink : (n.shape === 'external' || n.shape === 'boundary' ? RULE : STROKE),
    weight: featured ? 2.6 : n.shape === 'node' ? 2.4 : n.shape === 'boundary' ? 1.3 : 1.6,
    dashes: n.shape === 'external' ? '5 4' : n.shape === 'boundary' ? '8 6' : null,
  });
  // The zone has no symbol: that is the state of the repository, and it is not
  // the question asked here. Keeping it identical on both sides isolates the fill.
  if (n.shape === 'boundary') return sh
    + txt(n.x + 14, n.y + 24, n.name, { size: 12, bold: 700, ink: SOFT })
    + txt(n.x + 14, n.y + 39, n.inst, { size: 10, mono: true, bold: 500, ink: RULE });
  if (n.container) return sh + symbol(n.slug, n.x + 10, n.y + 8, 24)
    + txt(n.x + 40, n.y + 21, n.name, { size: 12, bold: 700 })
    + txt(n.x + 40, n.y + 36, n.inst, { size: 10, mono: true, bold: 500, ink: SOFT });
  const t = 34, yName = Math.max(n.y + n.h - 30, usableTop(n) + t + 13);
  return sh + symbol(n.slug, n.x + n.w / 2 - t / 2, usableTop(n), t)
    + txt(n.x + n.w / 2, yName, n.name, { centre: true, ink: featured ? ink : INK })
    + txt(n.x + n.w / 2, yName + 17, n.inst, { centre: true, size: 10, mono: true, bold: 500, ink: SOFT });
}

const fragment = (fills) => {
  let g = '';
  for (const [a, b, y] of LINKS) {
    const o = FRAG[a], d = FRAG[b];
    g += `<line x1="${o.x + o.w}" y1="${y}" x2="${d.x - 5}" y2="${y}" stroke="${RULE}" stroke-width="1.5" marker-end="url(#fl)"/>`;
  }
  for (const n of FRAG) if (n.container) g += renderNode(n, fills);
  for (const n of FRAG) if (!n.container) g += renderNode(n, fills);
  return g;
};

const heading = (x, y, t, s) => `<text x="${x}" y="${y}" font-size="15" font-weight="700" fill="${INK}">${esc(t)}</text>`
  + (s ? `<text x="${x}" y="${y + 18}" font-size="11.5" fill="${SOFT}">${esc(s)}</text>` : '');
const tag = (x, y, t, ink = RULE) =>
  `<text x="${x}" y="${y}" font-size="9.5" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${ink}">${esc(t)}</text>`;

// --- 1. The swatch grid: the nine shapes, both fill sets, side by side --------
const SHAPES = ['service', 'application', 'stream', 'store', 'actor', 'device', 'node', 'boundary', 'external'];
const CW = 150, SWW = 122, SWH = 58;
function swatches(x0, y0) {
  let g = '';
  SHAPES.forEach((f, i) => {
    const x = x0 + i * CW;
    g += tag(x, y0, SHAPE_NAME[f].toUpperCase());
    [[CURRENT_FILL[f], y0 + 10], [PROPOSED_FILL[f], y0 + 100]].forEach(([fill, y]) => {
      g += shell(f, x, y, SWW, SWH, {
        fill, stroke: f === 'external' || f === 'boundary' ? RULE : STROKE,
        weight: f === 'node' ? 2.4 : f === 'boundary' ? 1.3 : 1.6,
        dashes: f === 'external' ? '5 4' : f === 'boundary' ? '8 6' : null,
      });
      // White is the reference, not a defect: only a tinted fill that stays
      // stuck to white is a problem, since it claims to separate without
      // separating.
      const c = contrast(fill, '#FFFFFF');
      const mute = fill !== '#FFFFFF' && c < 1.09;
      g += `<text x="${x}" y="${y + SWH + 14}" font-size="9.5" font-family="${MONO}" fill="${SOFT}">${fill.toUpperCase()}</text>`
        + `<text x="${x}" y="${y + SWH + 26}" font-size="9.5" font-family="${MONO}" fill="${mute ? '#C0392F' : RULE}">`
        + `${fill === '#FFFFFF' ? 'reference' : c.toFixed(3) + ':1' + (mute ? ' ✕' : '')}</text>`;
    });
  });
  return g;
}

// --- assembly ---------------------------------------------------------------
const Y_SWATCH = 128, Y_A = 400, Y_E = Y_A + SH + 46, Y_BLUR = Y_E + SH + 66;
const SCALE = 0.55;
const H = Math.round(Y_BLUR + 20 + SH * SCALE + 96);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Isolated comparison of box fills, today against the proposed grey scale">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`
  + `<defs>${arrowHead()}<filter id="blur" x="-5%" y="-5%" width="110%" height="110%">`
  + `<feGaussianBlur stdDeviation="3.2"/></filter></defs>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${INK}">A or A + widened fills: the one open question</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${SOFT}">Settled: B adds nothing over A; F and G detach the name of the technology from its image; C's accent is kept, and appears on both sides below.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${SOFT}">What remains is the fill of the boxes. On the seven-row sheet, E differed from A in two ways at once and the rows were far apart: impossible to judge. Here the content is identical to the pixel.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`

  + heading(24, Y_SWATCH - 14, '1. The nine fills, isolated', 'Top row: today. Bottom row: proposed. The ratio is the contrast with white — a tinted fill that stays below 1.09:1 claims to separate without separating.')
  + swatches(28, Y_SWATCH + 34)

  + heading(24, Y_A - 26, '2. The same fragment, only the fills change')
  + tag(24, Y_A + 14, 'TODAY')
  + `<g transform="translate(300 ${Y_A})">${fragment(CURRENT_FILL)}</g>`
  + tag(24, Y_E + 14, 'PROPOSED')
  + `<g transform="translate(300 ${Y_E})">${fragment(PROPOSED_FILL)}</g>`

  + heading(24, Y_BLUR - 26, '3. The glance test', 'The same two, blurred: what is left when you can no longer read. What survives here is what shows at first glance.')
  + `<g transform="translate(40 ${Y_BLUR + 20}) scale(${SCALE})" filter="url(#blur)">${fragment(CURRENT_FILL)}</g>`
  + `<g transform="translate(${40 + 1136 * SCALE + 40} ${Y_BLUR + 20}) scale(${SCALE})" filter="url(#blur)">${fragment(PROPOSED_FILL)}</g>`
  + tag(40, Y_BLUR + 12, 'TODAY')
  + tag(40 + 1136 * SCALE + 40, Y_BLUR + 12, 'PROPOSED')

  + `<line x1="24" y1="${H - 58}" x2="${W - 24}" y2="${H - 58}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 36}" font-size="12" fill="${SOFT}">My view: today's fills separate the actor from the service by <tspan font-weight="700" fill="${INK}">1.054:1</tspan>, which is nothing at all. The question is not whether to widen them, but by how much.</text>`
  + `<text x="24" y="${H - 18}" font-size="10.5" fill="${RULE}">Nothing is applied: the views in the repository still use the fills of the top row. Sheet generated by scripts/specimen-fills.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Non-finite coordinate in the fills sheet.');
fs.writeFileSync(path.join(ROOT, 'docs/candidates-fills.svg'), svg);
console.log(`docs/candidates-fills.svg — ${W}x${H}`);
