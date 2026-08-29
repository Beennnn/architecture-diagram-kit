// Arbitration sheet on arrow annotation. The starting observation: in the Voltis
// view, four lockups sit 24 px above their line and one — SMTP — sits on it. The
// divergence is not a choice: a lockup is about 150 px wide while the short
// arrows are 82, so laying it on the line would spill onto both boxes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, esc, symbol, badge, box, arrowHead } from './diagram.mjs';
import { readableInk } from './colors.mjs';

const W = 1240, MONO = "'IBM Plex Mono',monospace";
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));
const ink = (slug) => readableInk(LAYERS[FAM[BY_SLUG[slug].family]].light, '#FFFFFF', 4.5);
const name = (slug) => BY_SLUG[slug].label;

// The real geometry of Voltis, to scale: two short 82 px arrows between
// neighbouring boxes, and an elbowed polyline for SMTP. The vertical offset is
// applied while building the paths, never by substitution on the path string:
// “V88” is an absolute ordinate that a regex on “x,y” does not see.
const X0 = 430, BW = 100, BH = 46;
const SHORT = [
  { slug: 'ssh', x: 0, y: 54, left: 'Operations', right: 'Bastion' },
  { slug: 'mqtt', x: 310, y: 54, left: 'Charge points', right: 'Ingestion' },
];
const ELBOW = { slug: 'smtp', xd: 670, yd: 52, xm: 746, ym: 78, ya: 96 };

const mutedBox = (x, y, t) =>
  box({ x, y, w: BW, h: BH, shape: 'service' })
  + `<text x="${x + BW / 2}" y="${y + BH / 2 + 4}" text-anchor="middle" font-size="11" fill="${SOFT}">${esc(t)}</text>`;

const elbowPath = (dy) =>
  `M${ELBOW.xd},${ELBOW.yd + dy} V${ELBOW.ym + dy} H${ELBOW.xm} V${ELBOW.ya + dy}`;

const scenery = (dy) => SHORT.map((c) =>
  mutedBox(c.x, c.y + dy - BH / 2, c.left)
  + mutedBox(c.x + BW + 82, c.y + dy - BH / 2, c.right)).join('')
  + mutedBox(620, 6 + dy, 'Billing')
  + mutedBox(696, 100 + dy, 'Relay');

const lines = (dy) => SHORT.map((c) =>
  `<line x1="${c.x + BW}" y1="${c.y + dy}" x2="${c.x + BW + 77}" y2="${c.y + dy}" stroke="${RULE}" stroke-width="1.5" marker-end="url(#fl)"/>`).join('')
  + `<path d="${elbowPath(dy)}" fill="none" stroke="${RULE}" stroke-width="1.5" marker-end="url(#fl)"/>`;

// The half-way point of a polyline, and the orientation of the segment carrying
// it. textPath places its text there on its own; a symbol not being text, it has
// to be computed — which takes away textPath's last advantage.
function halfway(points) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    seg.push(l); total += l;
  }
  let rest = total / 2;
  for (let i = 0; i < seg.length; i++) {
    if (rest <= seg[i]) {
      const [ax, ay] = points[i], [bx, by] = points[i + 1], t = seg[i] ? rest / seg[i] : 0;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, vertical: ax === bx };
    }
    rest -= seg[i];
  }
  const d = points[points.length - 1];
  return { x: d[0], y: d[1], vertical: false };
}
const shortPoints = (c, dy) => [[c.x + BW, c.y + dy], [c.x + BW + 77, c.y + dy]];
const elbowPoints = (dy) => [[ELBOW.xd, ELBOW.yd + dy], [ELBOW.xd, ELBOW.ym + dy],
  [ELBOW.xm, ELBOW.ym + dy], [ELBOW.xm, ELBOW.ya + dy]];

const shortMiddle = (c) => c.x + BW + 41;
const elbowMiddle = () => [(ELBOW.xd + ELBOW.xm) / 2, ELBOW.ym];

// --- the four ways of annotating -----------------------------------------
// A — what exists: a tinted lockup, 24 px above the line.
const A = (dy) => SHORT.map((c) => badge(c.slug, shortMiddle(c), c.y + dy - 26)).join('')
  + badge(ELBOW.slug, elbowMiddle()[0], elbowMiddle()[1] + dy - 26);

// B — no pill: symbol and name in layer ink, laid ON the line, which breaks
//     behind them. This is the convention of draw.io and of AWS.
function onTheLine(slug, cx, cy) {
  const t = 17, text = name(slug);
  const width = t + 5 + text.length * 6.6;
  const x = cx - width / 2;
  return `<rect x="${x - 5}" y="${cy - 11}" width="${width + 10}" height="22" fill="#FFFFFF"/>`
    + symbol(slug, x, cy - t / 2, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '')
    + `<text x="${x + t + 5}" y="${cy + 4}" font-size="11.5" font-weight="600" fill="${ink(slug)}">${esc(text)}</text>`;
}
const B = (dy) => SHORT.map((c) => onTheLine(c.slug, shortMiddle(c), c.y + dy)).join('')
  + onTheLine(ELBOW.slug, elbowMiddle()[0], elbowMiddle()[1] + dy);

// C — textPath: the text follows the path. It cannot carry a symbol, and its
//     orientation depends on the segment its midpoint falls on: here the
//     horizontal, but a slightly different routing would lay it vertically.
const C = (dy) => SHORT.map((c, i) =>
  `<path id="tp${i}-${dy}" d="M${c.x + BW},${c.y + dy} H${c.x + BW + 77}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${ink(c.slug)}" dy="-5">`
  + `<textPath href="#tp${i}-${dy}" startOffset="50%" text-anchor="middle">${esc(name(c.slug))}</textPath></text>`).join('')
  + `<path id="tps-${dy}" d="${elbowPath(dy)}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${ink(ELBOW.slug)}" dy="-5">`
  + `<textPath href="#tps-${dy}" startOffset="50%" text-anchor="middle">${esc(name(ELBOW.slug))}</textPath></text>`;

// D — the text stays carried by the path, and the symbol comes underneath it to
//     restore the dual coding. The midpoint textPath found on its own therefore
//     has to be computed: the mechanics of the two options are no longer the same.
function symbolUnderText(slug, pt) {
  const t = 16;
  return symbol(slug, pt.x - t / 2, pt.y - t - 3, t)
    .replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '');
}
const D = (dy) => SHORT.map((c, i) =>
  `<path id="dp${i}-${dy}" d="M${c.x + BW},${c.y + dy} H${c.x + BW + 77}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${ink(c.slug)}" dy="-23">`
  + `<textPath href="#dp${i}-${dy}" startOffset="50%" text-anchor="middle">${esc(name(c.slug))}</textPath></text>`
  + symbolUnderText(c.slug, halfway(shortPoints(c, dy)))).join('')
  + `<path id="dps-${dy}" d="${elbowPath(dy)}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${ink(ELBOW.slug)}" dy="-23">`
  + `<textPath href="#dps-${dy}" startOffset="50%" text-anchor="middle">${esc(name(ELBOW.slug))}</textPath></text>`
  + symbolUnderText(ELBOW.slug, halfway(elbowPoints(dy)));

const ROWS = [
  { key: 'A', title: 'Lockup above the line', sub: 'what exists', render: A, verdict: ['#5B6873', '#F1F3F4', 'EXISTING'],
    notes: ['The lockup is 150 px for an 82 px arrow: it cannot',
            'be laid on the line without spilling over.',
            'Hence the 24 px offset — and the floating blob,',
            'whose pill weighs more than the arrow it annotates.'] },
  { key: 'B', title: 'Symbol and name on the line', sub: 'no pill, the line breaks', render: B, verdict: ['#0B7A6E', '#D8ECE9', 'RECOMMENDED'],
    notes: ['56 px instead of 150: it fits on the short arrow.',
            'The annotation is back on its line, so nobody has',
            'to wonder which arrow it belongs to.',
            'The convention of draw.io, of AWS and of PlantUML.'] },
  { key: 'C', title: 'Text carried by the path', sub: 'textPath', render: C, verdict: ['#C0392F', '#FBECEA', 'RULE OUT HERE'],
    notes: ['Technically available, and the right tool on a', 'curved path. But it cannot carry a symbol: the dual', 'coding falls, and that is exactly what this', 'repository manufactures. The text being tied to the', 'path, it tips vertical as soon as its midpoint falls', 'on a vertical segment — so its orientation depends', 'on the routing, not on a decision.'] },
  { key: 'D', title: 'Text on the path, symbol beneath', sub: 'the proposal: semantics in the text, symbol in support', render: D, verdict: ['#B36208', '#FBF0E2', 'RESTORES THE SYMBOL'],
    notes: ['Restores the dual coding C had lost, and keeps the', 'text tied to the path. But the symbol follows', 'nothing: the midpoint textPath found on its own had', 'to be computed — textPath’s advantage cancels there.', 'Above all, stacking pushes the annotation upwards,', 'into space already taken: see SMTP hit the bottom of', 'Billing, its symbol detached from the line.'] },
];

const NOTE_WIDTH = Math.floor((X0 - 48 - 16) / 4.9);
for (const r of ROWS) for (const n of r.notes) {
  if (n.length > NOTE_WIDTH) throw new Error(`Note of ${n.length} characters for ${NOTE_WIDTH}: “${n}”`);
}
const CH = 190, Y0 = 132;
let out = '';
ROWS.forEach((r, k) => {
  const y = Y0 + k * (CH + 14);
  const [vInk, vFill, vText] = r.verdict;
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`
    + `<text x="48" y="${y + 30}" font-size="18" font-weight="700" fill="${INK}">${r.key}</text>`
    + `<text x="68" y="${y + 30}" font-size="14.5" font-weight="700" fill="${INK}">${esc(r.title)}</text>`
    + `<text x="68" y="${y + 47}" font-size="11" fill="${SOFT}">${esc(r.sub)}</text>`;
  const lg = vText.length * 6.2 + 18;
  out += `<rect x="48" y="${y + 58}" width="${lg}" height="19" rx="9.5" fill="${vFill}" stroke="${vInk}" stroke-width="1.1"/>`
    + `<text x="${48 + lg / 2}" y="${y + 71.5}" text-anchor="middle" font-size="9.5" font-weight="700" font-family="${MONO}" fill="${vInk}">${vText}</text>`
    + r.notes.map((n, j) => `<text x="48" y="${y + 98 + j * 14}" font-size="10" fill="${SOFT}">${esc(n)}</text>`).join('');
  const dy = y + 34;
  out += `<g transform="translate(${X0} 0)">${scenery(dy)}${lines(dy)}${r.render(dy)}</g>`;
});

const H = Y0 + ROWS.length * (CH + 14) + 76;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Four ways of annotating an arrow with a protocol">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/><defs>${arrowHead()}</defs>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${INK}">Annotating an arrow with its protocol</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${SOFT}">The real geometry of the Voltis view: two short 82 px arrows between neighbouring boxes, and the elbowed polyline of SMTP.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${SOFT}">Four annotations used to sit 24 px above their line and only one on it. The divergence came from the width of the lockup, not from an intention.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`
  + out
  + `<line x1="24" y1="${H - 54}" x2="${W - 24}" y2="${H - 54}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 32}" font-size="12" fill="${SOFT}">Recommendation: <tspan font-weight="700" fill="${INK}">B</tspan>, where the text already dominates the symbol — 11.5 px coloured bold against 17 px monochrome. The hierarchy sought in D is obtained there, without leaving the corridor of the line.</text>`
  + `<text x="24" y="${H - 14}" font-size="10.5" fill="${RULE}">Sheet generated by scripts/specimen-arrows.mjs; row B is the rule in force since ADR 0007.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Non-finite coordinate in the arrows sheet.');
fs.writeFileSync(path.join(ROOT, 'docs/candidates-arrows.svg'), svg);
console.log(`docs/candidates-arrows.svg — ${W}x${H}`);
