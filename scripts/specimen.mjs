// Génère specimen/index.html : la planche de specimen navigable.
// Consomme .cache/rows.json produit par build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));

const clean=(svg,cls)=>svg
  .replace(/<!--[\s\S]*?-->/g,'')
  .replace(/\s+(width|height)="[^"]*"/g,'')
  .replace(/\s+class="[^"]*"/g,'')
  .replace(/<svg\b/,`<svg class="${cls}" aria-hidden="true" focusable="false"`)
  .replace(/<title>[\s\S]*?<\/title>/,'')
  .trim();

const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const hx=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
const lum=h=>{const[r,g,b]=hx(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b;};
const mix=(h,t,a)=>'#'+hx(h).map(v=>Math.round(v+(t-v)*a).toString(16).padStart(2,'0')).join('');
// assez sombre sur papier clair ? sinon on fonce ; trop sombre sur fond sombre ? on eclaircit
const light=h=>lum(h)>0.62?mix(h,0,0.34):'#'+h;
const dark =h=>lum(h)<0.22?mix(h,255,0.62):(lum(h)<0.38?mix(h,255,0.34):'#'+h);

const fams=[...new Set(rows.map(r=>r.famille))];

const cells=rows.map(r=>`
      <article class="cell" data-fam="${esc(r.famille)}" data-slug="${r.slug}">
        <div class="glyph">
          <span class="set set-tabler">${clean(r.tSvg,'ico')}</span>
          <span class="set set-lucide">${clean(r.lSvg,'ico')}</span>
        </div>
        <h3>${esc(r.label)}</h3>
        <p class="names">
          <code class="n-tabler">${esc(r.tabler)}</code><code class="n-lucide">${esc(r.lucide)}</code>
        </p>
        <span class="fam">${esc(r.famille)}</span>
        <button class="copy" type="button" data-slug="${r.slug}">Copier le SVG</button>
      </article>`).join('');

const brand=rows.filter(r=>r.simpleIcons).map(r=>`
      <article class="bcell" style="--brand-light:${light(r.hex)};--brand-dark:${dark(r.hex)}">
        <div class="bglyph">${clean(r.sSvg,'bico')}</div>
        <h3>${esc(r.marque)}</h3>
        <p class="for">${esc(r.label)}</p>
        <p class="names"><code>${esc(r.simpleIcons)}</code></p>
        <p class="hex">#${r.hex}</p>
      </article>`).join('');

const tableRows=rows.map(r=>`<tr><th scope="row">${esc(r.label)}</th><td><code>${esc(r.tabler)}</code></td><td><code>${esc(r.lucide)}</code></td><td>${r.simpleIcons?`<code>${esc(r.simpleIcons)}</code>`:'<span class="none">aucun logo officiel</span>'}</td></tr>`).join('\n        ');

const svgData=JSON.stringify(Object.fromEntries(rows.map(r=>[r.slug,{tabler:r.tSvg,lucide:r.lSvg}])));

const html=`<title>Iconographie des protocoles</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#EEF1F3; --surface:#FFFFFF; --surface-2:#F7F9FA;
  --ink:#111820; --ink-2:#3D4A55; --muted:#6C7B87;
  --line:#D3DBE0; --line-2:#E4EAEE;
  --accent:#0B6E7F; --accent-soft:#DCEFF2; --accent-ink:#08525E;
  --shadow:0 1px 2px rgba(17,24,32,.06),0 8px 24px -16px rgba(17,24,32,.28);
  --r:10px;
  --brand-use:var(--brand-light);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#0D1317; --surface:#141C22; --surface-2:#18222A;
    --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
    --line:#28343D; --line-2:#1F2A32;
    --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
    --shadow:0 1px 2px rgba(0,0,0,.5),0 10px 28px -18px rgba(0,0,0,.9);
    --brand-use:var(--brand-dark);
  }
}
:root[data-theme="dark"]{
  --paper:#0D1317; --surface:#141C22; --surface-2:#18222A;
  --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
  --line:#28343D; --line-2:#1F2A32;
  --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
  --shadow:0 1px 2px rgba(0,0,0,.5),0 10px 28px -18px rgba(0,0,0,.9);
  --brand-use:var(--brand-dark);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:16px; line-height:1.6; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px 96px}
h1,h2,h3{font-family:"IBM Plex Sans Condensed","IBM Plex Sans",system-ui,sans-serif;text-wrap:balance;margin:0}
code,.mono{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace}

/* ---- en-tête ---- */
header.top{border-bottom:1px solid var(--line);background:var(--surface);}
.top .wrap{padding-top:48px;padding-bottom:40px;display:grid;gap:28px}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0}
h1{font-size:clamp(2.1rem,5.2vw,3.4rem);line-height:1.05;font-weight:700;letter-spacing:-.02em}
.lede{max-width:62ch;color:var(--ink-2);font-size:1.0625rem;margin:0}
.lede strong{color:var(--ink);font-weight:600}
.facts{display:flex;flex-wrap:wrap;gap:0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.fact{flex:1 1 180px;padding:14px 18px;border-right:1px solid var(--line-2);background:var(--surface-2)}
.fact:last-child{border-right:0}
.fact b{display:block;font-family:"IBM Plex Mono",monospace;font-size:1.5rem;font-weight:600;line-height:1.2;font-variant-numeric:tabular-nums}
.fact span{font-size:12.5px;color:var(--muted)}

/* ---- barre d'outils ---- */
.toolbar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);margin-bottom:32px}
.toolbar .wrap{padding-top:12px;padding-bottom:12px;display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--surface)}
.seg button{appearance:none;border:0;background:transparent;color:var(--ink-2);font:500 13px/1 "IBM Plex Sans",sans-serif;padding:9px 16px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--accent);color:#fff}
.seg button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.ctrl{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted)}
.ctrl label{font-family:"IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;font-size:11px}
input[type=range]{accent-color:var(--accent);width:110px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
.chip{appearance:none;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:999px;padding:5px 11px;font:500 12px/1 "IBM Plex Sans",sans-serif;cursor:pointer}
.chip[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
.chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ---- sections ---- */
section{margin-top:56px;scroll-margin-top:76px}
section:first-of-type{margin-top:0}
.shead{display:flex;align-items:baseline;gap:14px;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.shead h2{font-size:1.35rem;font-weight:600;letter-spacing:-.01em}
.shead p{margin:0;color:var(--muted);font-size:13.5px}

/* ---- grille specimen ---- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:1px;background:var(--line-2);border:1px solid var(--line-2);border-radius:var(--r);overflow:hidden}
.cell{background:var(--surface);padding:18px 14px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;min-height:158px}
.cell[hidden]{display:none}
.glyph{height:52px;display:grid;place-items:center;color:var(--ink)}
.ico{width:40px;height:40px;stroke-width:var(--sw,2);overflow:visible}
.cell h3{font-size:.95rem;font-weight:600;text-align:center}
.names{margin:0;display:flex;justify-content:center}
.names code{font-size:11px;color:var(--muted);word-break:break-all;text-align:center}
.fam{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-top:auto}
.copy{margin-top:8px;appearance:none;border:1px solid transparent;background:transparent;color:var(--muted);font:500 11px/1 "IBM Plex Sans",sans-serif;padding:5px 9px;border-radius:6px;cursor:pointer;opacity:0;transition:opacity .12s}
.cell:hover .copy,.cell:focus-within .copy{opacity:1}
.copy:hover{border-color:var(--line);color:var(--ink);background:var(--surface-2)}
.copy:focus-visible{opacity:1;outline:2px solid var(--accent);outline-offset:1px}
body[data-set="tabler"] .set-lucide,body[data-set="lucide"] .set-tabler{display:none}
body[data-set="tabler"] .n-lucide,body[data-set="lucide"] .n-tabler{display:none}

/* ---- logos de marque ---- */
.bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:14px}
.bcell{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px 14px;display:flex;flex-direction:column;align-items:center;gap:7px;box-shadow:var(--shadow)}
.bglyph{height:46px;display:grid;place-items:center;color:var(--brand-use)}
.bico{width:34px;height:34px;fill:currentColor}
.bcell h3{font-size:.9rem;font-weight:600;text-align:center}
.bcell .names code{font-size:10.5px}
.for{margin:0;font-size:11.5px;color:var(--muted);text-align:center}
.hex{margin:0;font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--muted);font-variant-numeric:tabular-nums}

/* ---- notes / licences ---- */
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
.note{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:var(--r);padding:16px 18px}
.note h3{font-size:.95rem;font-weight:600;margin-bottom:5px}
.note p{margin:0;font-size:13.5px;color:var(--ink-2)}
.note .lic{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.06em;color:var(--accent);text-transform:uppercase;display:block;margin-top:8px}
.note a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:2px}

.scroller{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
table{border-collapse:collapse;width:100%;font-size:13px;min-width:640px}
th,td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--line-2);vertical-align:top}
thead th{position:sticky;top:0;background:var(--surface-2);font:600 11px/1.4 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
tbody th{font-weight:600;white-space:nowrap}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
td code{font-size:12px;color:var(--ink-2)}
.none{color:var(--muted);font-style:italic;font-size:12px}

.warn{margin-top:56px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r);padding:20px 22px}
.warn h2{font-size:1.05rem;margin-bottom:8px}
.warn p{margin:0 0 8px;font-size:13.5px;color:var(--ink-2);max-width:74ch}
.warn p:last-child{margin-bottom:0}

#toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,14px);background:var(--ink);color:var(--paper);font:500 13px/1 "IBM Plex Sans",sans-serif;padding:11px 18px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;z-index:60}
#toast.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (max-width:640px){.chips{margin-left:0;width:100%}.top .wrap{padding-top:34px}}
</style>

<header class="top">
  <div class="wrap">
    <p class="eyebrow">Specimen · 32 protocoles · SVG libres</p>
    <h1>Iconographie des protocoles réseau</h1>
    <p class="lede">SSH, HTTP, FTP et REST <strong>n'ont pas de logo officiel</strong> — ce sont des spécifications, pas des marques. L'homogénéité ne peut donc pas venir des logos : elle vient du choix d'<strong>une seule famille d'icônes</strong> pour tous les protocoles. Voici ce jeu, construit dans deux familles libres au tracé identique, plus les rares protocoles qui possèdent réellement une marque.</p>
    <div class="facts">
      <div class="fact"><b>32</b><span>protocoles couverts</span></div>
      <div class="fact"><b>13</b><span>ont un vrai logo de marque</span></div>
      <div class="fact"><b>24 px</b><span>grille commune, tracé 2 px</span></div>
      <div class="fact"><b>MIT · ISC · CC0</b><span>usage commercial autorisé</span></div>
    </div>
  </div>
</header>

<div class="toolbar">
  <div class="wrap">
    <div class="seg" role="group" aria-label="Famille d'icônes">
      <button type="button" data-set="tabler" aria-pressed="true">Tabler <span class="mono">MIT</span></button>
      <button type="button" data-set="lucide" aria-pressed="false">Lucide <span class="mono">ISC</span></button>
    </div>
    <div class="ctrl">
      <label for="sw">Tracé</label>
      <input type="range" id="sw" min="1" max="2.5" step="0.25" value="2">
      <span class="mono" id="swv" style="font-variant-numeric:tabular-nums">2</span>
    </div>
    <div class="chips" id="chips"></div>
  </div>
</div>

<div class="wrap">
  <section>
    <div class="shead"><h2>Le jeu homogène</h2><p>Même grille, même tracé, même arrondi — bascule entre les deux familles pour comparer.</p></div>
    <div class="grid" id="grid">${cells}
    </div>
  </section>

  <section>
    <div class="shead"><h2>Les protocoles qui ont un vrai logo</h2><p>Marques officielles redistribuées par Simple Icons, à la couleur d'origine.</p></div>
    <div class="bgrid">${brand}
    </div>
  </section>

  <section>
    <div class="shead"><h2>Sources et licences</h2><p>Trois dépôts, tous utilisables en projet commercial.</p></div>
    <div class="notes">
      <div class="note">
        <h3>Tabler Icons</h3>
        <p>5 900+ icônes au trait, grille 24 px, tracé 2 px. La plus fournie pour le vocabulaire réseau et serveur.</p>
        <span class="lic">MIT · tabler.io/icons</span>
      </div>
      <div class="note">
        <h3>Lucide</h3>
        <p>Fork communautaire de Feather. Trait plus fin et plus rond, idéal pour une interface légère.</p>
        <span class="lic">ISC · lucide.dev</span>
      </div>
      <div class="note">
        <h3>Simple Icons</h3>
        <p>3 400+ logos de marque monochromes avec leur couleur officielle. C'est là que se trouvent MQTT, GraphQL, XMPP ou WireGuard.</p>
        <span class="lic">CC0 1.0 · simpleicons.org</span>
      </div>
      <div class="note">
        <h3>Alternatives équivalentes</h3>
        <p>Phosphor (MIT), Material Symbols (Apache 2.0), Bootstrap Icons (MIT), Iconoir (MIT), Font Awesome Free (CC BY 4.0, attribution requise). Iconify les agrège toutes derrière une seule API.</p>
        <span class="lic">Même méthode, autre tracé</span>
      </div>
    </div>
  </section>

  <section>
    <div class="shead"><h2>Table de correspondance</h2><p>Les noms exacts à copier dans votre code.</p></div>
    <div class="scroller">
      <table>
        <thead><tr><th scope="col">Protocole</th><th scope="col">Tabler (MIT)</th><th scope="col">Lucide (ISC)</th><th scope="col">Logo officiel (CC0)</th></tr></thead>
        <tbody>
        ${tableRows}
        </tbody>
      </table>
    </div>
  </section>

  <div class="warn">
    <h2>Deux précautions avant de publier</h2>
    <p><strong>Libre de droits ≠ libre de marque.</strong> Les licences MIT, ISC et CC0 portent sur le fichier SVG, pas sur la marque qu'il représente. Les logos GraphQL, MQTT, WireGuard ou RabbitMQ restent la propriété de leurs détenteurs : ils s'utilisent pour désigner la technologie, jamais pour suggérer un partenariat ou une certification. Chaque marque publie ses propres règles d'usage.</p>
    <p><strong>Ne mélangez pas les familles.</strong> Un <code>world-www</code> Tabler à côté d'un <code>globe</code> Lucide se voit immédiatement : les épaisseurs et les arrondis diffèrent. Choisissez une famille, et n'introduisez les logos de marque colorés que dans une zone clairement séparée du reste de l'interface.</p>
  </div>
</div>

<div id="toast" role="status" aria-live="polite"></div>

<script>
(function(){
  var SVGS=${svgData};
  var body=document.body, grid=document.getElementById('grid');
  body.dataset.set='tabler';

  // familles
  var fams=${JSON.stringify(fams)}, active=new Set(), chips=document.getElementById('chips');
  fams.forEach(function(f){
    var b=document.createElement('button');
    b.className='chip'; b.type='button'; b.textContent=f; b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){
      if(active.has(f)){active.delete(f);b.setAttribute('aria-pressed','false');}
      else{active.add(f);b.setAttribute('aria-pressed','true');}
      render();
    });
    chips.appendChild(b);
  });
  function render(){
    Array.prototype.forEach.call(grid.querySelectorAll('.cell'),function(c){
      c.hidden = active.size>0 && !active.has(c.dataset.fam);
    });
  }

  // bascule de famille d'icônes
  Array.prototype.forEach.call(document.querySelectorAll('.seg button'),function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.seg button').forEach(function(o){o.setAttribute('aria-pressed', String(o===b));});
      body.dataset.set=b.dataset.set;
      try{localStorage.setItem('proto-set',b.dataset.set);}catch(e){}
    });
  });
  try{
    var s=localStorage.getItem('proto-set');
    if(s==='lucide'){document.querySelector('.seg button[data-set="lucide"]').click();}
  }catch(e){}

  // épaisseur de tracé
  var sw=document.getElementById('sw'), swv=document.getElementById('swv');
  sw.addEventListener('input',function(){
    document.documentElement.style.setProperty('--sw',sw.value);
    swv.textContent=sw.value;
  });

  // copie
  var toast=document.getElementById('toast'), t;
  function say(msg){toast.textContent=msg;toast.classList.add('on');clearTimeout(t);t=setTimeout(function(){toast.classList.remove('on');},1900);}
  grid.addEventListener('click',function(e){
    var b=e.target.closest('.copy'); if(!b) return;
    var svg=SVGS[b.dataset.slug][body.dataset.set];
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(svg).then(function(){say('SVG copié — '+body.dataset.set);},function(){say('Copie refusée par le navigateur');});
    } else { say('Copie indisponible ici'); }
  });
})();
</script>`;

fs.mkdirSync(path.join(ROOT, 'specimen'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'specimen/index.html'), html);
console.log(`  specimen/index.html · ${(html.length / 1024).toFixed(0)} Ko`);
