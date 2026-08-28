// Planche d'arbitrage : le même fragment de schéma rendu de sept façons, pour
// trancher les questions « les symboles sont beaux mais pas assez visibles »,
// « on distingue mal les boîtes entre elles » et « il faut nommer le bucket ».
// Rien ici n'est la grammaire en vigueur : les variantes B à G sont des
// propositions. Seule la variante A utilise boite() de schema.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, LIGNE, esc, fleche } from './schema.mjs';
import { FRAG, LIENS, SH, MONO, RENDUS } from './fragment.mjs';

const W = 1460, X0 = 300;

// --- les recommandations, écrites dans la planche --------------------------
const VERDICTS = {
  ecarter:     ['#C0392F', '#FBECEA', 'À ÉCARTER'],
  reference:   ['#5B6873', '#F1F3F4', 'EXISTANT'],
  prendre:     ['#0B7A6E', '#E4F2F0', 'À PRENDRE'],
  insuffisant: ['#B36208', '#FBF0E2', 'INSUFFISANT SEUL'],
  recommande:  ['#0B7A6E', '#D8ECE9', 'RECOMMANDÉ'],
  adr:         ['#7038D8', '#EFE8FB', 'EXIGE UN ADR'],
  propose:     ['#0B6E7F', '#DDEDF1', 'MA PROPOSITION'],
};
const CARTES = [
  { cle: 'A', titre: 'Symbole seul, 34 px', sous: 'l’existant, + le nom d’instance',
    verdict: 'reference', levier: '—',
    notes: ['Produit et instance sont écrits ici — mais nos', 'six vues n’écrivent aujourd’hui que le produit.', 'La frontière n’a ni symbole ni identité :', 'boite() ne connaît que huit formes sur neuf.'] },
  { cle: 'B', titre: 'Symbole grossi, 44 px', sous: 'plus gros, rien de plus',
    verdict: 'ecarter', levier: 'levier 2',
    notes: ['De 12 % à 20 % de la boîte pour le symbole.', 'Plus d’encre, aucune variable de plus — et deux', 'lignes de texte à caser sous un symbole plus haut.', 'Le cylindre plafonne à 36 px : il perd 14 px sous', 'son ellipse. Rapport coût/gain défavorable.'] },
  { cle: 'C', titre: 'Un accent par schéma', sous: 'un seul sujet coloré',
    verdict: 'prendre', levier: 'levier 1',
    notes: ['Applique l’étape 6 de notre propre recette,', 'jamais appliquée aux six vues existantes.', 'Ne touche ni la grammaire ni la géométrie.', 'Gratuit, et cumulable avec n’importe quelle ligne.'] },
  { cle: 'D', titre: 'Bloc-marque + instance', sous: 'produit dessus, instance dessous',
    verdict: 'insuffisant', levier: 'levier 2',
    notes: ['Le bloc-marque écrit le produit, l’instance passe', 'dessous : deux registres, deux typographies.', 'Mais sa taille suit la largeur de la boîte :', 'comparez « Passerelle d’API » et « Kafka ». Et sa', 'pastille fait 1,01:1 sur « externe » : voyez S3.'] },
  { cle: 'E', titre: 'Bloc-marque + fonds écartés', sous: 'forme = valeur, couche = teinte',
    verdict: 'recommande', levier: 'levier 2',
    notes: ['Même contenu que D, mais le fond code la forme :', 'zone claire, nœud gris, application blanche.', 'L’emboîtement se lit sans suivre les bordures.', 'Survit au niveau de gris. Sans ADR.'] },
  { cle: 'F', titre: 'Le bloc-marque devient la boîte', sous: 'instance en titre, produit en sous-titre',
    verdict: 'adr', levier: 'levier 3',
    notes: ['Inverse la hiérarchie : l’instance devient le titre,', 'le produit passe en sous-titre.', 'Seul rendu qui répond vraiment à « nommer le', 'bucket ». Mais la couleur porte seule.'] },
  { cle: 'G', titre: 'La combinaison', sous: 'fonds de E, hiérarchie de F, accent de C',
    verdict: 'propose', levier: 'levier 2',
    notes: ['Le fond code la forme, l’instance fait le titre, le',
            'produit le sous-titre, un seul sujet est accentué.',
            'Le symbole garde sa pastille : lui seul porte la',
            'couleur de marque, et les logos se reconnaissent.',
            'Survit au niveau de gris, et sans ADR.'] },
];

// --- assemblage ------------------------------------------------------------
const LARGEUR_NOTE = 52;  // colonne de gauche : 48 → X0, à 10 px de fonte
for (const c of CARTES) for (const n of c.notes) {
  if (n.length > LARGEUR_NOTE) throw new Error(`Note trop longue (${n.length} > ${LARGEUR_NOTE}), elle passerait sous les boîtes : « ${n} »`);
}
const CH = 346, CG = 14, Y0 = 118;
let out = '';
CARTES.forEach((c, k) => {
  const y = Y0 + k * (CH + CG);
  const [encreV, fondV, texteV] = VERDICTS[c.verdict];
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`;
  out += `<text x="48" y="${y + 32}" font-size="19" font-weight="700" fill="${ENCRE}">${c.cle}</text>`;
  out += `<text x="70" y="${y + 32}" font-size="15" font-weight="700" fill="${ENCRE}">${esc(c.titre)}</text>`;
  out += `<text x="70" y="${y + 49}" font-size="11.5" fill="${DOUX}">${esc(c.sous)}</text>`;
  const lg = texteV.length * 6.2 + 18;
  out += `<rect x="48" y="${y + 60}" width="${lg}" height="19" rx="9.5" fill="${fondV}" stroke="${encreV}" stroke-width="1.1"/>`
       + `<text x="${48 + lg / 2}" y="${y + 73.5}" text-anchor="middle" font-size="9.5" font-weight="700"`
       + ` font-family="${MONO}" fill="${encreV}">${texteV}</text>`;
  out += `<text x="${48 + lg + 10}" y="${y + 73.5}" font-size="9.5" font-weight="600" font-family="${MONO}" fill="${LIGNE}">${c.levier}</text>`;
  c.notes.forEach((n, j) => {
    out += `<text x="48" y="${y + 100 + j * 14}" font-size="10" fill="${DOUX}">${esc(n)}</text>`;
  });

  // Le fragment, translaté sous l'en-tête de la carte.
  const sy = y + 34;
  out += `<g transform="translate(${X0} ${sy})">`;
  for (const [a, b, yl] of LIENS) {
    const g = FRAG[a], d = FRAG[b];
    out += `<line x1="${g.x + g.w}" y1="${yl}" x2="${d.x - 5}" y2="${yl}" stroke="${LIGNE}" stroke-width="1.5" marker-end="url(#fl)"/>`;
  }
  // Conteneurs d'abord : ils sont dessous.
  for (const n of FRAG) if (n.conteneur) out += RENDUS[c.cle](n);
  for (const n of FRAG) if (!n.conteneur) out += RENDUS[c.cle](n);
  // Étiquette de forme, pour que la comparaison verticale reste possible.
  for (const n of FRAG) {
    out += `<text x="${n.x + 2}" y="${n.y - 5}" font-size="8.5" font-weight="700" letter-spacing="0.6"`
         + ` font-family="${MONO}" fill="#A9B4BE">${esc(n.forme.toUpperCase())}</text>`;
  }
  out += `</g>`;
});

// Vérifications géométriques : la planche a déjà produit trois collisions.
for (const n of FRAG) {
  if (!n.conteneur && n.h < 92) throw new Error(`${n.slug} : ${n.h} px ne suffisent pas pour un symbole et deux lignes.`);
  const parent = FRAG.find((p) => p.conteneur && p !== n && n.x > p.x && n.x + n.w < p.x + p.w && n.y > p.y && n.y + n.h < p.y + p.h
    && !FRAG.some((q) => q.conteneur && q !== p && q !== n && q.x > p.x && n.x > q.x));
  if (parent && n.y - 5 < parent.y + 72) {
    throw new Error(`Étiquette de ${n.slug} (y=${n.y - 5}) dans le bloc-titre de ${parent.slug} (jusqu'à y=${parent.y + 72}).`);
  }
}

const H = Y0 + CARTES.length * (CH + CG) + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Sept rendus candidats pour les nœuds de schéma, avec recommandation">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/><defs>${fleche()}</defs>`
  + `<text x="24" y="46" font-size="23" font-weight="700" fill="${ENCRE}">Sept rendus candidats pour un nœud de schéma</text>`
  + `<text x="24" y="70" font-size="12.5" fill="${DOUX}">Même fragment à chaque ligne — les neuf formes de l’ADR 0003, dont deux conteneurs — pour que la comparaison porte sur le rendu et rien d’autre.</text>`
  + `<text x="24" y="90" font-size="12.5" fill="${DOUX}">Chaque nœud porte deux noms : le produit, que le bloc-marque sait écrire, et l’instance, que lui seul ne saura jamais écrire. Le verdict de chaque ligne est mon avis, pas une décision.</text>`
  + out
  + `<line x1="24" y1="${H - 56}" x2="${W - 24}" y2="${H - 56}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 34}" font-size="12" fill="${DOUX}">Recommandation : <tspan font-weight="700" fill="${ENCRE}">G</tspan>, qui combine les trois leviers compatibles — et <tspan font-weight="700" fill="${ENCRE}">C</tspan> seule si l’on ne veut toucher à rien. B est à écarter, D ne suffit pas seul, F ne se décide pas sans ADR.</text>`
  + `<text x="24" y="${H - 16}" font-size="10.5" fill="${LIGNE}">Rien de tout ceci n’est appliqué : seule la ligne A correspond à l’état du dépôt. Planche générée par scripts/specimen-rendus.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Coordonnée non finie dans la planche de rendus.');
fs.writeFileSync(path.join(ROOT, 'docs/rendus-candidats.svg'), svg);
console.log(`docs/rendus-candidats.svg — ${W}x${H}, ${CARTES.length} rendus`);
