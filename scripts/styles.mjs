// Génère specimen/styles.html : comparateur de traitements visuels,
// jugé dans le contexte réel d'un schéma d'architecture.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));

const famVersCouche = {};
for (const [cle, c] of Object.entries(couches)) for (const f of c.familles) famVersCouche[f] = cle;

const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Contenu interne d'un SVG Tabler, réemballé dans un <svg> imbriqué qu'on dimensionne.
const inner = (svg) => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

const glyphe = (slug, x, y, taille) => {
  const r = bySlug[slug];
  return `<svg class="chip-ico" x="${x}" y="${y}" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner(r.tSvg)}</svg>`;
};

const couleurDe = (slug) => `var(--c-${famVersCouche[bySlug[slug].famille]})`;

// Une pastille : variante compacte (carré) + variante étiquette (icône + nom),
// la CSS n'en affiche qu'une selon le traitement choisi.
function chip(slug, cx, cy, { box = 26, ico = 16, label = null } = {}) {
  const r = bySlug[slug];
  const nom = label ?? r.label;
  const rx = Math.round(box * 0.27);
  const lw = Math.round(nom.length * 6.5 + ico + 22);
  const lh = Math.round(box * 0.92);
  return `<g class="chip" style="--c:${couleurDe(slug)}">
      <g class="chip--compact">
        <rect class="chip-bg" x="${cx - box / 2}" y="${cy - box / 2}" width="${box}" height="${box}" rx="${rx}"></rect>
        ${glyphe(slug, cx - ico / 2, cy - ico / 2, ico)}
      </g>
      <g class="chip--label">
        <rect class="chip-bg" x="${cx - lw / 2}" y="${cy - lh / 2}" width="${lw}" height="${lh}" rx="${lh / 2}"></rect>
        ${glyphe(slug, cx - lw / 2 + 10, cy - ico / 2, ico)}
        <text class="chip-txt" x="${cx - lw / 2 + 14 + ico}" y="${cy}" dominant-baseline="central">${esc(nom)}</text>
      </g>
    </g>`;
}

/* ---------------------------------------------------------------- schéma */
// Écarts de 130 px entre boîtes : c'est la largeur qu'exige la variante
// « étiquette ». Un schéma plus serré interdit ce traitement.
const N = [
  { x: 40,  y: 44,  t: 'Navigateur',      s: 'poste client' },
  { x: 320, y: 44,  t: 'Reverse proxy',   s: 'nginx' },
  { x: 600, y: 44,  t: 'API Gateway',     s: 'edge' },
  { x: 880, y: 44,  t: 'Service Comptes', s: 'conteneur' },
  { x: 40,  y: 196, t: 'Poste admin',     s: 'exploitation' },
  { x: 600, y: 196, t: 'Broker',          s: 'RabbitMQ' },
  { x: 880, y: 196, t: 'Relais mail',     s: 'sortant' },
];
const NW = 150, NH = 64;

const noeuds = N.map((n) => `<g class="node">
      <rect x="${n.x}" y="${n.y}" width="${NW}" height="${NH}" rx="10"></rect>
      <text class="node-t" x="${n.x + NW / 2}" y="${n.y + 26}">${esc(n.t)}</text>
      <text class="node-s" x="${n.x + NW / 2}" y="${n.y + 45}">${esc(n.s)}</text>
    </g>`).join('\n    ');

const liens = [
  { d: 'M190,76 H312',            chip: ['https', 251, 76] },
  { d: 'M470,76 H592',            chip: ['http',  531, 76] },
  { d: 'M750,76 H872',            chip: ['grpc',  811, 76] },
  { d: 'M115,196 V152 H395 V116', chip: ['ssh',   251, 152] },
  { d: 'M675,108 V188',           chip: ['amqp',  675, 152] },
  { d: 'M750,228 H872',           chip: ['smtp',  811, 228] },
];
const aretes = liens.map((l) => `<path class="edge" d="${l.d}" marker-end="url(#fleche)"></path>`).join('\n    ');
const pastilles = liens.map((l) => chip(l.chip[0], l.chip[1], l.chip[2], { label: bySlug[l.chip[0]].label.split(' /')[0] })).join('\n    ');

const schema = `<svg class="diagramme" viewBox="0 0 1070 300" role="img" aria-label="Schéma d'architecture annoté par protocole">
    <defs>
      <marker id="fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,1 L9,5 L0,9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
    </defs>
    ${aretes}
    ${noeuds}
    ${pastilles}
  </svg>`;

/* ------------------------------------------------------- test d'échelle */
const TAILLES = [16, 20, 24, 32, 48];
const echelle = ['https', 'mqtt', 'ssh'].map((slug) => `<div class="scale-row">
      <span class="scale-name">${esc(bySlug[slug].label)}</span>
      ${TAILLES.map((t) => {
        const ico = Math.round(t * 0.62);
        const nom = bySlug[slug].label.split(' /')[0];
        const lw = Math.round(nom.length * 6.5 + ico + 22);
        const w = Math.max(lw + 8, t + 8);
        return `<figure class="scale-cell">
        <svg class="chipbox" viewBox="0 0 ${w} ${t + 8}" style="height:${t + 8}px;width:${w}px">${chip(slug, w / 2, (t + 8) / 2, { box: t, ico, label: nom })}</svg>
        <figcaption>${t} px</figcaption>
      </figure>`;
      }).join('\n      ')}
    </div>`).join('\n    ');

/* ------------------------------------------------------ les 32 en style */
const grille = rows.map((r) => {
  const nom = r.label.split(' /')[0];
  const lw = Math.round(nom.length * 6.5 + 20 + 22);
  const w = Math.max(lw + 8, 44);
  return `<article class="gcell" data-couche="${famVersCouche[r.famille]}">
        <svg class="chipbox" viewBox="0 0 ${w} 44" style="height:44px;width:${w}px">${chip(r.slug, w / 2, 22, { box: 32, ico: 20, label: nom })}</svg>
        <h3>${esc(r.label)}</h3>
      </article>`;
}).join('\n      ');

const legende = Object.entries(couches).map(([cle, c]) =>
  `<li><span class="swatch" style="background:var(--c-${cle})"></span>${esc(c.label)}<em>${rows.filter((r) => c.familles.includes(r.famille)).length}</em></li>`
).join('\n        ');

const STYLES = [
  ['douce',     'Pastille teintée',  'Fond à 14 % de la teinte, glyphe coloré. Se pose sur un trait sans le couper, reste lisible à 16 px.'],
  ['pleine',    'Pastille pleine',   'Aplat de couleur, glyphe blanc détouré. Le plus visible de loin, le plus lourd en densité.'],
  ['contour',   'Pastille contour',  'Fond canvas, filet 1,5 px coloré. Discret, proche des conventions AWS / Azure.'],
  ['nu',        'Trait nu',          'Le glyphe seul, avec un halo à la couleur du fond. Le plus léger, le plus fragile sur fond chargé.'],
  ['etiquette', 'Étiquette',         'Icône + nom du protocole. Lève toute ambiguïté (FTP vs SFTP), mais encombre les schémas denses.'],
  ['mono',      'Monochrome',        'Filet noir, aucune couleur. Pour l’impression N&B et les schémas déjà colorés par ailleurs.'],
];
const boutons = STYLES.map(([k, t], i) => `<button type="button" data-style="${k}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('\n      ');
const fiches = STYLES.map(([k, t, d]) => `<div class="fiche" data-for="${k}"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n      ');

const tokensClair = Object.entries(couches).map(([k, c]) => `  --c-${k}:${c.clair};`).join('\n');
const tokensSombre = Object.entries(couches).map(([k, c]) => `  --c-${k}:${c.sombre};`).join('\n');

const html = `<title>Traitements d'icônes pour schémas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{
  --paper:#EEF1F3; --surface:#FFFFFF; --surface-2:#F7F9FA; --canvas:#FFFFFF;
  --ink:#111820; --ink-2:#3D4A55; --muted:#6C7B87;
  --line:#D3DBE0; --line-2:#E4EAEE; --edge:#93A3AE;
  --accent:#0B6E7F; --accent-soft:#DCEFF2; --accent-ink:#08525E;
${tokensClair}
  --r:10px;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#0D1317; --surface:#141C22; --surface-2:#18222A; --canvas:#141C22;
    --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
    --line:#28343D; --line-2:#1F2A32; --edge:#5C6E7C;
    --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
${tokensSombre}
  }
}
:root[data-theme="dark"]{
  --paper:#0D1317; --surface:#141C22; --surface-2:#18222A; --canvas:#141C22;
  --ink:#E6EDF1; --ink-2:#B4C2CC; --muted:#8496A2;
  --line:#28343D; --line-2:#1F2A32; --edge:#5C6E7C;
  --accent:#3FBFD4; --accent-soft:#123038; --accent-ink:#8FDDEA;
${tokensSombre}
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

/* --- les six traitements, pilotés par un seul attribut --- */
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

.legende{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px}
.legende li{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-2)}
.swatch{width:12px;height:12px;border-radius:3px;flex:none}
.legende em{font-family:"IBM Plex Mono",monospace;font-style:normal;font-size:11px;color:var(--muted)}

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
    <p class="eyebrow">Décision de style · 6 traitements · 1 schéma témoin</p>
    <h1>Quel traitement pour les icônes de protocole&nbsp;?</h1>
    <p class="lede">Dans un schéma d'architecture, une icône de protocole ne vit pas dans une grille : elle se pose <strong>sur une flèche</strong>, à 16–20 px, entre deux boîtes, souvent à un croisement de traits. Les six traitements ci-dessous sont appliqués au <strong>même schéma témoin</strong> — changez de traitement et regardez ce qui tient.</p>
  </div>
</header>

<div class="toolbar">
  <div class="wrap">
    <span class="lbl">Traitement</span>
    ${boutons}
  </div>
</div>

<div class="wrap">
  <section>
    <div class="shead"><h2>Sur un schéma</h2><p>Le test qui tranche : la pastille doit se poser sur le trait sans le hacher ni écraser les libellés.</p></div>
    <div class="board">${schema}</div>
    ${fiches}
  </section>

  <section>
    <div class="shead"><h2>À l'échelle</h2><p>16 px, c'est la taille réelle sur une flèche dans un schéma exporté en A4.</p></div>
    <div class="scale">
    ${echelle}
    </div>
  </section>

  <section>
    <div class="shead"><h2>Les 32 protocoles dans ce traitement</h2><p>Couleur portée par la couche, pas par le protocole : six teintes seulement, pour que le schéma reste lisible.</p></div>
    <div class="ggrid">
      ${grille}
    </div>
    <ul class="legende">
        ${legende}
    </ul>
  </section>

  <div class="reco">
    <h2>Ma recommandation</h2>
    <p><strong>Pastille teintée</strong> comme traitement par défaut, <strong>étiquette</strong> en variante pour les schémas où le protocole doit être nommé.</p>
    <p>La pastille teintée est la seule qui tient les trois contraintes à la fois : elle masque le trait sous elle (donc la flèche ne traverse pas le glyphe), elle garde un glyphe à pleine couleur donc lisible à 16 px, et elle reste assez discrète pour ne pas voler la vedette aux boîtes du schéma. La pastille pleine gagne en visibilité mais six aplats saturés sur un schéma dense deviennent vite criards ; le trait nu décroche dès que le fond n'est pas uni ; le contour perd son filet à 16 px.</p>
    <p>Le point qui compte autant que le traitement : <strong>la couleur porte la couche, pas le protocole.</strong> Six teintes pour 32 protocoles — un lecteur retient « bleu = web, orange = messages », jamais 32 couleurs. C'est ce qui rend la convention transmissible à quelqu'un qui n'a pas le catalogue sous les yeux.</p>
    <div class="scroller">
      <table>
        <thead><tr><th scope="col">Paramètre</th><th scope="col">Valeur retenue</th><th scope="col">Pourquoi</th></tr></thead>
        <tbody>
          <tr><th scope="row">Famille d'icônes</th><td>Tabler, tracé 2 px</td><td>Couverture réseau la plus complète (17 icônes sans équivalent Lucide)</td></tr>
          <tr><th scope="row">Pastille</th><td>Carré arrondi, rayon = 27 % du côté</td><td>Assez rond pour ne pas concurrencer les boîtes, assez carré pour s'aligner</td></tr>
          <tr><th scope="row">Ratio glyphe / pastille</th><td>62 %</td><td>En-dessous, le glyphe flotte ; au-dessus, il touche le bord</td></tr>
          <tr><th scope="row">Taille minimale</th><td>20 px sur flèche, 16 px en dernier recours</td><td>En dessous, les glyphes les plus chargés se ferment</td></tr>
          <tr><th scope="row">Densité du glyphe</th><td>&lt; 100 commandes de tracé</td><td>Deux icônes ont été remplacées sur ce critère : HTTP <code>world-www</code> → <code>world</code>, HTTPS <code>lock-square-rounded</code> → <code>lock</code></td></tr>
          <tr><th scope="row">Écart entre boîtes</th><td>≥ 130 px</td><td>C'est la place qu'exige une étiquette ; en dessous, seule la pastille compacte passe</td></tr>
          <tr><th scope="row">Couleur</th><td>6 couches, pas 32 protocoles</td><td>Une légende de six entrées se retient ; une de trente-deux, non</td></tr>
          <tr><th scope="row">Fond de pastille</th><td>14 % de la teinte sur le canvas</td><td>Masque le trait sans créer un deuxième aplat concurrent</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
(function(){
  var body=document.body, defaut='douce';
  try{ defaut=localStorage.getItem('proto-style')||defaut; }catch(e){}
  function set(k){
    body.dataset.style=k;
    document.querySelectorAll('.toolbar button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.style===k));});
    try{localStorage.setItem('proto-style',k);}catch(e){}
  }
  document.querySelectorAll('.toolbar button').forEach(function(b){
    b.addEventListener('click',function(){set(b.dataset.style);});
  });
  set(defaut);
})();
</script>`;

fs.mkdirSync(path.join(ROOT, 'specimen'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'specimen/styles.html'), html);
console.log(`  specimen/styles.html · ${(html.length / 1024).toFixed(0)} Ko`);
