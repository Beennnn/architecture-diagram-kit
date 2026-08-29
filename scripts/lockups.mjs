// Assemble les visuels prêts à l'emploi : un picto (ou le logo officiel de la
// marque quand elle DÉSIGNE le protocole) verrouillé avec le nom du protocole.
//
// Vocabulaire : l'assemblage figé « signe + nom » s'appelle un lockup
// (bloc-marque en français). On en produit deux dispositions plus le signe seul.
//
//   lockups/horizontal/  signe à gauche, nom à droite   → annoter une flèche
//   lockups/empile/      signe au-dessus, nom dessous   → représenter un nœud
//   lockups/mono/        horizontal, encre unique       → impression N&B
//   symboles/            le signe seul, sans nom        → place contrainte
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));

const POLICE = path.join(ROOT, '.cache/plex/package/files/ibm-plex-sans-latin-600-normal.woff');
if (!fs.existsSync(POLICE)) {
  console.error(`Police absente du cache (${POLICE}). Lancez ./regenerer.sh.`);
  process.exit(1);
}
const b = fs.readFileSync(POLICE);
const font = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

const famVersCouche = {};
for (const [cle, c] of Object.entries(couches)) for (const f of c.familles) famVersCouche[f] = cle;

/* --------------------------------------------------------------- couleurs */
import { encreLisible as _encre, fondTeinte as _fond } from './couleurs.mjs';
import { poserMarque, poserMarqueCentree } from './boite-encre.mjs';

const CANVAS = '#FFFFFF';
const CIBLE_FOND = 0.87;             // luminance visée pour TOUS les fonds
const CONTRASTE_MIN = 4.5;           // encre / fond teinté — même seuil que le
                                     // libellé draw.io : une seule règle de
                                     // contraste dans tout le projet

const fondTeinte = (c) => _fond(c, CANVAS, CIBLE_FOND);
const encreLisible = (c, fond) => _encre(c, fond, CONTRASTE_MIN);

/* ------------------------------------------------------------ géométrie */
const G = {
  horizontal: { H: 48, ICO: 30, CORPS: 20, PAD_G: 15, ECART: 10, PAD_D: 18, PAD_SEUL: 17, LARGE_MAX: 110 },
  empile:     { H: 84, ICO: 34, CORPS: 17, PAD_H: 12, ECART: 8, PAD_LAT: 14, MIN_W: 92, LARGE_MAX: 100 },
  symbole:    { S: 48, ICO: 30, LARGE_MAX: 36 },
};
const capHeight = (font.tables.os2 && font.tables.os2.sCapHeight) || 698;

/* ------------------------------------------------- sérialisation du texte */
// opentype.js 1.3 sérialise mal certaines courbes : toPathData() produit des
// « NaN » alors que path.commands est sain, et le parseur SVG s'arrête net —
// le libellé apparaît tronqué. On sérialise donc nous-mêmes.
const n = (v) => {
  if (!Number.isFinite(v)) throw new Error(`coordonnée non finie : ${v}`);
  return String(Math.round(v * 100) / 100);
};
const versPathData = (chemin) => chemin.commands.map((c) => {
  switch (c.type) {
    case 'M': return `M${n(c.x)} ${n(c.y)}`;
    case 'L': return `L${n(c.x)} ${n(c.y)}`;
    case 'C': return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    case 'Q': return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    case 'Z': return 'Z';
    default: throw new Error(`commande de tracé inconnue : ${c.type}`);
  }
}).join('');

const mot = (texte, x, ligneBase, corps, couleur) =>
  `<path d="${versPathData(font.getPath(texte, x, ligneBase, corps))}" fill="${couleur}"/>`;
const largeurMot = (texte, corps) => font.getAdvanceWidth(texte, corps);

/* ----------------------------------------------------------------- signes */
const interieur = (svg) => svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
const indente = (s, p) => s.split('\n').map((l) => p + l.trim()).join('\n');

// Deux niveaux : le logo officiel quand la marque désigne le protocole,
// le picto générique sinon.
function signe(r, x, y, taille, encre) {
  if (r.marqueOfficielle && r.sSvg) {
    return `<svg x="${n(x)}" y="${n(y)}" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="${encre}">
${indente(interieur(r.sSvg).replace(/<title>[\s\S]*?<\/title>/, '').trim(), '    ')}
  </svg>`;
  }
  return `<svg x="${n(x)}" y="${n(y)}" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="${encre}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${indente(interieur(r.tSvg), '    ')}
  </svg>`;
}

// Certaines marques n'ont pas de symbole : elles ÉCRIVENT le nom, un point
// c'est tout — .NET, Go, vmware. Leur accoler notre libellé écrirait le nom deux
// fois. Or le codage double de Moody, c'est signe ET texte, pas texte et texte :
// le doublon coûte de la place et n'ajoute aucun canal de lecture. Pour ces
// entrées, le bloc-marque EST la marque, et le mot disparaît.
//
// Encore faut-il que la marque soit alors lisible. Inscrite dans le carré du
// viewBox, « vmware » — une bande de 24 × 3,8 — s'écrit en 4,7 px de haut : on
// gardait le mot parce que la marque ne parlait pas. On la pose donc par son
// ENCRE mesurée (boite-encre.mjs), à la hauteur de capitale qu'avait le mot :
// le nom garde exactement sa taille optique, et la pastille s'élargit d'autant.
const CAP = (corps) => (capHeight / font.unitsPerEm) * corps;

const marqueEncre = (r, x, yCentre, hauteurEncre, largeurMax, encre) =>
  poserMarque(r.sSvg, { x, yCentre, hauteurEncre, largeurMax, encre });
const marqueCentree = (r, largeur, yCentre, hauteurEncre, largeurMax, encre) =>
  poserMarqueCentree(r.sSvg, largeur, { yCentre, hauteurEncre, largeurMax, encre });

const court = (r) => r.court || r.label.split(' /')[0].split(' (')[0];

// Couleur de base : la marque quand elle désigne le protocole, la couche sinon.
function base(r) {
  if (r.couleur) return r.couleur;                                   // repli explicite
  if (r.marqueOfficielle && r.hex) return r.hex.startsWith('#') ? r.hex : '#' + r.hex;
  const c = couches[famVersCouche[r.famille]];
  if (!c) throw new Error(`Aucune couleur pour « ${r.slug} » (famille « ${r.famille} »). Complétez scripts/couches.json.`);
  return c.clair;
}

const entete = (w, h, nom) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${nom}">
  <title>${nom}</title>`;

/* ---------------------------------------------------------- dispositions */
function horizontal(r, { mono = false } = {}) {
  const { H, ICO, CORPS, PAD_G, ECART, PAD_D, PAD_SEUL, LARGE_MAX } = G.horizontal;
  const brut = mono ? '#1F2933' : base(r);
  const fond = mono ? '#F1F3F5' : fondTeinte(brut);
  const encre = mono ? '#1F2933' : encreLisible(brut, fond);
  const nom = court(r);
  if (r.logotype) {
    const m = marqueEncre(r, PAD_SEUL, H / 2, CAP(CORPS), LARGE_MAX, encre);
    const W = Math.round(m.w + PAD_SEUL * 2);
    return `${entete(W, H, nom)}
  <rect width="${W}" height="${H}" rx="${H / 2}" fill="${fond}"/>
  ${m.svg}
</svg>
`;
  }
  const W = Math.round(PAD_G + ICO + ECART + largeurMot(nom, CORPS) + PAD_D);
  const ligneBase = H / 2 + (capHeight / font.unitsPerEm) * CORPS / 2;
  return `${entete(W, H, nom)}
  <rect width="${W}" height="${H}" rx="${H / 2}" fill="${fond}"/>
  ${signe(r, PAD_G, (H - ICO) / 2, ICO, encre)}
  ${mot(nom, PAD_G + ICO + ECART, ligneBase, CORPS, encre)}
</svg>
`;
}

function empile(r) {
  const { H, ICO, CORPS, PAD_H, ECART, PAD_LAT, MIN_W, LARGE_MAX } = G.empile;
  const brut = base(r);
  const fond = fondTeinte(brut);
  const encre = encreLisible(brut, fond);
  const nom = court(r);
  if (r.logotype) {
    // La marque remplace ici le signe ET le mot : elle occupe leur bande, soit
    // la hauteur du signe, l'écart et la capitale du mot.
    const bande = ICO + ECART + CAP(CORPS);
    const m = marqueEncre(r, PAD_LAT, H / 2, bande, LARGE_MAX, encre);
    const W = Math.round(Math.max(MIN_W, m.w + PAD_LAT * 2));
    return `${entete(W, H, nom)}
  <rect width="${W}" height="${H}" rx="14" fill="${fond}"/>
  ${marqueCentree(r, W, H / 2, bande, LARGE_MAX, encre).svg}
</svg>
`;
  }
  const lm = largeurMot(nom, CORPS);
  const W = Math.round(Math.max(MIN_W, lm + PAD_LAT * 2));
  const ligneBase = PAD_H + ICO + ECART + (capHeight / font.unitsPerEm) * CORPS;
  return `${entete(W, H, nom)}
  <rect width="${W}" height="${H}" rx="14" fill="${fond}"/>
  ${signe(r, (W - ICO) / 2, PAD_H, ICO, encre)}
  ${mot(nom, (W - lm) / 2, ligneBase, CORPS, encre)}
</svg>
`;
}

function symbole(r) {
  const { S, ICO, LARGE_MAX } = G.symbole;
  const brut = base(r);
  const fond = fondTeinte(brut);
  const encre = encreLisible(brut, fond);
  // La place est contrainte : le carré ne s'élargit pas. Un logotype y gagne
  // quand même à être posé par son encre — il occupe alors toute la largeur
  // utile au lieu d'être boîté aux lettres dans le carré du viewBox.
  const dedans = r.logotype
    ? marqueCentree(r, S, S / 2, ICO, LARGE_MAX, encre).svg
    : signe(r, (S - ICO) / 2, (S - ICO) / 2, ICO, encre);
  return `${entete(S, S, court(r))}
  <rect width="${S}" height="${S}" rx="${Math.round(S * 0.27)}" fill="${fond}"/>
  ${dedans}
</svg>
`;
}

/* -------------------------------------------------------------- écriture */
const SORTIES = [
  ['lockups/horizontal', (r) => horizontal(r)],
  ['lockups/empile',     (r) => empile(r)],
  ['lockups/mono',       (r) => horizontal(r, { mono: true })],
  ['symboles',           (r) => symbole(r)],
];

for (const [d] of SORTIES) {
  const dir = path.join(ROOT, d);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

let marques = 0, largeMax = 0, logotypes = 0;
for (const r of rows) {
  if (r.marqueOfficielle && r.sSvg) marques++;
  if (r.logotype) logotypes++;
  for (const [d, fabrique] of SORTIES) {
    const svg = fabrique(r);
    if (/NaN|Infinity|undefined/.test(svg)) throw new Error(`sortie invalide : ${d}/${r.slug}.svg`);
    // Un logotype ne doit contenir que les tracés de sa marque : si le mot
    // revenait, le doublon reviendrait avec lui sans que rien ne le dise.
    if (r.logotype) {
      const attendus = (r.sSvg.match(/<path/g) || []).length;
      const posés = (svg.match(/<path/g) || []).length;
      if (posés !== attendus) {
        throw new Error(`${d}/${r.slug}.svg : ${posés} tracés pour une marque qui en compte ${attendus}`
          + ` — le nom y est réécrit alors que la marque l'écrit déjà.`);
      }
    }
    fs.writeFileSync(path.join(ROOT, d, `${r.slug}.svg`), svg);
  }
  largeMax = Math.max(largeMax, +horizontal(r).match(/width="(\d+)"/)[1]);
}
const nbProto = rows.filter((r) => r.type === 'protocole').length;
const nbProd = rows.filter((r) => r.type === 'produit').length;
console.log(`  ${nbProto} protocoles + ${nbProd} produits + ${rows.length - nbProto - nbProd} rôles × ${SORTIES.length} dispositions = ${rows.length * SORTIES.length} fichiers`);
console.log(`  ${marques} portent un logo de marque, ${rows.length - marques} un picto générique`);
console.log(`  ${logotypes} sont des logotypes : la marque écrit le nom, le bloc-marque ne le répète pas`);
console.log(`  lockup horizontal le plus large : ${largeMax} px`);
