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
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  }
  if (forme === 'flux')        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'externe')     return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#EDEFF1" stroke="${LIGNE}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  if (forme === 'acteur')      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'application') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'materiel')    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
};

export const fleche = () => `<marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`
  + `<path d="M0,1 L9,5 L0,9" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`;
