// Records the DECLARATIVE description of each example view, so that a second
// renderer can exist without a second copy of the data.
//
// The views were already declarative — boxes, zones, links, annotations — but
// the description lived inside the SVG generators and died with them. A draw.io
// export written from its own copy of the coordinates would drift from the SVG
// on the first edit, and nothing would catch it: that is exactly the failure
// mode this repository is built to prevent.
//
// The three generators run as separate processes, so the registry is a
// directory rather than a variable: one file per view, written as it is
// rendered, read back by scripts/drawio-examples.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './diagram.mjs';

const DIR = path.join(ROOT, '.cache/views');

// slug = the SVG's basename, so the two outputs of a view stay traceable to
// each other: docs/example-k8s.svg and the “k8s” page of the draw.io file.
export function record(spec) {
  fs.mkdirSync(DIR, { recursive: true });
  const slug = spec.file.replace(/^example-/, '').replace(/\.svg$/, '');
  fs.writeFileSync(path.join(DIR, `${slug}.json`), JSON.stringify({ slug, ...spec }, null, 1) + '\n');
}

export function readAll() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
}
