// Generates specimen/lockups.html: the reference sheet for the assembled set.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { layers } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8'));

const familyToLayer = {};
for (const [k, c] of Object.entries(layers)) for (const f of c.families) familyToLayer[f] = k;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The SVGs are self-contained: we inline them as they are, rewriting nothing.
const read = (d, slug) => fs.readFileSync(path.join(ROOT, d, `${slug}.svg`), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '').replace(/<title>[\s\S]*?<\/title>/, '').trim();

const protocols = rows.filter((r) => r.type === 'protocol');
const products = rows.filter((r) => r.type === 'product');
const marks = protocols.filter((r) => r.officialMark);
const pictos = protocols.filter((r) => !r.officialMark);
const sample = ['http', 'graphql', 'kafka', 'springboot', 'postgresql', 'kubernetes', 'ssh', 'java'];

const series = (d, slugs, cls = '') => `<div class="series ${cls}">${slugs.map((s) => `<span class="v">${read(d, s)}</span>`).join('')}</div>`;

const byLayer = Object.entries(layers).map(([k, c]) => {
  const inside = protocols.filter((r) => familyToLayer[r.family] === k);
  return `<section class="layer">
      <h3><span class="dot" style="background:${c.light}"></span>${esc(c.label)}<em>${inside.length}</em></h3>
      ${series('lockups/horizontal', inside.map((r) => r.slug))}
    </section>`;
}).join('\n    ');

const byFamily = [...new Set(products.map((r) => r.family))].map((fam) => {
  const inside = products.filter((r) => r.family === fam);
  return `<section class="layer">
      <h3><span class="dot" style="background:${inside[0].hex}"></span>${esc(fam)}<em>${inside.length}</em></h3>
      ${series('lockups/horizontal', inside.map((r) => r.slug))}
    </section>`;
}).join('\n    ');

const fallbacks = products.filter((r) => !r.officialMark || r.note);
const logotypes = rows.filter((r) => r.logotype);

const table = rows.map((r) => `<tr>
          <th scope="row">${esc(r.label)}</th>
          <td><code>${esc(r.slug)}</code></td>
          <td>${r.officialMark ? '<span class="tag t1">brand logo</span>' : '<span class="tag t2">pictogram</span>'}</td>
          <td><code>${esc(r.officialMark ? r.simpleIcons : r.tabler)}</code></td>
          <td>${esc(r.type === 'product' ? r.family : layers[familyToLayer[r.family]].label)}</td>
        </tr>`).join('\n        ');

const html = `<title>Lockups of the set</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#EEF1F3; --surface:#FFFFFF; --surface-2:#F7F9FA;
  --ink:#111820; --ink-2:#3D4A55; --muted:#6C7B87;
  --line:#D3DBE0; --line-2:#E4EAEE;
  --accent:#0B6E7F; --accent-soft:#DCEFF2; --accent-ink:#08525E;
  --r:10px;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#0D1317; --surface:#141C22; --surface-2:#18222A;
    --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
    --line:#28343D; --line-2:#1F2A32;
    --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
  }
}
:root[data-theme="dark"]{
  --paper:#0D1317; --surface:#141C22; --surface-2:#18222A;
  --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
  --line:#28343D; --line-2:#1F2A32;
  --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"IBM Plex Sans",system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:1100px;margin:0 auto;padding:0 24px 90px}
h1,h2,h3{font-family:"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif;text-wrap:balance;margin:0}
code{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:.86em}

header.top{border-bottom:1px solid var(--line);background:var(--surface)}
.top .wrap{padding-top:48px;padding-bottom:36px;display:grid;gap:18px}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0}
h1{font-size:clamp(2rem,5vw,3.1rem);line-height:1.06;font-weight:700;letter-spacing:-.02em}
.lede{max-width:64ch;color:var(--ink-2);margin:0}
.lede strong{color:var(--ink);font-weight:600}

/* The visuals sit on a constant white ground: they are calibrated for a light
   canvas, like every architecture diagram. */
.series{display:flex;flex-wrap:wrap;gap:11px;align-items:flex-end;background:#FFFFFF;border:1px solid var(--line);border-radius:var(--r);padding:16px 18px}
.series .v{display:inline-flex;flex:none}
.series svg{display:block}
.series.sym{gap:9px}

section.block{margin-top:46px}
section.block:first-of-type{margin-top:0}
.shead{margin-bottom:14px;padding-bottom:9px;border-bottom:1px solid var(--line)}
.shead h2{font-size:1.3rem;font-weight:600;letter-spacing:-.01em;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.shead h2 code{color:var(--accent);font-size:12px;font-weight:500}
.shead p{margin:6px 0 0;color:var(--muted);font-size:13.5px;max-width:78ch}

.layer{margin-top:16px}
.layer h3{font-size:.9rem;font-weight:600;display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--ink-2)}
.dot{width:11px;height:11px;border-radius:3px;flex:none}
.layer h3 em{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--muted);margin-left:auto}

.levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px}
.level{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:var(--r);padding:16px 18px;display:grid;gap:11px;align-content:start}
.level h3{font-size:.98rem;font-weight:600}
.level p{margin:0;font-size:13.5px;color:var(--ink-2)}
.level .series{padding:12px 13px}

.scroller{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);margin-top:16px}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:660px}
th,td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--line-2)}
thead th{position:sticky;top:0;background:var(--surface-2);font:600 11px/1.4 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
tbody th{font-weight:600;white-space:nowrap}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
.tag{font:600 10.5px/1 "IBM Plex Mono",monospace;padding:4px 8px;border-radius:999px;white-space:nowrap}
.t1{background:var(--accent-soft);color:var(--accent-ink)}
.t2{background:var(--surface-2);color:var(--muted);border:1px solid var(--line-2)}

.note{margin-top:46px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:22px 24px}
.note h2{font-size:1.1rem;margin-bottom:9px}
.note p{margin:0 0 11px;font-size:14px;color:var(--ink-2);max-width:78ch}
.note p:last-child{margin-bottom:0}
.note strong{color:var(--ink)}
</style>

<header class="top">
  <div class="wrap">
    <p class="eyebrow">${protocols.length} protocols · ${products.length} products · 4 layouts · ${rows.length * 4} SVG</p>
    <h1>Lockups of the set</h1>
    <p class="lede">A <strong>lockup</strong> locks a sign and a name into a constant layout. Here the sign is the <strong>official logo</strong> when the brand designates the protocol itself, a <strong>generic pictogram</strong> otherwise. Every file is self-contained: colours baked in, text vectorised, no font to install.</p>
  </div>
</header>

<div class="wrap">
  <section class="block">
    <div class="shead">
      <h2>Two levels of sign</h2>
      <p>The distinction is not aesthetic, it is factual: RabbitMQ, WireGuard and OpenSSL are <em>implementations</em>. Using their logo for AMQP, VPN or HTTPS would mean designating a standard by a product.</p>
    </div>
    <div class="levels">
      <div class="level">
        <h3>Level 1 — brand logo</h3>
        <p>The brand <em>is</em> the protocol. The logo replaces the pictogram and keeps its official colour.</p>
        ${series('lockups/horizontal', marks.map((r) => r.slug))}
      </div>
      <div class="level">
        <h3>Level 2 — generic pictogram</h3>
        <p>No brand designates the protocol. A Tabler pictogram, coloured by its layer.</p>
        ${series('lockups/horizontal', pictos.slice(0, 6).map((r) => r.slug))}
      </div>
    </div>
  </section>

  <section class="block">
    <div class="shead">
      <h2>Horizontal layout <code>lockups/horizontal/</code></h2>
      <p>The default format: annotate an arrow, caption something, drop one into a table. 48 px tall.</p>
    </div>
    ${byLayer}
  </section>

  <section class="block">
    <div class="shead">
      <h2>Products and technologies</h2>
      <p>Here the rule inverts: a product <strong>has</strong> a brand, and people recognise it without a legend. So we use the official logo whenever it is redistributable, in its own colour — that is what makes a diagram readable at a glance.</p>
    </div>
    ${byFamily}
    ${fallbacks.length ? `<div class="level" style="margin-top:18px">
      <h3>The cases where the logo is not available</h3>
      ${fallbacks.map((r) => `<p><strong>${esc(r.label)}</strong> — ${esc(r.note || '')}</p>`).join('\n      ')}
    </div>` : ''}
  </section>

  <section class="block">
    <div class="shead">
      <h2>Logotypes — when the mark already writes the name</h2>
      <p>${logotypes.length} marks in the set have no symbol: they <em>write</em> the name, full stop. Setting our label beside them would write it twice. Moody's dual coding asks for a sign <strong>and</strong> a text, not two texts: the duplicate takes space without adding a channel of reading. For these entries, the lockup <strong>is</strong> the mark.</p>
      <p>The mark then had to be made legible. Inscribed in the square of the <code>viewBox</code>, the “vmware” band — 24 × 3.8 units — wrote at 4.7 px tall: we kept the word because the mark did not speak. It is now placed by its <strong>measured ink</strong> (<code>scripts/ink-box.mjs</code>), at the cap height the word had. The name keeps its optical size and the pill widens accordingly.</p>
      <p>Helm and MySQL stay outside: their mark carries a symbol — a wheel, a dolphin — and its lettering is illegible at our sizes. The word does real work there.</p>
    </div>
    ${series('lockups/horizontal', logotypes.map((r) => r.slug))}
    ${series('lockups/stacked', logotypes.map((r) => r.slug))}
  </section>

  <section class="block">
    <div class="shead">
      <h2>Stacked layout <code>lockups/stacked/</code></h2>
      <p>To stand in for a node in a diagram, in place of a box. 84 px tall.</p>
    </div>
    ${series('lockups/stacked', sample)}
  </section>

  <section class="block">
    <div class="shead">
      <h2>Symbol alone <code>symbols/</code></h2>
      <p>The fallback when space runs short. The name then moves to a caption — without one, a symbol alone is not readable to anyone who does not know the set.</p>
    </div>
    ${series('symbols', rows.map((r) => r.slug), 'sym')}
  </section>

  <section class="block">
    <div class="shead">
      <h2>Single ink <code>lockups/mono/</code></h2>
      <p>Black-and-white printing, or a diagram whose colour already encodes something else.</p>
    </div>
    ${series('lockups/mono', sample)}
  </section>

  <section class="block">
    <div class="shead"><h2>Reference table</h2><p>The file name is the slug, identical across the four layouts.</p></div>
    <div class="scroller">
      <table>
        <thead><tr><th scope="col">Name</th><th scope="col">File</th><th scope="col">Level</th><th scope="col">Source of the sign</th><th scope="col">Layer</th></tr></thead>
        <tbody>
        ${table}
        </tbody>
      </table>
    </div>
  </section>

  <div class="note">
    <h2>How the colour is computed</h2>
    <p>The fill is not a fixed share of the hue. A fixed share would give pills of very uneven weight — at 14 %, BitTorrent's black drops to 0.72 of luminance while RSS's orange stays at 0.90, and the series loses its balance. Every fill is therefore <strong>set on the same luminance</strong> (0.87), whatever the starting colour: the spread across the protocols fell from 0.184 to 0.012.</p>
    <p>The ink is then darkened until it reaches <strong>4.5:1 of contrast</strong> on its own fill. That is what makes light marks such as RSS or IPFS readable without touching the dark ones.</p>
    <p>Equalising luminance was not enough: at equal luminance a saturated yellow carries ten times the chroma of a grey. Chroma is therefore <strong>capped at 0.20</strong>, and the luminance re-targeted afterwards.</p>
    <p><strong>Free of rights is not free of trademark.</strong> The level 1 logos remain the property of their holders: they designate the technology, never a partnership or a certification.</p>
  </div>
</div>`;

fs.mkdirSync(path.join(ROOT, 'specimen'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'specimen/lockups.html'), html);
console.log(`  specimen/lockups.html · ${(html.length / 1024).toFixed(0)} kB`);
