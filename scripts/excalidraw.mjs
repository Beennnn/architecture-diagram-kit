// Generates excalidraw/badges.excalidraw: a scene holding every badge, to be
// opened and then copy-pasted into your own diagrams.
//
// Why a SCENE and not a .excalidrawlib library: Excalidraw's ExportedLibraryData
// type holds only { type, version, source, libraryItems } — no “files”
// property. loadLibraryFromBlob returns nothing but LibraryItem[]. A library
// therefore cannot carry image binaries: an image element in one would reference
// a fileId that does not exist. A scene's ExportedDataState type does carry
// “files”. Verified against @excalidraw/excalidraw 0.18.1.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readableInk } from './colors.mjs';
import { base, verify, verifyGroups, VERIFIED_VERSION } from './excalidraw-format.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));

const familyToLayer = {};
for (const [k, c] of Object.entries(layers)) for (const f of c.families) familyToLayer[f] = k;

const CANVAS = '#FFFFFF', CONTRAST = 4.5;
const SIZE = 48, STEP_X = 132, STEP_Y = 116, PER_ROW = 8;

const color = (r) => {
  const raw = r.color ? r.color
    : (r.officialMark && r.hex) ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`)
    : layers[familyToLayer[r.family]].light;
  return readableInk(raw, CANVAS, CONTRAST);
};
const short = (r) => r.short || r.label.split(' /')[0].split(' (')[0];

// Excalidraw identifies a file by a digest; we use the SHA-1 of the SVG, which
// makes the scene reproducible from one generation to the next.
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

const elements = [], files = {};
let row = 0, col = 0, group = 0;
const titles = [];

for (const type of ['protocol', 'product', 'role']) {
  const batch = rows.filter((r) => r.type === type);
  if (col !== 0) { row++; col = 0; }
  titles.push({ y: row * STEP_Y, text: { protocol: 'Protocols', product: 'Products', role: 'Infrastructure roles' }[type], n: batch.length });
  row++;

  for (const r of batch) {
    const x = col * STEP_X, y = row * STEP_Y;
    const svg = fs.readFileSync(path.join(ROOT, 'symbols', `${r.slug}.svg`), 'utf8');
    const fileId = sha1(svg);
    files[fileId] = {
      mimeType: 'image/svg+xml', id: fileId,
      dataURL: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
      created: 1,
    };
    const g = [`adk-group-${++group}`];
    elements.push({ ...base(x, y, SIZE, SIZE, g), type: 'image', fileId, status: 'saved', scale: [1, 1], crop: null });
    const name = short(r);
    elements.push({
      ...base(x - (STEP_X - SIZE) / 2, y + SIZE + 8, STEP_X - 12, 20, g),
      type: 'text', strokeColor: color(r),
      fontSize: 16, fontFamily: 2, text: name, originalText: name,
      textAlign: 'center', verticalAlign: 'top',
      containerId: null, autoResize: true, lineHeight: 1.25,
    });
    if (++col === PER_ROW) { col = 0; row++; }
  }
}

for (const t of titles) {
  const text = `${t.text} · ${t.n}`;
  elements.push({
    ...base(0, t.y + 60, 320, 25, []),
    type: 'text', strokeColor: '#495057',
    fontSize: 20, fontFamily: 2, text, originalText: text,
    textAlign: 'left', verticalAlign: 'top',
    containerId: null, autoResize: true, lineHeight: 1.25,
  });
}

// ─── conformance ──────────────────────────────────────────────────────────
// This route is the secondary one (ADR 0004): with no daily user it would break
// silently at the first change of format. These assertions turn that risk into
// a build failure.
const scene = {
  type: 'excalidraw', version: 2, source: 'https://github.com/Beennnn/architecture-diagram-kit',
  elements,
  appState: { gridSize: 20, gridStep: 5, gridModeEnabled: false, viewBackgroundColor: '#ffffff' },
  files,
};
verify(scene);
// every badge is a group of two elements: the sign and its name
verifyGroups(scene, (t) => t.length === 2 && t.includes('image') && t.includes('text'));
fs.mkdirSync(path.join(ROOT, 'excalidraw'), { recursive: true });
const out = JSON.stringify(scene, null, 2) + '\n';
fs.writeFileSync(path.join(ROOT, 'excalidraw/badges.excalidraw'), out);
console.log(`  excalidraw/badges.excalidraw · ${elements.length} elements · ${Object.keys(files).length} images · ${(out.length / 1024).toFixed(0)} kB · conforming to format ${VERIFIED_VERSION}`);
