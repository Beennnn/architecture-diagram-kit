// Generates docs/example-domains.svg: an experience layer over four domain
// subsystems, two of which are systems of record.
//
// The point this view makes, which none of the other eight makes: a subsystem
// is a PERIMETER, not a box. Reference and Custody each hold their own data and
// expose their own service; drawing either as a single rectangle would hide the
// half that matters — you could no longer say whether the experience layer talks
// to a service or reaches into a database. So each subsystem is a zone, and the
// two boxes inside it are the service and the store.
//
// A consequence of ADR 0003 that this view exercises: no arrow ever lands on a
// zone. The experience layer calls Reference's API, never “Reference”.
//
// Every box carries the third C4 field, a description. That is affordable here
// — eleven boxes, not seventeen — and it is what makes the diagram readable by
// someone who does not already know the system.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, esc, symbol, box, ACCENT, annotation, label, arrowHead, legend } from './diagram.mjs';
import { record } from './view-spec.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const W = 1520, H = 940;

// ─── zones ────────────────────────────────────────────────────────────────
// The experience layer is a layer: an architectural perimeter, so no symbol.
// A subsystem that IS a system of record says so in its subtitle, because the
// shapes inside it cannot say it on their own.
const Z = [
  { x: 40, y: 234, w: 1440, h: 200, t: 'Experience layer', s: 'assembles · owns no data' },
  { x: 40, y: 520, w: 330, h: 336, t: 'Reference', s: 'system of record' },
  { x: 410, y: 520, w: 330, h: 336, t: 'Pricing', s: 'subsystem' },
  { x: 780, y: 520, w: 330, h: 336, t: 'Corporate actions', s: 'subsystem' },
  { x: 1150, y: 520, w: 330, h: 336, t: 'Custody', s: 'system of record' },
];

// ─── nodes ────────────────────────────────────────────────────────────────
const svc = (x, t, s, ico, d) => ({ x, y: 580, w: 300, h: 104, t, s, ico, d, shape: 'service' });
const sto = (x, t, s, ico, id, d) => ({ x, y: 714, w: 300, h: 116, t, s, ico, id, d, shape: 'store' });

const N = [
  { x: 340, y: 100, w: 320, h: 104, t: 'Client portal', s: 'web', ico: 'web-app', shape: 'application',
    d: 'What a client sees of what they hold.' },
  { x: 860, y: 100, w: 320, h: 104, t: 'Advisor console', s: 'internal', ico: 'admin-console', shape: 'application',
    d: 'Where an advisor acts on a client’s behalf.' },

  { x: 280, y: 280, w: 440, h: 104, t: 'Portfolio experience', s: 'Spring Boot', ico: 'application-service',
    shape: 'service', featured: true,
    d: 'Assembles one client view from the four subsystems. Keeps nothing.' },
  { x: 800, y: 280, w: 440, h: 104, t: 'Reporting experience', s: 'Spring Boot', ico: 'service', shape: 'service',
    d: 'Statements and regulatory extracts, built on request.' },

  svc(55, 'Reference API', 'REST · read mostly', 'application-service',
    'Instruments, counterparties, calendars.'),
  sto(55, 'Golden copy', 'PostgreSQL 16', 'postgresql', 'reference-master',
    'The one place a static datum is written.'),

  svc(425, 'Pricing API', 'REST', 'service',
    'Marks and valuations, intraday and at close.'),
  sto(425, 'Mark history', 'ClickHouse', 'clickhouse', 'pricing-marks',
    'Every mark ever published, kept for audit.'),

  svc(795, 'Actions API', 'REST', 'application-service',
    'Dividends, splits and mergers as announced.'),
  sto(795, 'Announcements', 'object storage', 's3', 'ca-announcements',
    'The notices as received, never rewritten.'),

  svc(1165, 'Custody API', 'gRPC · REST', 'application-service',
    'Positions and movements, per account.'),
  sto(1165, 'Position ledger', 'PostgreSQL 16', 'postgresql', 'custody-ledger',
    'The one place a holding is written.'),
];

// ─── links ────────────────────────────────────────────────────────────────
// Two trunks at two heights rather than one: the experience services would
// otherwise cross each other on the way down, and a crossing costs more
// comprehension than any other defect measured (Purchase).
//
// The arrows enter the Custody API at two different points of its top edge —
// 1265 and 1365 — so the second trunk never has to cut through the first.
const L = [
  { d: 'M500,204 V276', b: ['https', 500, 240, 'reviews the portfolio'] },
  { d: 'M1020,204 V276', b: ['https', 1020, 240, 'requests a statement'] },

  { d: 'M500,384 V468 H205 V576', l: [215, 500, 'reads the static data', 'start'] },
  { d: 'M500,384 V468 H575 V576', l: [585, 500, 'reads the marks', 'start'] },
  { d: 'M500,384 V468 H945 V576', l: [955, 500, 'reads the announcements', 'start'] },
  { d: 'M500,384 V468 H1265 V576', b: ['grpc', 1265, 496, 'reads the positions'] },

  { d: 'M1020,384 V448 H1365 V576', l: [1375, 500, 'reads the positions', 'start'] },

  { d: 'M205,684 V710', l: [222, 702, 'SQL', 'start'] },
  { d: 'M575,684 V710', l: [592, 702, 'SQL', 'start'] },
  { d: 'M945,684 V710', l: [962, 702, 'GET', 'start'] },
  { d: 'M1315,684 V710', l: [1332, 702, 'SQL', 'start'] },
];

// ─── the same guards as every other view ──────────────────────────────────
const frames = L.filter((e) => e.b).map((e) => {
  const [slug, cx, cy, verb] = e.b;
  const proto = BY_SLUG[slug].label;
  const w = Math.max(17 + 5 + proto.length * 6.6, verb ? verb.length * 5.3 : 0) + 10;
  const h = verb ? 36 : 22;
  return { t: `${proto} / ${verb}`, x: cx - w / 2, y: cy - h / 2, w, h };
}).concat(L.filter((e) => e.l).map((e) => {
  const [x, y, text, anchor] = e.l;
  const w = text.length * 5.3;
  return { t: text, x: anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x, y: y - 11, w, h: 14 };
}));
const clashes = [];
for (const c of frames) {
  for (const n of N) {
    if (c.x < n.x + n.w + 6 && c.x + c.w > n.x - 6 && c.y < n.y + n.h + 6 && c.y + c.h > n.y - 6) {
      clashes.push(`  “${c.t}” covers “${n.t}”`);
    }
  }
}
for (const n of N) {
  if (n.y + n.h + 6 > H - 58) clashes.push(`  the legend (from ${H - 58}) lands on “${n.t}”`);
}
// A zone title is written at its TOP RIGHT, so only a box that reaches both
// high enough and far enough right can cover it. Checking the height alone
// would condemn every box in a wide zone.
for (const z of Z) {
  const right = z.x + z.w - 14;
  const titleWidth = Math.max(z.t.length * 6.9, z.s ? z.s.length * 5.3 : 0);
  const bar = { x: right - titleWidth, y: z.y, w: titleWidth, h: z.s ? 46 : 30 };
  const boxes = N.map((n) => ({ t: n.t, x: n.x, y: n.y, w: n.w, h: n.h })).concat(frames);
  for (const n of boxes) {
    const overlaps = n.x < bar.x + bar.w + 6 && n.x + n.w > bar.x - 6
      && n.y < bar.y + bar.h + 6 && n.y + n.h > bar.y - 6;
    if (overlaps) clashes.push(`  “${n.t}” covers the title of “${z.t}”`);
  }
}
if (clashes.length) throw new Error(`example-domains: labels in collision:\n${clashes.join('\n')}`);

// ─── render ───────────────────────────────────────────────────────────────
const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''} font-size="${o.f || 11}"`
  + `${o.g ? ' font-weight="600"' : ''} fill="${o.c || SOFT}">${esc(s)}</text>`;

const zones = Z.map((z) => {
  const right = z.x + z.w - 14;
  return `<g>${box({ x: z.x, y: z.y, w: z.w, h: z.h, shape: 'boundary' })}`
    + T(right, z.y + 24, z.t, { a: 'end', f: 12.5, g: 1 })
    + (z.s ? T(right, z.y + 40, z.s, { a: 'end', f: 10, c: RULE }) : '') + `</g>`;
}).join('\n    ');

function wrap(text, chars) {
  const out = []; let cur = '';
  for (const w of text.split(' ')) {
    if (cur && (cur + ' ' + w).length > chars) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

const nodes = N.map((n) => {
  const ft = n.featured ? ACCENT : null;
  const lines = wrap(n.d, Math.floor((n.w - 24) / 5.2));
  // A cylinder's top ellipse reaches 27 px down: everything it carries starts
  // below that, or the title is written straight through the curve.
  const drop = n.shape === 'store' ? 16 : 0;
  if (68 + drop + lines.length * 14 + 6 > n.h) {
    throw new Error(`“${n.t}”: ${lines.length} lines of description do not fit in ${n.h} px.`);
  }
  const sub = n.s + (n.id ? ' · ' : '');
  return `<g>${box({ ...n, featured: ft })}`
    + symbol(n.ico, n.x + 12, n.y + 14 + drop, 30)
    + T(n.x + 50, n.y + 28 + drop, n.t, { f: 13.5, g: 1, c: ft || INK })
    + (n.id
      ? T(n.x + 50, n.y + 43 + drop, sub, { f: 10.5 })
        .replace('</text>', `<tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan></text>`)
      : T(n.x + 50, n.y + 43 + drop, n.s, { f: 10.5 }))
    + lines.map((l, i) => T(n.x + 12, n.y + 68 + drop + i * 14, l, { f: 10.5 })).join('')
    + `</g>`;
}).join('\n    ');

const edges = L.map((e) => `<path d="${e.d}" fill="none" stroke="${RULE}" stroke-width="1.5"`
  + ` stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const notes = L.filter((e) => e.l).map((e) => label(e.l[2], e.l[0], e.l[1], Z, e.l[3] || 'start', 10.5)).join('\n    ');
const marks = L.filter((e) => e.b).map((e) => annotation(e.b[0], e.b[1], e.b[2], Z, e.b[3])).join('\n    ');

const title = 'Asset servicing — subsystems and the experience layer';
const sub = 'A subsystem is a perimeter: Reference and Custody each hold their data and expose their service';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>${arrowHead()}</defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="44" font-size="18" font-weight="700" fill="${INK}">${esc(title)}</text>
  <text x="40" y="66" font-size="12.5" fill="${SOFT}">${esc(sub)}</text>
    ${zones}
    ${edges}
    ${nodes}
    ${notes}
    ${marks}
  ${legend(40, H - 46,
    [...new Set(N.map((n) => n.shape || 'service'))].concat(['boundary']),
    [...new Set(N.map((n) => BY_SLUG[n.ico]).filter((e) => e && !e.officialMark)
      .map((e) => FAM[e.family]).filter(Boolean))].map((k) => [LAYERS[k].label, LAYERS[k].light]),
    N.some((n) => n.featured))}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/example-domains.svg'), svg);
record({
  file: 'example-domains.svg', w: W, h: H, title, sub,
  zones: Z, nodes: N,
  links: L.map((e) => ({ d: e.d, mark: e.b || null, note: e.l || null })),
  marks: [], notes: [],
});
console.log(`  docs/example-domains.svg · ${(svg.length / 1024).toFixed(0)} kB · ${N.length} nodes · ${Z.length} zones`);
