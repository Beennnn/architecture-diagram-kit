// Génère docs/exemple-voltis.svg : un schéma d'architecture complet, assemblé
// avec les badges réellement produits par ce dépôt.
//
// Il sert de démonstration et de test : les symboles vont dans les boîtes, les
// bloc-marques horizontaux annotent les flèches, et la grammaire de formes est
// celle de docs/formes-couleurs-fleches.html.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '').replace(/>\s+</g, '><').trim();
const dim = (svg, a) => Number(svg.match(new RegExp(`${a}="(\\d+)"`))[1]);

// Un symbole (48×48) posé à une position donnée.
function symbole(slug, x, y, t = 34) {
  const s = lire(`symboles/${slug}.svg`)
    .replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/, `<svg x="${x}" y="${y}" width="${t}" height="${t}" viewBox="$1">`);
  return s;
}
// Un bloc-marque horizontal centré sur un point : sert d'annotation de flèche.
function badge(slug, cx, cy, e = 0.82) {
  const raw = lire(`lockups/horizontal/${slug}.svg`);
  const w = dim(raw, 'width') * e, h = dim(raw, 'height') * e;
  return raw.replace(/^<svg[^>]*?viewBox="([^"]*)"[^>]*>/,
    `<svg x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="$1">`);
}

const ENCRE = '#16181A', DOUX = '#5B6873', TRAIT = '#3E444A', LIGNE = '#8896A2';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─── nœuds ────────────────────────────────────────────────────────────────
// symbole: null = aucun badge disponible (c'est le constat de l'exercice)
const N = [
  { x: 40,   y: 150, w: 150, h: 72, t: 'App mobile',        s: 'iOS · Android',   ico: null,          forme: 'acteur' },
  { x: 40,   y: 310, w: 150, h: 72, t: 'Bornes',            s: '2 400 unités',    ico: null,          forme: 'materiel' },
  { x: 40,   y: 470, w: 150, h: 72, t: 'Exploitation',      s: 'astreinte',       ico: null,          forme: 'acteur' },
  { x: 280,  y: 150, w: 200, h: 72, t: 'API publique',      s: 'contrat OpenAPI', ico: 'openapi' },
  { x: 280,  y: 310, w: 200, h: 72, t: 'Ingestion',         s: 'Spring Boot',     ico: 'springboot' },
  { x: 280,  y: 470, w: 200, h: 72, t: 'Bastion',           s: 'accès restreint', ico: null },
  { x: 530,  y: 310, w: 200, h: 72, t: 'Bus de mesures',    s: '3 partitions',    ico: 'kafka',       forme: 'file' },
  { x: 760,  y: 150, w: 200, h: 72, t: 'Sessions',          s: 'Spring Boot',     ico: 'springboot' },
  { x: 530,  y: 470, w: 200, h: 72, t: 'Facturation',       s: 'Spring Boot',     ico: 'springboot' },
  { x: 1030, y: 150, w: 200, h: 72, t: 'Sessions',          s: 'PostgreSQL 16',   ico: 'postgresql',  forme: 'stockage' },
  { x: 1030, y: 470, w: 200, h: 72, t: 'Factures PDF',      s: 'stockage objet',  ico: 's3',          forme: 'stockage' },
  { x: 790,  y: 620, w: 200, h: 64, t: 'Relais courriel',   s: 'externe',         ico: 'smtp',        forme: 'externe' },
];

// ─── zones ────────────────────────────────────────────────────────────────
const Z = [
  { x: 240,  y: 96,  w: 760, h: 486, t: 'Cluster de production', ico: 'kubernetes' },
  { x: 1000, y: 96,  w: 250, h: 486, t: 'Données managées',      ico: null },
];

// ─── liens ────────────────────────────────────────────────────────────────
// b = bloc-marque de protocole ; l = libellé texte
const L = [
  { d: 'M190,186 H272',                    b: ['https', 231, 162] },
  { d: 'M480,186 H752',                    b: ['grpc',  616, 162] },
  { d: 'M960,186 H1022',                   l: ['SQL',   981, 170] },
  { d: 'M190,346 H272',                    b: ['mqtt',  231, 322] },
  { d: 'M480,346 H522',                    l: ['publie', 501, 330] },
  { d: 'M730,346 H860 V230',               l: ['consomme', 800, 336] },
  { d: 'M630,382 V462',                    l: ['consomme', 630, 428] },
  { d: 'M730,506 H1022',                   l: ['dépose les factures', 876, 496] },
  { d: 'M630,542 V596 H882 V612',          b: ['smtp',  756, 596] },
  { d: 'M190,506 H272',                    b: ['ssh',   231, 482] },
];

const W = 1290, H = 720;
const boite = (n) => {
  const { x, y, w, h, forme } = n;
  if (forme === 'stockage') {
    return `<path d="M${x} ${y + 14} v${h - 28} a${w / 2} 13 0 0 0 ${w} 0 v-${h - 28}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`
         + `<ellipse cx="${x + w / 2}" cy="${y + 14}" rx="${w / 2}" ry="13" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  }
  if (forme === 'file')     return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'externe')  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#EDEFF1" stroke="${LIGNE}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  if (forme === 'acteur')   return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  if (forme === 'materiel') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#F8F9FA" stroke="${TRAIT}" stroke-width="1.6"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="${TRAIT}" stroke-width="1.6"/>`;
};

const noeuds = N.map((n) => {
  const cy = n.y + n.h / 2;
  const dec = n.forme === 'stockage' ? 6 : 0;
  const tx = n.ico ? n.x + 58 : n.x + n.w / 2;
  const anchor = n.ico ? 'start' : 'middle';
  return `<g>${boite(n)}`
    + (n.ico ? symbole(n.ico, n.x + 14, cy - 17 + dec) : '')
    + `<text x="${tx}" y="${cy - 3 + dec}" text-anchor="${anchor}" font-size="14" font-weight="600" fill="${ENCRE}">${esc(n.t)}</text>`
    + `<text x="${tx}" y="${cy + 15 + dec}" text-anchor="${anchor}" font-size="11" fill="${DOUX}">${esc(n.s)}</text></g>`;
}).join('\n    ');

const zones = Z.map((z) => `<g>`
  + `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="14" fill="#F7F9FA" stroke="${LIGNE}" stroke-width="1.4" stroke-dasharray="8 6"/>`
  + (z.ico ? symbole(z.ico, z.x + 14, z.y + 12, 22) : '')
  + `<text x="${z.x + (z.ico ? 44 : 16)}" y="${z.y + 29}" font-size="12.5" font-weight="600" fill="${DOUX}">${esc(z.t)}</text></g>`).join('\n    ');

const aretes = L.map((e) => `<path d="${e.d}" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const marques = L.filter((e) => e.b).map((e) => badge(e.b[0], e.b[1], e.b[2])).join('\n    ');
const libelles = L.filter((e) => e.l).map((e) => `<text x="${e.l[1]}" y="${e.l[2]}" text-anchor="middle" font-size="11" fill="${DOUX}">${esc(e.l[0])}</text>`).join('\n    ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="Architecture d'exécution de la plateforme de recharge Voltis">
  <title>Voltis — vue d'exécution</title>
  <defs>
    <marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,1 L9,5 L0,9" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="46" font-size="19" font-weight="700" fill="${ENCRE}">Voltis — recharge de véhicules électriques</text>
  <text x="40" y="68" font-size="12.5" fill="${DOUX}">Vue d'exécution · les mesures des bornes deviennent des factures mensuelles</text>
    ${zones}
    ${aretes}
    ${noeuds}
    ${libelles}
    ${marques}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/exemple-voltis.svg'), svg);
const sansBadge = N.filter((n) => !n.ico).map((n) => n.t);
console.log(`  docs/exemple-voltis.svg · ${(svg.length / 1024).toFixed(0)} Ko`);
console.log(`  ${N.length - sansBadge.length}/${N.length} nœuds ont un badge · sans badge : ${sansBadge.join(', ')}`);
