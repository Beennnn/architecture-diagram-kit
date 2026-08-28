// Planche de décision : A contre A + fonds écartés. Les autres questions sont
// tranchées — B n'apporte rien sur A, F et G détachent le nom de la techno de
// son image, l'accent de C est retenu. Reste une seule variable, le fond des
// boîtes, que la planche à sept lignes ne permettait pas d'isoler : E y différait
// de A par deux choses à la fois, et les deux lignes étaient éloignées.
// Ici le contenu est rigoureusement identique et seul le fond change.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, TRAIT, LIGNE, esc, symbole, fleche } from './schema.mjs';
import { contraste } from './couleurs.mjs';
import { FRAG, LIENS, SH, MONO, coque, hautUtile, txt, ENCRE_C, FOND_ACTUEL, FOND_ECARTE } from './fragment.mjs';

const W = 1460, ACCENT = 'springboot';
const NOM_FORME = { service: 'service', application: 'application', stockage: 'stockage', flux: 'flux',
  acteur: 'acteur', materiel: 'matériel', externe: 'externe', frontiere: 'zone', noeud: 'nœud' };

// Le rendu A, avec un jeu de fonds passé en paramètre. Le symbole reste au-dessus
// de son libellé : le nom de la techno ne se détache jamais de son image.
function rendre(n, fonds) {
  const vedette = n.slug === ACCENT;
  const enc = ENCRE_C(n.couche);
  const coq = coque(n.forme, n.x, n.y, n.w, n.h, {
    fond: fonds[n.forme] || '#FFFFFF',
    trait: vedette ? enc : (n.forme === 'externe' || n.forme === 'frontiere' ? LIGNE : TRAIT),
    ep: vedette ? 2.6 : n.forme === 'noeud' ? 2.4 : n.forme === 'frontiere' ? 1.3 : 1.6,
    tirets: n.forme === 'externe' ? '5 4' : n.forme === 'frontiere' ? '8 6' : null,
  });
  // La zone n'a pas de symbole : c'est l'état du dépôt, et ce n'est pas la
  // question posée ici. La garder identique des deux côtés isole le fond.
  if (n.forme === 'frontiere') return coq
    + txt(n.x + 14, n.y + 24, n.nom, { taille: 12, gras: 700, encre: DOUX })
    + txt(n.x + 14, n.y + 39, n.inst, { taille: 10, mono: true, gras: 500, encre: LIGNE });
  if (n.conteneur) return coq + symbole(n.slug, n.x + 10, n.y + 8, 24)
    + txt(n.x + 40, n.y + 21, n.nom, { taille: 12, gras: 700 })
    + txt(n.x + 40, n.y + 36, n.inst, { taille: 10, mono: true, gras: 500, encre: DOUX });
  const t = 34, yNom = Math.max(n.y + n.h - 30, hautUtile(n) + t + 13);
  return coq + symbole(n.slug, n.x + n.w / 2 - t / 2, hautUtile(n), t)
    + txt(n.x + n.w / 2, yNom, n.nom, { centre: true, encre: vedette ? enc : ENCRE })
    + txt(n.x + n.w / 2, yNom + 17, n.inst, { centre: true, taille: 10, mono: true, gras: 500, encre: DOUX });
}

const fragment = (fonds) => {
  let g = '';
  for (const [a, b, y] of LIENS) {
    const o = FRAG[a], d = FRAG[b];
    g += `<line x1="${o.x + o.w}" y1="${y}" x2="${d.x - 5}" y2="${y}" stroke="${LIGNE}" stroke-width="1.5" marker-end="url(#fl)"/>`;
  }
  for (const n of FRAG) if (n.conteneur) g += rendre(n, fonds);
  for (const n of FRAG) if (!n.conteneur) g += rendre(n, fonds);
  return g;
};

const titre = (x, y, t, s) => `<text x="${x}" y="${y}" font-size="15" font-weight="700" fill="${ENCRE}">${esc(t)}</text>`
  + (s ? `<text x="${x}" y="${y + 18}" font-size="11.5" fill="${DOUX}">${esc(s)}</text>` : '');
const etiquette = (x, y, t, encre = LIGNE) =>
  `<text x="${x}" y="${y}" font-size="9.5" font-weight="700" letter-spacing="0.6" font-family="${MONO}" fill="${encre}">${esc(t)}</text>`;

// --- 1. Le nuancier : les neuf formes, les deux jeux de fonds, côte à côte ----
const FORMES = ['service', 'application', 'flux', 'stockage', 'acteur', 'materiel', 'noeud', 'frontiere', 'externe'];
const CW = 150, SWW = 122, SWH = 58;
function nuancier(x0, y0) {
  let g = '';
  FORMES.forEach((f, i) => {
    const x = x0 + i * CW;
    g += etiquette(x, y0, NOM_FORME[f].toUpperCase());
    [[FOND_ACTUEL[f], y0 + 10], [FOND_ECARTE[f], y0 + 100]].forEach(([fond, y]) => {
      g += coque(f, x, y, SWW, SWH, {
        fond, trait: f === 'externe' || f === 'frontiere' ? LIGNE : TRAIT,
        ep: f === 'noeud' ? 2.4 : f === 'frontiere' ? 1.3 : 1.6,
        tirets: f === 'externe' ? '5 4' : f === 'frontiere' ? '8 6' : null,
      });
      // Le blanc est la référence, pas un défaut : seul un fond teinté qui reste
      // collé au blanc est un problème, car il prétend séparer sans séparer.
      const c = contraste(fond, '#FFFFFF');
      const muet = fond !== '#FFFFFF' && c < 1.09;
      g += `<text x="${x}" y="${y + SWH + 14}" font-size="9.5" font-family="${MONO}" fill="${DOUX}">${fond.toUpperCase()}</text>`
        + `<text x="${x}" y="${y + SWH + 26}" font-size="9.5" font-family="${MONO}" fill="${muet ? '#C0392F' : LIGNE}">`
        + `${fond === '#FFFFFF' ? 'référence' : c.toFixed(3) + ':1' + (muet ? ' ✕' : '')}</text>`;
    });
  });
  return g;
}

// --- assemblage ---------------------------------------------------------------
const Y_NUANCIER = 128, Y_A = 400, Y_E = Y_A + SH + 46, Y_FLOU = Y_E + SH + 66;
const ECH = 0.55;
const H = Math.round(Y_FLOU + 20 + SH * ECH + 96);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
  + ` font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img"`
  + ` aria-label="Comparaison isolée des fonds de boîte, aujourd'hui contre l'échelle de gris proposée">`
  + `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`
  + `<defs>${fleche()}<filter id="flou" x="-5%" y="-5%" width="110%" height="110%">`
  + `<feGaussianBlur stdDeviation="3.2"/></filter></defs>`
  + `<text x="24" y="44" font-size="23" font-weight="700" fill="${ENCRE}">A ou A + fonds écartés : la seule question ouverte</text>`
  + `<text x="24" y="68" font-size="12.5" fill="${DOUX}">Tranché : B n’apporte rien sur A ; F et G détachent le nom de la techno de son image ; l’accent de C est retenu et figure des deux côtés ci-dessous.</text>`
  + `<text x="24" y="88" font-size="12.5" fill="${DOUX}">Reste le fond des boîtes. Sur la planche à sept lignes, E différait de A par deux choses à la fois et les lignes étaient éloignées : impossible à juger. Ici le contenu est identique au pixel près.</text>`
  + `<line x1="24" y1="104" x2="${W - 24}" y2="104" stroke="#E3E7EA"/>`

  + titre(24, Y_NUANCIER - 14, '1. Les neuf fonds, isolés', 'Rangée du haut : aujourd’hui. Rangée du bas : proposé. Le ratio est le contraste avec le blanc — un fond teinté qui reste sous 1,09:1 prétend séparer sans séparer.')
  + nuancier(28, Y_NUANCIER + 34)

  + titre(24, Y_A - 26, '2. Le même fragment, seuls les fonds changent')
  + etiquette(24, Y_A + 14, 'AUJOURD’HUI')
  + `<g transform="translate(300 ${Y_A})">${fragment(FOND_ACTUEL)}</g>`
  + etiquette(24, Y_E + 14, 'PROPOSÉ')
  + `<g transform="translate(300 ${Y_E})">${fragment(FOND_ECARTE)}</g>`

  + titre(24, Y_FLOU - 26, '3. Le test du coup d’œil', 'Les deux mêmes, floutés : ce qu’il reste quand on ne lit plus. Ce qui survit ici est ce qui se voit au premier regard.')
  + `<g transform="translate(40 ${Y_FLOU + 20}) scale(${ECH})" filter="url(#flou)">${fragment(FOND_ACTUEL)}</g>`
  + `<g transform="translate(${40 + 1136 * ECH + 40} ${Y_FLOU + 20}) scale(${ECH})" filter="url(#flou)">${fragment(FOND_ECARTE)}</g>`
  + etiquette(40, Y_FLOU + 12, 'AUJOURD’HUI')
  + etiquette(40 + 1136 * ECH + 40, Y_FLOU + 12, 'PROPOSÉ')

  + `<line x1="24" y1="${H - 58}" x2="${W - 24}" y2="${H - 58}" stroke="#E3E7EA"/>`
  + `<text x="24" y="${H - 36}" font-size="12" fill="${DOUX}">Mon avis : les fonds d’aujourd’hui séparent l’acteur du service par <tspan font-weight="700" fill="${ENCRE}">1,054:1</tspan>, soit rien du tout. La question n’est pas s’il faut les écarter, mais de combien.</text>`
  + `<text x="24" y="${H - 18}" font-size="10.5" fill="${LIGNE}">Rien n’est appliqué : les six vues du dépôt utilisent toujours les fonds de la rangée du haut. Planche générée par scripts/specimen-fonds.mjs.</text>`
  + `</svg>`;

if (/NaN|undefined/.test(svg)) throw new Error('Coordonnée non finie dans la planche des fonds.');
fs.writeFileSync(path.join(ROOT, 'docs/rendus-fonds.svg'), svg);
console.log(`docs/rendus-fonds.svg — ${W}x${H}`);
