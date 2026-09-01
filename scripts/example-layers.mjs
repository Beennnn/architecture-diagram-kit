// Generates docs/example-layers.svg: a layered architecture, with the sizing of
// every building block. A second demonstration of the set, on a shape of diagram
// very different from the one in example.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, esc, symbol, box, arrowHead, ACCENT, annotation, legend } from './diagram.mjs';
import { record } from './view-spec.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const W = 1400, H = 1000;
const NW = 196;

// ─── bands ────────────────────────────────────────────────────────────────
const BANDS = [
  { x: 40, y: 220, w: 1160, h: 160, t: 'Presentation layer', s: 'traffic entry, TLS termination, authentication' },
  { x: 40, y: 420, w: 1160, h: 190, t: 'Microservices layer', s: 'stateless · scales horizontally' },
  { x: 40, y: 650, w: 1160, h: 200, t: 'Storage layer', s: 'stateful · backed up' },
];

// ─── nodes ────────────────────────────────────────────────────────────────
// r = resource requirement
const N = [
  { x: 300, y: 100, w: NW, h: 76, t: 'Browser',      s: 'SPA',            ico: 'workstation',  shape: 'actor' },
  { x: 520, y: 100, w: NW, h: 76, t: 'Mobile app',   s: 'iOS · Android',  ico: 'mobile-app',   shape: 'actor' },

  { x: 80,  y: 265, w: NW, h: 76, t: 'CDN',          s: 'static assets',  ico: 'cdn',          shape: 'service' },
  { x: 300, y: 265, w: NW, h: 76, t: 'Load balancer', s: 'nginx',         ico: 'nginx',        shape: 'service' },
  { x: 520, y: 265, w: NW, h: 76, t: 'API gateway',  s: 'OpenAPI contract', ico: 'api-gateway', shape: 'service' },
  { x: 740, y: 265, w: NW, h: 76, t: 'Identity',     s: 'Keycloak',       ico: 'keycloak',     shape: 'service' },

  { x: 80,  y: 470, w: NW, h: 90, t: 'Catalogue',    s: 'Spring Boot', r: '6 × 1 vCPU · 2 GiB', ico: 'springboot', shape: 'service' },
  { x: 300, y: 470, w: NW, h: 90, t: 'Basket',       s: 'Quarkus',     r: '4 × 0.5 vCPU · 1 GiB', ico: 'quarkus',  shape: 'service' },
  { x: 520, y: 470, w: NW, h: 90, t: 'Orders',       s: 'Spring Boot', r: '3 × 1 vCPU · 2 GiB', ico: 'springboot', shape: 'service', featured: true },
  { x: 740, y: 470, w: NW, h: 90, t: 'Payment',      s: 'Spring Boot', r: '2 × 0.5 vCPU · 1 GiB', ico: 'springboot', shape: 'service' },
  { x: 960, y: 470, w: NW, h: 90, t: 'Notifications', s: 'Quarkus',    r: '2 × 0.5 vCPU · 1 GiB', ico: 'quarkus',   shape: 'service' },

  { x: 80,  y: 705, w: NW, h: 96, t: 'Product index', s: 'Elasticsearch · 80 GiB', r: '2 vCPU · 8 GiB', ico: 'elasticsearch', shape: 'store' },
  { x: 300, y: 705, w: NW, h: 96, t: 'Sessions',      s: 'Redis',                  r: '2 GiB in memory',        ico: 'redis',         shape: 'store' },
  { x: 520, y: 705, w: NW, h: 96, t: 'Relational',    s: 'PostgreSQL 16 · 500 GiB', r: '4 vCPU · 16 GiB', ico: 'postgresql',   shape: 'store' },
  { x: 740, y: 705, w: NW, h: 96, t: 'Bucket',        s: 'object storage · 2 TiB', r: 'standard class', ico: 's3',            shape: 'store' },

  { x: 1230, y: 470, w: 160, h: 90, t: 'Mail relay',  s: 'external', ico: 'smtp', shape: 'external' },
];

// ─── links ────────────────────────────────────────────────────────────────
const L = [
  { d: 'M398,176 V257',                     b: ['https', 398, 216, 'browses the catalogue'] },
  { d: 'M638,176 V257',                     b: ['rest',  638, 216, 'calls the API'] },
  { d: 'M300,138 H178 V257',                l: ['assets', 236, 128] },
  { d: 'M496,303 H512',                     l: ['', 0, 0] },
  { d: 'M716,303 H732',                     l: ['token', 724, 293] },
  // a single trunk then a horizontal bus: five calls, no crossing
  // the bus runs BETWEEN the two bands: inside a band it would cross its label
  { d: 'M638,341 V398 H178 V462' },
  { d: 'M638,398 H398 V462' },
  { d: 'M638,398 V462' },
  { d: 'M638,398 H858 V462' },
  { d: 'M638,398 H1058 V462' },
  { d: 'M178,560 V697',                     l: ['indexes', 212, 630] },
  { d: 'M398,560 V697',                     l: ['reads / writes', 448, 630] },
  { d: 'M638,560 V697',                     l: ['SQL', 660, 630] },
  { d: 'M858,560 V697',                     l: ['receipts', 898, 630] },
  { d: 'M1156,515 H1222',                   b: ['smtp', 1189, 515, 'sends the notifications'] },
];

const bands = BANDS.map((z) => `<g>`
  + box({ x: z.x, y: z.y, w: z.w, h: z.h, shape: 'boundary' })
  + `<text x="${z.x + z.w - 18}" y="${z.y + 26}" text-anchor="end" font-size="13" font-weight="600" fill="${SOFT}">${esc(z.t)}</text>`
  + `<text x="${z.x + z.w - 18}" y="${z.y + 44}" text-anchor="end" font-size="11" fill="${RULE}">${esc(z.s)}</text></g>`).join('\n    ');

// The subtitle carries the technology and, when the box designates something
// that really exists — a database, a bucket, a topic, a machine —, its
// identifier. A bucket is called “voltis-invoices”, not “S3”: without it the
// diagram describes a category and not a system. The monospaced face separates
// the two registers.
const idSuffix = (n) => n.id
  ? ` · <tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan>`
  : '';

const nodes = N.map((n) => {
  const ft = n.featured ? ACCENT : null;
  const cy = n.y + n.h / 2, drop = n.shape === 'store' ? 6 : 0;
  const tx = n.x + 56, top = n.r ? cy - 12 + drop : cy - 3 + drop;
  return `<g>${box({ ...n, featured: ft })}`
    + symbol(n.ico, n.x + 13, cy - 17 + drop, 32)
    + `<text x="${tx}" y="${top}" font-size="13.5" font-weight="600" fill="${ft || INK}">${esc(n.t)}</text>`
    + `<text x="${tx}" y="${top + 17}" font-size="11" fill="${SOFT}">${esc(n.s)}${idSuffix(n)}</text>`
    + (n.r ? `<text x="${tx}" y="${top + 33}" font-size="10" font-weight="600" fill="#0B6E7F" font-family="'IBM Plex Mono',monospace">${esc(n.r)}</text>` : '')
    + `</g>`;
}).join('\n    ');

const edges = L.map((e) => `<path d="${e.d}" fill="none" stroke="${RULE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const labels = L.filter((e) => e.l && e.l[0]).map((e) => `<text x="${e.l[1]}" y="${e.l[2]}" text-anchor="middle" font-size="11" fill="${SOFT}">${esc(e.l[0])}</text>`).join('\n    ');
const marks = L.filter((e) => e.b)
  .map((e) => annotation(e.b[0], e.b[1], e.b[2], BANDS, e.b[3])).join('\n    ');

const TOTAL = '17 containers · 12.5 vCPU / 27 GiB for compute · 8 vCPU / 26 GiB + 580 GiB for data';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="Layered architecture of a marketplace, with the sizing of every building block">
  <title>Layered architecture — sizing</title>
  <defs>${arrowHead()}</defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="46" font-size="19" font-weight="700" fill="${INK}">Marketplace — layered architecture</text>
  <text x="40" y="68" font-size="12.5" fill="${SOFT}">The sizing follows the load profile, not the size of the code</text>
    ${bands}
    ${edges}
    ${nodes}
    ${labels}
    ${marks}
  <text x="40" y="${H - 42}" font-size="11.5" font-weight="600" fill="${SOFT}">Total</text>
  <text x="90" y="${H - 42}" font-size="11.5" fill="${SOFT}" font-family="'IBM Plex Mono',monospace">${esc(TOTAL)}</text>
  ${legend(40, H - 90,
    [...new Set(N.map((n) => n.shape || 'service'))].concat(BANDS.length ? ['boundary'] : []),
    [...new Set(N.map((n) => BY_SLUG[n.ico]).filter((e) => e && !e.officialMark)
      .map((e) => FAM[e.family]).filter(Boolean))].map((k) => [LAYERS[k].label, LAYERS[k].light]),
    N.some((n) => n.featured))}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/example-layers.svg'), svg);
// The bands are zones like any other; the sizing line `r` becomes a third line
// of the label, as it is in the SVG.
record({
  file: 'example-layers.svg', w: W, h: H,
  title: 'Marketplace — layered architecture',
  sub: 'The sizing follows the load profile, not the size of the code',
  zones: BANDS.map((z) => ({ ...z, shape: 'boundary' })),
  nodes: N,
  links: L.map((e) => ({
    d: e.d, mark: e.b || null,
    note: e.l && e.l[0] ? [e.l[1], e.l[2], e.l[0], 'middle'] : null,
  })),
  marks: [], notes: [],
  footer: ['Total', TOTAL],
});
const compute = N.filter((n) => n.r && n.shape === 'service');
console.log(`  docs/example-layers.svg · ${(svg.length / 1024).toFixed(0)} kB · ${N.length} nodes · ${compute.length} sized services`);
