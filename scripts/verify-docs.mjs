// The numbers cited in the documentation are checked against reality.
//
// It happened three times in one day that a document asserted something the
// repository had ceased to be: the README recommended the lockup for annotating
// an arrow after we had ruled that out, ADR 0003 announced eight shapes after a
// ninth had been added, and its source table announced 25 products when there
// were 40. A wrong count is more harmful than a missing one: it gives the reader
// a reason not to go and look.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './diagram.mjs';
import { CHROMA_MAX } from './colors.mjs';

const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
// Two thresholds live in the code; the README cites them. We compare against the
// source rather than against a constant copied here, which would drift.
const lockups = fs.readFileSync(path.join(ROOT, 'scripts/lockups.mjs'), 'utf8');
const minContrast = Number(lockups.match(/const MIN_CONTRAST = ([\d.]+)/)[1]);
const count = (type) => mapping.filter((e) => e.type === type).length;
const files = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.svg')).length;

// The ADR index kept itself up to date by hand, and 0007 was not in it: a
// decision taken but impossible to find is worth a decision not taken.
{
  const dir = path.join(ROOT, 'docs/adr');
  const index = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
  const missing = fs.readdirSync(dir)
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .filter((f) => !index.includes(`(${f})`));
  if (missing.length) {
    throw new Error(`Some ADRs are absent from docs/adr/README.md:\n  ${missing.join('\n  ')}`);
  }
}

// The example views: each one must be reachable from the README's table AND
// present as a page of the draw.io file. A view that exists but that nobody can
// find, or that the editable file forgot, is a view that will rot.
const drawioExamples = fs.readFileSync(path.join(ROOT, 'drawio/examples.drawio'), 'utf8');
const exampleViews = fs.readdirSync(path.join(ROOT, 'docs'))
  .filter((f) => /^example-.*\.svg$/.test(f) && !f.endsWith('-dark.svg'));
{
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const unlisted = exampleViews.filter((f) => !readme.includes(`(docs/${f})`));
  if (unlisted.length) {
    throw new Error(`Example views absent from the README's table:\n  ${unlisted.join('\n  ')}`);
  }
  const pages = new Set([...drawioExamples.matchAll(/<diagram id="([^"]+)"/g)].map((m) => m[1]));
  const absent = exampleViews.map((f) => f.replace(/^example-|\.svg$/g, ''))
    .filter((slug) => !pages.has(slug));
  if (absent.length) {
    throw new Error(`Example views with no page in drawio/examples.drawio:\n  ${absent.join('\n  ')}`);
  }
}

const edges = [...drawioExamples.matchAll(/<mxCell[^>]*edge="1"[^>]*>/g)].map((m) => m[0]);
const bothEnds = edges.filter((e) => e.includes(' source="') && e.includes(' target="')).length;

// Every rule: a file, an expression capturing the number, the expected value,
// and enough to tell the author what is wrong.
const RULES = [
  ['README.md', /source of truth: (\d+) protocols/, count('protocol'), 'protocols in protocols.json'],
  ['README.md', /source of truth: (\d+) products/, count('product'), 'products in products.json'],
  ['README.md', /source of truth: (\d+) roles/, count('role'), 'roles in roles.json'],
  ['README.md', /lockups\/horizontal\/\s+(\d+) SVG/, files('lockups/horizontal'), 'files in lockups/horizontal'],
  ['README.md', /lockups\/stacked\/\s+(\d+) SVG/, files('lockups/stacked'), 'files in lockups/stacked'],
  ['README.md', /lockups\/mono\/\s+(\d+) SVG/, files('lockups/mono'), 'files in lockups/mono'],
  ['README.md', /symbols\/\s+(\d+) SVG/, files('symbols'), 'files in symbols'],
  ['README.md', /drawio\/products\.xml\s+draw\.io shape library · (\d+)/, count('product'), 'products in products.json'],
  ['README.md', /drawio\/roles\.xml\s+draw\.io shape library · (\d+)/, count('role'), 'roles in roles.json'],
  ['README.md', /\*\*(\d+) entries\*\* carry `"logotype": true`/, mapping.filter((e) => e.logotype).length, 'entries declared as logotypes'],
  ['README.md', /darkened until it reaches (\d\.\d):1 on its own fill/, minContrast, 'the MIN_CONTRAST threshold in scripts/lockups.mjs'],
  ['README.md', /chroma capped at (\d\.\d\d)/, CHROMA_MAX, 'the CHROMA_MAX ceiling in scripts/colors.mjs'],
  ['excalidraw/README.md', /the (\d+) signs/, mapping.length, 'entries in mapping.json'],
  ['README.md', /The (\d+) views below/, exampleViews.length, 'example views in docs/'],
  ['drawio/README.md', /the (\d+) example views, one per page/, exampleViews.length, 'example views in docs/'],
  ['drawio/README.md', /The (\d+) views appear as/, exampleViews.length, 'example views in docs/'],
  ['drawio/README.md', /here all (\d+) are white/, exampleViews.length, 'pages in examples.drawio'],
  ['drawio/README.md', /(\d+) of the \d+ arrows are bound at both/, bothEnds, 'arrows bound at both ends'],
  ['drawio/README.md', /\d+ of the (\d+) arrows are bound at both/, edges.length, 'arrows in examples.drawio'],
  ['drawio/README.md', /and the (\d+) that are not leave from/, edges.length - bothEnds, 'arrows free at one end'],
];

const errors = [];
for (const [file, pattern, expected, what] of RULES) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = text.match(pattern);
  if (!m) {
    errors.push(`  ${file}: the wording expected by ${pattern} has disappeared — the rule no longer verifies anything.`);
    continue;
  }
  if (Number(m[1]) !== expected) {
    errors.push(`  ${file}: announces ${m[1]}, there are ${expected} ${what}.`);
  }
}
if (errors.length) {
  throw new Error(`The documentation cites wrong numbers:\n${errors.join('\n')}`);
}
console.log(`  documentation: ${RULES.length} numbers checked against the sources`);
