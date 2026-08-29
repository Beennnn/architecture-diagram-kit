// Assembles the ready-to-use visuals: a pictogram (or the brand's official logo
// when the brand DESIGNATES the protocol) locked up with the entry's name.
//
// Vocabulary: the fixed “sign + name” assembly is called a lockup. We produce
// two layouts of it, plus the sign on its own.
//
//   lockups/horizontal/  sign left, name right    → annotate an arrow
//   lockups/stacked/     sign above, name below   → stand in for a node
//   lockups/mono/        horizontal, single ink   → black-and-white printing
//   symbols/             the sign alone, no name  → constrained space
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));

const FONT_FILE = path.join(ROOT, '.cache/plex/package/files/ibm-plex-sans-latin-600-normal.woff');
if (!fs.existsSync(FONT_FILE)) {
  console.error(`Font missing from the cache (${FONT_FILE}). Run ./regenerate.sh.`);
  process.exit(1);
}
const b = fs.readFileSync(FONT_FILE);
const font = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

const familyToLayer = {};
for (const [key, c] of Object.entries(layers)) for (const f of c.families) familyToLayer[f] = key;

/* ---------------------------------------------------------------- colours */
import { readableInk as _ink, tintedFill as _fill } from './colors.mjs';
import { placeMark, placeMarkCentred } from './ink-box.mjs';

const CANVAS = '#FFFFFF';
const FILL_TARGET = 0.87;            // luminance aimed at for EVERY fill
const MIN_CONTRAST = 4.5;            // ink / tinted fill — the same threshold as
                                     // the draw.io label: one contrast rule for
                                     // the whole project

const tintedFill = (c) => _fill(c, CANVAS, FILL_TARGET);
const readableInk = (c, fill) => _ink(c, fill, MIN_CONTRAST);

/* -------------------------------------------------------------- geometry */
const G = {
  horizontal: { H: 48, ICON: 30, SIZE: 20, PAD_L: 15, GAP: 10, PAD_R: 18, PAD_ALONE: 17, MAX_W: 110 },
  stacked:    { H: 84, ICON: 34, SIZE: 17, PAD_T: 12, GAP: 8, PAD_X: 14, MIN_W: 92, MAX_W: 100 },
  symbol:     { S: 48, ICON: 30, MAX_W: 36 },
};
const capHeight = (font.tables.os2 && font.tables.os2.sCapHeight) || 698;

/* --------------------------------------------------- text serialisation */
// opentype.js 1.3 serialises some curves badly: toPathData() emits “NaN”
// while path.commands is sound, and the SVG parser stops dead there — the label
// shows up truncated. So we serialise it ourselves.
const n = (v) => {
  if (!Number.isFinite(v)) throw new Error(`non-finite coordinate: ${v}`);
  return String(Math.round(v * 100) / 100);
};
const toPathData = (p) => p.commands.map((c) => {
  switch (c.type) {
    case 'M': return `M${n(c.x)} ${n(c.y)}`;
    case 'L': return `L${n(c.x)} ${n(c.y)}`;
    case 'C': return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    case 'Q': return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    case 'Z': return 'Z';
    default: throw new Error(`unknown path command: ${c.type}`);
  }
}).join('');

const word = (text, x, baseline, size, color) =>
  `<path d="${toPathData(font.getPath(text, x, baseline, size))}" fill="${color}"/>`;
const wordWidth = (text, size) => font.getAdvanceWidth(text, size);

/* ----------------------------------------------------------------- signs */
const inner = (svg) => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
const indent = (s, p) => s.split('\n').map((l) => p + l.trim()).join('\n');

// Two levels: the official logo when the brand designates the protocol, the
// generic pictogram otherwise.
function sign(r, x, y, size, ink) {
  if (r.officialMark && r.sSvg) {
    return `<svg x="${n(x)}" y="${n(y)}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${ink}">
${indent(inner(r.sSvg).replace(/<title>[\s\S]*?<\/title>/, '').trim(), '    ')}
  </svg>`;
  }
  return `<svg x="${n(x)}" y="${n(y)}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${indent(inner(r.tSvg), '    ')}
  </svg>`;
}

// Some marks have no symbol: they WRITE the name, full stop — .NET, Go, vmware.
// Setting our label beside them writes the name twice. Moody's dual coding is a
// sign AND a text, not a text and a text: the duplicate costs space and adds no
// channel of reading. For these entries the lockup IS the mark, and the word
// goes away.
//
// The mark then has to be legible. Inscribed in the square of the viewBox,
// “vmware” — a 24 × 3.8 band — writes at 4.7 px tall: we kept the word because
// the mark did not speak. So we place it by its measured INK (ink-box.mjs), at
// the cap height the word had: the name keeps exactly its optical size, and the
// pill widens accordingly.
const CAP = (size) => (capHeight / font.unitsPerEm) * size;

const markByInk = (r, x, yCentre, inkHeight, maxWidth, ink) =>
  placeMark(r.sSvg, { x, yCentre, inkHeight, maxWidth, ink });
const markCentred = (r, width, yCentre, inkHeight, maxWidth, ink) =>
  placeMarkCentred(r.sSvg, width, { yCentre, inkHeight, maxWidth, ink });

const short = (r) => r.short || r.label.split(' /')[0].split(' (')[0];

// Base colour: the brand when it designates the protocol, the layer otherwise.
function base(r) {
  if (r.color) return r.color;                                       // explicit fallback
  if (r.officialMark && r.hex) return r.hex.startsWith('#') ? r.hex : '#' + r.hex;
  const c = layers[familyToLayer[r.family]];
  if (!c) throw new Error(`No colour for “${r.slug}” (family “${r.family}”). Complete scripts/layers.json.`);
  return c.light;
}

const header = (w, h, name) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name}">
  <title>${name}</title>`;

/* ---------------------------------------------------------------- layouts */
function horizontal(r, { mono = false } = {}) {
  const { H, ICON, SIZE, PAD_L, GAP, PAD_R, PAD_ALONE, MAX_W } = G.horizontal;
  const raw = mono ? '#1F2933' : base(r);
  const fill = mono ? '#F1F3F5' : tintedFill(raw);
  const ink = mono ? '#1F2933' : readableInk(raw, fill);
  const name = short(r);
  if (r.logotype) {
    const m = markByInk(r, PAD_ALONE, H / 2, CAP(SIZE), MAX_W, ink);
    const W = Math.round(m.w + PAD_ALONE * 2);
    return `${header(W, H, name)}
  <rect width="${W}" height="${H}" rx="${H / 2}" fill="${fill}"/>
  ${m.svg}
</svg>
`;
  }
  const W = Math.round(PAD_L + ICON + GAP + wordWidth(name, SIZE) + PAD_R);
  const baseline = H / 2 + (capHeight / font.unitsPerEm) * SIZE / 2;
  return `${header(W, H, name)}
  <rect width="${W}" height="${H}" rx="${H / 2}" fill="${fill}"/>
  ${sign(r, PAD_L, (H - ICON) / 2, ICON, ink)}
  ${word(name, PAD_L + ICON + GAP, baseline, SIZE, ink)}
</svg>
`;
}

function stacked(r) {
  const { H, ICON, SIZE, PAD_T, GAP, PAD_X, MIN_W, MAX_W } = G.stacked;
  const raw = base(r);
  const fill = tintedFill(raw);
  const ink = readableInk(raw, fill);
  const name = short(r);
  if (r.logotype) {
    // Here the mark replaces the sign AND the word: it takes their band, which
    // is the sign's height, the gap, and the word's cap height.
    const band = ICON + GAP + CAP(SIZE);
    const m = markByInk(r, PAD_X, H / 2, band, MAX_W, ink);
    const W = Math.round(Math.max(MIN_W, m.w + PAD_X * 2));
    return `${header(W, H, name)}
  <rect width="${W}" height="${H}" rx="14" fill="${fill}"/>
  ${markCentred(r, W, H / 2, band, MAX_W, ink).svg}
</svg>
`;
  }
  const lw = wordWidth(name, SIZE);
  const W = Math.round(Math.max(MIN_W, lw + PAD_X * 2));
  const baseline = PAD_T + ICON + GAP + (capHeight / font.unitsPerEm) * SIZE;
  return `${header(W, H, name)}
  <rect width="${W}" height="${H}" rx="14" fill="${fill}"/>
  ${sign(r, (W - ICON) / 2, PAD_T, ICON, ink)}
  ${word(name, (W - lw) / 2, baseline, SIZE, ink)}
</svg>
`;
}

function symbol(r) {
  const { S, ICON, MAX_W } = G.symbol;
  const raw = base(r);
  const fill = tintedFill(raw);
  const ink = readableInk(raw, fill);
  // Space is constrained: the square does not widen. A logotype still gains
  // from being placed by its ink — it then uses the whole usable width instead
  // of being letterboxed inside the square of the viewBox.
  const insideIt = r.logotype
    ? markCentred(r, S, S / 2, ICON, MAX_W, ink).svg
    : sign(r, (S - ICON) / 2, (S - ICON) / 2, ICON, ink);
  return `${header(S, S, short(r))}
  <rect width="${S}" height="${S}" rx="${Math.round(S * 0.27)}" fill="${fill}"/>
  ${insideIt}
</svg>
`;
}

/* ---------------------------------------------------------------- writing */
const OUTPUTS = [
  ['lockups/horizontal', (r) => horizontal(r)],
  ['lockups/stacked',    (r) => stacked(r)],
  ['lockups/mono',       (r) => horizontal(r, { mono: true })],
  ['symbols',            (r) => symbol(r)],
];

for (const [d] of OUTPUTS) {
  const dir = path.join(ROOT, d);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

let marks = 0, widest = 0, logotypes = 0;
for (const r of rows) {
  if (r.officialMark && r.sSvg) marks++;
  if (r.logotype) logotypes++;
  for (const [d, make] of OUTPUTS) {
    const svg = make(r);
    if (/NaN|Infinity|undefined/.test(svg)) throw new Error(`invalid output: ${d}/${r.slug}.svg`);
    // A logotype must contain nothing but its mark's paths: were the word to
    // come back, the duplicate would come back with it and nothing would say so.
    if (r.logotype) {
      const expected = (r.sSvg.match(/<path/g) || []).length;
      const laid = (svg.match(/<path/g) || []).length;
      if (laid !== expected) {
        throw new Error(`${d}/${r.slug}.svg: ${laid} paths for a mark that has ${expected}`
          + ` — the name is written there again although the mark already writes it.`);
      }
    }
    fs.writeFileSync(path.join(ROOT, d, `${r.slug}.svg`), svg);
  }
  widest = Math.max(widest, +horizontal(r).match(/width="(\d+)"/)[1]);
}
const nProto = rows.filter((r) => r.type === 'protocol').length;
const nProd = rows.filter((r) => r.type === 'product').length;
console.log(`  ${nProto} protocols + ${nProd} products + ${rows.length - nProto - nProd} roles × ${OUTPUTS.length} layouts = ${rows.length * OUTPUTS.length} files`);
console.log(`  ${marks} carry a brand logo, ${rows.length - marks} a generic pictogram`);
console.log(`  ${logotypes} are logotypes: the mark writes the name, the lockup does not repeat it`);
console.log(`  widest horizontal lockup: ${widest} px`);
