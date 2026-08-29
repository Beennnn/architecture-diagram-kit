// Génère specimen/lockups.html : la planche de référence du jeu assemblé.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));

const famVersCouche = {};
for (const [k, c] of Object.entries(couches)) for (const f of c.familles) famVersCouche[f] = k;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Les SVG sont autonomes : on les inline tels quels, sans rien réécrire.
const lire = (d, slug) => fs.readFileSync(path.join(ROOT, d, `${slug}.svg`), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '').replace(/<title>[\s\S]*?<\/title>/, '').trim();

const protocoles = rows.filter((r) => r.type === 'protocole');
const produits = rows.filter((r) => r.type === 'produit');
const marques = protocoles.filter((r) => r.marqueOfficielle);
const pictos = protocoles.filter((r) => !r.marqueOfficielle);
const echantillon = ['http', 'graphql', 'kafka', 'springboot', 'postgresql', 'kubernetes', 'ssh', 'java'];

const serie = (d, slugs, cls = '') => `<div class="serie ${cls}">${slugs.map((s) => `<span class="v">${lire(d, s)}</span>`).join('')}</div>`;

const parCouche = Object.entries(couches).map(([k, c]) => {
  const dedans = protocoles.filter((r) => famVersCouche[r.famille] === k);
  return `<section class="couche">
      <h3><span class="pastille" style="background:${c.clair}"></span>${esc(c.label)}<em>${dedans.length}</em></h3>
      ${serie('lockups/horizontal', dedans.map((r) => r.slug))}
    </section>`;
}).join('\n    ');

const parCategorie = [...new Set(produits.map((r) => r.categorie))].map((cat) => {
  const dedans = produits.filter((r) => r.categorie === cat);
  return `<section class="couche">
      <h3><span class="pastille" style="background:${dedans[0].hex}"></span>${esc(cat)}<em>${dedans.length}</em></h3>
      ${serie('lockups/horizontal', dedans.map((r) => r.slug))}
    </section>`;
}).join('\n    ');

const replis = produits.filter((r) => !r.marqueOfficielle || r.note);
const logotypes = rows.filter((r) => r.logotype);

const tableau = rows.map((r) => `<tr>
          <th scope="row">${esc(r.label)}</th>
          <td><code>${esc(r.slug)}</code></td>
          <td>${r.marqueOfficielle ? '<span class="tag t1">logo de marque</span>' : '<span class="tag t2">picto</span>'}</td>
          <td><code>${esc(r.marqueOfficielle ? r.simpleIcons : r.tabler)}</code></td>
          <td>${esc(r.type === 'produit' ? r.categorie : couches[famVersCouche[r.famille]].label)}</td>
        </tr>`).join('\n        ');

const html = `<title>Bloc-marques des protocoles</title>
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

/* Les visuels sont posés sur un fond blanc constant : ils sont calibrés pour
   un canvas clair, comme tous les schémas d'architecture. */
.serie{display:flex;flex-wrap:wrap;gap:11px;align-items:flex-end;background:#FFFFFF;border:1px solid var(--line);border-radius:var(--r);padding:16px 18px}
.serie .v{display:inline-flex;flex:none}
.serie svg{display:block}
.serie.sym{gap:9px}

section.bloc{margin-top:46px}
section.bloc:first-of-type{margin-top:0}
.shead{margin-bottom:14px;padding-bottom:9px;border-bottom:1px solid var(--line)}
.shead h2{font-size:1.3rem;font-weight:600;letter-spacing:-.01em;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.shead h2 code{color:var(--accent);font-size:12px;font-weight:500}
.shead p{margin:6px 0 0;color:var(--muted);font-size:13.5px;max-width:78ch}

.couche{margin-top:16px}
.couche h3{font-size:.9rem;font-weight:600;display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--ink-2)}
.pastille{width:11px;height:11px;border-radius:3px;flex:none}
.couche h3 em{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--muted);margin-left:auto}

.niveaux{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px}
.niv{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:var(--r);padding:16px 18px;display:grid;gap:11px;align-content:start}
.niv h3{font-size:.98rem;font-weight:600}
.niv p{margin:0;font-size:13.5px;color:var(--ink-2)}
.niv .serie{padding:12px 13px}

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
    <p class="eyebrow">${protocoles.length} protocoles · ${produits.length} produits · 4 dispositions · ${rows.length * 4} SVG</p>
    <h1>Bloc-marques des protocoles</h1>
    <p class="lede">Un <strong>bloc-marque</strong> (lockup) verrouille un signe et un nom dans une disposition constante. Ici le signe est le <strong>logo officiel</strong> quand la marque désigne le protocole lui-même, un <strong>picto générique</strong> sinon. Chaque fichier est autonome : couleurs en dur, texte vectorisé, aucune police à installer.</p>
  </div>
</header>

<div class="wrap">
  <section class="bloc">
    <div class="shead">
      <h2>Deux niveaux de signe</h2>
      <p>La distinction n'est pas esthétique, elle est factuelle : RabbitMQ, WireGuard ou OpenSSL sont des <em>implémentations</em>. Employer leur logo pour AMQP, VPN ou HTTPS reviendrait à désigner un standard par un produit.</p>
    </div>
    <div class="niveaux">
      <div class="niv">
        <h3>Niveau 1 — logo de marque</h3>
        <p>La marque <em>est</em> le protocole. Le logo remplace le picto et garde sa couleur officielle.</p>
        ${serie('lockups/horizontal', marques.map((r) => r.slug))}
      </div>
      <div class="niv">
        <h3>Niveau 2 — picto générique</h3>
        <p>Aucune marque ne désigne le protocole. Picto Tabler, couleur portée par la couche.</p>
        ${serie('lockups/horizontal', pictos.slice(0, 6).map((r) => r.slug))}
      </div>
    </div>
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Disposition horizontale <code>lockups/horizontal/</code></h2>
      <p>Le format par défaut : annoter une flèche, légender, poser dans un tableau. 48 px de haut.</p>
    </div>
    ${parCouche}
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Produits et technologies</h2>
      <p>Ici la règle s'inverse : un produit <strong>a</strong> une marque, et les gens la reconnaissent sans légende. On emploie donc le logo officiel dès qu'il est redistribuable, dans sa couleur — c'est ce qui rend le schéma lisible d'un coup d'œil.</p>
    </div>
    ${parCategorie}
    ${replis.length ? `<div class="niv" style="margin-top:18px">
      <h3>Les deux cas où le logo n'est pas disponible</h3>
      ${replis.map((r) => `<p><strong>${esc(r.label)}</strong> — ${esc(r.note || '')}</p>`).join('\n      ')}
    </div>` : ''}
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Les logotypes — quand la marque écrit déjà le nom</h2>
      <p>${logotypes.length} marques du jeu n'ont pas de symbole : elles <em>écrivent</em> le nom, un point c'est tout. Leur accoler notre libellé l'écrirait deux fois. Le codage double de Moody demande un signe <strong>et</strong> un texte, pas deux textes : le doublon prend de la place sans ajouter de canal de lecture. Pour ces entrées, le bloc-marque <strong>est</strong> la marque.</p>
      <p>Restait à la rendre lisible. Inscrite dans le carré du <code>viewBox</code>, la bande « vmware » — 24 × 3,8 unités — s'écrivait en 4,7 px de haut : on gardait le mot parce que la marque ne parlait pas. Elle est désormais posée par son <strong>encre mesurée</strong> (<code>scripts/boite-encre.mjs</code>), à la hauteur de capitale qu'avait le mot. Le nom garde sa taille optique et la pastille s'élargit d'autant.</p>
      <p>Helm et MySQL restent en dehors : leur marque porte un symbole — une roue, un dauphin — et son lettrage, lui, est illisible à nos tailles. Le mot y fait donc un vrai travail.</p>
    </div>
    ${serie('lockups/horizontal', logotypes.map((r) => r.slug))}
    ${serie('lockups/empile', logotypes.map((r) => r.slug))}
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Disposition empilée <code>lockups/empile/</code></h2>
      <p>Pour représenter un nœud du schéma, à la place d'une boîte. 84 px de haut.</p>
    </div>
    ${serie('lockups/empile', echantillon)}
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Symbole seul <code>symboles/</code></h2>
      <p>Repli quand la place manque. Le nom passe alors en légende — sans légende, un symbole seul n'est pas lisible pour qui ne connaît pas le jeu.</p>
    </div>
    ${serie('symboles', rows.map((r) => r.slug), 'sym')}
  </section>

  <section class="bloc">
    <div class="shead">
      <h2>Encre unique <code>lockups/mono/</code></h2>
      <p>Impression noir et blanc, ou schéma dont la couleur code déjà autre chose.</p>
    </div>
    ${serie('lockups/mono', echantillon)}
  </section>

  <section class="bloc">
    <div class="shead"><h2>Table de référence</h2><p>Le nom de fichier est le slug, identique dans les quatre dispositions.</p></div>
    <div class="scroller">
      <table>
        <thead><tr><th scope="col">Nom</th><th scope="col">Fichier</th><th scope="col">Niveau</th><th scope="col">Source du signe</th><th scope="col">Couche</th></tr></thead>
        <tbody>
        ${tableau}
        </tbody>
      </table>
    </div>
  </section>

  <div class="note">
    <h2>Comment la couleur est calculée</h2>
    <p>Le fond n'est pas une part fixe de la teinte. Une part fixe donnerait des pastilles de poids très inégal — à 14 %, le noir de BitTorrent tombe à 0,72 de luminance quand l'orange de RSS reste à 0,90, et la série se déséquilibre. Chaque fond est donc <strong>calé sur la même luminance</strong> (0,87), quelle que soit la couleur de départ : l'écart sur les 32 est tombé de 0,184 à 0,012.</p>
    <p>L'encre, elle, est assombrie jusqu'à atteindre <strong>3,5:1 de contraste</strong> sur son propre fond. C'est ce qui rend lisibles des marques claires comme RSS ou IPFS sans toucher aux marques sombres.</p>
    <p><strong>Libre de droits n'est pas libre de marque.</strong> Les six logos de niveau 1 restent la propriété de leurs détenteurs : ils désignent la technologie, jamais un partenariat ou une certification.</p>
  </div>
</div>`;

fs.mkdirSync(path.join(ROOT, 'specimen'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'specimen/lockups.html'), html);
console.log(`  specimen/lockups.html · ${(html.length / 1024).toFixed(0)} Ko`);
