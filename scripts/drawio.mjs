// Génère les bibliothèques de formes draw.io.
//
// Choix de fond, expliqué dans docs/etat-de-l-art-schemas.md § 5 : on livre le
// SIGNE seul et draw.io écrit le nom lui-même, comme étiquette de forme. Le
// texte reste ainsi cherchable (Ctrl+F), modifiable sur place (« HTTPS :8443 »),
// réel à l'export SVG et HTML, et il suit la police du schéma. Les bloc-marques
// au texte vectorisé restent pour les contextes sans couche de composition.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { encreLisible, contraste } from './couleurs.mjs';
import { FONDS, FOND_IMBRIQUE, ACCENT, ACCENT_EP, TRAIT, LIGNE } from './schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));

const famVersCouche = {};
for (const [k, c] of Object.entries(couches)) for (const f of c.familles) famVersCouche[f] = k;

const TAILLE = 48;
const CANVAS = '#FFFFFF';     // un schéma se lit sur fond clair
const CONTRASTE_LIBELLE = 4.5; // le libellé est du texte : on vise le niveau AA

// draw.io compresse ses mxGraphModel ainsi : base64(deflateRaw(encodeURIComponent(xml))).
// C'est exactement ce qu'écrit l'application quand on exporte une bibliothèque ;
// on emprunte le même chemin plutôt que d'échapper du XML dans du JSON dans du XML.
const compresser = (xml) => zlib.deflateRawSync(Buffer.from(encodeURIComponent(xml), 'utf8')).toString('base64');
const decompresser = (b64) => decodeURIComponent(zlib.inflateRawSync(Buffer.from(b64, 'base64')).toString('utf8'));

const echapXml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Un style draw.io est une suite « clé=valeur; » : une valeur ne peut contenir
// ni « ; » ni « = ». Cela interdit la forme « data:image/svg+xml;base64,… ».
// La forme base64 sans le « ;base64 » contourne le point-virgule mais aucun
// moteur de rendu ne la décode — vérifié : naturalWidth = 0. Reste le SVG
// URL-encodé, que encodeURIComponent échappe justement « ; » (%3B) et « = »
// (%3D), et que tout navigateur décode.
function imageDataUri(slug) {
  const svg = fs.readFileSync(path.join(ROOT, 'symboles', `${slug}.svg`), 'utf8')
    .replace(/<title>[\s\S]*?<\/title>/, '')   // draw.io fournit le libellé
    .replace(/>\s+</g, '><')
    .trim();
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  if (uri.includes(';') || uri.includes('=')) {
    throw new Error(`URI d'image incompatible avec un style draw.io : ${slug}`);
  }
  return uri;
}

const couleurBrute = (r) => {
  if (r.couleur) return r.couleur;
  if (r.marqueOfficielle && r.hex) return r.hex.startsWith('#') ? r.hex : `#${r.hex}`;
  return couches[famVersCouche[r.famille]].clair;
};

// Le libellé est posé par draw.io sur le canvas, pas sur la pastille : il lui
// faut donc son propre calcul de contraste, contre le blanc. Sans quoi les
// marques claires — IPFS, RSS — donneraient un texte illisible.
const couleurLibelle = (r) => encreLisible(couleurBrute(r), CANVAS, CONTRASTE_LIBELLE);
const court = (r) => r.court || r.label.split(' /')[0].split(' (')[0];

function entree(r) {
  const style = [
    'shape=image',
    'html=1',
    'aspect=fixed',
    'imageAspect=1',
    'verticalLabelPosition=bottom',   // le nom sous le signe : la convention des
    'verticalAlign=top',              // jeux AWS et Azure, et elle garde le signe
    'labelPosition=center',           // carré, donc ancrable pour les flèches
    'align=center',
    'spacingTop=2',
    'fontSize=12',
    'fontStyle=1',
    `fontColor=${couleurLibelle(r)}`,
    `image=${imageDataUri(r.slug)}`,
  ].join(';') + ';';

  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${echapXml(court(r))}" style="${echapXml(style)}" vertex="1" parent="1">`
    + `<mxGeometry x="0" y="0" width="${TAILLE}" height="${TAILLE}" as="geometry"/></mxCell>`
    + `</root></mxGraphModel>`;

  const compresse = compresser(xml);
  if (decompresser(compresse) !== xml) throw new Error(`aller-retour de compression cassé : ${r.slug}`);

  return { xml: compresse, w: TAILLE, h: TAILLE, aspect: 'fixed', title: r.label };
}

function bibliotheque(fichier, lignes) {
  const entrees = lignes.map(entree);
  const json = JSON.stringify(entrees);
  // Le JSON est le contenu texte du nœud <mxlibrary> : il ne doit contenir
  // ni « < » ni « & », sans quoi le fichier n'est plus du XML valide.
  if (/[<&]/.test(json)) throw new Error(`caractère interdit dans le JSON de ${fichier}`);
  const contenu = `<mxlibrary>${json}</mxlibrary>`;
  fs.mkdirSync(path.join(ROOT, 'drawio'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'drawio', fichier), contenu + '\n');
  return { n: entrees.length, ko: (contenu.length / 1024).toFixed(0) };
}

// ─── La grammaire elle-même ───────────────────────────────────────────────
// Les trois bibliothèques ci-dessus ne livrent que des signes : celui qui part
// de nos badges devait réappliquer à la main les formes, les fonds et l'accent.
// Cette quatrième bibliothèque porte la grammaire, pour que l'ADR 0003 et
// l'ADR 0007 arrivent dans draw.io au lieu de rester dans le dépôt.
//
// Correspondances non évidentes : arcSize est un DIAMÈTRE quand
// absoluteArcSize=1, d'où 2 × rx ; le cylindre de draw.io s'appelle cylinder3 et
// son `size` est le demi-axe vertical de l'ellipse, soit notre ry de 13.
const GRAMMAIRE = [
  ['Service', 160, 80, `rounded=0;fillColor=${FONDS.service};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Application', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=20;fillColor=${FONDS.application};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Flux', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=80;fillColor=${FONDS.flux};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Stockage', 160, 100, `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=13;fillColor=${FONDS.stockage};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Acteur', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=20;fillColor=${FONDS.acteur};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Matériel', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=6;fillColor=${FONDS.materiel};strokeColor=${TRAIT};strokeWidth=1.6;`],
  ['Nœud de déploiement', 240, 140, `rounded=1;absoluteArcSize=1;arcSize=4;fillColor=${FONDS.noeud};strokeColor=${TRAIT};strokeWidth=2.4;verticalAlign=top;align=left;spacingLeft=10;spacingTop=6;`],
  ['Externe', 160, 80, `rounded=1;absoluteArcSize=1;arcSize=16;fillColor=${FONDS.externe};strokeColor=${LIGNE};strokeWidth=1.6;dashed=1;dashPattern=5 4;`],
  ['Zone', 320, 200, `rounded=1;absoluteArcSize=1;arcSize=24;fillColor=${FONDS.frontiere};strokeColor=${LIGNE};strokeWidth=1.3;dashed=1;dashPattern=8 6;verticalAlign=top;align=right;spacingRight=12;spacingTop=6;`],
  ['Zone imbriquée', 280, 160, `rounded=1;absoluteArcSize=1;arcSize=24;fillColor=${FOND_IMBRIQUE.frontiere};strokeColor=${LIGNE};strokeWidth=1.3;dashed=1;dashPattern=8 6;verticalAlign=top;align=right;spacingRight=12;spacingTop=6;`],
  ['Sujet du schéma', 160, 80, `rounded=0;fillColor=${FONDS.service};strokeColor=${ACCENT};strokeWidth=${ACCENT_EP};fontColor=${ACCENT};fontStyle=1;`],
];
const STYLE_COMMUN = 'whiteSpace=wrap;html=1;fontSize=13;fontColor=#16181A;';

function entreeForme([titre, w, h, style]) {
  const complet = STYLE_COMMUN + style;
  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${echapXml(titre)}" style="${echapXml(complet)}" vertex="1" parent="1">`
    + `<mxGeometry x="0" y="0" width="${w}" height="${h}" as="geometry"/></mxCell>`
    + `</root></mxGraphModel>`;
  const compresse = compresser(xml);
  if (decompresser(compresse) !== xml) throw new Error(`aller-retour cassé : ${titre}`);
  return { xml: compresse, w, h, title: titre };
}

// L'annotation de flèche : le trait s'interrompt derrière son étiquette, ce que
// draw.io fait nativement par labelBackgroundColor. Voir docs/rendus-fleches.svg.
function entreeFleche() {
  const style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=blockThin;endFill=1;'
    + `strokeColor=${LIGNE};strokeWidth=1.5;fontSize=11;fontColor=#5B6873;labelBackgroundColor=#FFFFFF;`;
  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>`
    + `<mxCell id="2" value="${echapXml('intention')}" style="${echapXml(style)}" edge="1" parent="1">`
    + `<mxGeometry relative="1" as="geometry">`
    + `<mxPoint x="0" y="40" as="sourcePoint"/><mxPoint x="160" y="40" as="targetPoint"/>`
    + `</mxGeometry></mxCell></root></mxGraphModel>`;
  const compresse = compresser(xml);
  if (decompresser(compresse) !== xml) throw new Error('aller-retour cassé : flèche');
  return { xml: compresse, w: 160, h: 80, title: 'Flèche annotée' };
}

function bibliothequeGrammaire() {
  const entrees = GRAMMAIRE.map(entreeForme).concat([entreeFleche()]);
  // La bibliothèque doit porter les neuf fonds de la grammaire, sinon elle
  // livre une version périmée de l'ADR 0007 à ceux qui partent de draw.io.
  const styles = GRAMMAIRE.map((g) => g[3]).join(' ');
  for (const [forme, fond] of Object.entries(FONDS)) {
    if (!styles.includes(`fillColor=${fond};`)) {
      throw new Error(`grammaire.xml : le fond de « ${forme} » (${fond}) n'y figure pas.`);
    }
  }
  const json = JSON.stringify(entrees);
  if (/[<&]/.test(json)) throw new Error('caractère interdit dans le JSON de grammaire.xml');
  fs.writeFileSync(path.join(ROOT, 'drawio', 'grammaire.xml'), `<mxlibrary>${json}</mxlibrary>\n`);
  return entrees.length;
}

for (const [type, fichier] of [['protocole', 'protocoles.xml'], ['produit', 'produits.xml'], ['role', 'roles.xml']]) {
  const { n, ko } = bibliotheque(fichier, rows.filter((r) => r.type === type));
  console.log(`  drawio/${fichier.padEnd(15)} · ${String(n).padStart(2)} formes · ${ko} Ko`);
}
console.log(`  drawio/grammaire.xml   · ${bibliothequeGrammaire()} formes · la grammaire, fonds et accent compris`);
