// Génère docs/exemple-couches.svg : une architecture en couches, avec le
// dimensionnement de chaque brique. Deuxième démonstration du jeu, sur une
// forme de schéma très différente de celle de exemple.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, LIGNE, esc, symbole, badge, boite, fleche, encreAccent, legende } from './schema.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const COUCHES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8')).couches;
const FAM = {}; for (const [k, c] of Object.entries(COUCHES)) for (const f of c.familles) FAM[f] = k;
const PAR_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const W = 1400, H = 1000;
const NW = 196;

// ─── couches ──────────────────────────────────────────────────────────────
const BANDES = [
  { x: 40, y: 220, w: 1160, h: 160, t: 'Couche présentation', s: 'entrée du trafic, terminaison TLS, authentification' },
  { x: 40, y: 420, w: 1160, h: 190, t: 'Couche microservices', s: 'sans état · mise à l’échelle horizontale' },
  { x: 40, y: 650, w: 1160, h: 200, t: 'Couche stockage', s: 'avec état · sauvegardé' },
];

// ─── nœuds ────────────────────────────────────────────────────────────────
// r = besoin en ressources
const N = [
  { x: 300, y: 100, w: NW, h: 76, t: 'Navigateur',     s: 'SPA',            ico: 'poste-client',    forme: 'acteur' },
  { x: 520, y: 100, w: NW, h: 76, t: 'App mobile',     s: 'iOS · Android',  ico: 'app-mobile',      forme: 'acteur' },

  { x: 80,  y: 265, w: NW, h: 76, t: 'CDN',            s: 'assets statiques', ico: 'cdn',           forme: 'service' },
  { x: 300, y: 265, w: NW, h: 76, t: 'Répartiteur',    s: 'nginx',          ico: 'nginx',           forme: 'service' },
  { x: 520, y: 265, w: NW, h: 76, t: 'Passerelle API', ico: 'passerelle-api', s: 'contrat OpenAPI', forme: 'service' },
  { x: 740, y: 265, w: NW, h: 76, t: 'Identité',       s: 'Keycloak',       ico: 'keycloak',        forme: 'service' },

  { x: 80,  y: 470, w: NW, h: 90, t: 'Catalogue',    s: 'Spring Boot', r: '6 × 1 vCPU · 2 Gio', ico: 'springboot', forme: 'service' },
  { x: 300, y: 470, w: NW, h: 90, t: 'Panier',       s: 'Quarkus',     r: '4 × 0,5 vCPU · 1 Gio', ico: 'quarkus',  forme: 'service' },
  { x: 520, y: 470, w: NW, h: 90, t: 'Commandes',    s: 'Spring Boot', r: '3 × 1 vCPU · 2 Gio', ico: 'springboot', forme: 'service', vedette: true },
  { x: 740, y: 470, w: NW, h: 90, t: 'Paiement',     s: 'Spring Boot', r: '2 × 0,5 vCPU · 1 Gio', ico: 'springboot', forme: 'service' },
  { x: 960, y: 470, w: NW, h: 90, t: 'Notifications', s: 'Quarkus',    r: '2 × 0,5 vCPU · 1 Gio', ico: 'quarkus',   forme: 'service' },

  { x: 80,  y: 705, w: NW, h: 96, t: 'Index produits', s: 'Elasticsearch · 80 Gio', r: '2 vCPU · 8 Gio', ico: 'elasticsearch', forme: 'stockage' },
  { x: 300, y: 705, w: NW, h: 96, t: 'Sessions',       s: 'Redis',                 r: '2 Gio en mémoire',        ico: 'redis',         forme: 'stockage' },
  { x: 520, y: 705, w: NW, h: 96, t: 'Relationnel',    s: 'PostgreSQL 16 · 500 Gio', r: '4 vCPU · 16 Gio', ico: 'postgresql',  forme: 'stockage' },
  { x: 740, y: 705, w: NW, h: 96, t: 'Bucket',         s: 'stockage objet · 2 Tio', r: 'classe standard', ico: 's3',         forme: 'stockage' },

  { x: 1230, y: 470, w: 160, h: 90, t: 'Relais mail',     s: 'externe', ico: 'smtp', forme: 'externe' },
];

// ─── liens ────────────────────────────────────────────────────────────────
const L = [
  { d: 'M398,176 V257',                     b: ['https', 398, 216] },
  { d: 'M638,176 V257',                     b: ['rest',  638, 216] },
  { d: 'M300,138 H178 V257',                l: ['assets', 236, 128] },
  { d: 'M496,303 H512',                     l: ['', 0, 0] },
  { d: 'M716,303 H732',                     l: ['jeton', 724, 293] },
  // un tronc unique puis un bus horizontal : cinq appels, aucun croisement
  // le bus passe ENTRE les deux bandes : dans la bande il croiserait son libellé
  { d: 'M638,341 V398 H178 V462' },
  { d: 'M638,398 H398 V462' },
  { d: 'M638,398 V462' },
  { d: 'M638,398 H858 V462' },
  { d: 'M638,398 H1058 V462' },
  { d: 'M178,560 V697',                     l: ['indexe', 210, 630] },
  { d: 'M398,560 V697',                     l: ['lit / écrit', 442, 630] },
  { d: 'M638,560 V697',                     l: ['SQL', 660, 630] },
  { d: 'M858,560 V697',                     l: ['justificatifs', 908, 630] },
  { d: 'M1156,515 H1222',                   b: ['smtp', 1189, 490] },
];

const bandes = BANDES.map((z) => `<g>`
  + boite({ x: z.x, y: z.y, w: z.w, h: z.h, forme: 'frontiere' })
  + `<text x="${z.x + z.w - 18}" y="${z.y + 26}" text-anchor="end" font-size="13" font-weight="600" fill="${DOUX}">${esc(z.t)}</text>`
  + `<text x="${z.x + z.w - 18}" y="${z.y + 44}" text-anchor="end" font-size="11" fill="${LIGNE}">${esc(z.s)}</text></g>`).join('\n    ');

const noeuds = N.map((n) => {
  const vd = n.vedette ? encreAccent(n.ico) : null;
  const cy = n.y + n.h / 2, dec = n.forme === 'stockage' ? 6 : 0;
  const tx = n.x + 56, base = n.r ? cy - 12 + dec : cy - 3 + dec;
  return `<g>${boite({ ...n, vedette: vd })}`
    + symbole(n.ico, n.x + 13, cy - 17 + dec, 32)
    + `<text x="${tx}" y="${base}" font-size="13.5" font-weight="600" fill="${vd || ENCRE}">${esc(n.t)}</text>`
    + `<text x="${tx}" y="${base + 17}" font-size="11" fill="${DOUX}">${esc(n.s)}</text>`
    + (n.r ? `<text x="${tx}" y="${base + 33}" font-size="10" font-weight="600" fill="#0B6E7F" font-family="'IBM Plex Mono',monospace">${esc(n.r)}</text>` : '')
    + `</g>`;
}).join('\n    ');

const aretes = L.map((e) => `<path d="${e.d}" fill="none" stroke="${LIGNE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`).join('\n    ');
const libelles = L.filter((e) => e.l && e.l[0]).map((e) => `<text x="${e.l[1]}" y="${e.l[2]}" text-anchor="middle" font-size="11" fill="${DOUX}">${esc(e.l[0])}</text>`).join('\n    ');
const marques = L.filter((e) => e.b).map((e) => badge(e.b[0], e.b[1], e.b[2], 0.78)).join('\n    ');

const TOTAL = '17 conteneurs · 12,5 vCPU / 27 Gio pour le calcul · 8 vCPU / 26 Gio + 580 Gio pour les données';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="Architecture en couches d'une place de marché, avec le dimensionnement de chaque brique">
  <title>Architecture en couches — dimensionnement</title>
  <defs>${fleche()}</defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <text x="40" y="46" font-size="19" font-weight="700" fill="${ENCRE}">Place de marché — architecture en couches</text>
  <text x="40" y="68" font-size="12.5" fill="${DOUX}">Le dimensionnement suit le profil de charge, pas la taille du code</text>
    ${bandes}
    ${aretes}
    ${noeuds}
    ${libelles}
    ${marques}
  <text x="40" y="${H - 42}" font-size="11.5" font-weight="600" fill="${DOUX}">Total</text>
  <text x="90" y="${H - 42}" font-size="11.5" fill="${DOUX}" font-family="'IBM Plex Mono',monospace">${esc(TOTAL)}</text>
  ${legende(40, H - 90,
    [...new Set(N.map((n) => n.forme || 'service'))].concat(BANDES.length ? ['frontiere'] : []),
    [...new Set(N.map((n) => PAR_SLUG[n.ico]).filter((e) => e && !e.marqueOfficielle)
      .map((e) => FAM[e.famille]).filter(Boolean))].map((k) => [COUCHES[k].label, COUCHES[k].clair]))}
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'docs/exemple-couches.svg'), svg);
const calc = N.filter((n) => n.r && n.forme === 'service');
console.log(`  docs/exemple-couches.svg · ${(svg.length / 1024).toFixed(0)} Ko · ${N.length} nœuds · ${calc.length} services dimensionnés`);
