// Arbitration sheet: the same diagram fragment rendered seven ways, to settle
// the questions “the symbols are beautiful but not visible enough”, “the
// boxes are hard to tell apart” and “the bucket has to be named”.
// Nothing here is the grammar in force: variants B to G are proposals. Only
// variant A uses box() from diagram.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, esc, arrowHead } from './diagram.mjs';
import { FRAG, LINKS, SH, MONO, RENDERINGS } from './fragment.mjs';

const W = 1460, X0 = 300;

// --- the recommendations, written into the sheet ---------------------------
const VERDICTS = {
  rule_out:     ['#C0392F', '#FBECEA', 'RULE OUT'],
  reference:    ['#5B6873', '#F1F3F4', 'EXISTING'],
  take:         ['#0B7A6E', '#E4F2F0', 'TAKE'],
  insufficient: ['#B36208', '#FBF0E2', 'NOT ENOUGH ALONE'],
  recommended:  ['#0B7A6E', '#D8ECE9', 'RECOMMENDED'],
  adr:          ['#7038D8', '#EFE8FB', 'NEEDS AN ADR'],
  proposal:     ['#0B6E7F', '#DDEDF1', 'MY PROPOSAL'],
};
const CARDS = [
  { key: 'A', title: 'Symbol alone, 34 px', sub: 'what exists, + the instance name',
    verdict: 'reference', lever: '—',
    notes: ['Product and instance are both written here — but', 'our six views write only the product today.', 'The boundary has neither symbol nor identity:', 'box() knows only eight shapes out of nine.'] },
  { key: 'B', title: 'Symbol enlarged, 44 px', sub: 'bigger, nothing more',
    verdict: 'rule_out', lever: 'lever 2',
    notes: ['From 12 % to 20 % of the box for the symbol.', 'More ink, not one variable more — and two lines', 'of text to fit under a taller symbol.', 'The cylinder caps at 36 px: it loses 14 px under', 'its ellipse. An unfavourable cost/gain ratio.'] },
  { key: 'C', title: 'One accent per diagram', sub: 'a single coloured subject',
    verdict: 'take', lever: 'lever 1',
    notes: ['Applies step 6 of our own recipe, never once', 'applied to the six existing views.', 'Touches neither the grammar nor the geometry.', 'Free, and combines with any other row.'] },
  { key: 'D', title: 'Lockup + instance', sub: 'product above, instance below',
    verdict: 'insufficient', lever: 'lever 2',
    notes: ['The lockup writes the product, the instance goes', 'underneath: two registers, two typefaces.', 'But its size follows the width of the box:', 'compare “API gateway” and “Kafka”. And its', 'pill is 1.01:1 on “external”: look at S3.'] },
  { key: 'E', title: 'Lockup + widened fills', sub: 'shape = value, layer = tint',
    verdict: 'recommended', lever: 'lever 2',
    notes: ['Same content as D, but the fill encodes the shape:', 'zone light, node grey, application white.', 'The nesting reads without following the borders.', 'Survives greyscale. No ADR needed.'] },
  { key: 'F', title: 'The lockup becomes the box', sub: 'instance as title, product as subtitle',
    verdict: 'adr', lever: 'lever 3',
    notes: ['Inverts the hierarchy: the instance becomes the', 'title, the product drops to subtitle.', 'The only rendering that truly answers “name the', 'bucket”. But colour carries alone.'] },
  { key: 'G', title: 'The combination', sub: 'fills of E, hierarchy of F, accent of C',
    verdict: 'proposal', lever: 'lever 2',
    notes: ['The fill encodes the shape, the instance is the',
            'title, the product the subtitle, one subject only',
            'is accented. The symbol keeps its pill: it alone',
            'carries the brand colour, and logos get recognised.',
            'Survives greyscale, and needs no ADR.'] },
];

// --- assembly --------------------------------------------------------------
const NOTE_WIDTH = 52;  // left column: 48 → X0, at a 10 px font
for (const c of CARDS) for (const n of c.notes) {
  if (n.length > NOTE_WIDTH) throw new Error(`Note too long (${n.length} > ${NOTE_WIDTH}), it would run under the boxes: “${n}”`);
}
const CH = 346, CG = 14, Y0 = 118;
let out = '';
CARDS.forEach((c, k) => {
  const y = Y0 + k * (CH + CG);
  const [vInk, vFill, vText] = VERDICTS[c.verdict];
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`;
  out += `<text x="48" y="${y + 32}" font-size="19" font-weight="700" fill="${INK}">${c.key}</text>`;
  out += `<text x="70" y="${y + 32}" font-size="15" font-weight="700" fill="${INK}">${esc(c.title)}</text>`;
  out += `<text x="70" y="${y + 49}" font-size="11.5" fill="${SOFT}">${esc(c.sub)}</text>`;
  const lg = vText.length * 6.2 + 18;
  out += `<rect x="48" y="${y + 60}" width="${lg}" height="19" rx="9.5" fill="${vFill}" stroke="${vInk}" stroke-width="1.1"/>`
       + `<text x="${48 + lg / 2}" y="${y + 73.5}" text-anchor="middle" font-size="9.5" font-weight="700"`
       + ` font-family="${MONO}" fill="${vInk}">${vText}</text>`;
  out += `<text x="${48 + lg + 10}" y="${y + 73.5}" font-size="9.5" font-weight="600" font-family="${MONO}" fill="${RULE}">${c.lever}</text>`;
  c.notes.forEach((n, j) => {
    out += `<text x="48" y="${y + 100 + j * 14}" font-size="10" fill="${SOFT}">${esc(n)}</text>`;
  });

  // The fragment, translated under the card's header.
  const sy = y + 34;
  out += `<g transform="translate(${X0} ${sy})">`;
  for (const [a, b, yl] of LINKS) {
    const g = FRAG[a], d = FRAG[b];
    out += `<line x1="${g.x + g.w}" y1="${yl}" x2="${d.x - 5}" y2="${yl}" stroke="${RULE}" stroke-width="1.5" marker-end="url(#fl)"/>`;
  }
  // Containers first: they sit underneath.
  for (const n of FRAG) if (n.container) out += RENDERINGS[c.key](n);
  for (const n of FRAG) if (!n.container) out += RENDERINGS[c.key](n);
  // A shape label, so that the vertical comparison stays possible.
  for (const n of FRAG) {
    out += `<text x="${n.x + 2}" y="${n.y - 5}" font-size="8.5" font-weight="700" letter-spacing="0.6"`
         + ` font-family="${MONO}" fill="#A9B4BE">${esc(n.shape.toUpperCase())}</text>`;
  }
  out += `</g>`;
});

// Geometric checks: this sheet has already produced three collisions.
for (const n of FRAG) {
  if (!n.container && n.h < 92) throw new Error(`${n.slug}: ${n.h} px are not enough for a symbol and two lines.`);
  const parent = FRAG.find((p) => p.container && p !== n && n.x > p.x && n.x + n.w < p.x + p.w && n.y > p.y && n.y + n.h < p.y + p.h
    && !FRAG.some((q) => q.container && q !== p && q !== n && q.x > p.x && n.x > q.x));
  if (parent && n.y - 5 < parent.y + 72) {
    throw new Error(`Label of ${n.slug} (y=${n.y - 5}) inside the title block of ${parent.slug} (down to y=${parent.y + 72}).`);
  }
}

const H = Y0 + CARDS.length * (CH + CG) + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Seven candidate renderings for diagram nodes, with a recommendation">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/><defs>${arrowHead()}</defs>`
  + `<text x="24" y="46" font-size="23" font-weight="700" fill="${INK}">Seven candidate renderings for a diagram node</text>`
  + `<text x="24" y="70" font-size="12.5" fill="${SOFT}">The same fragment on every row — the nine shapes of ADR 0003, two of them containers — so the comparison bears on the rendering and nothing else.</text>`
  + `<text x="24" y="90" font-size="12.5" fill="${SOFT}">Every node carries two names: the product, which the lockup can write, and the instance, which the lockup alone will never write. Each row's verdict is my opinion, not a decision.</text>`
  + out
  + `<line x1="24" y1="${H - 56}" x2="${W - 24}" y2="${H - 56}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 34}" font-size="12" fill="${SOFT}">Recommendation: <tspan font-weight="700" fill="${INK}">G</tspan>, which combines the three compatible levers — and <tspan font-weight="700" fill="${INK}">C</tspan> alone if nothing is to be touched. B should be ruled out, D is not enough on its own, F cannot be decided without an ADR.</text>`
  + `<text x="24" y="${H - 16}" font-size="10.5" fill="${RULE}">None of this is applied: only row A matches the state of the repository. Sheet generated by scripts/specimen-candidates.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Non-finite coordinate in the candidates sheet.');
fs.writeFileSync(path.join(ROOT, 'docs/candidates-nodes.svg'), svg);
console.log(`docs/candidates-nodes.svg — ${W}x${H}, ${CARDS.length} renderings`);
