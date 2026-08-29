// Drawing primitives shared by the diagram scripts, so that the shape grammar
// of ADR 0003 is applied in exactly one place.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readableInk } from './colors.mjs';
import { placeMark } from './ink-box.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const INK = '#16181A', SOFT = '#5B6873', STROKE = '#3E444A', RULE = '#8896A2';
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '').replace(/>\s+</g, '><').trim();
export const dim = (svg, a) => Number(svg.match(new RegExp(`${a}="(\\d+)"`))[1]);

// A symbol (48×48) laid at a given position.
export function symbol(slug, x, y, t = 34) {
  return read(`symbols/${slug}.svg`)
    .replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/, `<svg x="${x}" y="${y}" width="${t}" height="${t}" viewBox="$1">`);
}

// The layer ink of an entry. Used by arrow annotations, which keep the layer
// information the lockup's pill used to carry.
const _LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const _MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const _FAM = {}; for (const [k, c] of Object.entries(_LAYERS)) for (const f of c.families) _FAM[f] = k;
const _BY_SLUG = Object.fromEntries(_MAP.map((e) => [e.slug, e]));
export function layerInk(slug) {
  const e = _BY_SLUG[slug];
  const layer = e && _FAM[e.family];
  if (!layer) throw new Error(`Unknown layer for “${slug}”.`);
  return readableInk(_LAYERS[layer].light, '#FFFFFF', 4.5);
}

// An annotation's knockout is painted by intersecting it with the zones it
// covers, rather than with a single colour sampled at its centre: an arrow
// enters a zone in the middle of its label, and a plain knockout would then
// leave a light patch straddling the border.
function knockout(x, y, w, h, zones) {
  let g = `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" fill="#FFFFFF"/>`;
  for (const z of zones) {
    const x1 = Math.max(x, z.x), x2 = Math.min(x + w, z.x + z.w);
    const y1 = Math.max(y, z.y), y2 = Math.min(y + h, z.y + z.h);
    if (x2 <= x1 || y2 <= y1) continue;
    const fill = (z.nested && NESTED_FILL.boundary) || FILLS.boundary;
    g += `<rect x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${(x2 - x1).toFixed(1)}" height="${(y2 - y1).toFixed(1)}" fill="${fill}"/>`;
  }
  return g;
}

// An arrow LABEL: the intent alone, when the transport is already named by the
// box it arrives at — an arrow entering “Kafka” needs no Kafka tag. It carries
// the same knockout as an annotation, otherwise a zone border runs through it.
export function label(text, cx, cy, zones = [], anchor = 'middle', size = 11) {
  const width = text.length * size * 0.48;
  const x = anchor === 'middle' ? cx - width / 2 : anchor === 'end' ? cx - width : cx;
  return knockout(x - 5, cy - size, width + 10, size + 4, zones)
    + `<text x="${cx}" y="${cy}" text-anchor="${anchor}" font-size="${size}" fill="${SOFT}">${esc(text)}</text>`;
}

export const isLogotype = (slug) => Boolean(_BY_SLUG[slug] && _BY_SLUG[slug].logotype);

// The same rule as in the lockups: when the mark WRITES the name, it stands in
// for the label. We place it at the ink height of the text it replaces —
// otherwise it would be inscribed in a 17 px square and illegible.
const ANNOTATION_CAP = 8.2;   // cap height of an 11.5 px label at weight 600

function markAlone(slug, cx, cy, ink) {
  const raw = fs.readFileSync(path.join(ROOT, 'sources/marks', `${slug}.svg`), 'utf8');
  const opts = { yCentre: cy, inkHeight: ANNOTATION_CAP, maxWidth: 78, ink };
  const m = placeMark(raw, opts);
  return { width: m.w, svg: placeMark(raw, { ...opts, x: cx - m.w / 2 }).svg };
}

// An arrow ANNOTATION: the symbol and the name laid ON the line, which breaks
// behind them. A lockup is about 150 px wide: on an 82 px arrow it spilled onto
// the boxes, hence the vertical offset that left it floating. See
// docs/candidates-arrows.svg.
// `verb` carries the intent, the protocol carries the transport. C4 requires
// both: “sends order events to, via Kafka” — saying that A uses B teaches
// nothing, saying how A uses B does. The two stack inside a single knockout,
// intent on top, as C4-PlantUML's own rendering does: on one line, “reads its
// top-ups · HTTPS / TLS” would be 200 px for an arrow that is 82.
export function annotation(slug, cx, cy, zones = [], verb = null) {
  const t = 17, text = _BY_SLUG[slug].label;
  if (isLogotype(slug)) {
    const m = markAlone(slug, cx, verb ? cy + 9 : cy, layerInk(slug));
    const width = Math.max(m.width, verb ? verb.length * 5.3 : 0);
    return knockout(cx - width / 2 - 5, verb ? cy - 19 : cy - 11, width + 10, verb ? 36 : 22, zones)
      + (verb ? `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="10.5" fill="${SOFT}">${esc(verb)}</text>` : '')
      + m.svg;
  }
  const wProto = t + 5 + text.length * 6.6;
  const wVerb = verb ? verb.length * 5.3 : 0;
  const width = Math.max(wProto, wVerb);
  const xp = cx - wProto / 2;
  // Without a verb the block sits on one line, centred on the stroke; with one
  // it takes two, and the stroke breaks over the whole height of the block.
  const yProto = verb ? cy + 9 : cy;
  const high = verb ? 36 : 22;
  const top = verb ? cy - 19 : cy - 11;
  return knockout(cx - width / 2 - 5, top, width + 10, high, zones)
    + (verb ? `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="10.5" fill="${SOFT}">${esc(verb)}</text>` : '')
    + symbol(slug, xp, yProto - t / 2, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '')
    + `<text x="${(xp + t + 5).toFixed(1)}" y="${yProto + 4}" font-size="11.5" font-weight="600" fill="${layerInk(slug)}">${esc(text)}</text>`;
}

// A horizontal lockup centred on a point. Kept for the arbitration sheet
// docs/candidates-arrows.svg, which has to be able to show the old rendering.
export function badge(slug, cx, cy, e = 0.82) {
  const raw = read(`lockups/horizontal/${slug}.svg`);
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}

// Shape geometry: see shapes.json and docs/adr/0003-shape-grammar.md
//
// The fills follow the scale of ADR 0007: the VALUE of the fill encodes the
// shape and the nesting. The four previous greys sat between 1.05 and 1.08:1
// against white — a gap neither a projector nor a printer reproduces. They
// claimed to separate without separating. These run from 1.09 to 1.27:1.
export const FILLS = {
  service: '#FFFFFF', application: '#FFFFFF', stream: '#FFFFFF', store: '#FFFFFF',
  actor: '#E8ECEF', device: '#EDF0F2', node: '#DFE5E9', boundary: '#F2F5F6',
  external: '#F3F5F6',
};

// `featured` is the layer ink of the accented subject. A diagram carries at most
// one: that is step 6 of docs/shapes-colors-arrows.html, a dead letter until ADR
// 0007. Without it, the box keeps the neutral stroke.
// A zone nested inside another drops one step: without that, the nesting of
// zones stops reading, value having become our structural variable.
export const NESTED_FILL = { boundary: '#E7EBEE' };

// The ACCENT is a functional colour, not a seventh layer: it says only “this is
// the subject of this diagram”, never “this belongs to that domain”. It is
// therefore banned from layers.json, and the legend must declare it separately
// as soon as a diagram uses it — otherwise the reader looks for it among the
// layers.
//
// Magenta by elimination: blue, purple, teal, orange, red and slate are taken by
// the six layers of ADR 0001. See ADR 0007.
//
// BUT it does not carry alone. Measured under a Viénot-Brettel-Mollon
// simulation: in both deuteranopia and protanopia this magenta falls to
// ΔE00 = 1.5 from the “files” teal — the same colour for roughly 8 % of men.
// The accent would then read as a layer, exactly what it must not be. The thick
// stroke is therefore constitutive of the accent, not decorative: it is the
// second variable our own greyscale test demands.
export const ACCENT = '#A3196F';
// Thicker than any normal stroke, the node's 2.4 included.
export const ACCENT_WEIGHT = 3.2;

export const box = ({ x, y, w, h, shape, featured, nested }) => {
  const fill = (nested && NESTED_FILL[shape]) || FILLS[shape] || '#FFFFFF';
  const stroke = featured ? ACCENT : (shape === 'external' || shape === 'boundary' ? RULE : STROKE);
  const weight = featured ? ACCENT_WEIGHT : shape === 'node' ? 2.4 : shape === 'boundary' ? 1.3 : 1.6;
  if (shape === 'store') {
    // below 60 px, the cylinder's two ellipses cover the label
    if (h < 60) throw new Error(`Cylinder too short (${h} px): a “store” needs at least 60 px of height.`);
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"/>`;
  }
  const rx = { stream: h / 2, external: 8, actor: 10, application: 10, device: 3, node: 2, boundary: 12 }[shape] ?? 0;
  const dashes = shape === 'external' ? ' stroke-dasharray="5 4"' : shape === 'boundary' ? ' stroke-dasharray="8 6"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${dashes}/>`;
};

export const arrowHead = () => `<marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`
  + `<path d="M0,1 L9,5 L0,9" fill="none" stroke="${RULE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`;

// A MARKER qualifies a box or an arrow — “immutable”, “idempotent”, “RLS”.
// It is neither a shape nor a badge: a quality is not an object you can point
// at. See docs/adr/0006-quality-markers.md.
export const marker = (x, y, text, tone = '#0B6E7F') => {
  const w = Math.round(text.length * 5.6 + 16);
  return `<g><rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="#FFFFFF" stroke="${tone}" stroke-width="1.1"/>`
    + `<text x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle" font-size="9.5" font-weight="600"`
    + ` font-family="'IBM Plex Mono',monospace" fill="${tone}">${esc(text)}</text></g>`;
};

// A LEGEND, derived from the diagram's own content so that it cannot lie.
// Required by rule R5 of ADR 0003 and by the C4 model: our shapes and our six
// layer colours are house conventions the reader cannot guess. The AWS and Azure
// sets do without one because their iconography is public — ours is not.
// The swatches reuse FILLS: a legend showing fills the diagram does not use
// would be a lie, and rule R5 is what forbids it.
const SWATCH = (f) => (x, y) => {
  const fill = FILLS[f] ?? '#FFFFFF';
  const stroke = f === 'external' || f === 'boundary' ? RULE : STROKE;
  const weight = f === 'node' ? 2 : f === 'boundary' ? 1.2 : 1.3;
  if (f === 'store') {
    return `<path d="M${x} ${y + 4} v8 a13 4 0 0 0 26 0 v-8" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"/>`
         + `<ellipse cx="${x + 13}" cy="${y + 4}" rx="13" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"/>`;
  }
  const rx = { stream: 8, external: 4, actor: 5, application: 5, device: 2, node: 1, boundary: 4 }[f] ?? 0;
  const dashes = f === 'external' ? ' stroke-dasharray="3 2"' : f === 'boundary' ? ' stroke-dasharray="4 3"' : '';
  return `<rect x="${x}" y="${y}" width="26" height="16" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${dashes}/>`;
};

const SHAPE_NAME = { service: 'service', application: 'application', store: 'store', stream: 'stream',
  actor: 'actor', device: 'device', external: 'external', boundary: 'zone', node: 'node' };

export function legend(x, y, shapes, layerList, accent = false) {
  let cx = x + 64;
  const items = [];
  for (const f of shapes) {
    if (!(f in FILLS)) continue;
    items.push(SWATCH(f)(cx, y - 12) + `<text x="${cx + 32}" y="${y}" font-size="10.5" fill="${SOFT}">${esc(SHAPE_NAME[f] || f)}</text>`);
    cx += 32 + (SHAPE_NAME[f] || f).length * 5.6 + 22;
  }
  let dx = x + 64;
  const row2 = layerList.map(([lab, tone]) => {
    const el = `<rect x="${dx}" y="${y + 14}" width="12" height="12" rx="3" fill="${tone}"/>`
             + `<text x="${dx + 18}" y="${y + 24}" font-size="10.5" fill="${SOFT}">${esc(lab)}</text>`;
    dx += 18 + lab.length * 5.6 + 22;
    return el;
  }).join('');
  return `<g>`
    + `<text x="${x}" y="${y}" font-size="10" font-weight="600" font-family="'IBM Plex Mono',monospace" fill="${RULE}">SHAPES</text>`
    + items.join('')
    + (layerList.length ? `<text x="${x}" y="${y + 24}" font-size="10" font-weight="600" font-family="'IBM Plex Mono',monospace" fill="${RULE}">COLOURS</text>` + row2 : '')
    + (accent
      ? `<rect x="${dx}" y="${y + 14}" width="12" height="12" rx="3" fill="${ACCENT}"/>`
        + `<text x="${dx + 18}" y="${y + 24}" font-size="10.5" font-weight="600" fill="${SOFT}">subject of the diagram</text>`
      : '')
    + `</g>`;
}
