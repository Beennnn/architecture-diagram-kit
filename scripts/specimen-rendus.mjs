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

// Le fragment, identique dans les six cartes : les NEUF formes de l'ADR 0003,
// dont deux conteneurs (frontiere, noeud), sur une architecture plausible.
//   Poste client → Pare-feu → [ Kubernetes : Passerelle → Nœud [ Spring Boot ]
//                               → Kafka / PostgreSQL ] → S3
//
// Chaque nœud porte DEUX noms : le produit (que le bloc-marque sait écrire) et
// l'instance (que lui seul ne saura jamais écrire — un bucket S3 s'appelle
// « voltis-factures », pas « S3 »). C'est la contrainte qui départage les rendus.
const FRAG = [
  { slug: 'poste-client',   nom: 'Poste client',     inst: 'poste agent',        forme: 'acteur',      couche: 'infra',
    x: 0,   y: 132, w: 150, h: 92 },
  { slug: 'pare-feu',       nom: 'Pare-feu',         inst: 'fw-edge-01',         forme: 'materiel',    couche: 'infra',
    x: 174, y: 132, w: 140, h: 92 },
  { slug: 'kubernetes',     nom: 'Kubernetes',       inst: 'cluster voltis-prod', forme: 'frontiere',  couche: 'infra',
    x: 338, y: 8,   w: 590, h: 294, conteneur: true },
  { slug: 'passerelle-api', nom: 'Passerelle d’API', inst: 'gw-public',          forme: 'service',     couche: 'infra',
    x: 354, y: 126, w: 152, h: 92 },
  { slug: 'noeud-cluster',  nom: 'Nœud de cluster',  inst: 'node-a3',            forme: 'noeud',       couche: 'infra',
    x: 526, y: 88,  w: 196, h: 196, conteneur: true },
  { slug: 'springboot',     nom: 'Spring Boot',      inst: 'svc-facturation',    forme: 'application', couche: 'api',
    x: 540, y: 170, w: 168, h: 92 },
  { slug: 'kafka',          nom: 'Kafka',            inst: 'factures.v1',        forme: 'flux',        couche: 'messaging',
    x: 742, y: 88,  w: 170, h: 92 },
  { slug: 'postgresql',     nom: 'PostgreSQL',       inst: 'voltis-commandes',   forme: 'stockage',    couche: 'fichiers',
    x: 742, y: 194, w: 170, h: 92 },
  { slug: 's3',             nom: 'S3',               inst: 'voltis-factures',    forme: 'externe',     couche: 'fichiers',
    x: 952, y: 194, w: 150, h: 92 },
];
const LIENS = [[0, 1, 178], [1, 3, 175], [3, 4, 175], [4, 6, 134], [4, 7, 240], [7, 8, 240]];

const W = 1460, X0 = 300, SH = 312;
const MONO = "'IBM Plex Mono',monospace";

// --- géométries locales : les variantes ont besoin de fonds et de liserés que
// --- la grammaire actuelle n'expose pas. On les redessine ici, sans la toucher.
const RX = { service: 0, application: 10, acteur: 10, materiel: 3, noeud: 2, externe: 8, frontiere: 12 };
function coque(f, x, y, w, h, { fond = '#FFFFFF', trait = TRAIT, ep = 1.6, tirets = null } = {}) {
  const d = tirets ? ` stroke-dasharray="${tirets}"` : '';
  if (f === 'stockage') {
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`;
  }
  const rx = f === 'flux' ? h / 2 : (RX[f] ?? 0);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${d}/>`;
}
// La coque telle que le dépôt la dessine aujourd'hui. boite() ne connaît que huit
// formes : les zones sont tracées par une fonction locale d'exemples-systeme.mjs,
// sans symbole — c'est pour cela que la frontière est nue dans les lignes A à C.
const coqueActuelle = (n) => n.forme === 'frontiere'
  ? `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="#F7F9FA" stroke="${LIGNE}" stroke-width="1.3" stroke-dasharray="8 6"/>`
  : boite({ x: n.x, y: n.y, w: n.w, h: n.h, forme: n.forme });

// Un symbole débarrassé de sa pastille : les fichiers symboles/ sont des carrés
// teintés de 48 px (rx 13) portant un glyphe de 30 px, pas des pictos nus. Sur
// un fond déjà teinté, la pastille ferait doublon — on ne garde que le glyphe.
const glyphe = (slug, x, y, t) =>
  symbole(slug, x, y, t).replace(/<rect width="48" height="48" rx="13" fill="[^"]*"\/>/, '');

// Un bloc-marque mis à l'échelle pour tenir dans une largeur donnée.
function marque(slug, cx, cy, largeurMax) {
  const raw = lire(`lockups/horizontal/${slug}.svg`);
  const e = Math.min(0.82, largeurMax / dim(raw, 'width'));
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}
const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}"${o.centre ? ' text-anchor="middle"' : ''}`
  + ` font-size="${o.taille || 12.5}"${o.mono ? ` font-family="${MONO}"` : ''}`
  + ` font-weight="${o.gras || 600}" fill="${o.encre || ENCRE}">${esc(t)}</text>`;

// Le cylindre perd 14 px sous son ellipse : son contenu descend d'autant.
const hautUtile = (n) => n.y + (n.forme === 'stockage' ? 20 : 10);
// Règle R9 : un conteneur porte son étiquette en haut, sinon ses enfants la couvrent.
const largeurCoin = (n) => Math.min(n.w - 24, 148);

// --- les six rendus ------------------------------------------------------
// Chacun doit rendre les deux noms. C'est là que les écarts se creusent.
const RENDUS = {
  // A — l'existant, augmenté du nom d'instance qui manque à nos six vues.
  //     La frontière n'a ni symbole ni identité : elle n'en a pas non plus chez nous.
  A: (n, t = 34) => {
    if (n.forme === 'frontiere') return coqueActuelle(n)
      + txt(n.x + 14, n.y + 24, n.nom, { taille: 12, gras: 700, encre: DOUX })
      + txt(n.x + 14, n.y + 39, n.inst, { taille: 10, mono: true, gras: 500, encre: LIGNE });
    if (n.conteneur) return coqueActuelle(n) + symbole(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.nom, { taille: 12, gras: 700 })
      + txt(n.x + 40, n.y + 36, n.inst, { taille: 10, mono: true, gras: 500, encre: DOUX });
    // Les deux lignes se posent sous le symbole, jamais dessus : le cylindre perd
    // 14 px sous son ellipse, c'est lui qui plafonne la taille du symbole.
    const yNom = Math.max(n.y + n.h - 30, hautUtile(n) + t + 13);
    const yInst = yNom + 17;
    if (yInst > n.y + n.h - 6) {
      throw new Error(`${n.slug} : un symbole de ${t} px ne laisse pas la place aux deux lignes `
        + `(il faudrait ${Math.round(yInst - (n.y + n.h - 6))} px de plus).`);
    }
    return coqueActuelle(n) + symbole(n.slug, n.x + n.w / 2 - t / 2, hautUtile(n), t)
      + txt(n.x + n.w / 2, yNom, n.nom, { centre: true })
      + txt(n.x + n.w / 2, yInst, n.inst, { centre: true, taille: 10, mono: true, gras: 500, encre: DOUX });
  },

  // B — le même symbole à 44 px : plus d'encre, aucune variable de plus.
  B: (n) => RENDUS.A(n, n.conteneur ? 24 : n.forme === 'stockage' ? 36 : 44),

  // C — A, plus un unique sujet accentué par la couleur de sa couche.
  C: (n) => {
    if (n.forme === 'frontiere' || n.conteneur) return RENDUS.A(n);
    const vedette = n.slug === 'springboot';
    const enc = ENCRE_C(n.couche);
    return coque(n.forme, n.x, n.y, n.w, n.h, {
      fond: n.forme === 'externe' ? '#EDEFF1' : n.forme === 'acteur' || n.forme === 'materiel' ? '#F8F9FA' : '#FFFFFF',
      trait: vedette ? enc : (n.forme === 'externe' ? LIGNE : TRAIT),
      ep: vedette ? 2.6 : 1.6, tirets: n.forme === 'externe' ? '5 4' : null,
    })
      + symbole(n.slug, n.x + n.w / 2 - 17, hautUtile(n), 34)
      + txt(n.x + n.w / 2, n.y + n.h - 30, n.nom, { centre: true, encre: vedette ? enc : ENCRE })
      + txt(n.x + n.w / 2, n.y + n.h - 13, n.inst, { centre: true, taille: 10, mono: true, gras: 500, encre: DOUX });
  },

  // D — le bloc-marque porte le produit, le nom d'instance passe dessous.
  D: (n, coqueFn = coqueActuelle) => {
    if (n.conteneur) {
      const lg = largeurCoin(n);
      return coqueFn(n) + marque(n.slug, n.x + 10 + lg / 2, n.y + 24, lg)
        + txt(n.x + 12, n.y + 58, n.inst, { taille: 10, mono: true, gras: 500, encre: DOUX });
    }
    const cy = n.y + (n.forme === 'stockage' ? 46 : 38);
    return coqueFn(n) + marque(n.slug, n.x + n.w / 2, cy, n.w - 16)
      + txt(n.x + n.w / 2, n.y + n.h - 14, n.inst, { centre: true, taille: 10.5, mono: true, gras: 500, encre: DOUX });
  },

  // E — D, plus l'échelle de gris réellement écartée : la valeur du fond code la
  //     forme et l'emboîtement, la teinte du bloc-marque code la couche.
  E: (n) => {
    const FOND = { application: '#FFFFFF', service: '#FFFFFF', flux: '#FFFFFF', stockage: '#FFFFFF',
      acteur: '#E8ECEF', materiel: '#EDF0F2', noeud: '#DFE5E9', frontiere: '#F2F5F6', externe: '#F3F5F6' };
    return RENDUS.D(n, (m) => coque(m.forme, m.x, m.y, m.w, m.h, {
      fond: FOND[m.forme] || '#FFFFFF',
      trait: m.forme === 'externe' || m.forme === 'frontiere' ? LIGNE : TRAIT,
      ep: m.forme === 'noeud' ? 2.4 : m.forme === 'frontiere' ? 1.3 : 1.6,
      tirets: m.forme === 'externe' ? '5 4' : m.forme === 'frontiere' ? '8 6' : null,
    }));
  },

  // F — le bloc-marque devient la boîte : la teinte de couche remplit la forme,
  //     l'instance passe au premier plan et le produit devient secondaire.
  F: (n) => {
    const enc = ENCRE_C(n.couche);
    const fond = T(n.couche, n.conteneur ? 0.94 : 0.9);
    const coq = coque(n.forme, n.x, n.y, n.w, n.h, {
      fond, trait: enc, ep: n.forme === 'noeud' ? 2.4 : n.forme === 'frontiere' ? 1.3 : 1.8,
      tirets: n.forme === 'externe' ? '5 4' : n.forme === 'frontiere' ? '8 6' : null,
    });
    if (n.conteneur) return coq + glyphe(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.inst, { taille: 12, gras: 700 })
      + txt(n.x + 40, n.y + 36, n.nom, { taille: 10, gras: 500, encre: DOUX });
    const t = 28, lg = t + 8 + n.inst.length * 7.1, gx = n.x + n.w / 2 - lg / 2;
    const cy = n.y + (n.forme === 'stockage' ? 48 : 42);
    return coq + glyphe(n.slug, gx, cy - t / 2, t)
      + txt(gx + t + 8, cy + 5, n.inst, { taille: 13, gras: 700 })
      + txt(n.x + n.w / 2, n.y + n.h - 14, n.nom, { centre: true, taille: 10, gras: 500, encre: DOUX });
  },

  // G — la combinaison : l'échelle de gris de E, la hiérarchie de texte de F,
  //     l'accent unique de C. Le symbole reste tel quel, avec sa pastille : c'est
  //     lui qui porte la couleur de marque, et les gens reconnaissent les logos.
  G: (n) => {
    const FOND = { application: '#FFFFFF', service: '#FFFFFF', flux: '#FFFFFF', stockage: '#FFFFFF',
      acteur: '#E8ECEF', materiel: '#EDF0F2', noeud: '#DFE5E9', frontiere: '#F2F5F6', externe: '#F3F5F6' };
    const vedette = n.slug === 'springboot';
    const enc = ENCRE_C(n.couche);
    const coq = coque(n.forme, n.x, n.y, n.w, n.h, {
      fond: FOND[n.forme] || '#FFFFFF',
      trait: vedette ? enc : (n.forme === 'externe' || n.forme === 'frontiere' ? LIGNE : TRAIT),
      ep: vedette ? 2.6 : n.forme === 'noeud' ? 2.4 : n.forme === 'frontiere' ? 1.3 : 1.6,
      tirets: n.forme === 'externe' ? '5 4' : n.forme === 'frontiere' ? '8 6' : null,
    });
    if (n.conteneur) return coq + symbole(n.slug, n.x + 10, n.y + 8, 24)
      + txt(n.x + 40, n.y + 21, n.inst, { taille: 12, gras: 700 })
      + txt(n.x + 40, n.y + 36, n.nom, { taille: 10, gras: 500, encre: DOUX });
    const t = 32;
    const yTitre = Math.max(n.y + n.h - 30, hautUtile(n) + t + 13);
    return coq + symbole(n.slug, n.x + n.w / 2 - t / 2, hautUtile(n), t)
      + txt(n.x + n.w / 2, yTitre, n.inst, { centre: true, gras: 700, encre: vedette ? enc : ENCRE })
      + txt(n.x + n.w / 2, yTitre + 17, n.nom, { centre: true, taille: 10, gras: 500, encre: DOUX });
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
