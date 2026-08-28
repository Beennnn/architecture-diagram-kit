// Planche d'arbitrage sur l'accent. L'ADR 0007 l'a posé comme l'encre de la
// couche du sujet, et la relecture des vues a montré la limite : quatre de nos
// six vues ont un sujet d'infrastructure, dont l'encre est une ardoise presque
// neutre — l'accent y est invisible.
//
// Chaque option est jugée sur les DEUX cas, parce qu'elles ne se départagent
// que là : un sujet dans une couche colorée, et un sujet d'infrastructure à
// distinguer de ses jumeaux — même forme, même couche.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, TRAIT, LIGNE, esc, symbole, boite, encreAccent, FONDS } from './schema.mjs';
import { melange, contraste } from './couleurs.mjs';

const W = 1330, MONO = "'IBM Plex Mono',monospace";
// Une couleur d'emphase hors palette doit ne ressembler à aucune des six.
// Bleu, violet, sarcelle, orange, rouge et ardoise étant pris, il reste le
// magenta. C'est précisément ce qu'on lui reproche : une septième chose à apprendre.
const HORS_PALETTE = '#A3196F';
const fondSoutenu = (forme) => melange(FONDS[forme] || '#FFFFFF', ENCRE, 0.07);

// Les quatre façons d'accentuer, à contenu et géométrie rigoureusement égaux.
const OPTIONS = [
  { cle: '1', nom: 'Encre de couche', sous: 'l’ADR 0007 tel qu’appliqué',
    accent: (n) => ({ trait: encreAccent(n.ico), ep: 2.6, encre: encreAccent(n.ico) }),
    notes: ['Ce qui est en place. Désigne le sujet et rappelle sa',
            'couche d’un geste, sans couleur supplémentaire.',
            'Mais un sujet d’infrastructure hérite de l’ardoise :',
            'à droite, le nœud accentué ne se détache pas.'] },
  { cle: '2', nom: 'Couleur hors palette', sous: 'un magenta réservé à l’emphase',
    accent: () => ({ trait: HORS_PALETTE, ep: 2.6, encre: HORS_PALETTE }),
    notes: ['Marche partout, quelle que soit la couche du sujet.',
            'Mais ajoute une septième couleur à un jeu qui en',
            'compte six, et ne veut rien dire par elle-même :',
            'le lecteur doit l’apprendre. Contredit l’ADR 0001.'] },
  { cle: '3', nom: 'Le poids seul', sous: 'liseré plus épais, fond plus soutenu',
    accent: (n) => ({ trait: ENCRE, ep: 3, encre: ENCRE, fond: fondSoutenu(n.forme) }),
    notes: ['Aucune couleur nouvelle, et ça marche dans toutes',
            'les couches, y compris sur les jumeaux à droite.',
            'Mais l’accent perd la teinte quand le sujet en a',
            'une : à gauche, le bus n’est plus orange.'] },
  { cle: '4', nom: 'Teinte et poids', sous: 'la synthèse — pas proposée plus tôt',
    accent: (n) => ({ trait: encreAccent(n.ico), ep: 3, encre: encreAccent(n.ico), fond: fondSoutenu(n.forme) }),
    notes: ['Garde la teinte quand le sujet en a une, se replie',
            'sur le poids sinon. Les deux cas passent.',
            'Coût : l’accent devient deux variables, pas une,',
            'donc un fond de plus dans l’échelle de l’ADR 0007.'] },
];

// --- les deux cas de test ------------------------------------------------
const COLORE = [
  { t: 'Ingestion', s: 'Spring Boot', ico: 'springboot', forme: 'service' },
  { t: 'Bus de mesures', s: '3 partitions', ico: 'kafka', forme: 'flux', vedette: true },
  { t: 'Facturation', s: 'Spring Boot', ico: 'springboot', forme: 'service' },
];
const INFRA = [
  { t: 'nœud-1', s: 'vm-app-1', ico: 'noeud-cluster', forme: 'noeud' },
  { t: 'nœud-2', s: 'vm-app-2', ico: 'noeud-cluster', forme: 'noeud', vedette: true },
  { t: 'nœud-3', s: 'vm-data-1', ico: 'noeud-cluster', forme: 'noeud' },
];
const BW = 140, GAP = 26, BH_C = 86, BH_I = 110;

function cellule(liste, x0, y0, opt, conteneur) {
  let g = '';
  liste.forEach((n, i) => {
    const x = x0 + i * (BW + GAP), h = conteneur ? BH_I : BH_C;
    const a = n.vedette ? opt.accent(n) : {};
    // Le fond accentué n'existe pas dans la grammaire : on le pose ici pour
    // l'arbitrage, sans toucher à boite().
    g += a.fond
      ? `<rect x="${x}" y="${y0}" width="${BW}" height="${h}" rx="${conteneur ? 2 : n.forme === 'flux' ? h / 2 : 0}"`
        + ` fill="${a.fond}" stroke="${a.trait}" stroke-width="${a.ep}"/>`
      : boite({ x, y: y0, w: BW, h, forme: n.forme, vedette: a.trait });
    if (conteneur) {
      g += symbole(n.ico, x + 9, y0 + 8, 22)
        + `<text x="${x + 37}" y="${y0 + 20}" font-size="11.5" font-weight="700" fill="${a.encre || ENCRE}">${esc(n.t)}</text>`
        + `<text x="${x + 37}" y="${y0 + 34}" font-size="9.5" font-family="${MONO}" fill="${DOUX}">${esc(n.s)}</text>`
        + `<rect x="${x + 12}" y="${y0 + 48}" width="${BW - 24}" height="46" rx="4" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.3"/>`
        + `<text x="${x + BW / 2}" y="${y0 + 70}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${ENCRE}">pod</text>`
        + `<text x="${x + BW / 2}" y="${y0 + 84}" text-anchor="middle" font-size="9.5" font-family="${MONO}" fill="${DOUX}">2 réplicas</text>`;
    } else {
      g += symbole(n.ico, x + BW / 2 - 16, y0 + 12, 32)
        + `<text x="${x + BW / 2}" y="${y0 + 62}" text-anchor="middle" font-size="12" font-weight="600" fill="${a.encre || ENCRE}">${esc(n.t)}</text>`
        + `<text x="${x + BW / 2}" y="${y0 + 77}" text-anchor="middle" font-size="9.5" font-family="${MONO}" fill="${DOUX}">${esc(n.s)}</text>`;
    }
  });
  return g;
}

const LARGEUR_NOTE = 52;
for (const o of OPTIONS) for (const n of o.notes) {
  if (n.length > LARGEUR_NOTE) throw new Error(`Note trop longue (${n.length}) : « ${n} »`);
}

const X_C = 300, X_I = 300 + 3 * BW + 2 * GAP + 56, CH = 176, Y0 = 150;
let out = '';
OPTIONS.forEach((o, k) => {
  const y = Y0 + k * (CH + 14);
  out += `<rect x="24" y="${y}" width="${W - 48}" height="${CH}" rx="10" fill="#FCFDFD" stroke="#E3E7EA"/>`
    + `<text x="48" y="${y + 30}" font-size="18" font-weight="700" fill="${ENCRE}">${o.cle}</text>`
    + `<text x="68" y="${y + 30}" font-size="14.5" font-weight="700" fill="${ENCRE}">${esc(o.nom)}</text>`
    + `<text x="68" y="${y + 47}" font-size="11" fill="${DOUX}">${esc(o.sous)}</text>`
    + o.notes.map((n, j) => `<text x="48" y="${y + 74 + j * 14}" font-size="10" fill="${DOUX}">${esc(n)}</text>`).join('')
    + cellule(COLORE, X_C, y + 40, o, false)
    + cellule(INFRA, X_I, y + 30, o, true);
});

const H = Y0 + OPTIONS.length * (CH + 14) + 76;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Quatre façons d'accentuer le sujet d'un schéma, sur un sujet coloré et sur un sujet d'infrastructure">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${ENCRE}">Comment accentuer le sujet d’un schéma</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${DOUX}">La boîte accentuée est la même partout : « Bus de mesures » à gauche, « nœud-2 » à droite. Seule la manière de l’accentuer change d’une ligne à l’autre.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${DOUX}">Les deux cas ne sont pas redondants : à droite le sujet doit se détacher de deux jumeaux de même forme et de même couche. C’est là que les options divergent.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`
  + `<text x="${X_C}" y="${Y0 - 14}" font-size="10" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${LIGNE}">SUJET DANS UNE COUCHE COLORÉE</text>`
  + `<text x="${X_I}" y="${Y0 - 14}" font-size="10" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${LIGNE}">SUJET D’INFRASTRUCTURE, PARMI SES JUMEAUX</text>`
  + out
  + `<line x1="24" y1="${H - 54}" x2="${W - 24}" y2="${H - 54}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 32}" font-size="12" fill="${DOUX}">Ma préférence : <tspan font-weight="700" fill="${ENCRE}">4</tspan>, qui passe les deux cas sans couleur nouvelle. <tspan font-weight="700" fill="${ENCRE}">3</tspan> si l’on veut que l’accent ne signifie qu’une chose. <tspan font-weight="700" fill="${ENCRE}">2</tspan> contredit l’ADR 0001.</text>`
  + `<text x="24" y="${H - 14}" font-size="10.5" fill="${LIGNE}">Seule la ligne 1 est en place dans le dépôt. Planche générée par scripts/specimen-accent.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Coordonnée non finie dans la planche des accents.');
fs.writeFileSync(path.join(ROOT, 'docs/rendus-accent.svg'), svg);
console.log(`docs/rendus-accent.svg — ${W}x${H}, ${OPTIONS.length} options`);
console.log(`  magenta hors palette : contraste ${contraste(HORS_PALETTE, '#FFFFFF').toFixed(2)}:1 sur blanc`);
