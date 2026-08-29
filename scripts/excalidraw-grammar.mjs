// The shape grammar, carried into Excalidraw.
//
// It degrades there, and the sheet says so rather than passing it over in
// silence. What is verified: strokeWidth takes only 1, 2 or 4 — thin, bold,
// extra bold. The interface offers two roundnesses only, sharp or round, with no
// radius exposed. And there is no cylinder among the shapes.
//
// What I cannot assert: the format carries a “value” field on roundness, so a
// radius may be expressible in the JSON. It would make no difference here in any
// case, since a user toggling roundness in the application starts again from the
// two presets.
//
// This is the very reason ADR 0004 files this route second: it is for sketching,
// draw.io is for producing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, FILLS, NESTED_FILL, ACCENT, ACCENT_WEIGHT, STROKE, RULE, INK } from './diagram.mjs';
import { base, verify, verifyGroups, VERIFIED_VERSION } from './excalidraw-format.mjs';

// Excalidraw accepts three weights only — thin, bold, extra bold.
const weight = (px) => (px >= 3 ? 4 : px >= 2 ? 2 : 1);
// And two roundnesses: sharp, or “round” with a radius of its own choosing.
const roundness = (rx) => (rx > 0 ? { type: 3 } : null);

const SHAPES = [
  { key: 'service', name: 'Service', rx: 0, weight: 1.6, fill: FILLS.service, stroke: STROKE },
  { key: 'application', name: 'Application', rx: 10, weight: 1.6, fill: FILLS.application, stroke: STROKE },
  { key: 'stream', name: 'Stream', rx: 40, weight: 1.6, fill: FILLS.stream, stroke: STROKE, loss: 'the capsule becomes a rounded rectangle' },
  { key: 'store', name: 'Store', rx: 0, weight: 1.6, fill: FILLS.store, stroke: STROKE, cylinder: true, loss: 'no native cylinder: a rectangle and an ellipse, grouped' },
  { key: 'actor', name: 'Actor', rx: 10, weight: 1.6, fill: FILLS.actor, stroke: STROKE },
  { key: 'device', name: 'Device', rx: 3, weight: 1.6, fill: FILLS.device, stroke: STROKE, loss: 'the same roundness as “application”' },
  { key: 'node', name: 'Deployment node', rx: 2, weight: 2.4, fill: FILLS.node, stroke: STROKE },
  { key: 'external', name: 'External', rx: 8, weight: 1.6, fill: FILLS.external, stroke: RULE, dashed: true },
  { key: 'boundary', name: 'Zone', rx: 12, weight: 1.3, fill: FILLS.boundary, stroke: RULE, dashed: true, loss: 'the 5-4 and 8-6 dashes become one' },
  { key: 'boundary2', name: 'Nested zone', rx: 12, weight: 1.3, fill: NESTED_FILL.boundary, stroke: RULE, dashed: true },
  { key: 'featured', name: 'Subject of the diagram', rx: 0, weight: ACCENT_WEIGHT, fill: FILLS.service, stroke: ACCENT, ink: ACCENT },
];

const W = 200, H = 96, STEP_X = 260, STEP_Y = 170, COLS = 4;
const elements = [];

const text = (x, y, w, content, size, color) => ({
  ...base(x, y, w, size * 1.25, []),
  type: 'text', strokeColor: color,
  fontSize: size, fontFamily: 2, text: content, originalText: content,
  textAlign: 'center', verticalAlign: 'top',
  containerId: null, autoResize: true, lineHeight: 1.25,
});

SHAPES.forEach((f, i) => {
  const x = 40 + (i % COLS) * STEP_X, y = 120 + Math.floor(i / COLS) * STEP_Y;
  const common = {
    strokeColor: f.stroke, backgroundColor: f.fill, fillStyle: 'solid',
    strokeWidth: weight(f.weight), strokeStyle: f.dashed ? 'dashed' : 'solid',
  };
  if (f.cylinder) {
    // A cylinder is composed: this is what a user would do by hand.
    const g = [`grp-${f.key}`];
    elements.push({ ...base(x, y + 14, W, H - 14, g), type: 'rectangle', ...common, roundness: null });
    elements.push({ ...base(x, y, W, 28, g), type: 'ellipse', ...common, roundness: null });
  } else {
    elements.push({ ...base(x, y, W, H, []), type: 'rectangle', ...common, roundness: roundness(f.rx) });
  }
  elements.push(text(x, y + H + 10, W, f.name, 14, f.ink || INK));
  if (f.loss) elements.push(text(x, y + H + 32, W, `⚠ ${f.loss}`, 11, '#B36208'));
});

const yNote = 120 + Math.ceil(SHAPES.length / COLS) * STEP_Y + 20;
const NOTE = [
  'What the grammar loses on its way into Excalidraw',
  '',
  'Excalidraw offers three stroke weights only (thin, bold, extra bold): our 1.3 · 1.6 · 2.4 · 3.2 px collapse to 1 · 1 · 2 · 4.',
  'Its interface offers two roundnesses, sharp or round, with no radius exposed: rx 3, 8, 10 and 12 become the same corner.',
  'It has no cylinder: the store is a rectangle and an ellipse grouped, which nothing stops anyone from separating.',
  'Its dashes are not parameterisable: “external” and “zone” are told apart by their fill alone.',
  '',
  'The fills, on the other hand, come through exactly — and they are what carries shape and nesting since ADR 0007.',
  'Sketch here, produce in draw.io: that is the sense of ADR 0004.',
];
NOTE.forEach((l, i) => {
  elements.push({ ...text(40, yNote + i * 20, 1000, l, i === 0 ? 18 : 13, i === 0 ? INK : '#5B6873'), textAlign: 'left' });
});

const scene = {
  type: 'excalidraw', version: 2, source: 'https://github.com/Beennnn/architecture-diagram-kit',
  elements, appState: { gridSize: null, viewBackgroundColor: '#ffffff' }, files: {},
};
verify(scene);
// the only group on this sheet is the composed cylinder
verifyGroups(scene, (t) => t.length === 2 && t.includes('rectangle') && t.includes('ellipse'));

// Check: every fill of the grammar must be present, otherwise the scene ships a
// stale version of the ADR 0007 scale.
const fills = new Set(elements.map((e) => e.backgroundColor));
for (const [shape, fill] of Object.entries(FILLS)) {
  if (!fills.has(fill)) throw new Error(`grammar.excalidraw: the fill of “${shape}” (${fill}) does not appear in it.`);
}

const out = JSON.stringify(scene, null, 2) + '\n';
fs.mkdirSync(path.join(ROOT, 'excalidraw'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'excalidraw', 'grammar.excalidraw'), out);
console.log(`  excalidraw/grammar.excalidraw · ${elements.length} elements · ${SHAPES.length} shapes · ${SHAPES.filter((f) => f.loss).length} documented losses · format ${VERIFIED_VERSION}`);
