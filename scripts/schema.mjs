// Primitives de dessin partagées par les scripts de schéma, pour que la
// grammaire de formes de l'ADR 0003 soit appliquée en un seul endroit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENCRE = '#16181A', DOUX = '#5B6873', TRAIT = '#3E444A', LIGNE = '#8896A2';
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '').replace(/>\s+</g, '><').trim();
export const dim = (svg, a) => Number(svg.match(new RegExp(`${a}="(\\d+)"`))[1]);

// Un symbole (48×48) posé à une position donnée.
export function symbole(slug, x, y, t = 34) {
  return lire(`symboles/${slug}.svg`)
    .replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/, `<svg x="${x}" y="${y}" width="${t}" height="${t}" viewBox="$1">`);
}

// Un bloc-marque horizontal centré sur un point : sert d'annotation de flèche.
export function badge(slug, cx, cy, e = 0.82) {
  const raw = lire(`lockups/horizontal/${slug}.svg`);
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}

// Géométrie des formes : voir formes.json et docs/adr/0003-grammaire-de-formes.md
//
// Les fonds suivent l'échelle de l'ADR 0007 : la VALEUR du fond code la forme et
// l'emboîtement. Les quatre gris précédents tenaient dans 1,05 à 1,08:1 avec le
// blanc — un écart que ni un vidéoprojecteur ni une impression ne restituent.
// Ils prétendaient séparer sans séparer. Ceux-ci vont de 1,09 à 1,27:1.
export const FONDS = {
  service: '#FFFFFF', application: '#FFFFFF', flux: '#FFFFFF', stockage: '#FFFFFF',
  acteur: '#E8ECEF', materiel: '#EDF0F2', noeud: '#DFE5E9', frontiere: '#F2F5F6',
  externe: '#F3F5F6',
};

// `vedette` est l'encre de couche du sujet accentué. Un schéma en porte au plus
// un : c'est l'étape 6 de docs/formes-couleurs-fleches.html, restée lettre morte
// jusqu'à l'ADR 0007. Sans elle, la boîte garde le liseré neutre.
// Une zone imbriquée dans une autre descend d'un cran : sans cela l'emboîtement
// des zones ne se lit plus, la valeur étant devenue notre variable de structure.
export const FOND_IMBRIQUE = { frontiere: '#E7EBEE' };

// L'ACCENT est une couleur fonctionnelle, pas une septième couche : il ne dit
// que « c'est le sujet de ce schéma », jamais « ceci appartient à tel domaine ».
// Il est donc interdit dans couches.json, et la légende doit le déclarer à part
// dès qu'un schéma s'en sert — sinon le lecteur le cherche parmi les couches.
//
// Magenta par élimination : bleu, violet, sarcelle, orange, rouge et ardoise
// sont pris par les six couches de l'ADR 0001. Voir l'ADR 0007.
//
// MAIS il ne porte pas seul. Mesuré en simulation de Viénot-Brettel-Mollon :
// en deutéranopie comme en protanopie, ce magenta tombe à ΔE00 = 1,5 de la
// sarcelle « fichiers » — soit la même couleur pour environ 8 % des hommes.
// L'accent serait alors lu comme une couche, exactement ce qu'il ne doit pas
// être. Le liseré épais est donc constitutif de l'accent, pas décoratif : c'est
// la seconde variable qu'exige notre propre test des niveaux de gris.
export const ACCENT = '#A3196F';
// Plus épais que n'importe quel liseré normal, le nœud (2,4) compris.
export const ACCENT_EP = 3.2;

export const boite = ({ x, y, w, h, forme, vedette, imbrique }) => {
  const fond = (imbrique && FOND_IMBRIQUE[forme]) || FONDS[forme] || '#FFFFFF';
  const trait = vedette ? ACCENT : (forme === 'externe' || forme === 'frontiere' ? LIGNE : TRAIT);
  const ep = vedette ? ACCENT_EP : forme === 'noeud' ? 2.4 : forme === 'frontiere' ? 1.3 : 1.6;
  if (forme === 'stockage') {
    // sous 60 px, les deux ellipses du cylindre recouvrent le libellé
    if (h < 60) throw new Error(`Cylindre trop bas (${h} px) : un « stockage » exige au moins 60 px de haut.`);
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="${fond}" stroke="${trait}" stroke-width="${ep}"/>`;
  }
  const rx = { flux: h / 2, externe: 8, acteur: 10, application: 10, materiel: 3, noeud: 2, frontiere: 12 }[forme] ?? 0;
  const tirets = forme === 'externe' ? ' stroke-dasharray="5 4"' : forme === 'frontiere' ? ' stroke-dasharray="8 6"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${tirets}/>`;
};

export const fleche = () => `<marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`
  + `<path d="M0,1 L9,5 L0,9" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`;

// Un MARQUEUR qualifie une boîte ou une flèche — « immuable », « idempotent »,
// « RLS ». Ce n'est ni une forme ni un badge : une qualité n'est pas un objet
// qu'on peut montrer du doigt. Voir docs/adr/0006-marqueurs.md.
export const marqueur = (x, y, texte, ton = '#0B6E7F') => {
  const w = Math.round(texte.length * 5.6 + 16);
  return `<g><rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="#FFFFFF" stroke="${ton}" stroke-width="1.1"/>`
    + `<text x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle" font-size="9.5" font-weight="600"`
    + ` font-family="'IBM Plex Mono',monospace" fill="${ton}">${esc(texte)}</text></g>`;
};

// Une LÉGENDE, dérivée du contenu du schéma pour qu'elle ne puisse pas mentir.
// Exigée par la règle R5 de l'ADR 0003 et par le modèle C4 : nos formes et nos
// six couleurs de couche sont des conventions maison, que le lecteur ne peut
// pas deviner. Les jeux AWS ou Azure s'en passent parce que leur iconographie
// est publique — la nôtre ne l'est pas.
// Les vignettes reprennent FONDS : une légende qui montrerait d'autres fonds
// que le schéma serait un mensonge, et c'est la règle R5 qui l'interdit.
const MINI = (f) => (x, y) => {
  const fond = FONDS[f] ?? '#FFFFFF';
  const trait = f === 'externe' || f === 'frontiere' ? LIGNE : TRAIT;
  const ep = f === 'noeud' ? 2 : f === 'frontiere' ? 1.2 : 1.3;
  if (f === 'stockage') {
    return `<path d="M${x} ${y + 4} v8 a13 4 0 0 0 26 0 v-8" fill="${fond}" stroke="${trait}" stroke-width="${ep}"/>`
         + `<ellipse cx="${x + 13}" cy="${y + 4}" rx="13" ry="4" fill="${fond}" stroke="${trait}" stroke-width="${ep}"/>`;
  }
  const rx = { flux: 8, externe: 4, acteur: 5, application: 5, materiel: 2, noeud: 1, frontiere: 4 }[f] ?? 0;
  const tirets = f === 'externe' ? ' stroke-dasharray="3 2"' : f === 'frontiere' ? ' stroke-dasharray="4 3"' : '';
  return `<rect x="${x}" y="${y}" width="26" height="16" rx="${rx}" fill="${fond}" stroke="${trait}" stroke-width="${ep}"${tirets}/>`;
};

const NOM_FORME = { service: 'service', application: 'application', stockage: 'stockage', flux: 'flux',
  acteur: 'acteur', materiel: 'matériel', externe: 'externe', frontiere: 'zone', noeud: 'nœud' };

export function legende(x, y, formes, couches, accent = false) {
  let cx = x + 64;
  const items = [];
  for (const f of formes) {
    if (!(f in FONDS)) continue;
    items.push(MINI(f)(cx, y - 12) + `<text x="${cx + 32}" y="${y}" font-size="10.5" fill="${DOUX}">${esc(NOM_FORME[f] || f)}</text>`);
    cx += 32 + (NOM_FORME[f] || f).length * 5.6 + 22;
  }
  let dx = x + 64;
  const rangee2 = couches.map(([label, teinte]) => {
    const el = `<rect x="${dx}" y="${y + 14}" width="12" height="12" rx="3" fill="${teinte}"/>`
             + `<text x="${dx + 18}" y="${y + 24}" font-size="10.5" fill="${DOUX}">${esc(label)}</text>`;
    dx += 18 + label.length * 5.6 + 22;
    return el;
  }).join('');
  return `<g>`
    + `<text x="${x}" y="${y}" font-size="10" font-weight="600" font-family="'IBM Plex Mono',monospace" fill="${LIGNE}">FORMES</text>`
    + items.join('')
    + (couches.length ? `<text x="${x}" y="${y + 24}" font-size="10" font-weight="600" font-family="'IBM Plex Mono',monospace" fill="${LIGNE}">COULEURS</text>` + rangee2 : '')
    + (accent
      ? `<rect x="${dx}" y="${y + 14}" width="12" height="12" rx="3" fill="${ACCENT}"/>`
        + `<text x="${dx + 18}" y="${y + 24}" font-size="10.5" font-weight="600" fill="${DOUX}">sujet du schéma</text>`
      : '')
    + `</g>`;
}
