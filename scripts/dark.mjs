// Dark variant of the views, by rewriting the palette.
//
// Why a rewrite rather than a parameterised theme: the grammar's colours are
// module constants, and parameterising them would touch every view. The rewrite
// handles them where they are, and above all it makes possible the one rule that
// matters here: DO NOT touch the symbols.
//
// A symbol is a nested <svg>. Spring Boot's green and PostgreSQL's blue are
// brand colours: inverting them would produce false logos, which ADR 0002
// forbids. Their light pill therefore becomes a light swatch on a dark ground —
// which is what the AWS and Azure sets do in dark theme, and it is deliberate.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './diagram.mjs';
import { contrast, readableInk } from './colors.mjs';

// The value scale is turned over, not inverted: the order has to be preserved —
// the plain box darkest, the deployment node lightest — otherwise the nesting
// would read backwards.
const PALETTE = [
  ['#FFFFFF', '#1B1F24'],   // page ground and plain box
  ['#F3F5F6', '#22272E'],   // external
  ['#F2F5F6', '#232930'],   // zone
  ['#EDF0F2', '#272D34'],   // device
  ['#E7EBEE', '#2A3038'],   // nested zone
  ['#E8ECEF', '#2E353D'],   // actor
  ['#DFE5E9', '#343C45'],   // deployment node
  ['#16181A', '#E9EDF0'],   // ink
  ['#5B6873', '#9FADB9'],   // soft ink
  ['#3E444A', '#8A96A2'],   // stroke
  ['#8896A2', '#7B8894'],   // arrow line
  ['#E3E7EA', '#2C3238'],   // separating rules
  ['#FCFDFD', '#1E2329'],   // card ground
  ['#A3196F', '#F26BB2'],   // accent
  ['#0B6E7F', '#4FC3D9'],   // default marker
  ['#C0392F', '#FF8A80'],   // alert marker
];

// Layer inks have their variant declared in layers.json.
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));
for (const c of Object.values(layers)) {
  PALETTE.push([c.light.toUpperCase(), c.dark]);
  // Annotations do not use the raw layer colour but the ink derived from it,
  // darkened to 4.5:1 on white. For the “messaging” orange that differs from
  // the original colour, and a hand-written table would have missed it — as one
  // did on the first attempt.
  PALETTE.push([readableInk(c.light, '#FFFFFF', 4.5).toUpperCase(), c.dark]);
}

const TABLE = new Map(PALETTE.map(([a, b]) => [a.toUpperCase(), b]));

// Rewrites colours at root level only: anything inside a nested <svg> is a
// symbol or a lockup, therefore a brand, therefore untouchable.
export function darken(svg) {
  let out = '', depth = 0, i = 0;
  const re = /<svg\b|<\/svg>/g;
  let m;
  while ((m = re.exec(svg))) {
    const block = svg.slice(i, m.index);
    out += depth <= 1 ? rewrite(block) : block;
    out += m[0];
    depth += m[0] === '</svg>' ? -1 : 1;
    i = m.index + m[0].length;
  }
  out += depth <= 1 ? rewrite(svg.slice(i)) : svg.slice(i);
  return out;
}

const rewrite = (s) => s.replace(/#[0-9A-Fa-f]{6}/g, (c) => TABLE.get(c.toUpperCase()) || c);

const views = fs.readdirSync(path.join(ROOT, 'docs'))
  .filter((f) => f.startsWith('example-') && f.endsWith('.svg') && !f.includes('-dark'));

const DARK_CANVAS = '#1B1F24';

// The real check is not “did the table cover everything” but “does every text
// read”. Annotation inks are derived from a layer colour by readableInk(): they
// appear in no table, and an exhaustive table would have to be redone at the
// first layer added anyway.
function unreadableText(svg) {
  const root = svg.replace(/<svg\b[\s\S]*?<\/svg>/g, '');
  const bad = new Map();
  for (const m of root.matchAll(/<text[^>]*fill="(#[0-9A-Fa-f]{6})"[^>]*>([^<]{0,40})/g)) {
    const r = contrast(m[1], DARK_CANVAS);
    if (r < 4.5) bad.set(m[1], { r, ex: m[2].trim().slice(0, 24) });
  }
  return bad;
}

const leftovers = [];
for (const f of views) {
  const light = fs.readFileSync(path.join(ROOT, 'docs', f), 'utf8');
  const dark = darken(light);
  for (const [c, { r, ex }] of unreadableText(dark)) {
    leftovers.push(`  ${f}: ${c} on ${DARK_CANVAS} → ${r.toFixed(2)}:1 (“${ex}”)`);
  }
  fs.writeFileSync(path.join(ROOT, 'docs', f.replace('.svg', '-dark.svg')), dark);
}
if (leftovers.length) {
  throw new Error(`Unreadable text in the dark variant (< 4.5:1):\n${leftovers.join('\n')}`);
}
console.log(`  ${views.length} views in dark variant`);
