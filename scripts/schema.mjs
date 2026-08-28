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
export const boite = ({ x, y, w, h, forme }) => {
  if (forme === 'stockage') {
    // sous 60 px, les deux ellipses du cylindre recouvrent le libellé
    if (h < 60) throw new Error(`Cylindre trop bas (${h} px) : un « stockage » exige au moins 60 px de haut.`);
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  }
  if (forme === 'flux')        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'externe')     return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#EDEFF1" stroke="${LIGNE}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  if (forme === 'acteur')      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'application') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'materiel')    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  // le nœud de déploiement héberge : liseré épais, fond retrait, il contient d'autres boîtes
  if (forme === 'noeud')       return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#F4F6F7" stroke="${TRAIT}" stroke-width="2.4"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
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
const MINI = {
  service:     (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" fill="#FFF" stroke="${TRAIT}" stroke-width="1.3"/>`,
  application: (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="5" fill="#FFF" stroke="${TRAIT}" stroke-width="1.3"/>`,
  flux:        (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="8" fill="#FFF" stroke="${TRAIT}" stroke-width="1.3"/>`,
  acteur:      (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="5" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.3"/>`,
  materiel:    (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="2" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.3"/>`,
  noeud:       (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="1" fill="#F4F6F7" stroke="${TRAIT}" stroke-width="2"/>`,
  externe:     (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="4" fill="#EDEFF1" stroke="${LIGNE}" stroke-width="1.3" stroke-dasharray="3 2"/>`,
  frontiere:   (x, y) => `<rect x="${x}" y="${y}" width="26" height="16" rx="4" fill="#F7F9FA" stroke="${LIGNE}" stroke-width="1.2" stroke-dasharray="4 3"/>`,
  stockage:    (x, y) => `<path d="M${x} ${y + 4} v8 a13 4 0 0 0 26 0 v-8" fill="#FFF" stroke="${TRAIT}" stroke-width="1.3"/>`
                       + `<ellipse cx="${x + 13}" cy="${y + 4}" rx="13" ry="4" fill="#FFF" stroke="${TRAIT}" stroke-width="1.3"/>`,
};
const NOM_FORME = { service: 'service', application: 'application', stockage: 'stockage', flux: 'flux',
  acteur: 'acteur', materiel: 'matériel', externe: 'externe', frontiere: 'zone', noeud: 'nœud' };

export function legende(x, y, formes, couches) {
  let cx = x + 64;
  const items = [];
  for (const f of formes) {
    if (!MINI[f]) continue;
    items.push(MINI[f](cx, y - 12) + `<text x="${cx + 32}" y="${y}" font-size="10.5" fill="${DOUX}">${esc(NOM_FORME[f] || f)}</text>`);
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
    + `</g>`;
}
