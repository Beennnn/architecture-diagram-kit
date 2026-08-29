// The diagram fragment shared by the arbitration sheets, and the drawing
// primitives they need to redefine locally. Extracted from
// specimen-candidates.mjs so that specimen-fills.mjs judges exactly the same
// geometry: two copies would have drifted.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, STROKE, RULE, esc, read, dim, symbol, box } from './diagram.mjs';
import { tintedFill, readableInk } from './colors.mjs';

const CANVAS = '#FFFFFF';
const layers = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
export const T = (c, target) => tintedFill(layers[c].light, CANVAS, target);
export const LAYER_INK = (c) => readableInk(layers[c].light, CANVAS, 4.5);

// The proposed grey scale: the value of the fill encodes shape and nesting.
export const PROPOSED_FILL = { application: '#FFFFFF', service: '#FFFFFF', stream: '#FFFFFF',
  store: '#FFFFFF', actor: '#E8ECEF', device: '#EDF0F2', node: '#DFE5E9',
  boundary: '#F2F5F6', external: '#F3F5F6' };
// Today's fills, as box() and zone() lay them.
export const CURRENT_FILL = { application: '#FFFFFF', service: '#FFFFFF', stream: '#FFFFFF',
  store: '#FFFFFF', actor: '#F8F9FA', device: '#F8F9FA', node: '#F4F6F7',
  boundary: '#F7F9FA', external: '#EDEFF1' };

// The fragment, identical on all cards: the NINE shapes of ADR 0003, two of them
// containers (boundary, node), on a plausible architecture.
//   Workstation → Firewall → [ Kubernetes: Gateway → Node [ Spring Boot ]
//                              → Kafka / PostgreSQL ] → S3
//
// Every node carries TWO names: the product (which the lockup can write) and the
// instance (which the lockup alone will never write — an S3 bucket is called
// “voltis-invoices”, not “S3”). That constraint is what separates the
// renderings.
export const FRAG = [
  { slug: 'workstation',    name: 'Workstation',     inst: 'agent desk',          shape: 'actor',       layer: 'infra',
    x: 0,   y: 132, w: 150, h: 92 },
  { slug: 'firewall',       name: 'Firewall',        inst: 'fw-edge-01',          shape: 'device',      layer: 'infra',
    x: 174, y: 132, w: 140, h: 92 },
  { slug: 'kubernetes',     name: 'Kubernetes',      inst: 'cluster voltis-prod', shape: 'boundary',    layer: 'infra',
    x: 338, y: 8,   w: 590, h: 294, container: true },
  { slug: 'api-gateway',    name: 'API gateway',     inst: 'gw-public',           shape: 'service',     layer: 'infra',
    x: 354, y: 126, w: 152, h: 92 },
  { slug: 'cluster-node',   name: 'Cluster node',    inst: 'node-a3',             shape: 'node',        layer: 'infra',
    x: 526, y: 88,  w: 196, h: 196, container: true },
  { slug: 'springboot',     name: 'Spring Boot',     inst: 'svc-billing',         shape: 'application', layer: 'api',
    x: 540, y: 170, w: 168, h: 92 },
  { slug: 'kafka',          name: 'Kafka',           inst: 'invoices.v1',         shape: 'stream',      layer: 'messaging',
    x: 742, y: 88,  w: 170, h: 92 },
  { slug: 'postgresql',     name: 'PostgreSQL',      inst: 'voltis-orders',       shape: 'store',       layer: 'files',
    x: 742, y: 194, w: 170, h: 92 },
  { slug: 's3',             name: 'S3',              inst: 'voltis-invoices',     shape: 'external',    layer: 'files',
    x: 952, y: 194, w: 150, h: 92 },
];
export const LINKS = [[0, 1, 178], [1, 3, 175], [3, 4, 175], [4, 6, 134], [4, 7, 240], [7, 8, 240]];

export const SH = 312;
export const MONO = "'IBM Plex Mono',monospace";

// --- local geometry: the variants need fills and strokes the current grammar
// --- does not expose. We redraw them here, without touching it.
const RX = { service: 0, application: 10, actor: 10, device: 3, node: 2, external: 8, boundary: 12 };
export function shell(f, x, y, w, h, { fill = '#FFFFFF', stroke = STROKE, weight = 1.6, dashes = null } = {}) {
  const d = dashes ? ` stroke-dasharray="${dashes}"` : '';
  if (f === 'store') {
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${d}/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${d}/>`;
  }
  const rx = f === 'stream' ? h / 2 : (RX[f] ?? 0);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${d}/>`;
}
// The shell as the repository draws it today. box() knew only eight shapes: the
// zones were drawn by a local function in example-systems.mjs, with no symbol —
// which is why the boundary is bare in rows A to C.
export const currentShell = (n) => n.shape === 'boundary'
  ? `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="#F7F9FA" stroke="${RULE}" stroke-width="1.3" stroke-dasharray="8 6"/>`
  : box({ x: n.x, y: n.y, w: n.w, h: n.h, shape: n.shape });

// A symbol stripped of its pill: the files in symbols/ are 48 px tinted squares
// (rx 13) carrying a 30 px glyph, not bare pictograms. On an already tinted
// ground the pill would duplicate — so we keep the glyph alone.
export const glyph = (slug, x, y, t) =>
  symbol(slug, x, y, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '');

// A lockup scaled to fit within a given width.
export function mark(slug, cx, cy, maxWidth) {
  const raw = read(`lockups/horizontal/${slug}.svg`);
  const e = Math.min(0.82, maxWidth / dim(raw, 'width'));
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}
export const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}"${o.centre ? ' text-anchor="middle"' : ''}`
  + ` font-size="${o.size || 12.5}"${o.mono ? ` font-family="${MONO}"` : ''}`
  + ` font-weight="${o.bold || 600}" fill="${o.ink || INK}">${esc(t)}</text>`;

// The cylinder loses 14 px under its ellipse: its content drops by as much.
export const usableTop = (n) => n.y + (n.shape === 'store' ? 20 : 10);
// Rule R9: a container carries its label at the top, else its children cover it.
export const cornerWidth = (n) => Math.min(n.w - 24, 148);

// --- the seven renderings -------------------------------------------------
// Each has to render both names. That is where they pull apart.
export const RENDERINGS = {
  // A — what exists, plus the instance name our six views were missing.
  //     The boundary has neither symbol nor identity: nor does it in our views.
  A: (n, t = 34) => {
    if (n.shape === 'boundary') return currentShell(n)
      + txt(n.x + 14, n.y + 24, n.name, { size: 12, bold: 700, ink: SOFT })
      + txt(n.x + 14, n.y + 39, n.inst, { size: 10, mono: true, bold: 500, ink: RULE });
    if (n.container) return currentShell(n) + symbol(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.name, { size: 12, bold: 700 })
      + txt(n.x + 40, n.y + 36, n.inst, { size: 10, mono: true, bold: 500, ink: SOFT });
    // The two lines sit under the symbol, never over it: the cylinder loses
    // 14 px under its ellipse, and it is what caps the symbol's size.
    const yName = Math.max(n.y + n.h - 30, usableTop(n) + t + 13);
    const yInst = yName + 17;
    if (yInst > n.y + n.h - 6) {
      throw new Error(`${n.slug}: a ${t} px symbol leaves no room for the two lines `
        + `(it would need ${Math.round(yInst - (n.y + n.h - 6))} px more).`);
    }
    return currentShell(n) + symbol(n.slug, n.x + n.w / 2 - t / 2, usableTop(n), t)
      + txt(n.x + n.w / 2, yName, n.name, { centre: true })
      + txt(n.x + n.w / 2, yInst, n.inst, { centre: true, size: 10, mono: true, bold: 500, ink: SOFT });
  },

  // B — the same symbol at 44 px: more ink, not one variable more.
  B: (n) => RENDERINGS.A(n, n.container ? 24 : n.shape === 'store' ? 36 : 44),

  // C — A, plus a single subject accented by its layer colour.
  C: (n) => {
    if (n.shape === 'boundary' || n.container) return RENDERINGS.A(n);
    const featured = n.slug === 'springboot';
    const ink = LAYER_INK(n.layer);
    return shell(n.shape, n.x, n.y, n.w, n.h, {
      fill: n.shape === 'external' ? '#EDEFF1' : n.shape === 'actor' || n.shape === 'device' ? '#F8F9FA' : '#FFFFFF',
      stroke: featured ? ink : (n.shape === 'external' ? RULE : STROKE),
      weight: featured ? 2.6 : 1.6, dashes: n.shape === 'external' ? '5 4' : null,
    })
      + symbol(n.slug, n.x + n.w / 2 - 17, usableTop(n), 34)
      + txt(n.x + n.w / 2, n.y + n.h - 30, n.name, { centre: true, ink: featured ? ink : INK })
      + txt(n.x + n.w / 2, n.y + n.h - 13, n.inst, { centre: true, size: 10, mono: true, bold: 500, ink: SOFT });
  },

  // D — the lockup carries the product, the instance name goes underneath.
  D: (n, shellFn = currentShell) => {
    if (n.container) {
      const lg = cornerWidth(n);
      return shellFn(n) + mark(n.slug, n.x + 10 + lg / 2, n.y + 24, lg)
        + txt(n.x + 12, n.y + 58, n.inst, { size: 10, mono: true, bold: 500, ink: SOFT });
    }
    const cy = n.y + (n.shape === 'store' ? 46 : 38);
    return shellFn(n) + mark(n.slug, n.x + n.w / 2, cy, n.w - 16)
      + txt(n.x + n.w / 2, n.y + n.h - 14, n.inst, { centre: true, size: 10.5, mono: true, bold: 500, ink: SOFT });
  },

  // E — D, plus the grey scale actually widened: the value of the fill encodes
  //     shape and nesting, the lockup's tint encodes the layer.
  E: (n) => RENDERINGS.D(n, (m) => shell(m.shape, m.x, m.y, m.w, m.h, {
    fill: PROPOSED_FILL[m.shape] || '#FFFFFF',
    stroke: m.shape === 'external' || m.shape === 'boundary' ? RULE : STROKE,
    weight: m.shape === 'node' ? 2.4 : m.shape === 'boundary' ? 1.3 : 1.6,
    dashes: m.shape === 'external' ? '5 4' : m.shape === 'boundary' ? '8 6' : null,
  })),

  // F — the lockup becomes the box: the layer tint fills the shape, the instance
  //     comes to the front and the product becomes secondary.
  F: (n) => {
    const ink = LAYER_INK(n.layer);
    const fill = T(n.layer, n.container ? 0.94 : 0.9);
    const sh = shell(n.shape, n.x, n.y, n.w, n.h, {
      fill, stroke: ink, weight: n.shape === 'node' ? 2.4 : n.shape === 'boundary' ? 1.3 : 1.8,
      dashes: n.shape === 'external' ? '5 4' : n.shape === 'boundary' ? '8 6' : null,
    });
    if (n.container) return sh + glyph(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.inst, { size: 12, bold: 700 })
      + txt(n.x + 40, n.y + 36, n.name, { size: 10, bold: 500, ink: SOFT });
    const t = 28, lg = t + 8 + n.inst.length * 7.1, gx = n.x + n.w / 2 - lg / 2;
    const cy = n.y + (n.shape === 'store' ? 48 : 42);
    return sh + glyph(n.slug, gx, cy - t / 2, t)
      + txt(gx + t + 8, cy + 5, n.inst, { size: 13, bold: 700 })
      + txt(n.x + n.w / 2, n.y + n.h - 14, n.name, { centre: true, size: 10, bold: 500, ink: SOFT });
  },

  // G — the combination: the grey scale of E, the text hierarchy of F, the
  //     single accent of C. The symbol stays as it is, pill included: it is what
  //     carries the brand colour, and people recognise logos.
  G: (n) => {
    const featured = n.slug === 'springboot';
    const ink = LAYER_INK(n.layer);
    const sh = shell(n.shape, n.x, n.y, n.w, n.h, {
      fill: PROPOSED_FILL[n.shape] || '#FFFFFF',
      stroke: featured ? ink : (n.shape === 'external' || n.shape === 'boundary' ? RULE : STROKE),
      weight: featured ? 2.6 : n.shape === 'node' ? 2.4 : n.shape === 'boundary' ? 1.3 : 1.6,
      dashes: n.shape === 'external' ? '5 4' : n.shape === 'boundary' ? '8 6' : null,
    });
    if (n.container) return sh + symbol(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.inst, { size: 12, bold: 700 })
      + txt(n.x + 40, n.y + 36, n.name, { size: 10, bold: 500, ink: SOFT });
    const t = 32;
    const yTitle = Math.max(n.y + n.h - 30, usableTop(n) + t + 13);
    return sh + symbol(n.slug, n.x + n.w / 2 - t / 2, usableTop(n), t)
      + txt(n.x + n.w / 2, yTitle, n.inst, { centre: true, bold: 700, ink: featured ? ink : INK })
      + txt(n.x + n.w / 2, yTitle + 17, n.name, { centre: true, size: 10, bold: 500, ink: SOFT });
  },
};
