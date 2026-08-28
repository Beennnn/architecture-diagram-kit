// Planche d'arbitrage sur l'annotation des flèches. Constat de départ : dans la
// vue Voltis, quatre bloc-marques sont posés 24 px au-dessus de leur trait et un
// seul — SMTP — est posé dessus. La divergence n'est pas un choix : le
// bloc-marque fait environ 150 px alors que les flèches courtes en font 82, donc
// le poser sur le trait déborderait sur les deux boîtes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, TRAIT, LIGNE, esc, lire, dim, symbole, badge, boite, fleche } from './schema.mjs';
import { encreLisible } from './couleurs.mjs';

const W = 1240, MONO = "'IBM Plex Mono',monospace";
const COUCHES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8')).couches;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const FAM = {}; for (const [k, c] of Object.entries(COUCHES)) for (const f of c.familles) FAM[f] = k;
const PAR_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));
const encre = (slug) => encreLisible(COUCHES[FAM[PAR_SLUG[slug].famille]].clair, '#FFFFFF', 4.5);
const nom = (slug) => PAR_SLUG[slug].label;

// La géométrie réelle de Voltis, à l'échelle : deux flèches courtes de 82 px
// entre boîtes voisines, et une polyligne coudée pour SMTP. Le décalage vertical
// est appliqué en construisant les tracés, jamais par substitution sur la chaîne
// du chemin : « V88 » est une ordonnée absolue qu'une regex sur « x,y » ne voit pas.
const X0 = 430, BW = 100, BH = 46;
const COURTES = [
  { slug: 'ssh', x: 0, y: 54, gauche: 'Exploitation', droite: 'Bastion' },
  { slug: 'mqtt', x: 310, y: 54, gauche: 'Bornes', droite: 'Ingestion' },
];
const COUDE = { slug: 'smtp', xd: 670, yd: 52, xm: 746, ym: 78, ya: 96 };

const boiteMuette = (x, y, t) =>
  boite({ x, y, w: BW, h: BH, forme: 'service' })
  + `<text x="${x + BW / 2}" y="${y + BH / 2 + 4}" text-anchor="middle" font-size="11" fill="${DOUX}">${esc(t)}</text>`;

const cheminCoude = (dy) =>
  `M${COUDE.xd},${COUDE.yd + dy} V${COUDE.ym + dy} H${COUDE.xm} V${COUDE.ya + dy}`;

const decor = (dy) => COURTES.map((c) =>
  boiteMuette(c.x, c.y + dy - BH / 2, c.gauche)
  + boiteMuette(c.x + BW + 82, c.y + dy - BH / 2, c.droite)).join('')
  + boiteMuette(620, 6 + dy, 'Facturation')
  + boiteMuette(696, 100 + dy, 'Relais');

const traits = (dy) => COURTES.map((c) =>
  `<line x1="${c.x + BW}" y1="${c.y + dy}" x2="${c.x + BW + 77}" y2="${c.y + dy}" stroke="${LIGNE}" stroke-width="1.5" marker-end="url(#fl)"/>`).join('')
  + `<path d="${cheminCoude(dy)}" fill="none" stroke="${LIGNE}" stroke-width="1.5" marker-end="url(#fl)"/>`;

// Le point à mi-longueur d'une polyligne, et l'orientation du segment qui le
// porte. textPath place son texte là tout seul ; un symbole n'étant pas du
// texte, il faut le calculer — ce qui retire à textPath son dernier avantage.
function miParcours(points) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    seg.push(l); total += l;
  }
  let reste = total / 2;
  for (let i = 0; i < seg.length; i++) {
    if (reste <= seg[i]) {
      const [ax, ay] = points[i], [bx, by] = points[i + 1], t = seg[i] ? reste / seg[i] : 0;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, vertical: ax === bx };
    }
    reste -= seg[i];
  }
  const d = points[points.length - 1];
  return { x: d[0], y: d[1], vertical: false };
}
const pointsCourte = (c, dy) => [[c.x + BW, c.y + dy], [c.x + BW + 77, c.y + dy]];
const pointsCoude = (dy) => [[COUDE.xd, COUDE.yd + dy], [COUDE.xd, COUDE.ym + dy],
  [COUDE.xm, COUDE.ym + dy], [COUDE.xm, COUDE.ya + dy]];

const milieuCourte = (c) => c.x + BW + 41;
const milieuCoude = () => [(COUDE.xd + COUDE.xm) / 2, COUDE.ym];

// --- les trois façons d'annoter ------------------------------------------
// A — l'existant : bloc-marque teinté, 24 px au-dessus du trait.
const A = (dy) => COURTES.map((c) => badge(c.slug, milieuCourte(c), c.y + dy - 26)).join('')
  + badge(COUDE.slug, milieuCoude()[0], milieuCoude()[1] + dy - 26);

// B — sans pastille : symbole et nom en encre de couche, posés SUR le trait,
//     qui s'interrompt derrière eux. C'est la convention de draw.io et d'AWS.
function surLeTrait(slug, cx, cy) {
  const t = 17, texte = nom(slug);
  const largeur = t + 5 + texte.length * 6.6;
  const x = cx - largeur / 2;
  return `<rect x="${x - 5}" y="${cy - 11}" width="${largeur + 10}" height="22" fill="#FFFFFF"/>`
    + symbole(slug, x, cy - t / 2, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '')
    + `<text x="${x + t + 5}" y="${cy + 4}" font-size="11.5" font-weight="600" fill="${encre(slug)}">${esc(texte)}</text>`;
}
const B = (dy) => COURTES.map((c) => surLeTrait(c.slug, milieuCourte(c), c.y + dy)).join('')
  + surLeTrait(COUDE.slug, milieuCoude()[0], milieuCoude()[1] + dy);

// C — textPath : le texte suit le tracé. Il ne peut pas emporter de symbole, et
//     son orientation dépend du segment sur lequel tombe son point milieu : ici
//     l'horizontale, mais un routage un peu différent le coucherait à la verticale.
const C = (dy) => COURTES.map((c, i) =>
  `<path id="tp${i}-${dy}" d="M${c.x + BW},${c.y + dy} H${c.x + BW + 77}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${encre(c.slug)}" dy="-5">`
  + `<textPath href="#tp${i}-${dy}" startOffset="50%" text-anchor="middle">${esc(nom(c.slug))}</textPath></text>`).join('')
  + `<path id="tps-${dy}" d="${cheminCoude(dy)}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${encre(COUDE.slug)}" dy="-5">`
  + `<textPath href="#tps-${dy}" startOffset="50%" text-anchor="middle">${esc(nom(COUDE.slug))}</textPath></text>`;

// D — le texte reste porté par le tracé, et le symbole vient sous lui pour
//     rendre le dual coding. Il faut donc calculer le milieu que textPath
//     trouvait seul : la mécanique des deux options n'est plus la même.
function symboleSousTexte(slug, pt) {
  const t = 16;
  return symbole(slug, pt.x - t / 2, pt.y - t - 3, t)
    .replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '');
}
const D = (dy) => COURTES.map((c, i) =>
  `<path id="dp${i}-${dy}" d="M${c.x + BW},${c.y + dy} H${c.x + BW + 77}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${encre(c.slug)}" dy="-23">`
  + `<textPath href="#dp${i}-${dy}" startOffset="50%" text-anchor="middle">${esc(nom(c.slug))}</textPath></text>`
  + symboleSousTexte(c.slug, miParcours(pointsCourte(c, dy)))).join('')
  + `<path id="dps-${dy}" d="${cheminCoude(dy)}" fill="none" stroke="none"/>`
  + `<text font-size="11.5" font-weight="600" fill="${encre(COUDE.slug)}" dy="-23">`
  + `<textPath href="#dps-${dy}" startOffset="50%" text-anchor="middle">${esc(nom(COUDE.slug))}</textPath></text>`
  + symboleSousTexte(COUDE.slug, miParcours(pointsCoude(dy)));

const RANGS = [
  { cle: 'A', titre: 'Bloc-marque au-dessus du trait', sous: 'l’existant', rendu: A, verdict: ['#5B6873', '#F1F3F4', 'EXISTANT'],
    notes: ['Le bloc-marque fait 150 px pour une flèche de 82 :',
            'impossible à poser sur le trait sans déborder.',
            'D’où le décalage de 24 px — et le pâté flottant,',
            'dont la pastille pèse plus que la flèche annotée.'] },
  { cle: 'B', titre: 'Symbole et nom sur le trait', sous: 'sans pastille, le trait s’interrompt', rendu: B, verdict: ['#0B7A6E', '#D8ECE9', 'RECOMMANDÉ'],
    notes: ['56 px au lieu de 150 : tient dans la flèche courte.',
            'L’annotation revient sur son trait, donc on ne se',
            'demande plus à quelle flèche elle appartient.',
            'Convention de draw.io, d’AWS et de PlantUML.'] },
  { cle: 'C', titre: 'Texte porté par le tracé', sous: 'textPath', rendu: C, verdict: ['#C0392F', '#FBECEA', 'À ÉCARTER ICI'],
    notes: ['Techniquement disponible, et le bon outil sur un', 'tracé courbe. Mais il ne peut pas emporter de', 'symbole : le dual coding tombe, et c’est justement', 'ce que ce dépôt fabrique. Le texte étant lié au', 'tracé, il bascule à la verticale dès que son point', 'milieu tombe sur un segment vertical — donc son', 'orientation dépend du routage, pas d’une décision.'] },
  { cle: 'D', titre: 'Texte sur le tracé, symbole dessous', sous: 'la proposition : sémantique portée par le texte, symbole en appui', rendu: D, verdict: ['#B36208', '#FBF0E2', 'RÉTABLIT LE SYMBOLE'],
    notes: ['Rend le dual coding que C avait perdu, et garde le', 'texte lié au tracé. Mais le symbole, lui, ne suit', 'rien : il a fallu calculer le milieu que textPath', 'trouvait seul — l’avantage de textPath s’annule là.', 'Surtout, empiler pousse l’annotation vers le haut,', 'dans l’espace déjà occupé : voyez SMTP percuter le', 'bas de Facturation, le symbole détaché du trait.'] },
];

const LARGEUR_NOTE = Math.floor((X0 - 48 - 16) / 4.9);
for (const r of RANGS) for (const n of r.notes) {
  if (n.length > LARGEUR_NOTE) throw new Error(`Note de ${n.length} caractères pour ${LARGEUR_NOTE} : « ${n} »`);
}
const CH = 190, Y0 = 132;
let out = '';
RANGS.forEach((r, k) => {
  const y = Y0 + k * (CH + 14);
  const [encreV, fondV, texteV] = r.verdict;
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`
    + `<text x="48" y="${y + 30}" font-size="18" font-weight="700" fill="${ENCRE}">${r.cle}</text>`
    + `<text x="68" y="${y + 30}" font-size="14.5" font-weight="700" fill="${ENCRE}">${esc(r.titre)}</text>`
    + `<text x="68" y="${y + 47}" font-size="11" fill="${DOUX}">${esc(r.sous)}</text>`;
  const lg = texteV.length * 6.2 + 18;
  out += `<rect x="48" y="${y + 58}" width="${lg}" height="19" rx="9.5" fill="${fondV}" stroke="${encreV}" stroke-width="1.1"/>`
    + `<text x="${48 + lg / 2}" y="${y + 71.5}" text-anchor="middle" font-size="9.5" font-weight="700" font-family="${MONO}" fill="${encreV}">${texteV}</text>`
    + r.notes.map((n, j) => `<text x="48" y="${y + 98 + j * 14}" font-size="10" fill="${DOUX}">${esc(n)}</text>`).join('');
  const dy = y + 34;
  out += `<g transform="translate(${X0} 0)">${decor(dy)}${traits(dy)}${r.rendu(dy)}</g>`;
});

const H = Y0 + RANGS.length * (CH + 14) + 76;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Trois façons d'annoter une flèche par un protocole">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/><defs>${fleche()}</defs>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${ENCRE}">Annoter une flèche par son protocole</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${DOUX}">Géométrie réelle de la vue Voltis : deux flèches courtes de 82 px entre boîtes voisines, et la polyligne coudée de SMTP.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${DOUX}">Aujourd’hui quatre annotations sont posées 24 px au-dessus de leur trait et une seule dessus. La divergence vient de la largeur du bloc-marque, pas d’une intention.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`
  + out
  + `<line x1="24" y1="${H - 54}" x2="${W - 24}" y2="${H - 54}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 32}" font-size="12" fill="${DOUX}">Recommandation : <tspan font-weight="700" fill="${ENCRE}">B</tspan>, où le texte domine déjà le symbole — 11,5 px gras coloré contre 17 px monochrome. La hiérarchie voulue en D y est acquise, sans quitter le couloir du trait.</text>`
  + `<text x="24" y="${H - 14}" font-size="10.5" fill="${LIGNE}">Rien n’est appliqué : la vue Voltis est toujours en A. Planche générée par scripts/specimen-fleches.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Coordonnée non finie dans la planche des flèches.');
fs.writeFileSync(path.join(ROOT, 'docs/rendus-fleches.svg'), svg);
console.log(`docs/rendus-fleches.svg — ${W}x${H}`);
