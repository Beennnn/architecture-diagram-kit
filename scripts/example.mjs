// Generates docs/example-voltis.svg: a complete architecture diagram, assembled
// with the badges this repository actually produces.
//
// It serves as a demonstration and as a test: the symbols go inside the boxes,
// the arrows carry annotations, and the shape grammar is the one in
// docs/shapes-colors-arrows.html.
import fs from 'node:fs';
import path from 'node:path';

import { ROOT, INK, SOFT, RULE, esc, symbol, box, arrowHead, ACCENT, annotation, label, legend } from './diagram.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

// ─── nodes ────────────────────────────────────────────────────────────────
// ico: absent = no badge available (that was the finding of the exercise)
const N = [
  { x: 40,   y: 150, w: 150, h: 72, t: 'Mobile app',      s: 'iOS · Android',    ico: 'mobile-app',       shape: 'actor' },
  { x: 40,   y: 310, w: 150, h: 72, t: 'Charge points',   s: '2,400 units',      ico: 'connected-device', shape: 'device' },
  { x: 40,   y: 470, w: 150, h: 72, t: 'Operations',      s: 'on call',          ico: 'team',             shape: 'actor' },
  { x: 340,  y: 150, w: 200, h: 72, t: 'Public API',      s: 'OpenAPI contract', ico: 'openapi' },
  { x: 340,  y: 310, w: 200, h: 72, t: 'Ingestion',       s: 'Spring Boot',      ico: 'springboot' },
  { x: 340,  y: 470, w: 200, h: 72, t: 'Bastion',         s: 'restricted access', ico: 'bastion', id: 'bastion-01' },
  { x: 590,  y: 310, w: 200, h: 72, t: 'Readings bus',    s: '3 partitions',     ico: 'kafka', id: 'readings.v1',    shape: 'stream', featured: true },
  { x: 820,  y: 150, w: 200, h: 72, t: 'Sessions',        s: 'Spring Boot',      ico: 'springboot' },
  { x: 590,  y: 470, w: 200, h: 72, t: 'Billing',         s: 'Spring Boot',      ico: 'springboot' },
  { x: 1090, y: 150, w: 200, h: 72, t: 'Sessions',        s: 'PostgreSQL 16',    ico: 'postgresql', id: 'voltis-sessions', shape: 'store' },
  { x: 1090, y: 470, w: 200, h: 72, t: 'PDF invoices',    s: 'object storage',   ico: 's3', id: 'voltis-invoices',         shape: 'store' },
  { x: 850,  y: 620, w: 200, h: 64, t: 'Mail relay',      s: 'external',         ico: 'smtp',             shape: 'external' },
];

// ─── zones ────────────────────────────────────────────────────────────────
const Z = [
  { x: 300,  y: 96,  w: 760, h: 486, t: 'Production cluster', ico: 'kubernetes' },
  { x: 1060, y: 96,  w: 250, h: 486, t: 'Managed data',       ico: null },
];

// ─── links ────────────────────────────────────────────────────────────────
// b = protocol annotation; l = plain text label
const L = [
  { d: 'M190,186 H332',           b: ['https', 261, 186, 'reviews its charges'] },
  { d: 'M540,186 H812',           b: ['grpc',  676, 186, 'opens a session'] },
  { d: 'M1020,186 H1082',         l: ['reads and writes the sessions', 1051, 140] },
  { d: 'M190,346 H332',           b: ['mqtt',  261, 346, 'reports its readings'] },
  { d: 'M540,346 H582',           l: ['publishes the readings', 561, 300] },
  { d: 'M790,346 H920 V230',      l: ['consumes the readings', 860, 336] },
  { d: 'M690,382 V462',           l: ['consumes the readings', 690, 428] },
  { d: 'M790,506 H1082',          l: ['drops the invoices', 936, 496] },
  { d: 'M690,542 V596 H942 V612', b: ['smtp',  816, 596, 'sends the invoices'] },
  { d: 'M190,506 H332',           b: ['ssh',   261, 506, 'administers'] },
];

const W = 1350, H = 780;

// An arrow label must not cover any box. The check is mechanical because the eye
// gets it wrong: a label biting ten pixels into a corner goes unseen at the
// scale of the diagram, and shows up plainly in print. Widths are approximated
// at 5.3 px per character in Plex Sans and 6.6 in bold — the margin of error is
// absorbed by the 6 px of guard.
const GUARD = 6;
function annotationFrame(e) {
  const [slug, cx, cy, verb] = e.b;
  const proto = BY_SLUG[slug].label;
  const w = Math.max(17 + 5 + proto.length * 6.6, verb ? verb.length * 5.3 : 0) + 10;
  const h = verb ? 36 : 22;
  return { t: `${proto}${verb ? ' / ' + verb : ''}`, x: cx - w / 2, y: cy - h / 2, w, h };
}
const labelFrame = (e) => ({ t: e.l[0], x: e.l[1] - e.l[0].length * 5.3 / 2, y: e.l[2] - 11, w: e.l[0].length * 5.3, h: 14 });

const collisions = [];
for (const e of L) {
  const c = e.b ? annotationFrame(e) : e.l ? labelFrame(e) : null;
  if (!c) continue;
  for (const n of N) {
    if (c.x < n.x + n.w + GUARD && c.x + c.w > n.x - GUARD
      && c.y < n.y + n.h + GUARD && c.y + c.h > n.y - GUARD) {
      collisions.push(`  “${c.t}” covers “${n.t}”`);
    }
  }
}
if (collisions.length) {
  throw new Error(`Arrow labels colliding with boxes:\n${collisions.join('\n')}`);
}

// The subtitle carries the technology and, when the box designates something
// that really exists — a database, a bucket, a topic, a machine —, its
// identifier. A bucket is called “voltis-invoices”, not “S3”: without it the
// diagram describes a category and not a system. The monospaced face separates
// the two registers. Inline when it fits, on its own line otherwise: a narrow
// box must not force an identifier to be shortened, and an identifier is not
// negotiable.
const fitsInline = (n, room) =>
  n.s.length * 11 * 0.48 + 3 * 11 * 0.48 + n.id.length * 11 * 0.60 <= room;

function subtitle(n, tx, y, anchor) {
  const t = (yy, txt, size, color, mono) => `<text x="${tx}" y="${yy}" text-anchor="${anchor}"`
    + ` font-size="${size}"${mono ? ` font-family="'IBM Plex Mono',monospace"` : ''} fill="${color}">${esc(txt)}</text>`;
  if (!n.id) return t(y, n.s, 11, SOFT);
  const room = n.x + n.w - tx - 10;
  if (fitsInline(n, room)) {
    return t(y, n.s, 11, SOFT)
      .replace('</text>', ` · <tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan></text>`);
  }
  const idWidth = n.id.length * 10 * 0.60;
  if (idWidth > room) {
    throw new Error(`“${n.t}”: identifier “${n.id}” of ${Math.round(idWidth)} px for ${Math.round(room)} px.`);
  }
  return t(y - 6, n.s, 11, SOFT) + t(y + 8, n.id, 10, RULE, true);
}

const nodes = N.map((n) => {
  const ft = n.featured ? ACCENT : null;
  const cy = n.y + n.h / 2;
  const drop = n.shape === 'store' ? 6 : 0;
  const tx = n.ico ? n.x + 58 : n.x + n.w / 2;
  const anchor = n.ico ? 'start' : 'middle';
  return `<g>${box({ ...n, featured: ft })}`
    + (n.ico ? symbol(n.ico, n.x + 14, cy - 17 + drop) : '')
    + `<text x="${tx}" y="${cy - 3 + drop}" text-anchor="${anchor}" font-size="14" font-weight="600" fill="${ft || INK}">${esc(n.t)}</text>`
    + subtitle(n, tx, cy + 15 + drop, anchor)
    + `</g>`;
}).join('\n    ');

const zones = Z.map((z) => `<g>`
  + box({ x: z.x, y: z.y, w: z.w, h: z.h, shape: 'boundary' })
  + (z.ico ? symbol(z.ico, z.x + 14, z.y + 12, 22) : '')
  + `<text x="${z.x + (z.ico ? 44 : 16)}" y="${z.y + 29}" font-size="12.5" font-weight="600" fill="${SOFT}">${esc(z.t)}</text></g>`).join('\n    ');

const edges = L.map((e) => `<path d="${e.d}" fill="none" stroke="${RULE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const marks = L.filter((e) => e.b)
  .map((e) => annotation(e.b[0], e.b[1], e.b[2], Z, e.b[3])).join('\n    ');
const labels = L.filter((e) => e.l).map((e) => label(e.l[0], e.l[1], e.l[2], Z)).join('\n    ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="Runtime architecture of the Voltis charging platform">
  <title>Voltis — runtime view</title>
  <defs>
    ${arrowHead()}
  </defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="46" font-size="19" font-weight="700" fill="${INK}">Voltis — electric vehicle charging</text>
  <text x="40" y="68" font-size="12.5" fill="${SOFT}">Runtime view · the readings from the charge points become monthly invoices</text>
  ${legend(40, H - 46,
    [...new Set(N.map((n) => n.shape || 'service'))].concat(Z.length ? ['boundary'] : []),
    [...new Set(N.map((n) => BY_SLUG[n.ico]).filter((e) => e && !e.officialMark)
      .map((e) => FAM[e.family]).filter(Boolean))].map((k) => [LAYERS[k].label, LAYERS[k].light]),
    N.some((n) => n.featured))}
    ${zones}
    ${edges}
    ${nodes}
    ${labels}
    ${marks}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/example-voltis.svg'), svg);
const withoutBadge = N.filter((n) => !n.ico).map((n) => n.t);
if (withoutBadge.length) console.log(`  ⚠ nodes with no badge available: ${withoutBadge.join(', ')}`);
console.log(`  docs/example-voltis.svg · ${(svg.length / 1024).toFixed(0)} kB`);
console.log(`  ${N.length - withoutBadge.length}/${N.length} nodes carry a badge`);
