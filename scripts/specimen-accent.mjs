// Arbitration sheet on the accent. ADR 0007 first set it as the layer ink of the
// subject, and re-reading the views showed the limit: four of our six views have
// an infrastructure subject, whose ink is an almost neutral slate — the accent is
// invisible there.
//
// Every option is judged on BOTH cases, because that is the only place they pull
// apart: a subject inside a coloured layer, and an infrastructure subject to be
// told apart from its twins — same shape, same layer.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, STROKE, RULE, esc, symbol, box, FILLS } from './diagram.mjs';
import { mix, contrast, readableInk } from './colors.mjs';

// Options 1 and 4 make the accent depend on the subject's layer. The grammar can
// no longer do that since the accent became a functional colour (ADR 0007): we
// recompute it here, these being ruled-out variants.
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));
const layerInk = (slug) => readableInk(LAYERS[FAM[BY_SLUG[slug].family]].light, '#FFFFFF', 4.5);

const W = 1330, MONO = "'IBM Plex Mono',monospace";
// A colour of emphasis outside the palette must resemble none of the six. Blue,
// purple, teal, orange, red and slate being taken, magenta is what is left. That
// is precisely the objection to it: a seventh thing to learn.
const OFF_PALETTE = '#A3196F';
const CHOSEN = '2';
const deeperFill = (shape) => mix(FILLS[shape] || '#FFFFFF', INK, 0.07);

// The four ways of accenting, at rigorously equal content and geometry.
const OPTIONS = [
  { key: '1', name: 'Layer ink', sub: 'ADR 0007 as first applied',
    accent: (n) => ({ stroke: layerInk(n.ico), weight: 2.6, ink: layerInk(n.ico) }),
    notes: ['What is in place. Designates the subject and recalls',
            'its layer in one gesture, with no extra colour.',
            'But an infrastructure subject inherits the slate:',
            'on the right, the accented node does not stand out.'] },
  { key: '2', name: 'Off-palette colour', sub: 'a magenta reserved for emphasis',
    accent: () => ({ stroke: OFF_PALETTE, weight: 3.2, ink: OFF_PALETTE }),
    notes: ['Chosen. Works everywhere, whatever the layer.', 'Price: a seventh colour, which says nothing by', 'itself — the legend has to name it.', 'The 3.2 px stroke is not decorative: under', 'dichromacy this magenta is ΔE00 1.5 from “files”.'] },
  { key: '3', name: 'Weight alone', sub: 'thicker stroke, deeper fill',
    accent: (n) => ({ stroke: INK, weight: 3, ink: INK, fill: deeperFill(n.shape) }),
    notes: ['No new colour, and it works in every layer,',
            'including on the twins on the right.',
            'But the accent loses the hue when the subject has',
            'one: on the left, the bus is no longer orange.'] },
  { key: '4', name: 'Hue and weight', sub: 'the synthesis — not proposed earlier',
    accent: (n) => ({ stroke: layerInk(n.ico), weight: 3, ink: layerInk(n.ico), fill: deeperFill(n.shape) }),
    notes: ['Keeps the hue when the subject has one, falls back',
            'on weight otherwise. Both cases pass.',
            'Cost: the accent becomes two variables, not one,',
            'so one more fill in the scale of ADR 0007.'] },
];

// --- the two test cases --------------------------------------------------
const COLOURED = [
  { t: 'Ingestion', s: 'Spring Boot', ico: 'springboot', shape: 'service' },
  { t: 'Readings bus', s: '3 partitions', ico: 'kafka', shape: 'stream', featured: true },
  { t: 'Billing', s: 'Spring Boot', ico: 'springboot', shape: 'service' },
];
const INFRA = [
  { t: 'node-1', s: 'vm-app-1', ico: 'cluster-node', shape: 'node' },
  { t: 'node-2', s: 'vm-app-2', ico: 'cluster-node', shape: 'node', featured: true },
  { t: 'node-3', s: 'vm-data-1', ico: 'cluster-node', shape: 'node' },
];
const BW = 140, GAP = 26, BH_C = 86, BH_I = 110;

function cell(list, x0, y0, opt, container) {
  let g = '';
  list.forEach((n, i) => {
    const x = x0 + i * (BW + GAP), h = container ? BH_I : BH_C;
    const a = n.featured ? opt.accent(n) : {};
    // The accented fill does not exist in the grammar: we lay it here for the
    // arbitration, without touching box().
    g += a.fill
      ? `<rect x="${x}" y="${y0}" width="${BW}" height="${h}" rx="${container ? 2 : n.shape === 'stream' ? h / 2 : 0}"`
        + ` fill="${a.fill}" stroke="${a.stroke}" stroke-width="${a.weight}"/>`
      : box({ x, y: y0, w: BW, h, shape: n.shape, featured: a.stroke });
    if (container) {
      g += symbol(n.ico, x + 9, y0 + 8, 22)
        + `<text x="${x + 37}" y="${y0 + 20}" font-size="11.5" font-weight="700" fill="${a.ink || INK}">${esc(n.t)}</text>`
        + `<text x="${x + 37}" y="${y0 + 34}" font-size="9.5" font-family="${MONO}" fill="${SOFT}">${esc(n.s)}</text>`
        + `<rect x="${x + 12}" y="${y0 + 48}" width="${BW - 24}" height="46" rx="4" fill="#FFFFFF" stroke="${STROKE}" stroke-width="1.3"/>`
        + `<text x="${x + BW / 2}" y="${y0 + 70}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${INK}">pod</text>`
        + `<text x="${x + BW / 2}" y="${y0 + 84}" text-anchor="middle" font-size="9.5" font-family="${MONO}" fill="${SOFT}">2 replicas</text>`;
    } else {
      g += symbol(n.ico, x + BW / 2 - 16, y0 + 12, 32)
        + `<text x="${x + BW / 2}" y="${y0 + 62}" text-anchor="middle" font-size="12" font-weight="600" fill="${a.ink || INK}">${esc(n.t)}</text>`
        + `<text x="${x + BW / 2}" y="${y0 + 77}" text-anchor="middle" font-size="9.5" font-family="${MONO}" fill="${SOFT}">${esc(n.s)}</text>`;
    }
  });
  return g;
}

const NOTE_WIDTH = 52;
for (const o of OPTIONS) for (const n of o.notes) {
  if (n.length > NOTE_WIDTH) throw new Error(`Note too long (${n.length}): “${n}”`);
}

const X_C = 300, X_I = 300 + 3 * BW + 2 * GAP + 56, CH = 176, Y0 = 150;
let out = '';
OPTIONS.forEach((o, k) => {
  const y = Y0 + k * (CH + 14);
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`
    + `<text x="48" y="${y + 30}" font-size="18" font-weight="700" fill="${INK}">${o.key}</text>`
    + `<text x="68" y="${y + 30}" font-size="14.5" font-weight="700" fill="${INK}">${esc(o.name)}</text>`
    + `<text x="68" y="${y + 47}" font-size="11" fill="${SOFT}">${esc(o.sub)}</text>`
    + (o.key === CHOSEN
      ? `<rect x="${W - 148}" y="${y + 16}" width="76" height="19" rx="9.5" fill="#F3E3EC" stroke="${OFF_PALETTE}" stroke-width="1.1"/>`
        + `<text x="${W - 110}" y="${y + 29.5}" text-anchor="middle" font-size="9.5" font-weight="700" font-family="${MONO}" fill="${OFF_PALETTE}">CHOSEN</text>`
      : '')
    + o.notes.map((n, j) => `<text x="48" y="${y + 74 + j * 14}" font-size="10" fill="${SOFT}">${esc(n)}</text>`).join('')
    + cell(COLOURED, X_C, y + 40, o, false)
    + cell(INFRA, X_I, y + 30, o, true);
});

const H = Y0 + OPTIONS.length * (CH + 14) + 76;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Four ways of accenting the subject of a diagram, on a coloured subject and on an infrastructure subject">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${INK}">How to accent the subject of a diagram</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${SOFT}">The accented box is the same throughout: “Readings bus” on the left, “node-2” on the right. Only the manner of accenting changes from one row to the next.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${SOFT}">The two cases are not redundant: on the right the subject has to stand out from two twins of the same shape and the same layer. That is where the options diverge.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`
  + `<text x="${X_C}" y="${Y0 - 14}" font-size="10" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${RULE}">SUBJECT IN A COLOURED LAYER</text>`
  + `<text x="${X_I}" y="${Y0 - 14}" font-size="10" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${RULE}">INFRASTRUCTURE SUBJECT, AMONG ITS TWINS</text>`
  + out
  + `<line x1="24" y1="${H - 54}" x2="${W - 24}" y2="${H - 54}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 32}" font-size="12" fill="${SOFT}">Chosen: <tspan font-weight="700" fill="${INK}">2</tspan>, for its flexibility — it does not depend on the subject's layer. The thick stroke was added after measurement: alone, the magenta merges with the teal under dichromacy.</text>`
  + `<text x="24" y="${H - 14}" font-size="10.5" fill="${RULE}">Only row 1 was in place in the repository at the time. Sheet generated by scripts/specimen-accent.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Non-finite coordinate in the accent sheet.');
fs.writeFileSync(path.join(ROOT, 'docs/candidates-accent.svg'), svg);
console.log(`docs/candidates-accent.svg — ${W}x${H}, ${OPTIONS.length} options`);
console.log(`  off-palette magenta: contrast ${contrast(OFF_PALETTE, '#FFFFFF').toFixed(2)}:1 on white`);
