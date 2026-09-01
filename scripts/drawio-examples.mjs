// Generates drawio/examples.drawio: the nine example views, as EDITABLE
// draw.io pages.
//
// Why this exists. docs/example-*.svg are pictures. Dropped into draw.io they
// stay one flat image: nothing to move, nothing to rename, nothing to extend.
// Anyone wanting to start from a view had to redraw it. The data was already
// declarative — scripts/view-spec.mjs records it — so a second renderer costs a
// translation, not a second copy of the coordinates.
//
// What is deliberately NOT carried over:
//
//   - the LEGEND. In the SVG it is derived from the content, which is what makes
//     it unable to lie (rule R5 of ADR 0003). On a page you are free to edit,
//     a frozen legend would start lying at the first box you add. The grammar
//     palette, drawio/grammar.xml, is the honest equivalent.
//   - the protocol SIGN on the arrows. draw.io writes an edge label as text;
//     the sign would have to be a second floating cell, which would come adrift
//     from its arrow on the first move. The label keeps both registers ADR 0003
//     asks for — the intent and the transport — as text.
//
// Everything else is here, and connected: an arrow knows which box it leaves
// and which it enters, so moving a box drags its arrows along.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, ACCENT, layerInk } from './diagram.mjs';
import { shapeStyle, imageDataUri, EDGE_STYLE } from './drawio.mjs';
import { readAll } from './view-spec.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// ─── Paths ────────────────────────────────────────────────────────────────
// The links are orthogonal polylines written with M, H and V only. Anything
// else would silently lose a segment, so it is refused rather than approximated.
function pathPoints(d) {
  const pts = [];
  let x = 0, y = 0;
  const re = /([A-Za-z])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g;
  let m;
  while ((m = re.exec(d))) {
    const [, c, a, b] = m;
    if (c === 'M' || c === 'L') { x = +a; y = +b; }
    else if (c === 'H') x = +a;
    else if (c === 'V') y = +a;
    else throw new Error(`path command “${c}” unsupported in a link: ${d}`);
    pts.push({ x, y });
  }
  if (pts.length < 2) throw new Error(`link with fewer than two points: ${d}`);
  return pts;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Which side of which box an endpoint sits on. The arrows stop a few pixels
// short of the box they point at, hence the tolerance.
const TOL = 14;

// How far an annotation may sit from the stroke it belongs to. Measured on the
// three views that need the inference: the labels deliberately stand off the
// line to clear the boxes, the furthest — “publishes the readings” — by 60 px.
// Beyond 70 the nearest arrow stops being obviously the right one, so the
// annotation is left free-standing instead.
const LOOSE_MAX = 70;
function anchorOn(n, p) {
  if (p.x < n.x - TOL || p.x > n.x + n.w + TOL) return null;
  if (p.y < n.y - TOL || p.y > n.y + n.h + TOL) return null;
  const best = [
    { v: Math.abs(p.x - n.x), X: 0, Y: (p.y - n.y) / n.h },
    { v: Math.abs(p.x - (n.x + n.w)), X: 1, Y: (p.y - n.y) / n.h },
    { v: Math.abs(p.y - n.y), X: (p.x - n.x) / n.w, Y: 0 },
    { v: Math.abs(p.y - (n.y + n.h)), X: (p.x - n.x) / n.w, Y: 1 },
  ].sort((a, b) => a.v - b.v)[0];
  return best.v <= TOL ? { X: clamp01(best.X), Y: clamp01(best.Y), d: best.v } : null;
}

function attach(nodes, p) {
  let found = null;
  nodes.forEach((n, i) => {
    const a = anchorOn(n, p);
    if (a && (!found || a.d < found.d)) found = { i, ...a };
  });
  return found;
}

// Distance from a point to the polyline, used to decide whether an annotation
// belongs to an arrow or floats on its own.
function distanceToPath(pts, p) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len ? clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / len) : 0;
    const qx = a.x + t * dx, qy = a.y + t * dy;
    best = Math.min(best, Math.hypot(p.x - qx, p.y - qy));
  }
  return best;
}

// The midpoint by arc length: an edge label is positioned relative to it.
function midpoint(pts) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(l); total += l;
  }
  let run = 0;
  for (let i = 0; i < seg.length; i++) {
    if (run + seg[i] >= total / 2) {
      const t = seg[i] ? (total / 2 - run) / seg[i] : 0;
      return { x: pts[i].x + t * (pts[i + 1].x - pts[i].x), y: pts[i].y + t * (pts[i + 1].y - pts[i].y) };
    }
    run += seg[i];
  }
  return pts[pts.length - 1];
}

// ─── Labels ───────────────────────────────────────────────────────────────
const span = (text, colour, mono = false) =>
  `<span style="color:${colour}${mono ? ';font-family:monospace' : ''}">${esc(esc(text))}</span>`;

// Title, then technology, then the identifier of the thing that really exists —
// a bucket is called “voltis-invoices”, not “S3”. Same three registers as the
// SVG, and here the reader can edit them in place.
function nodeLabel(n) {
  const head = `<b>${esc(esc(n.t))}</b>`;
  const lines = [head];
  if (n.s) lines.push(span(n.s, SOFT) + (n.id ? ` · ${span(n.id, RULE, true)}` : ''));
  else if (n.id) lines.push(span(n.id, RULE, true));
  if (n.r) lines.push(span(n.r, '#0B6E7F', true));
  if (n.d) lines.push(span(n.d, SOFT));
  return lines.join('<br>');
}

function zoneLabel(z) {
  const lines = [`<b>${esc(esc(z.t))}</b>`];
  if (z.s) lines.push(span(z.s, RULE));
  return lines.join('<br>');
}

// ─── Cells ────────────────────────────────────────────────────────────────
let seq = 0;
const nextId = (page) => `${page}-${++seq}`;

const cell = (id, value, style, geo, extra = '') =>
  `        <mxCell id="${id}" value="${esc(value)}" style="${esc(style)}" vertex="1" parent="1"${extra}>\n`
  + `          <mxGeometry ${geo} as="geometry"/>\n        </mxCell>`;

const ICON = 28;

function page(view, index) {
  seq = 0;
  const p = view.slug;
  const cells = [];
  const stats = { attached: 0, floating: 0, marks: 0, notes: 0, orphans: 0 };

  // Title and subtitle. Plain text cells: they are part of the diagram, and on
  // a page you own they should be renameable like anything else.
  cells.push(cell(nextId(p), view.title,
    `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=19;fontStyle=1;fontColor=${INK};`,
    `x="40" y="28" width="${view.w - 80}" height="26"`));
  cells.push(cell(nextId(p), view.sub,
    `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=12;fontColor=${SOFT};`,
    `x="40" y="54" width="${view.w - 80}" height="20"`));

  // Zones first: they must sit behind everything, and mxGraph paints in
  // document order.
  for (const z of view.zones) {
    cells.push(cell(nextId(p), zoneLabel(z),
      shapeStyle('boundary', { h: z.h, nested: z.nested })
      + 'html=1;whiteSpace=wrap;verticalAlign=top;align=right;spacingRight=12;spacingTop=6;'
      + `fontSize=12;fontColor=${SOFT};`,
      `x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"`));
  }

  // Nodes, with their badge as a CHILD cell so it travels with the box.
  const nodeIds = view.nodes.map(() => null);
  view.nodes.forEach((n, i) => {
    const shape = n.shape || 'service';
    const id = nextId(p);
    nodeIds[i] = id;
    // A deployment node tall enough to host other boxes labels at the top,
    // otherwise its children cover the name — ADR 0005.
    const top = shape === 'node' && n.h > 100;
    const style = shapeStyle(shape, { h: n.h, featured: n.featured })
      + 'html=1;whiteSpace=wrap;align=left;'
      + (top ? 'verticalAlign=top;spacingTop=6;' : 'verticalAlign=middle;')
      + `spacingLeft=${n.ico ? ICON + 18 : 8};fontSize=12;fontColor=${n.featured ? ACCENT : INK};`;
    cells.push(cell(id, nodeLabel(n), style, `x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}"`));
    if (n.ico && BY_SLUG[n.ico]) {
      // A cylinder's body starts 14 px down: the badge follows it, as in the SVG.
      const drop = shape === 'store' ? 6 : 0;
      const iy = top ? 12 : (n.h - ICON) / 2 + drop;
      cells.push(`        <mxCell id="${nextId(p)}" value="" style="${esc(`shape=image;html=1;imageAspect=1;aspect=fixed;image=${imageDataUri(n.ico)}`)}" vertex="1" parent="${id}">\n`
        + `          <mxGeometry x="12" y="${Math.round(iy)}" width="${ICON}" height="${ICON}" as="geometry"/>\n        </mxCell>`);
    }
  });

  // Links. Each keeps its own route, and each end that touches a box is bound
  // to it: move the box and the arrow follows.
  const routes = view.links.map((e) => pathPoints(e.d));

  // The loose annotations of example-systems.mjs are assigned BEFORE the arrows
  // are written, each to the stroke nearest to IT. Assigning them the other way
  // round — the nearest annotation to each arrow, in file order — gives a
  // different and wrong answer as soon as two arrows compete for one label.
  const assigned = view.links.map(() => null);
  const loose = view.marks.map((m) => ({ kind: 'mark', at: { x: m[1], y: m[2] }, v: m }))
    .concat(view.notes.map((n) => ({ kind: 'note', at: { x: n[0], y: n[1] }, v: n })));
  const orphans = [];
  for (const a of loose) {
    const ranked = routes.map((r, i) => ({ i, d: distanceToPath(r, a.at) }))
      .filter(({ i }) => !assigned[i])
      .sort((x, y) => x.d - y.d);
    if (!ranked.length || ranked[0].d > LOOSE_MAX) { orphans.push(a); continue; }
    assigned[ranked[0].i] = a;
  }

  view.links.forEach((e, li) => {
    const pts = routes[li];
    const from = attach(view.nodes, pts[0]);
    const to = attach(view.nodes, pts[pts.length - 1]);
    if (from && to) stats.attached++; else stats.floating++;

    // The annotation this arrow carries. Two of the three generators know the
    // association and declare it on the link; example-systems.mjs keeps its
    // annotations in arrays of their own, so there it is inferred from the
    // distance to the stroke — and an ambiguous inference is refused rather
    // than guessed, because a label attached to the wrong arrow says something
    // the diagram does not.
    const mid = midpoint(pts);
    let value = '';
    let offset = null;

    const take = (kind, tuple) => {
      const [px, py] = kind === 'mark' ? [tuple[1], tuple[2]] : [tuple[0], tuple[1]];
      if (kind === 'mark') {
        const [slug, , , verb] = tuple;
        stats.marks++;
        value = (verb ? span(verb, SOFT) + '<br>' : '')
          + `<b><span style="color:${layerInk(slug)}">${esc(esc(BY_SLUG[slug].label))}</span></b>`;
      } else {
        stats.notes++;
        value = esc(esc(tuple[2]));
      }
      offset = { x: Math.round(px - mid.x), y: Math.round(py - mid.y) };
    };

    if (e.mark) take('mark', e.mark);
    else if (e.note) take('note', e.note);
    else if (assigned[li]) take(assigned[li].kind, assigned[li].v);

    const constraints = (from ? `exitX=${from.X};exitY=${from.Y};exitDx=0;exitDy=0;` : '')
      + (to ? `entryX=${to.X};entryY=${to.Y};entryDx=0;entryDy=0;` : '');
    const attrs = (from ? ` source="${nodeIds[from.i]}"` : '') + (to ? ` target="${nodeIds[to.i]}"` : '');
    const waypoints = pts.slice(1, -1);
    const geo = `        <mxGeometry relative="1" as="geometry">\n`
      + (from ? '' : `          <mxPoint x="${pts[0].x}" y="${pts[0].y}" as="sourcePoint"/>\n`)
      + (to ? '' : `          <mxPoint x="${pts[pts.length - 1].x}" y="${pts[pts.length - 1].y}" as="targetPoint"/>\n`)
      + (waypoints.length
        ? `          <Array as="points">\n`
          + waypoints.map((w) => `            <mxPoint x="${w.x}" y="${w.y}"/>`).join('\n')
          + `\n          </Array>\n`
        : '')
      + (offset ? `          <mxPoint x="${offset.x}" y="${offset.y}" as="offset"/>\n` : '')
      + `        </mxGeometry>`;
    cells.push(`        <mxCell id="${nextId(p)}" value="${esc(value)}" style="${esc(EDGE_STYLE + constraints)}" edge="1" parent="1"${attrs}>\n${geo}\n        </mxCell>`);
  });

  // Whatever did not land on an arrow stays a free label — it said something in
  // the SVG and it must keep saying it.
  for (const a of orphans) {
    if (a.kind === 'mark') {
      const [slug, x, y, verb] = a.v;
      cells.push(cell(nextId(p), (verb ? span(verb, SOFT) + '<br>' : '')
        + `<b><span style="color:${layerInk(slug)}">${esc(esc(BY_SLUG[slug].label))}</span></b>`,
        'text;html=1;strokeColor=none;fillColor=#FFFFFF;align=center;verticalAlign=middle;fontSize=11;',
        `x="${Math.round(x - 60)}" y="${Math.round(y - 18)}" width="120" height="36"`));
    } else {
      const [x, y, text, anchor] = a.v;
      const w = Math.max(60, Math.round(text.length * 6));
      const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      cells.push(cell(nextId(p), text,
        `text;html=1;strokeColor=none;fillColor=none;align=${anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left'};`
        + `verticalAlign=middle;fontSize=11;fontColor=${SOFT};`,
        `x="${Math.round(left)}" y="${Math.round(y - 11)}" width="${w}" height="20"`));
    }
  }
  stats.orphans += orphans.length;

  if (view.footer) {
    cells.push(cell(nextId(p), `<b>${esc(esc(view.footer[0]))}</b>  ${span(view.footer[1], SOFT, true)}`,
      `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=11;fontColor=${SOFT};`,
      `x="40" y="${view.h - 52}" width="${view.w - 80}" height="20"`));
  }

  const name = `${index + 1} · ${view.title.split(' — ')[0]}`;
  const xml = `  <diagram id="${p}" name="${esc(name)}">\n`
    + `    <mxGraphModel dx="${view.w}" dy="${view.h}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1"`
    + ` arrows="1" fold="1" page="1" pageScale="1" pageWidth="${view.w}" pageHeight="${view.h}"`
    + ` math="0" shadow="0" background="#FFFFFF">\n      <root>\n`
    + `        <mxCell id="${p}-0"/>\n        <mxCell id="1" parent="${p}-0"/>\n`
    + cells.join('\n') + `\n      </root>\n    </mxGraphModel>\n  </diagram>`;
  return { xml, stats };
}

// The reading order of the README's table: from the widest context down to the
// inside of one component, then the two synthesis views.
const ORDER = ['context', 'voltis', 'domains', 'infra', 'k8s', 'component', 'delivery', 'layers', 'full', 'analytics'];

const views = readAll();
if (!views.length) throw new Error('no view recorded: run the example generators first.');
const missing = ORDER.filter((s) => !views.some((v) => v.slug === s));
const extra = views.map((v) => v.slug).filter((s) => !ORDER.includes(s));
if (missing.length || extra.length) {
  throw new Error(`the page order does not match the views: missing ${missing.join(', ') || 'none'},`
    + ` unlisted ${extra.join(', ') || 'none'}.`);
}

const pages = ORDER.map((slug, i) => page(views.find((v) => v.slug === slug), i));

// A dangling reference costs nothing at write time and everything at open time:
// draw.io drops the cell silently, so the page simply loses an arrow. Checked
// here rather than discovered later.
for (const { xml } of pages) {
  const ids = new Set([...xml.matchAll(/<mxCell id="([^"]+)"/g)].map((m) => m[1]));
  if (ids.size !== [...xml.matchAll(/<mxCell id="([^"]+)"/g)].length) {
    throw new Error('examples.drawio: duplicate cell id on a page.');
  }
  for (const m of xml.matchAll(/(source|target|parent)="([^"]+)"/g)) {
    if (!ids.has(m[2])) throw new Error(`examples.drawio: ${m[1]}="${m[2]}" points at no cell.`);
  }
}
const file = `<mxfile host="architecture-diagram-kit" type="device">\n`
  + pages.map((x) => x.xml).join('\n') + `\n</mxfile>\n`;

fs.mkdirSync(path.join(ROOT, 'drawio'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'drawio/examples.drawio'), file);

const t = pages.reduce((a, x) => ({
  attached: a.attached + x.stats.attached, floating: a.floating + x.stats.floating,
  marks: a.marks + x.stats.marks, notes: a.notes + x.stats.notes,
  orphans: a.orphans + x.stats.orphans,
}), { attached: 0, floating: 0, marks: 0, notes: 0, orphans: 0 });

// Nothing may be lost on the way: every annotation the SVG draws is either an
// edge label here or a free-standing one, never absent.
const declared = views.reduce((a, v) => a + v.marks.length + v.notes.length
  + v.links.filter((e) => e.mark || e.note).length, 0);
const written = t.marks + t.notes + t.orphans;
if (written !== declared) {
  throw new Error(`examples.drawio: ${written} annotations written for ${declared} declared —`
    + ` ${declared - written} lost on the way.`);
}
console.log(`  drawio/examples.drawio · ${pages.length} pages · ${(file.length / 1024).toFixed(0)} kB`);
console.log(`  ${t.attached + t.floating} arrows, ${t.attached} bound at both ends`
  + ` · ${written}/${declared} annotations kept, ${t.orphans} free-standing`);
