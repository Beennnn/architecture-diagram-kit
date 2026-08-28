// Génère docs/exemple-voltis.svg : un schéma d'architecture complet, assemblé
// avec les badges réellement produits par ce dépôt.
//
// Il sert de démonstration et de test : les symboles vont dans les boîtes, les
// bloc-marques horizontaux annotent les flèches, et la grammaire de formes est
// celle de docs/formes-couleurs-fleches.html.
import fs from 'node:fs';
import path from 'node:path';

import { ROOT, ENCRE, DOUX, TRAIT, LIGNE, esc, symbole, badge, boite, fleche, ACCENT, annotation, libelle, legende } from './schema.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const COUCHES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8')).couches;
const FAM = {}; for (const [k, c] of Object.entries(COUCHES)) for (const f of c.familles) FAM[f] = k;
const PAR_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

// ─── nœuds ────────────────────────────────────────────────────────────────
// symbole: null = aucun badge disponible (c'est le constat de l'exercice)
const N = [
  { x: 40,   y: 150, w: 150, h: 72, t: 'App mobile',        s: 'iOS · Android',   ico: 'app-mobile',  forme: 'acteur' },
  { x: 40,   y: 310, w: 150, h: 72, t: 'Bornes',            s: '2 400 unités',    ico: 'appareil',    forme: 'materiel' },
  { x: 40,   y: 470, w: 150, h: 72, t: 'Exploitation',      s: 'astreinte',       ico: 'equipe',      forme: 'acteur' },
  { x: 340,  y: 150, w: 200, h: 72, t: 'API publique',      s: 'contrat OpenAPI', ico: 'openapi' },
  { x: 340,  y: 310, w: 200, h: 72, t: 'Ingestion',         s: 'Spring Boot',     ico: 'springboot' },
  { x: 340,  y: 470, w: 200, h: 72, t: 'Bastion',           s: 'accès restreint', ico: 'bastion', id: 'bastion-01' },
  { x: 590,  y: 310, w: 200, h: 72, t: 'Bus de mesures',    s: '3 partitions',    ico: 'kafka', id: 'mesures.v1',       forme: 'flux', vedette: true },
  { x: 820,  y: 150, w: 200, h: 72, t: 'Sessions',          s: 'Spring Boot',     ico: 'springboot' },
  { x: 590,  y: 470, w: 200, h: 72, t: 'Facturation',       s: 'Spring Boot',     ico: 'springboot' },
  { x: 1090, y: 150, w: 200, h: 72, t: 'Sessions',          s: 'PostgreSQL 16',   ico: 'postgresql', id: 'voltis-sessions',  forme: 'stockage' },
  { x: 1090, y: 470, w: 200, h: 72, t: 'Factures PDF',      s: 'stockage objet',  ico: 's3', id: 'voltis-factures',          forme: 'stockage' },
  { x: 850,  y: 620, w: 200, h: 64, t: 'Relais courriel',   s: 'externe',         ico: 'smtp',        forme: 'externe' },
];

// ─── zones ────────────────────────────────────────────────────────────────
const Z = [
  { x: 300,  y: 96,  w: 760, h: 486, t: 'Cluster de production', ico: 'kubernetes' },
  { x: 1060, y: 96,  w: 250, h: 486, t: 'Données managées',      ico: null },
];

// ─── liens ────────────────────────────────────────────────────────────────
// b = bloc-marque de protocole ; l = libellé texte
const L = [
  { d: 'M190,186 H332',                    b: ['https', 261, 186, 'consulte ses recharges'] },
  { d: 'M540,186 H812',                    b: ['grpc',  676, 186, 'ouvre une session'] },
  { d: 'M1020,186 H1082',                   l: ['lit et écrit les sessions', 1051, 140] },
  { d: 'M190,346 H332',                    b: ['mqtt',  261, 346, 'remonte ses mesures'] },
  { d: 'M540,346 H582',                    l: ['publie les mesures', 561, 300] },
  { d: 'M790,346 H920 V230',               l: ['consomme les mesures', 860, 336] },
  { d: 'M690,382 V462',                    l: ['consomme les mesures', 690, 428] },
  { d: 'M790,506 H1082',                   l: ['dépose les factures', 936, 496] },
  { d: 'M690,542 V596 H942 V612',          b: ['smtp',  816, 596, 'envoie les factures'] },
  { d: 'M190,506 H332',                    b: ['ssh',   261, 506, 'administre'] },
];

const W = 1350, H = 780;

// Une étiquette de flèche ne doit recouvrir aucune boîte. Le contrôle est
// mécanique parce que l'œil s'y trompe : une étiquette qui mord de dix pixels
// sur un angle ne se voit pas à l'échelle du schéma, et se voit très bien à
// l'impression. Les largeurs sont approchées à 5,3 px par caractère en Plex Sans
// et 6,6 en gras — la marge d'erreur est absorbée par les 6 px de garde.
const GARDE = 6;
function cadreAnnotation(e) {
  const [slug, cx, cy, verbe] = e.b;
  const proto = PAR_SLUG[slug].label;
  const w = Math.max(17 + 5 + proto.length * 6.6, verbe ? verbe.length * 5.3 : 0) + 10;
  const h = verbe ? 36 : 22;
  return { t: `${proto}${verbe ? ' / ' + verbe : ''}`, x: cx - w / 2, y: cy - h / 2, w, h };
}
const cadreLibelle = (e) => ({ t: e.l[0], x: e.l[1] - e.l[0].length * 5.3 / 2, y: e.l[2] - 11, w: e.l[0].length * 5.3, h: 14 });

const collisions = [];
for (const e of L) {
  const c = e.b ? cadreAnnotation(e) : e.l ? cadreLibelle(e) : null;
  if (!c) continue;
  for (const n of N) {
    if (c.x < n.x + n.w + GARDE && c.x + c.w > n.x - GARDE
      && c.y < n.y + n.h + GARDE && c.y + c.h > n.y - GARDE) {
      collisions.push(`  « ${c.t} » recouvre « ${n.t} »`);
    }
  }
}
if (collisions.length) {
  throw new Error(`Étiquettes de flèche en collision avec des boîtes :\n${collisions.join('\n')}`);
}

// Le sous-titre porte la techno et, quand la boîte désigne une chose qui existe
// vraiment — une base, un bucket, un topic, une machine —, son identifiant. Un
// bucket s'appelle « voltis-factures », pas « S3 » : sans lui, le schéma décrit
// une catégorie et pas un système. La chasse fixe sépare les deux registres.
// En ligne quand ça tient, sur sa propre ligne sinon : une boîte étroite ne doit
// pas obliger à raccourcir un identifiant, qui n'est pas négociable.
const tientEnLigne = (n, dispo) =>
  n.s.length * 11 * 0.48 + 3 * 11 * 0.48 + n.id.length * 11 * 0.60 <= dispo;

function sousTitre(n, tx, y, anchor) {
  const t = (yy, txt, taille, couleur, mono) => `<text x="${tx}" y="${yy}" text-anchor="${anchor}"`
    + ` font-size="${taille}"${mono ? ` font-family="'IBM Plex Mono',monospace"` : ''} fill="${couleur}">${esc(txt)}</text>`;
  if (!n.id) return t(y, n.s, 11, DOUX);
  const dispo = n.x + n.w - tx - 10;
  if (tientEnLigne(n, dispo)) {
    return t(y, n.s, 11, DOUX)
      .replace('</text>', ` · <tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan></text>`);
  }
  const largeurId = n.id.length * 10 * 0.60;
  if (largeurId > dispo) {
    throw new Error(`« ${n.t} » : identifiant « ${n.id} » de ${Math.round(largeurId)} px pour ${Math.round(dispo)} px.`);
  }
  return t(y - 6, n.s, 11, DOUX) + t(y + 8, n.id, 10, LIGNE, true);
}

const noeuds = N.map((n) => {
  const vd = n.vedette ? ACCENT : null;
  const cy = n.y + n.h / 2;
  const dec = n.forme === 'stockage' ? 6 : 0;
  const tx = n.ico ? n.x + 58 : n.x + n.w / 2;
  const anchor = n.ico ? 'start' : 'middle';
  return `<g>${boite({ ...n, vedette: vd })}`
    + (n.ico ? symbole(n.ico, n.x + 14, cy - 17 + dec) : '')
    + `<text x="${tx}" y="${cy - 3 + dec}" text-anchor="${anchor}" font-size="14" font-weight="600" fill="${vd || ENCRE}">${esc(n.t)}</text>`
    + sousTitre(n, tx, cy + 15 + dec, anchor)
    + `</g>`;
}).join('\n    ');

const zones = Z.map((z) => `<g>`
  + boite({ x: z.x, y: z.y, w: z.w, h: z.h, forme: 'frontiere' })
  + (z.ico ? symbole(z.ico, z.x + 14, z.y + 12, 22) : '')
  + `<text x="${z.x + (z.ico ? 44 : 16)}" y="${z.y + 29}" font-size="12.5" font-weight="600" fill="${DOUX}">${esc(z.t)}</text></g>`).join('\n    ');

const aretes = L.map((e) => `<path d="${e.d}" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const marques = L.filter((e) => e.b)
  .map((e) => annotation(e.b[0], e.b[1], e.b[2], Z, e.b[3])).join('\n    ');
const libelles = L.filter((e) => e.l).map((e) => libelle(e.l[0], e.l[1], e.l[2], Z)).join('\n    ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="Architecture d'exécution de la plateforme de recharge Voltis">
  <title>Voltis — vue d'exécution</title>
  <defs>
    ${fleche()}
  </defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="46" font-size="19" font-weight="700" fill="${ENCRE}">Voltis — recharge de véhicules électriques</text>
  <text x="40" y="68" font-size="12.5" fill="${DOUX}">Vue d'exécution · les mesures des bornes deviennent des factures mensuelles</text>
  ${legende(40, H - 46,
    [...new Set(N.map((n) => n.forme || 'service'))].concat(Z.length ? ['frontiere'] : []),
    [...new Set(N.map((n) => PAR_SLUG[n.ico]).filter((e) => e && !e.marqueOfficielle)
      .map((e) => FAM[e.famille]).filter(Boolean))].map((k) => [COUCHES[k].label, COUCHES[k].clair]),
    N.some((n) => n.vedette))}
    ${zones}
    ${aretes}
    ${noeuds}
    ${libelles}
    ${marques}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/exemple-voltis.svg'), svg);
const sansBadge = N.filter((n) => !n.ico).map((n) => n.t);
if (sansBadge.length) console.log(`  ⚠ nœuds sans badge disponible : ${sansBadge.join(', ')}`);
console.log(`  docs/exemple-voltis.svg · ${(svg.length / 1024).toFixed(0)} Ko`);
console.log(`  ${N.length - sansBadge.length}/${N.length} nœuds portent un badge`);
