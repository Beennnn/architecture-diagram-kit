// The figures used by the README. They are generated from the real assets —
// the same box(), the same FILLS, the same lockup files — so that an
// illustration cannot drift from what the repository actually produces. A
// hand-drawn figure would be a claim; these are a rendering.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, STROKE, RULE, esc, read, dim, symbol, box, FILLS, NESTED_FILL, ACCENT } from './diagram.mjs';
import { contrast, readableInk } from './colors.mjs';

const OUT = path.join(ROOT, 'docs/figures');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const SANS = "'IBM Plex Sans','Helvetica Neue',Arial,sans-serif";
const MONO = "'IBM Plex Mono',monospace";
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''}`
  + ` font-size="${o.f || 12}"${o.m ? ` font-family="${MONO}"` : ''}`
  + `${o.w ? ` font-weight="${o.w}"` : ''} fill="${o.c || SOFT}">${esc(s)}</text>`;

const page = (w, h, label, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"`
  + ` font-family="${SANS}" role="img" aria-label="${esc(label)}">`
  + `<rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>\n`;

const write = (name, w, h, label, body) => {
  const svg = page(w, h, label, body);
  if (/NaN|undefined/.test(svg)) throw new Error(`non-finite coordinate in ${name}`);
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(`  docs/figures/${name} · ${w}×${h}`);
};

// A lockup file laid at a position, at its natural size.
const lockup = (dir, slug, x, y, scale = 1) => {
  const raw = read(`${dir}/${slug}.svg`);
  const w = dim(raw, 'width') * scale, h = dim(raw, 'height') * scale;
  return {
    w, h,
    svg: raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
      `<svg x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`),
  };
};

/* ── 0 · the banner ───────────────────────────────────────────────────── */
{
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
  const W = 1200, H = 300;
  let g = `<rect width="${W}" height="${H}" fill="#F7F9FA"/>`
    + `<rect x="0" y="${H - 4}" width="${W}" height="4" fill="${ACCENT}"/>`;

  // The shapes, drawn small along the top: the grammar is half the project.
  const SH = ['service', 'application', 'store', 'stream', 'actor', 'device', 'node', 'external', 'boundary'];
  SH.forEach((k, i) => {
    const x = 56 + i * 86, y = 46;
    if (k === 'store') {
      g += `<path d="M${x} ${y + 8} v28 a30 8 0 0 0 60 0 v-28" fill="${FILLS[k]}" stroke="${STROKE}" stroke-width="1.4"/>`
        + `<ellipse cx="${x + 30}" cy="${y + 8}" rx="30" ry="8" fill="${FILLS[k]}" stroke="${STROKE}" stroke-width="1.4"/>`;
    } else {
      const rx = { stream: 22, external: 8, actor: 10, application: 10, device: 3, node: 2, boundary: 12 }[k] ?? 0;
      const dash = k === 'external' ? ' stroke-dasharray="5 4"' : k === 'boundary' ? ' stroke-dasharray="8 6"' : '';
      const stroke = k === 'external' || k === 'boundary' ? RULE : STROKE;
      g += `<rect x="${x}" y="${y}" width="60" height="44" rx="${rx}" fill="${FILLS[k]}" stroke="${stroke}" stroke-width="${k === 'node' ? 2 : 1.4}"${dash}/>`;
    }
    g += T(x + 30, y + 62, k, { f: 8.5, m: 1, a: 'middle', c: RULE });
  });

  g += T(56, 168, 'Architecture Diagram Kit', { f: 38, w: 700, c: INK });
  g += T(56, 200, 'Rights-free badges and an executable shape grammar, for people who draw architecture.', { f: 15 });
  g += T(56, 226, `${map.length} entries · ${map.length * 4} SVG · 4 layouts · draw.io and Excalidraw libraries · 9 views that prove the rules`,
    { f: 12, m: 1, c: RULE });

  // A strip of real badges: the other half of the project, at natural size.
  const STRIP = ['kubernetes', 'kafka', 'postgresql', 'https', 'api-gateway', 'pytorch', 'queue', 'vault'];
  let x = 56;
  for (const slug of STRIP) {
    const l = lockup('lockups/horizontal', slug, x, 248, 0.86);
    if (x + l.w > W - 56) break;
    g += l.svg; x += l.w + 9;
  }
  write('banner.svg', W, H, 'Architecture Diagram Kit — rights-free badges and an executable shape grammar', g);
}

/* ── 1 · the four layouts ─────────────────────────────────────────────── */
{
  const COLS = [
    ['symbols', 'symbols/', 'the sign alone', 'the default inside a diagram'],
    ['lockups/horizontal', 'lockups/horizontal/', 'sign left, name right', 'a slide, a README, a web page'],
    ['lockups/stacked', 'lockups/stacked/', 'sign above, name below', 'a grid of logos, a footer'],
    ['lockups/mono', 'lockups/mono/', 'horizontal, single ink', 'black-and-white printing'],
  ];
  const W = 1000, X = 30, STEP = (W - 60) / 4;
  let g = T(X, 30, 'One entry, four layouts', { f: 15, w: 700, c: INK })
    + T(X, 50, 'Every one of the 191 entries is produced in all four. Kafka, at natural size.', { f: 12 });
  COLS.forEach(([dir, name, what, use], i) => {
    const x = X + i * STEP;
    g += `<rect x="${x}" y="${70}" width="${STEP - 18}" height="150" rx="9" fill="#FCFDFD" stroke="#E3E7EA"/>`;
    const l = lockup(dir, 'kafka', 0, 0);
    const cx = x + (STEP - 18) / 2 - l.w / 2, cy = 100 + (84 - l.h) / 2;
    g += lockup(dir, 'kafka', cx, cy).svg;
    g += T(x + 14, 205, name, { f: 11, m: 1, c: '#0B6E7F' });
    g += T(x + 14, 190, what, { f: 11.5, w: 600, c: INK });
    g += T(x + 14, 240, use, { f: 11 });
  });
  write('layouts.svg', W, 260, 'The four layouts of one entry', g);
}

/* ── 2 · the nine shapes ──────────────────────────────────────────────── */
{
  const SHAPES = [
    ['service', 'a component that runs code'],
    ['application', 'something a person interacts with'],
    ['store', 'data that survives a restart'],
    ['stream', 'a queue, a topic, a bus'],
    ['actor', 'a person, or their workstation'],
    ['device', 'physical equipment outside the IS'],
    ['node', 'a machine that hosts'],
    ['external', 'a system outside our control'],
    ['boundary', 'a zone: network, trust, deployment'],
  ];
  const W = 1000, BW = 280, BH = 92, GX = 40, GY = 118, SX = 320, SY = 132;
  let g = T(30, 30, 'The nine shapes', { f: 15, w: 700, c: INK })
    + T(30, 50, 'The shape encodes the NATURE of an object, never its importance nor its state.', { f: 12 })
    + T(30, 68, 'Drawn here by box() itself — the same primitive every view uses.', { f: 11, c: RULE });
  SHAPES.forEach(([k, what], i) => {
    const x = GX + (i % 3) * SX, y = GY + Math.floor(i / 3) * SY;
    g += box({ x, y, w: BW, h: BH, shape: k });
    g += T(x + 16, y + 34, k, { f: 13, m: 1, w: 600, c: INK });
    g += T(x + 16, y + 54, what, { f: 11 });
    g += T(x + 16, y + 74, `fill ${FILLS[k]} · ${contrast(FILLS[k], '#FFFFFF').toFixed(3)}:1 on white`,
      { f: 9.5, m: 1, c: RULE });
  });
  const y = GY + 3 * SY;
  g += box({ x: GX, y, w: BW, h: BH, shape: 'service', featured: true });
  g += T(GX + 16, y + 34, 'featured', { f: 13, m: 1, w: 600, c: ACCENT });
  g += T(GX + 16, y + 54, 'the subject of the diagram — at most one', { f: 11 });
  g += T(GX + 16, y + 74, `${ACCENT} · not a seventh layer`, { f: 9.5, m: 1, c: RULE });
  g += box({ x: GX + SX, y, w: BW, h: BH, shape: 'boundary', nested: true });
  g += T(GX + SX + 16, y + 34, 'boundary, nested', { f: 13, m: 1, w: 600, c: INK });
  g += T(GX + SX + 16, y + 54, 'a zone inside another zone', { f: 11 });
  g += T(GX + SX + 16, y + 74, `fill ${NESTED_FILL.boundary} · one step darker`, { f: 9.5, m: 1, c: RULE });
  write('shapes.svg', W, y + BH + 40, 'The nine shapes of the grammar', g);
}

/* ── 3 · the colours ──────────────────────────────────────────────────── */
{
  const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));
  const W = 1000;
  let g = T(30, 30, 'Six layer colours, one accent', { f: 15, w: 700, c: INK })
    + T(30, 50, 'A protocol or a role has no colour of its own: it inherits its layer’s. Six hues, not 191. Light theme on top, dark below.', { f: 12 });
  const entries = Object.entries(layers);
  const CW = (W - 60) / entries.length;
  entries.forEach(([k, c], i) => {
    const x = 30 + i * CW;
    g += `<rect x="${x}" y="72" width="${CW - 12}" height="30" rx="6" fill="${c.light}"/>`;
    g += `<rect x="${x}" y="106" width="${CW - 12}" height="30" rx="6" fill="${c.dark}"/>`;
    g += T(x, 154, c.label, { f: 11.5, w: 600, c: INK });
    g += T(x, 170, `${c.light} · ${c.dark}`, { f: 9.5, m: 1, c: RULE });
  });
  g += T(30, 214, 'The badge fill is computed, not chosen', { f: 13, w: 600, c: INK });
  g += T(30, 232, 'Every fill is set on the same luminance (0.87) and its chroma capped at 0.20, so no badge shouts louder than another.', { f: 11 });
  const SAMPLE = ['duckdb', 'kafka', 'postgresql', 'bittorrent', 'rss', 'vault', 'linux', 'springboot'];
  let x = 30;
  for (const slug of SAMPLE) {
    const l = lockup('lockups/horizontal', slug, x, 250);
    if (x + l.w > W - 30) break;
    g += l.svg; x += l.w + 10;
  }
  g += T(30, 336, 'The accent', { f: 13, w: 600, c: INK });
  g += T(30, 354, 'One colour, reserved for “this is the subject of this diagram”. It is absent from the layer palette, the legend names it', { f: 11 });
  g += T(30, 370, 'separately, and it carries a thicker stroke — because under deuteranopia this magenta and the Files teal are the same colour.', { f: 11 });
  g += `<rect x="30" y="386" width="150" height="34" rx="6" fill="#FFFFFF" stroke="${ACCENT}" stroke-width="3.2"/>`;
  g += T(46, 408, 'accented subject', { f: 12, w: 600, c: ACCENT });
  g += `<rect x="200" y="386" width="150" height="34" rx="6" fill="#FFFFFF" stroke="${STROKE}" stroke-width="1.6"/>`;
  g += T(216, 408, 'everything else', { f: 12, c: INK });
  g += T(370, 408, `${ACCENT} · 3.2 px, thicker than any normal stroke`, { f: 10, m: 1, c: RULE });
  write('colours.svg', W, 450, 'The six layer colours, the computed fill and the accent', g);
}

/* ── 4 · how the set is organised ─────────────────────────────────────── */
{
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
  const count = (t) => map.filter((e) => e.type === t).length;
  const COLS = [
    ['protocols.json', count('protocol'), 'What crosses a boundary. A protocol annotates an arrow, never a box.',
      ['https', 'mqtt', 'grpc', 'smtp']],
    ['products.json', count('product'), 'A named technology, with its official logo whenever one is redistributable.',
      ['kafka', 'postgresql', 'kubernetes', 'pytorch']],
    ['roles.json', count('role'), 'What a building block DOES, independently of the product implementing it.',
      ['api-gateway', 'cache', 'queue', 'data-lake']],
  ];
  // Wrapping on words: slicing at a fixed character count cut “whenever” in half.
  const wrap = (text, max) => {
    const out = []; let line = '';
    for (const w of text.split(' ')) {
      if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
    return out;
  };
  const W = 1000, CW = (W - 60) / 3, CARD_Y = 74, LIST_Y = 190, STEP = 41.4;
  const CARD_H = LIST_Y - CARD_Y + 4 * STEP + 8;
  let g = T(30, 30, 'Three populations, three source files', { f: 15, w: 700, c: INK })
    + T(30, 50, 'A role is what lets you draw a diagram before the technology has been chosen: “cache”, not “Redis”.', { f: 12 });
  COLS.forEach(([file, n, what, slugs], i) => {
    const x = 30 + i * CW;
    g += `<rect x="${x}" y="${CARD_Y}" width="${CW - 16}" height="${CARD_H}" rx="9" fill="#FCFDFD" stroke="#E3E7EA"/>`;
    g += T(x + 16, 102, file, { f: 12.5, m: 1, w: 600, c: '#0B6E7F' });
    g += T(x + 16, 122, `${n} entries`, { f: 11, m: 1, c: RULE });
    wrap(what, 44).forEach((l, j) => { g += T(x + 16, 146 + j * 15, l, { f: 11 }); });
    slugs.forEach((sl, j) => { g += lockup('lockups/horizontal', sl, x + 16, LIST_Y + j * STEP, 0.78).svg; });
  });
  write('populations.svg', W, CARD_Y + CARD_H + 26, 'The three populations of the set', g);
}

/* ── 5 · what a draw.io library ships ─────────────────────────────────── */
{
  const W = 1000;
  let g = T(30, 30, 'What the draw.io libraries ship', { f: 15, w: 700, c: INK })
    + T(30, 50, 'The sign alone. draw.io writes the name itself, as the shape’s label — so it stays searchable, editable and real text on export.', { f: 12 });
  g += `<rect x="30" y="80" width="300" height="150" rx="9" fill="#FCFDFD" stroke="#E3E7EA"/>`;
  g += T(46, 106, 'in the library', { f: 11, m: 1, c: RULE });
  g += symbol('kafka', 60, 124, 48);
  g += symbol('postgresql', 124, 124, 48);
  g += symbol('https', 188, 124, 48);
  g += T(46, 200, 'a 48 × 48 sign, no text', { f: 11 });
  g += `<path d="M346,155 H406" fill="none" stroke="${RULE}" stroke-width="1.6" marker-end="url(#fa)"/>`;
  g += `<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9" fill="none" stroke="${RULE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
  g += `<rect x="420" y="80" width="550" height="150" rx="9" fill="#FCFDFD" stroke="#E3E7EA"/>`;
  g += T(436, 106, 'on the canvas', { f: 11, m: 1, c: RULE });
  g += symbol('kafka', 460, 124, 48);
  g += T(460, 192, 'Kafka', { f: 12, w: 600, c: readableInk('#231F20', '#FFFFFF', 4.5) });
  g += symbol('https', 560, 124, 48);
  g += T(552, 192, 'HTTPS :8443', { f: 12, w: 600, c: '#1B5FD9' });
  g += T(700, 150, 'the label is written by draw.io:', { f: 11 });
  g += T(700, 168, 'Ctrl+F finds it, you can edit it in place,', { f: 11 });
  g += T(700, 186, 'and it exports as real text.', { f: 11 });
  write('drawio.svg', W, 256, 'What a draw.io library entry contains', g);
}
