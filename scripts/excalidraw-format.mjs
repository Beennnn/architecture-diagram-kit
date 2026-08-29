// The Excalidraw scene format, shared by the generators. Extracted from
// excalidraw.mjs so that the grammar library writes exactly the same structure:
// two copies would have diverged at the first change of format.
import crypto from 'node:crypto';

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

let n = 0;
export const id = () => `adk-${String(++n).padStart(4, '0')}`;
export const fixed = () => 1; // constant seed and version: the scene must be reproducible

export const base = (x, y, w, h, groupIds) => ({
  id: id(), x, y, width: w, height: h, angle: 0,
  strokeColor: '#1e1e1e', backgroundColor: 'transparent',
  fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
  roundness: null, roughness: 0, opacity: 100,
  seed: fixed(), version: fixed(), versionNonce: fixed(), index: null,
  isDeleted: false, groupIds, frameId: null, boundElements: null,
  updated: 1, link: null, locked: false,
});


export const VERIFIED_VERSION = '0.18.1';   // the @excalidraw/excalidraw the format was read from

export function verify(sc) {
  const err = (m) => { throw new Error(`non-conforming Excalidraw scene: ${m}`); };
  if (sc.type !== 'excalidraw' || sc.version !== 2) err('unexpected type or version');
  if (!sc.files || typeof sc.files !== 'object') err('“files” missing — the very thing a library does not carry');

  const ids = new Set();
  const BASE = ['id', 'x', 'y', 'width', 'height', 'angle', 'strokeColor', 'backgroundColor',
    'fillStyle', 'strokeWidth', 'strokeStyle', 'roundness', 'roughness', 'opacity', 'seed',
    'version', 'versionNonce', 'index', 'isDeleted', 'groupIds', 'frameId', 'boundElements',
    'updated', 'link', 'locked'];

  for (const e of sc.elements) {
    for (const c of BASE) if (!(c in e)) err(`field “${c}” missing on ${e.id}`);
    if (ids.has(e.id)) err(`duplicate identifier: ${e.id}`);
    ids.add(e.id);
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) err(`non-finite coordinate on ${e.id}`);
    if (e.type === 'image') {
      if (!sc.files[e.fileId]) err(`image ${e.id} references a fileId absent from “files”`);
      if (e.status !== 'saved') err(`image ${e.id} is not marked “saved”`);
    }
    if (e.type === 'text' && e.text !== e.originalText) err(`text and originalText diverge on ${e.id}`);
  }

  for (const [k, f] of Object.entries(sc.files)) {
    if (f.id !== k) err(`key and id diverge for file ${k}`);
    const pref = 'data:image/svg+xml;base64,';
    if (!f.dataURL.startsWith(pref)) err(`malformed dataURL for ${k}`);
    const svg = Buffer.from(f.dataURL.slice(pref.length), 'base64').toString('utf8');
    if (!svg.startsWith('<svg') || !svg.trimEnd().endsWith('</svg>')) err(`file ${k} does not decode back to SVG`);
    if (sha1(svg) !== k) err(`file ${k} is not named by the digest of its content`);
  }
}

// A composition check, kept apart: it belongs not to the format but to the
// scene that uses it. The badge sheet wants sign + name pairs; the grammar sheet
// groups a rectangle and an ellipse for its cylinder.
export function verifyGroups(sc, expected) {
  const byGroup = {};
  for (const e of sc.elements) for (const g of e.groupIds) (byGroup[g] ||= []).push(e.type);
  const wrong = Object.entries(byGroup).filter(([, t]) => !expected(t));
  if (wrong.length) {
    throw new Error(`${wrong.length} group(s) of unexpected composition: `
      + wrong.map(([g, t]) => `${g} = [${t.join(', ')}]`).join(' · '));
  }
}
