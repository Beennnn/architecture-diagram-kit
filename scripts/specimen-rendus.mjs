// Planche d'arbitrage : le même fragment de schéma rendu de six façons, pour
// trancher la question « les icônes sont belles mais pas assez visibles, et on
// distingue mal les boîtes entre elles ». Rien ici n'est la grammaire en
// vigueur : les variantes B à F sont des propositions, pas des primitives.
// Seule la variante A utilise boite() de schema.mjs — c'est l'existant.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, TRAIT, LIGNE, esc, lire, dim, symbole, badge, boite, fleche } from './schema.mjs';
import { fondTeinte, encreLisible, contraste } from './couleurs.mjs';

const CANVAS = '#FFFFFF';
const couches = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8')).couches;
const T = (c, cible) => fondTeinte(couches[c].clair, CANVAS, cible);
const ENCRE_C = (c) => encreLisible(couches[c].clair, CANVAS, 4.5);

// Le fragment, identique dans les six cartes : cinq nœuds couvrant cinq formes
// et quatre couches, pour que la comparaison porte sur le rendu et rien d'autre.
const NOEUDS = [
  { slug: 'poste-client', nom: 'Poste client', forme: 'acteur',      couche: 'infra' },
  { slug: 'springboot',   nom: 'Spring Boot',  forme: 'application', couche: 'api' },
  { slug: 'kafka',        nom: 'Kafka',        forme: 'flux',        couche: 'messaging' },
  { slug: 'postgresql',   nom: 'PostgreSQL',   forme: 'stockage',    couche: 'fichiers' },
  { slug: 's3',           nom: 'S3',           forme: 'externe',     couche: 'fichiers' },
];

const W = 1200, X0 = 285, BW = 155, BH = 88, GAP = 27.5;
const xDe = (i) => X0 + i * (BW + GAP);

// --- géométries locales : les variantes ont besoin de fonds et de liserés que
// --- la grammaire actuelle n'expose pas. On les redessine ici, sans la toucher.
const RX = { service: 0, application: 10, acteur: 10, materiel: 3, noeud: 2, externe: 8 };
function coque(f, x, y, w, h, { fond = '#FFFFFF', trait = TRAIT, ep = 1.6, tirets = null } = {}) {
  const d = tirets ? ` stroke-dasharray="${tirets}"` : '';
  if (f === 'stockage') {
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`;
  }
  const rx = f === 'flux' ? h / 2 : (RX[f] ?? 0);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`;
}
// Le haut utile d'une forme : le cylindre perd 14 px sous son ellipse.
const hautUtile = (f, y) => (f === 'stockage' ? y + 20 : y + 12);

// Un bloc-marque mis à l'échelle pour tenir dans une largeur donnée.
function marque(slug, cx, cy, largeurMax) {
  const raw = lire(`lockups/horizontal/${slug}.svg`);
  const e = Math.min(0.82, largeurMax / dim(raw, 'width'));
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}
// Un symbole débarrassé de sa pastille : les fichiers symboles/ sont des carrés
// teintés de 48 px (rx 13) portant un glyphe de 30 px, pas des pictos nus. Sur
// un fond déjà teinté, la pastille ferait doublon — on ne garde que le glyphe.
function glyphe(slug, x, y, t) {
  return symbole(slug, x, y, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '');
}

// Le contenu d'un bloc-marque « ouvert » : posé à même la boîte, sans pastille.
function ouvert(slug, nom, cx, cy, t = 30) {
  const lg = t + 8 + nom.length * 7.4;
  const x = cx - lg / 2;
  return glyphe(slug, x, cy - t / 2, t)
    + `<text x="${x + t + 8}" y="${cy + 5}" font-size="14" font-weight="600" fill="${ENCRE}">${esc(nom)}</text>`;
}
const libelle = (cx, y, nom, encre = ENCRE) =>
  `<text x="${cx}" y="${y}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${encre}">${esc(nom)}</text>`;

// --- les six rendus ------------------------------------------------------
const RENDUS = {
  // A — l'existant : picto nu monochrome à 34 px, libellé sous lui.
  A: (n, i, y) => boite({ x: xDe(i), y, w: BW, h: BH, forme: n.forme })
    + symbole(n.slug, xDe(i) + BW / 2 - 17, hautUtile(n.forme, y), 34)
    + libelle(xDe(i) + BW / 2, y + BH - 18, n.nom),

  // B — le même picto à 44 px : plus d'encre, aucune variable de plus.
  B: (n, i, y) => boite({ x: xDe(i), y, w: BW, h: BH, forme: n.forme })
    + symbole(n.slug, xDe(i) + BW / 2 - 22, hautUtile(n.forme, y) - 4, 44)
    + libelle(xDe(i) + BW / 2, y + BH - 14, n.nom),

  // C — A, plus un unique sujet accentué par la couleur de sa couche.
  C: (n, i, y) => {
    const vedette = i === 1;
    const enc = vedette ? ENCRE_C(n.couche) : null;
    return coque(n.forme, xDe(i), y, BW, BH, {
      fond: n.forme === 'externe' ? '#EDEFF1' : n.forme === 'acteur' ? '#F8F9FA' : '#FFFFFF',
      trait: vedette ? enc : (n.forme === 'externe' ? LIGNE : TRAIT),
      ep: vedette ? 2.6 : 1.6, tirets: n.forme === 'externe' ? '5 4' : null,
    })
      + symbole(n.slug, xDe(i) + BW / 2 - 17, hautUtile(n.forme, y), 34)
      + libelle(xDe(i) + BW / 2, y + BH - 18, n.nom, vedette ? enc : ENCRE);
  },

  // D — le bloc-marque remplace picto + libellé. Boîtes inchangées.
  D: (n, i, y) => boite({ x: xDe(i), y, w: BW, h: BH, forme: n.forme })
    + marque(n.slug, xDe(i) + BW / 2, y + BH / 2 + (n.forme === 'stockage' ? 4 : 0), BW - 16),

  // E — D, plus l'échelle de gris des formes réellement écartée.
  //     La forme se lit par la valeur du fond, la couche par la teinte du bloc-marque.
  E: (n, i, y) => {
    const FOND = { application: '#FFFFFF', service: '#FFFFFF', flux: '#FFFFFF', stockage: '#FFFFFF',
      acteur: '#E8ECEF', materiel: '#EDF0F2', noeud: '#DFE5E9', externe: '#F3F5F6' };
    return coque(n.forme, xDe(i), y, BW, BH, {
      fond: FOND[n.forme] || '#FFFFFF',
      trait: n.forme === 'externe' ? LIGNE : TRAIT,
      ep: n.forme === 'noeud' ? 2.4 : 1.6,
      tirets: n.forme === 'externe' ? '5 4' : null,
    }) + marque(n.slug, xDe(i) + BW / 2, y + BH / 2 + (n.forme === 'stockage' ? 4 : 0), BW - 16);
  },

  // F — le bloc-marque devient la boîte : la teinte de couche remplit la forme,
  //     le liseré prend l'encre de couche, la pastille disparaît (elle ferait doublon).
  F: (n, i, y) => {
    const enc = ENCRE_C(n.couche);
    return coque(n.forme, xDe(i), y, BW, BH, {
      fond: T(n.couche, 0.9), trait: enc, ep: n.forme === 'noeud' ? 2.4 : 1.8,
      tirets: n.forme === 'externe' ? '5 4' : null,
    }) + ouvert(n.slug, n.nom, xDe(i) + BW / 2, y + BH / 2 + (n.forme === 'stockage' ? 5 : 0), 28);
  },
};

// --- les recommandations, écrites dans la planche --------------------------
const VERDICTS = {
  ecarter:     ['#C0392F', '#FBECEA', 'À ÉCARTER'],
  reference:   ['#5B6873', '#F1F3F4', 'EXISTANT'],
  prendre:     ['#0B7A6E', '#E4F2F0', 'À PRENDRE'],
  insuffisant: ['#B36208', '#FBF0E2', 'INSUFFISANT SEUL'],
  recommande:  ['#0B7A6E', '#D8ECE9', 'RECOMMANDÉ'],
  adr:         ['#7038D8', '#EFE8FB', 'EXIGE UN ADR'],
};
const CARTES = [
  { cle: 'A', titre: 'Symbole seul, 34 px', sous: 'l’existant',
    verdict: 'reference', levier: '—',
    notes: ['Pastille teintée de 34 px : 12 % de la boîte.', 'Les formes ne se séparent que par l’arrondi —', 'application et acteur ont le même (rx 10).', 'Aucune couleur hors de la pastille.'] },
  { cle: 'B', titre: 'Symbole grossi, 44 px', sous: 'plus gros, rien de plus',
    verdict: 'ecarter', levier: 'levier 2',
    notes: ['De 12 % à 20 % de la boîte.', 'Plus d’encre, aucune variable de plus : ne dit', 'toujours rien de la couche ni de la forme.', 'Coût géométrique réel, gain décoratif.'] },
  { cle: 'C', titre: 'Un accent par schéma', sous: 'un seul sujet coloré',
    verdict: 'prendre', levier: 'levier 1',
    notes: ['Applique l’étape 6 de notre propre recette,', 'jamais appliquée aux six vues existantes.', 'Ne touche ni la grammaire, ni la géométrie,', 'ni les blocs-marques. Gratuit et indépendant.'] },
  { cle: 'D', titre: 'Bloc-marque dans la boîte', sous: 'il remplace picto + libellé',
    verdict: 'insuffisant', levier: 'levier 2',
    notes: ['Sort les 488 blocs-marques des flèches, où', 'ils sont aujourd’hui cantonnés.', 'Mais la pastille fait 1,14:1 sur blanc et', '1,01:1 sur « externe » : voyez S3, à droite.'] },
  { cle: 'E', titre: 'Bloc-marque + fonds écartés', sous: 'forme = valeur, couche = teinte',
    verdict: 'recommande', levier: 'levier 2',
    notes: ['Sépare les variables : le gris code la forme,', 'la teinte code la couche.', 'Répond aux deux impressions à la fois et', 'survit au niveau de gris. Sans ADR.'] },
  { cle: 'F', titre: 'Le bloc-marque devient la boîte', sous: 'teinte de couche pleine',
    verdict: 'adr', levier: 'levier 3',
    notes: ['Unifie les deux systèmes, qui ne partagent', 'aujourd’hui que le glyphe brut.', 'Distinction maximale, mais la couleur porte', 'seule : notre test des niveaux de gris tombe.'] },
];

// --- assemblage ------------------------------------------------------------
const LARGEUR_NOTE = 46;
for (const c of CARTES) for (const n of c.notes) {
  if (n.length > LARGEUR_NOTE) throw new Error(`Note trop longue (${n.length} > ${LARGEUR_NOTE}), elle passerait sous les boîtes : « ${n} »`);
}
const CH = 172, CG = 14, Y0 = 132;
let out = '';
CARTES.forEach((c, k) => {
  const y = Y0 + k * (CH + CG);
  const [encreV, fondV, texteV] = VERDICTS[c.verdict];
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`;
  out += `<text x="48" y="${y + 34}" font-size="19" font-weight="700" fill="${ENCRE}">${c.cle}</text>`;
  out += `<text x="70" y="${y + 34}" font-size="15" font-weight="700" fill="${ENCRE}">${esc(c.titre)}</text>`;
  out += `<text x="70" y="${y + 51}" font-size="11.5" fill="${DOUX}">${esc(c.sous)}</text>`;
  const lg = texteV.length * 6.2 + 18;
  out += `<rect x="48" y="${y + 62}" width="${lg}" height="19" rx="9.5" fill="${fondV}" stroke="${encreV}" stroke-width="1.1"/>`
       + `<text x="${48 + lg / 2}" y="${y + 75.5}" text-anchor="middle" font-size="9.5" font-weight="700"`
       + ` font-family="'IBM Plex Mono',monospace" fill="${encreV}">${texteV}</text>`;
  out += `<text x="${48 + lg + 10}" y="${y + 75.5}" font-size="9.5" font-weight="600" font-family="'IBM Plex Mono',monospace" fill="${LIGNE}">${c.levier}</text>`;
  c.notes.forEach((n, j) => {
    out += `<text x="48" y="${y + 100 + j * 14}" font-size="10" fill="${DOUX}">${esc(n)}</text>`;
  });
  const ys = y + 62;
  for (let i = 0; i < NOEUDS.length - 1; i++) {
    const yc = ys + BH / 2 + (NOEUDS[i].forme === 'stockage' ? 4 : 0);
    out += `<line x1="${xDe(i) + BW}" y1="${yc}" x2="${xDe(i + 1) - 5}" y2="${yc}" stroke="${LIGNE}" stroke-width="1.5" marker-end="url(#fl)"/>`;
  }
  NOEUDS.forEach((n, i) => { out += RENDUS[c.cle](n, i, ys); });
});

const H = Y0 + CARTES.length * (CH + CG) + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Six rendus candidats pour les nœuds de schéma, avec recommandation">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/><defs>${fleche()}</defs>`
  + `<text x="24" y="46" font-size="23" font-weight="700" fill="${ENCRE}">Six rendus candidats pour un nœud de schéma</text>`
  + `<text x="24" y="70" font-size="12.5" fill="${DOUX}">Même fragment à chaque ligne — cinq formes, quatre couches — pour que la comparaison porte sur le rendu et rien d’autre. Colonnes alignées : comparez verticalement.</text>`
  + `<text x="24" y="90" font-size="12.5" fill="${DOUX}">Question posée : les symboles sont beaux mais discrets, et deux boîtes de formes différentes se ressemblent trop. Le verdict de chaque ligne est mon avis, pas une décision.</text>`
  + `<line x1="24" y1="108" x2="${W - 24}" y2="108" stroke="#E3E7EA"/>`
  + `<text x="24" y="124" font-size="9.5" font-weight="700" font-family="'IBM Plex Mono',monospace" fill="${LIGNE}">RENDU</text>`
  + NOEUDS.map((n, i) => `<text x="${xDe(i) + BW / 2}" y="124" text-anchor="middle" font-size="9.5" font-weight="700" font-family="'IBM Plex Mono',monospace" fill="${LIGNE}">${esc(n.forme.toUpperCase())} · ${esc(couches[n.couche].label.toUpperCase())}</text>`).join('')
  + out
  + `<line x1="24" y1="${H - 56}" x2="${W - 24}" y2="${H - 56}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 34}" font-size="12" fill="${DOUX}">Recommandation : <tspan font-weight="700" fill="${ENCRE}">C tout de suite</tspan> (gratuit, indépendant), puis <tspan font-weight="700" fill="${ENCRE}">E</tspan> comme cible. D seul ne suffit pas, B est à écarter, F ne se décide pas sans ADR.</text>`
  + `<text x="24" y="${H - 16}" font-size="10.5" fill="${LIGNE}">Rien de tout ceci n’est appliqué : seule la ligne A correspond à l’état du dépôt. Planche générée par scripts/specimen-rendus.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Coordonnée non finie dans la planche de rendus.');
fs.writeFileSync(path.join(ROOT, 'docs/rendus-candidats.svg'), svg);
console.log(`docs/rendus-candidats.svg — ${W}x${H}, ${CARTES.length} rendus`);
