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

const protocoles = rows.filter((r) => r.type === 'protocole');
const produits = rows.filter((r) => r.type === 'produit');
const a = bibliotheque('protocoles.xml', protocoles);
const b = bibliotheque('produits.xml', produits);
console.log(`  drawio/protocoles.xml · ${a.n} formes · ${a.ko} Ko`);
console.log(`  drawio/produits.xml   · ${b.n} formes · ${b.ko} Ko`);
