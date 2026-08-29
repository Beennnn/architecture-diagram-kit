// Generates specimen/styles.html: a comparator of visual treatments, judged in
// the real context of an architecture diagram.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// This sheet covers protocols only; the products have their own sheet in
// specimen/lockups.html.
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'))
  .filter((r) => r.type === 'protocol');
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));

const familyToLayer = {};
for (const [key, c] of Object.entries(layers)) for (const f of c.families) familyToLayer[f] = key;

const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The inner content of a Tabler SVG, repacked into a nested <svg> we can size.
const inner = (svg) => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

const glyph = (slug, x, y, size) => {
  const r = bySlug[slug];
  return `<svg class="chip-ico" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner(r.tSvg)}</svg>`;
};

const colorOf = (slug) => `var(--c-${familyToLayer[bySlug[slug].family]})`;

// A chip: a compact variant (square) plus a label variant (icon + name); the CSS
// shows only one of them, depending on the treatment chosen.
function chip(slug, cx, cy, { box = 26, ico = 16, label = null } = {}) {
  const r = bySlug[slug];
  const name = label ?? r.label;
  const rx = Math.round(box * 0.27);
  const lw = Math.round(name.length * 6.5 + ico + 22);
  const lh = Math.round(box * 0.92);
  return `<g class="chip" style="--c:${colorOf(slug)}">
      <g class="chip--compact">
        <rect class="chip-bg" x="${cx - box / 2}" y="${cy - box / 2}" width="${box}" height="${box}" rx="${rx}"></rect>
        ${glyph(slug, cx - ico / 2, cy - ico / 2, ico)}
      </g>
      <g class="chip--label">
        <rect class="chip-bg" x="${cx - lw / 2}" y="${cy - lh / 2}" width="${lw}" height="${lh}" rx="${lh / 2}"></rect>
        ${glyph(slug, cx - lw / 2 + 10, cy - ico / 2, ico)}
        <text class="chip-txt" x="${cx - lw / 2 + 14 + ico}" y="${cy}" dominant-baseline="central">${esc(name)}</text>
      </g>
    </g>`;
}

/* --------------------------------------------------------------- diagram */
// 130 px between boxes: that is the width the “label” variant demands. A
// tighter diagram rules this treatment out.
const N = [
  { x: 40,  y: 44,  t: 'Browser',         s: 'workstation' },
  { x: 320, y: 44,  t: 'Reverse proxy',   s: 'nginx' },
  { x: 600, y: 44,  t: 'API gateway',     s: 'edge' },
  { x: 880, y: 44,  t: 'Accounts service', s: 'container' },
  { x: 40,  y: 196, t: 'Admin desk',      s: 'operations' },
  { x: 600, y: 196, t: 'Broker',          s: 'RabbitMQ' },
  { x: 880, y: 196, t: 'Mail relay',      s: 'outbound' },
];
const NW = 150, NH = 64;

const nodes = N.map((n) => `<g class="node">
      <rect x="${n.x}" y="${n.y}" width="${NW}" height="${NH}" rx="10"></rect>
      <text class="node-t" x="${n.x + NW / 2}" y="${n.y + 26}">${esc(n.t)}</text>
      <text class="node-s" x="${n.x + NW / 2}" y="${n.y + 45}">${esc(n.s)}</text>
    </g>`).join('\n    ');

const links = [
  { d: 'M190,76 H312',            chip: ['https', 251, 76] },
  { d: 'M470,76 H592',            chip: ['http',  531, 76] },
  { d: 'M750,76 H872',            chip: ['grpc',  811, 76] },
  { d: 'M115,196 V152 H395 V116', chip: ['ssh',   251, 152] },
  { d: 'M675,108 V188',           chip: ['amqp',  675, 152] },
  { d: 'M750,228 H872',           chip: ['smtp',  811, 228] },
];
const edges = links.map((l) => `<path class="edge" d="${l.d}" marker-end="url(#arrow)"></path>`).join('\n    ');
const chips = links.map((l) => chip(l.chip[0], l.chip[1], l.chip[2], { label: bySlug[l.chip[0]].label.split(' /')[0] })).join('\n    ');

const diagram = `<svg class="diagram" viewBox="0 0 1070 300" role="img" aria-label="Architecture diagram annotated by protocol">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,1 L9,5 L0,9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
    </defs>
    ${edges}
    ${nodes}
    ${chips}
  </svg>`;

/* ---------------------------------------------------------- scale test */
const SIZES = [16, 20, 24, 32, 48];
const scale = ['https', 'mqtt', 'ssh'].map((slug) => `<div class="scale-row">
      <span class="scale-name">${esc(bySlug[slug].label)}</span>
      ${SIZES.map((t) => {
        const ico = Math.round(t * 0.62);
        const name = bySlug[slug].label.split(' /')[0];
        const lw = Math.round(name.length * 6.5 + ico + 22);
        const w = Math.max(lw + 8, t + 8);
        return `<figure class="scale-cell">
        <svg class="chipbox" viewBox="0 0 ${w} ${t + 8}" style="height:${t + 8}px;width:${w}px">${chip(slug, w / 2, (t + 8) / 2, { box: t, ico, label: name })}</svg>
        <figcaption>${t} px</figcaption>
      </figure>`;
      }).join('\n      ')}
    </div>`).join('\n    ');

/* --------------------------------------------------- all 32 in one style */
const grid = rows.map((r) => {
  const name = r.label.split(' /')[0];
  const lw = Math.round(name.length * 6.5 + 20 + 22);
  const w = Math.max(lw + 8, 44);
  return `<article class="gcell" data-layer="${familyToLayer[r.family]}">
        <svg class="chipbox" viewBox="0 0 ${w} 44" style="height:44px;width:${w}px">${chip(r.slug, w / 2, 22, { box: 32, ico: 20, label: name })}</svg>
        <h3>${esc(r.label)}</h3>
      </article>`;
}).join('\n      ');

const legend = Object.entries(layers).map(([key, c]) =>
  `<li><span class="swatch" style="background:var(--c-${key})"></span>${esc(c.label)}<em>${rows.filter((r) => c.families.includes(r.family)).length}</em></li>`
).join('\n        ');

const STYLES = [
  ['etiquette', 'Label',           'CHOSEN. Icon + protocol name on a tinted ground. Formal, with no possible ambiguity. Needs at least 130 px between two boxes.'],
  ['douce',     'Tinted chip',      'The fallback when the diagram is too tight for a label: same ground, same colour, without the name.'],
  ['contour',   'Outlined chip',    'Canvas ground, a coloured 1.5 px rule. Discreet, but the rule gives way at 16 px.'],
  ['nu',        'Bare stroke',      'The glyph alone, with a halo in the colour of the ground. The lightest, the most fragile on a busy ground.'],
  ['pleine',    'Solid chip',       'Ruled out: a saturated flat, too strong in density — the rendering that crushes the rest of the diagram.'],
  ['mono',      'Monochrome',       'A black rule, no colour. For black-and-white printing and diagrams already coloured elsewhere.'],
];
const buttons = STYLES.map(([k, t], i) => `<button type="button" data-style="${k}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('\n      ');
const cards = STYLES.map(([k, t, d]) => `<div class="card" data-for="${k}"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n      ');

const lightTokens = Object.entries(layers).map(([k, c]) => `  --c-${k}:${c.light};`).join('\n');
const darkTokens = Object.entries(layers).map(([k, c]) => `  --c-${k}:${c.dark};`).join('\n');

const html = `<title>Icon treatments for diagrams</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#EEF1F3; --surface:#FFFFFF; --surface-2:#F7F9FA; --canvas:#FFFFFF;
  --ink:#111820; --ink-2:#3D4A55; --muted:#6C7B87;
  --line:#D3DBE0; --line-2:#E4EAEE; --edge:#93A3AE;
  --accent:#0B6E7F; --accent-soft:#DCEFF2; --accent-ink:#08525E;
${lightTokens}
  --r:10px;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#0D1317; --surface:#141C22; --surface-2:#18222A; --canvas:#141C22;
    --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
    --line:#28343D; --line-2:#1F2A32; --edge:#5C6E7C;
    --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
${darkTokens}
  }
}
:root[data-theme="dark"]{
  --paper:#0D1317; --surface:#141C22; --surface-2:#18222A; --canvas:#141C22;
  --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
  --line:#28343D; --line-2:#1F2A32; --edge:#5C6E7C;
  --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
${darkTokens}
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px 96px}
h1,h2,h3{font-family:"IBM Plex Sans Condensed","IBM Plex Sans",system-ui,sans-serif;text-wrap:balance;margin:0}
code,.mono{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace}

header.top{border-bottom:1px solid var(--line);background:var(--surface)}
.top .wrap{padding-top:48px;padding-bottom:36px;display:grid;gap:20px}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0}
h1{font-size:clamp(2rem,5vw,3.1rem);line-height:1.06;font-weight:700;letter-spacing:-.02em}
.lede{max-width:64ch;color:var(--ink-2);margin:0}
.lede strong{color:var(--ink);font-weight:600}

.toolbar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);margin-bottom:36px}
.toolbar .wrap{padding-top:12px;padding-bottom:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.toolbar .lbl{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-right:6px}
.toolbar button{appearance:none;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:7px 14px;font:500 13px/1 "IBM Plex Sans",sans-serif;cursor:pointer}
.toolbar button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent);color:#fff}
.toolbar button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

section{margin-top:52px;scroll-margin-top:76px}
section:first-of-type{margin-top:0}
.shead{display:flex;align-items:baseline;gap:14px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.shead h2{font-size:1.3rem;font-weight:600;letter-spacing:-.01em}
.shead p{margin:0;color:var(--muted);font-size:13.5px}

.board{background:var(--canvas);border:1px solid var(--line);border-radius:var(--r);padding:18px;overflow-x:auto}
.diagramme{display:block;min-width:860px;width:100%;height:auto}
.node rect{fill:var(--surface-2);stroke:var(--line);stroke-width:1.25}
.node-t{fill:var(--ink);font:600 14px/1 "IBM Plex Sans",sans-serif;text-anchor:middle}
.node-s{fill:var(--muted);font:400 11px/1 "IBM Plex Mono",monospace;text-anchor:middle}
.edge{fill:none;stroke:var(--edge);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.chip-txt{font:600 11px/1 "IBM Plex Sans",sans-serif;fill:var(--c)}

/* --- the six treatments, driven by a single attribute --- */
.chip{--soft:color-mix(in srgb,var(--c) 14%,var(--canvas))}
.chip--label{display:none}
body[data-style="nu"]        .chip-bg{fill:var(--canvas);stroke:none}
body[data-style="nu"]        .chip-ico{color:var(--c)}
body[data-style="douce"]     .chip-bg{fill:var(--soft);stroke:none}
body[data-style="douce"]     .chip-ico{color:var(--c)}
body[data-style="pleine"]    .chip-bg{fill:var(--c);stroke:none}
body[data-style="pleine"]    .chip-ico{color:var(--canvas)}
body[data-style="contour"]   .chip-bg{fill:var(--canvas);stroke:var(--c);stroke-width:1.5}
body[data-style="contour"]   .chip-ico{color:var(--c)}
body[data-style="etiquette"] .chip-bg{fill:var(--soft);stroke:none}
body[data-style="etiquette"] .chip-ico{color:var(--c)}
body[data-style="etiquette"] .chip--compact{display:none}
body[data-style="etiquette"] .chip--label{display:inline}
body[data-style="mono"]      .chip-bg{fill:var(--canvas);stroke:var(--ink);stroke-width:1.25}
body[data-style="mono"]      .chip-ico{color:var(--ink)}
body[data-style="mono"]      .chip-txt{fill:var(--ink)}

.fiche{display:none;margin-top:14px;border-left:3px solid var(--accent);background:var(--surface);border:1px solid var(--line);border-left-width:3px;border-radius:var(--r);padding:14px 18px}
.fiche h3{font-size:.95rem;font-weight:600;margin-bottom:4px}
.fiche p{margin:0;font-size:13.5px;color:var(--ink-2);max-width:78ch}
${STYLES.map(([k]) => `body[data-style="${k}"] .fiche[data-for="${k}"]{display:block}`).join('\n')}

.scale{display:grid;gap:14px;background:var(--canvas);border:1px solid var(--line);border-radius:var(--r);padding:20px;overflow-x:auto}
.scale-row{display:flex;align-items:center;gap:22px;min-width:560px}
.scale-name{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--muted);width:96px;flex:none}
.scale-cell{margin:0;display:flex;flex-direction:column;align-items:center;gap:7px}
.scale-cell figcaption{font-family:"IBM Plex Mono",monospace;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}
.chipbox{display:block;overflow:visible}

.ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1px;background:var(--line-2);border:1px solid var(--line-2);border-radius:var(--r);overflow:hidden}
.gcell{background:var(--canvas);padding:16px 10px 14px;display:flex;flex-direction:column;align-items:center;gap:8px}
.gcell h3{font-size:.85rem;font-weight:500;color:var(--ink-2);text-align:center}

.legend{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px}
.legend li{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-2)}
.swatch{width:12px;height:12px;border-radius:3px;flex:none}
.legend em{font-family:"IBM Plex Mono",monospace;font-style:normal;font-size:11px;color:var(--muted)}

.reco{margin-top:52px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:24px 26px}
.reco h2{font-size:1.2rem;margin-bottom:10px}
.reco p{margin:0 0 12px;color:var(--ink-2);font-size:14.5px;max-width:76ch}
.reco p:last-child{margin-bottom:0}
.reco strong{color:var(--ink)}
.scroller{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);margin-top:16px}
table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:560px}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line-2);vertical-align:top}
thead th{background:var(--surface-2);font:600 11px/1.4 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
tbody th{font-weight:600;white-space:nowrap}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<header class="top">
  <div class="wrap">
    <p class="eyebrow">Style decision · 6 treatments · 1 control diagram</p>
    <h1>Which treatment for protocol icons?</h1>
    <p class="lede">In an architecture diagram a protocol icon does not live in a grid: it sits <strong>on an arrow</strong>, at 16–20 px, between two boxes, often where lines cross. The six treatments below are applied to the <strong>same control diagram</strong> — switch treatment and watch what holds up.</p>
  </div>
</header>

<div class="toolbar">
  <div class="wrap">
    <span class="lbl">Treatment</span>
    ${buttons}
  </div>
</div>

<div class="wrap">
  <section>
    <div class="shead"><h2>On a diagram</h2><p>The decisive test: the chip has to sit on the line without chopping it up or crushing the labels.</p></div>
    <div class="board">${diagram}</div>
    ${cards}
  </section>

  <section>
    <div class="shead"><h2>At scale</h2><p>16 px is the real size on an arrow in a diagram exported to A4.</p></div>
    <div class="scale">
    ${scale}
    </div>
  </section>

  <section>
    <div class="shead"><h2>All 32 protocols in this treatment</h2><p>Colour carried by the layer, not by the protocol: six hues only, so the diagram stays readable.</p></div>
    <div class="ggrid">
      ${grid}
    </div>
    <ul class="legend">
        ${legend}
    </ul>
  </section>

  <div class="reco">
    <h2>The convention chosen</h2>
    <p><strong>Label</strong> — icon + protocol name on a tinted ground — as the default treatment. <strong>Tinted chip</strong> as the fallback, when the gap between two boxes drops below 130 px.</p>
    <p>The label is the most formal rendering: it names the protocol, which resolves the ambiguity no glyph can resolve alone (FTP against SFTP, IMAP against POP3), and it stays sober because the ground is only a 14 % tint. The solid chip was ruled out: the saturated flat crushes the rest of the diagram. The bare stroke breaks down as soon as the ground is not plain, and the outline loses its rule at 16 px.</p>
    <p>The point that matters as much as the treatment: <strong>colour carries the layer, not the protocol.</strong> Six hues for 32 protocols — a reader remembers “blue = web, orange = messages”, never 32 colours. That is what makes the convention transmissible to someone without the catalogue in front of them.</p>
    <div class="scroller">
      <table>
        <thead><tr><th scope="col">Parameter</th><th scope="col">Value chosen</th><th scope="col">Why</th></tr></thead>
        <tbody>
          <tr><th scope="row">Icon family</th><td>Tabler, 2 px stroke</td><td>The most complete network coverage (17 icons with no Lucide equivalent)</td></tr>
          <tr><th scope="row">Treatment</th><td>Label (icon + name), ground at 14 %</td><td>The most formal rendering; names what no glyph can disambiguate alone</td></tr>
          <tr><th scope="row">Fallback</th><td>Compact chip, radius = 27 % of the side</td><td>When the diagram is too tight for a label</td></tr>
          <tr><th scope="row">Nominal size</th><td>48 px tall</td><td>Readable without effort; the file stays vectorial and scales down losslessly</td></tr>
          <tr><th scope="row">Glyph / chip ratio</th><td>62 %</td><td>Below that the glyph floats; above it, it touches the edge</td></tr>
          <tr><th scope="row">Minimum size</th><td>20 px on an arrow, 16 px as a last resort</td><td>Below that, the busiest glyphs close up</td></tr>
          <tr><th scope="row">Glyph density</th><td>&lt; 100 path commands</td><td>Two icons were replaced on this criterion: HTTP <code>world-www</code> → <code>world</code>, HTTPS <code>lock-square-rounded</code> → <code>lock</code></td></tr>
          <tr><th scope="row">Gap between boxes</th><td>≥ 130 px</td><td>That is the room a label needs; below it, only the compact chip fits</td></tr>
          <tr><th scope="row">Colour</th><td>6 layers, not 32 protocols</td><td>A legend of six entries is memorable; one of thirty-two is not</td></tr>
          <tr><th scope="row">Chip ground</th><td>14 % of the hue over the canvas</td><td>Masks the line without creating a second competing flat</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
(function(){
  var body=document.body, fallback='etiquette';
  try{ fallback=localStorage.getItem('proto-style')||fallback; }catch(e){}
  function set(k){
    body.dataset.style=k;
    document.querySelectorAll('.toolbar button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.style===k));});
    try{localStorage.setItem('proto-style',k);}catch(e){}
  }
  document.querySelectorAll('.toolbar button').forEach(function(b){
    b.addEventListener('click',function(){set(b.dataset.style);});
  });
  set(fallback);
})();
</script>`;

fs.mkdirSync(path.join(ROOT, 'specimen'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'specimen/styles.html'), html);
console.log(`  specimen/styles.html · ${(html.length / 1024).toFixed(0)} kB`);
