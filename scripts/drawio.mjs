// Generates the draw.io shape libraries.
//
// The underlying choice, explained in docs/state-of-the-art-diagrams.md § 5: we
// ship the SIGN alone and draw.io writes the name itself, as the shape's label.
// The text therefore stays searchable (Ctrl+F), editable in place
// (“HTTPS :8443”), real in SVG and HTML exports, and it follows the diagram's
// font. The lockups with vectorised text remain for contexts without a
// composition layer.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { readableInk } from './colors.mjs';
import { FILLS, NESTED_FILL, ACCENT, ACCENT_WEIGHT, STROKE, RULE } from './diagram.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));

const familyToLayer = {};
for (const [k, c] of Object.entries(layers)) for (const f of c.families) familyToLayer[f] = k;

const SIZE = 48;
const CANVAS = '#FFFFFF';     // a diagram is read on a light background
const LABEL_CONTRAST = 4.5;   // the label is text: we aim at the AA level

// draw.io compresses its mxGraphModel like this:
// base64(deflateRaw(encodeURIComponent(xml))). That is exactly what the
// application writes when exporting a library; we take the same path rather
// than escaping XML inside JSON inside XML.
const compress = (xml) => zlib.deflateRawSync(Buffer.from(encodeURIComponent(xml), 'utf8')).toString('base64');
const decompress = (b64) => decodeURIComponent(zlib.inflateRawSync(Buffer.from(b64, 'base64')).toString('utf8'));

const escXml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// A draw.io style is a sequence of “key=value;”: a value can contain neither
// “;” nor “=”. That rules out the “data:image/svg+xml;base64,…” form. The
// base64 form without the “;base64” gets around the semicolon but no renderer
// decodes it — verified: naturalWidth = 0. What remains is the URL-encoded SVG,
// where encodeURIComponent escapes precisely “;” (%3B) and “=” (%3D), and
// which every browser decodes.
function imageDataUri(slug) {
  const svg = fs.readFileSync(path.join(ROOT, 'symbols', `${slug}.svg`), 'utf8')
    .replace(/<title>[\s\S]*?<\/title>/, '')   // draw.io supplies the label
    .replace(/>\s+</g, '><')
    .trim();
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  if (uri.includes(';') || uri.includes('=')) {
    throw new Error(`image URI incompatible with a draw.io style: ${slug}`);
  }
  return uri;
}

const rawColor = (r) => {
  if (r.color) return r.color;
  if (r.officialMark && r.hex) return r.hex.startsWith('#') ? r.hex : `#${r.hex}`;
  return layers[familyToLayer[r.family]].light;
};

// draw.io lays the label on the canvas, not on the pill: it therefore needs its
// own contrast calculation, against white. Without that, light marks — IPFS,
// RSS — would give unreadable text.
const labelColor = (r) => readableInk(rawColor(r), CANVAS, LABEL_CONTRAST);
const short = (r) => r.short || r.label.split(' /')[0].split(' (')[0];

function entry(r) {
  const style = [
    'shape=image',
    'html=1',
    'aspect=fixed',
    'imageAspect=1',
    'verticalLabelPosition=bottom',   // the name under the sign: the convention
    'verticalAlign=top',              // of the AWS and Azure sets, and it keeps
    'labelPosition=center',           // the sign square, so arrows can anchor
    'align=center',
    'spacingTop=2',
    'fontSize=12',
    'fontStyle=1',
    `fontColor=${labelColor(r)}`,
    `image=${imageDataUri(r.slug)}`,
  ].join(';') + ';';

  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${escXml(short(r))}" style="${escXml(style)}" vertex="1" parent="1">`
    + `<mxGeometry x="0" y="0" width="${SIZE}" height="${SIZE}" as="geometry"/></mxCell>`
    + `</root></mxGraphModel>`;

  const packed = compress(xml);
  if (decompress(packed) !== xml) throw new Error(`compression round trip broken: ${r.slug}`);

  return { xml: packed, w: SIZE, h: SIZE, aspect: 'fixed', title: r.label };
}

function library(file, entries) {
  const built = entries.map(entry);
  const json = JSON.stringify(built);
  // The JSON is the text content of the <mxlibrary> node: it must contain
  // neither “<” nor “&”, otherwise the file is no longer valid XML.
  if (/[<&]/.test(json)) throw new Error(`forbidden character in the JSON of ${file}`);
  const content = `<mxlibrary>${json}</mxlibrary>`;
  fs.mkdirSync(path.join(ROOT, 'drawio'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'drawio', file), content + '\n');
  return { n: built.length, kb: (content.length / 1024).toFixed(0) };
}

// ─── The grammar itself ───────────────────────────────────────────────────
// The three libraries above ship signs only: anyone starting from our badges
// had to reapply the shapes, the fills and the accent by hand. This fourth
// library carries the grammar, so that ADR 0003 and ADR 0007 reach draw.io
// instead of staying in the repository.
//
// Non-obvious correspondences: arcSize is a DIAMETER when absoluteArcSize=1,
// hence 2 × rx; draw.io's cylinder is called cylinder3 and its `size` is the
// vertical semi-axis of the ellipse, which is our ry of 13.
const GRAMMAR = [
  ['Service', 160, 80, `rounded=0;fillColor=${FILLS.service};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Application', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=20;fillColor=${FILLS.application};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Stream', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=80;fillColor=${FILLS.stream};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Store', 160, 100, `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=13;fillColor=${FILLS.store};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Actor', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=20;fillColor=${FILLS.actor};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Device', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=6;fillColor=${FILLS.device};strokeColor=${STROKE};strokeWidth=1.6;`],
  ['Deployment node', 240, 140, `rounded=1;absoluteArcSize=1;arcSize=4;fillColor=${FILLS.node};strokeColor=${STROKE};strokeWidth=2.4;verticalAlign=top;align=left;spacingLeft=10;spacingTop=6;`],
  ['External', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=16;fillColor=${FILLS.external};strokeColor=${RULE};strokeWidth=1.6;dashed=1;dashPattern=5 4;`],
  ['Zone', 320, 200, `rounded=1;absoluteArcSize=1;arcSize=24;fillColor=${FILLS.boundary};strokeColor=${RULE};strokeWidth=1.3;dashed=1;dashPattern=8 6;verticalAlign=top;align=right;spacingRight=12;spacingTop=6;`],
  ['Nested zone', 280, 160, `rounded=1;absoluteArcSize=1;arcSize=24;fillColor=${NESTED_FILL.boundary};strokeColor=${RULE};strokeWidth=1.3;dashed=1;dashPattern=8 6;verticalAlign=top;align=right;spacingRight=12;spacingTop=6;`],
  ['Subject of the diagram', 160, 80, `rounded=0;fillColor=${FILLS.service};strokeColor=${ACCENT};strokeWidth=${ACCENT_WEIGHT};fontColor=${ACCENT};fontStyle=1;`],
];
const COMMON_STYLE = 'whiteSpace=wrap;html=1;fontSize=13;fontColor=#16181A;';

function shapeEntry([title, w, h, style]) {
  const full = COMMON_STYLE + style;
  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${escXml(title)}" style="${escXml(full)}" vertex="1" parent="1">`
    + `<mxGeometry x="0" y="0" width="${w}" height="${h}" as="geometry"/></mxCell>`
    + `</root></mxGraphModel>`;
  const packed = compress(xml);
  if (decompress(packed) !== xml) throw new Error(`round trip broken: ${title}`);
  return { xml: packed, w, h, title };
}

// The arrow annotation: the line breaks behind its label, which draw.io does
// natively through labelBackgroundColor. See docs/candidates-arrows.svg.
function arrowEntry() {
  const style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=blockThin;endFill=1;'
    + `strokeColor=${RULE};strokeWidth=1.5;fontSize=11;fontColor=#5B6873;labelBackgroundColor=#FFFFFF;`;
  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${escXml('intent')}" style="${escXml(style)}" edge="1" parent="1">`
    + `<mxGeometry relative="1" as="geometry">`
    + `<mxPoint x="0" y="40" as="sourcePoint"/><mxPoint x="160" y="40" as="targetPoint"/>`
    + `</mxGeometry></mxCell></root></mxGraphModel>`;
  const packed = compress(xml);
  if (decompress(packed) !== xml) throw new Error('round trip broken: arrow');
  return { xml: packed, w: 160, h: 80, title: 'Annotated arrow' };
}

function grammarLibrary() {
  const entries = GRAMMAR.map(shapeEntry).concat([arrowEntry()]);
  // The library must carry the nine fills of the grammar, otherwise it ships a
  // stale version of ADR 0007 to whoever starts from draw.io.
  const styles = GRAMMAR.map((g) => g[3]).join(' ');
  for (const [shape, fill] of Object.entries(FILLS)) {
    if (!styles.includes(`fillColor=${fill};`)) {
      throw new Error(`grammar.xml: the fill of “${shape}” (${fill}) does not appear in it.`);
    }
  }
  const json = JSON.stringify(entries);
  if (/[<&]/.test(json)) throw new Error('forbidden character in the JSON of grammar.xml');
  fs.writeFileSync(path.join(ROOT, 'drawio', 'grammar.xml'), `<mxlibrary>${json}</mxlibrary>\n`);
  return entries.length;
}

for (const [type, file] of [['protocol', 'protocols.xml'], ['product', 'products.xml'], ['role', 'roles.xml']]) {
  const { n, kb } = library(file, rows.filter((r) => r.type === type));
  console.log(`  drawio/${file.padEnd(15)} · ${String(n).padStart(2)} shapes · ${kb} kB`);
}
console.log(`  drawio/grammar.xml     · ${grammarLibrary()} shapes · the grammar, fills and accent included`);
