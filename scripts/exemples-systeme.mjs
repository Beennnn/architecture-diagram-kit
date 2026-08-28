// Trois vues d'un même système, à trois niveaux d'abstraction distincts.
// Elles ne sont PAS fusionnables : mélanger matériel, plateforme et code dans
// un seul schéma viole la règle « un seul niveau d'abstraction par schéma ».
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENCRE, DOUX, LIGNE, esc, symbole, badge, boite, ACCENT, fleche, marqueur, legende } from './schema.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const COUCHES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8')).couches;
const FAM = {}; for (const [k, c] of Object.entries(COUCHES)) for (const f of c.familles) FAM[f] = k;
const PAR_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''} font-size="${o.f || 11}"${o.g ? ` font-weight="600"` : ''} fill="${o.c || DOUX}"${o.m ? ` font-family="'IBM Plex Mono',monospace"` : ''}>${esc(s)}</text>`;

// La zone passe par boite() : elle avait sa propre géométrie, donc son propre
// fond, qui a survécu au changement d'échelle de l'ADR 0007 sans le suivre.
// Une zone reçoit un symbole quand elle EST un produit ou une plateforme
// (« Cluster de production » est du Kubernetes). Une frontière abstraite —
// un segment réseau, une couche d'architecture — n'en reçoit pas : lui en
// coller un ferait croire à un composant là où il n'y a qu'un périmètre.
const zone = (z) => {
  const droite = z.x + z.w - 14;
  const finTexte = z.ico ? droite - 28 : droite;
  return boite({ x: z.x, y: z.y, w: z.w, h: z.h, forme: 'frontiere', imbrique: z.imbrique })
    + (z.ico ? symbole(z.ico, droite - 22, z.y + 12, 22) : '')
    + T(finTexte, z.y + 22, z.t, { a: 'end', f: 12, g: 1 })
    + (z.s ? T(finTexte, z.y + 38, z.s, { a: 'end', f: 10, c: LIGNE }) : '');
};

// Le sous-titre porte la techno et, quand la boîte désigne une chose qui existe
// vraiment — une base, un bucket, un topic, une machine —, son identifiant. Un
// bucket s'appelle « voltis-factures », pas « S3 » : sans lui, le schéma décrit
// une catégorie et pas un système. La chasse fixe sépare les deux registres.
// Largeurs approchées : 0,48 em en Plex Sans, 0,60 em en Plex Mono. La marge
// d'erreur est absorbée par les 10 px de fond de boîte réservés.
const largeurSousTitre = (n, taille) =>
  n.s.length * taille * 0.48 + (n.id ? (3 * taille * 0.48 + n.id.length * taille * 0.60) : 0);

const sousTitre = (x, y, n, taille) => {
  const dispo = n.x + n.w - x - 10;
  if (!n.id) return T(x, y, n.s, { f: taille });
  // En ligne quand ça tient, sur sa propre ligne sinon : une boîte étroite ne
  // doit pas obliger à raccourcir un identifiant, qui n'est pas négociable.
  if (largeurSousTitre(n, taille) <= dispo) {
    return T(x, y, n.s, { f: taille })
      .replace('</text>', ` · <tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan></text>`);
  }
  const largeurId = n.id.length * (taille - 1) * 0.60;
  if (largeurId > dispo) {
    throw new Error(`« ${n.t} » : l'identifiant « ${n.id} » fait ${Math.round(largeurId)} px `
      + `pour ${Math.round(dispo)} px disponibles, même seul sur sa ligne.`);
  }
  if (n.y + n.h - (y + 13) < 6) {
    throw new Error(`« ${n.t} » : pas la place d'une troisième ligne (${n.h} px de haut).`);
  }
  return T(x, y - 6, n.s, { f: taille })
    + T(x, y + 8, n.id, { f: taille - 1, m: 1, c: LIGNE });
};

// Un nœud : titre + sous-titre, badge à gauche, deux tailles selon la hauteur
const noeud = (n) => {
  const vd = n.vedette ? ACCENT : null;
  // Un nœud haut héberge d'autres boîtes : son libellé va en haut, sinon les
  // enfants le recouvrent. Constat de l'exercice, consigné dans l'ADR 0005.
  if (n.forme === 'noeud' && n.h > 100) {
    return `<g>${boite({ ...n, vedette: vd })}`
      + (n.ico ? symbole(n.ico, n.x + 12, n.y + 12, 26) : '')
      + T(n.x + 46, n.y + 24, n.t, { f: 13, g: 1, c: vd || ENCRE })
      + (n.s ? sousTitre(n.x + 46, n.y + 39, n, 10.5) : '') + `</g>`;
  }
  const petit = n.h <= 58;
  const dec = n.forme === 'stockage' ? 6 : 0;
  const cy = n.y + n.h / 2 + dec;
  const it = petit ? 24 : 30, tx = n.x + (petit ? 40 : 50);
  return `<g>${boite({ ...n, vedette: vd })}`
    + (n.ico ? symbole(n.ico, n.x + (petit ? 10 : 12), cy - it / 2, it) : '')
    + T(tx, n.s ? cy - 2 : cy + 4, n.t, { f: petit ? 12 : 13.5, g: 1, c: vd || ENCRE })
    + (n.s ? sousTitre(tx, cy + 14, n, petit ? 9.5 : 10.5) : '') + `</g>`;
};

const lien = (e) => `<path d="${e.d}" fill="none" stroke="${LIGNE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`;

function rendre({ f, w, h, titre, sous, zones = [], noeuds = [], liens = [], marques = [], notes = [], apres = '' }) {
  // La légende se déduit du contenu : elle ne peut pas annoncer une forme
  // absente ni oublier une couleur employée.
  const formesUtilisees = [...new Set(noeuds.map((n) => n.forme || 'service'))].concat(zones.length ? ['frontiere'] : []);
  const couchesUtilisees = [...new Set(noeuds.map((n) => PAR_SLUG[n.ico]).filter((e) => e && !e.marqueOfficielle)
    .map((e) => FAM[e.famille]).filter(Boolean))]
    .map((k) => [COUCHES[k].label, COUCHES[k].clair]);
  const leg = legende(40, h - 46, formesUtilisees, couchesUtilisees, noeuds.some((n) => n.vedette));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="${esc(titre)}">
  <title>${esc(titre)}</title>
  <defs>${fleche()}</defs>
  <rect width="${w}" height="${h}" fill="#FFFFFF"/>
  ${T(40, 44, titre, { f: 18, g: 1, c: ENCRE })}
  ${T(40, 66, sous, { f: 12.5 })}
  ${zones.map(zone).join('\n  ')}
  ${liens.map(lien).join('\n  ')}
  ${noeuds.map(noeud).join('\n  ')}
  ${notes.map((n) => T(n[0], n[1], n[2], { a: n[3], f: n[4] || 10.5 })).join('\n  ')}
  ${marques.map((m) => badge(m[0], m[1], m[2], m[3] || 0.74)).join('\n  ')}
  ${apres}
  ${leg}
</svg>
`;
  fs.writeFileSync(path.join(ROOT, 'docs', f), svg);
  console.log(`  docs/${f} · ${(svg.length / 1024).toFixed(0)} Ko · ${noeuds.length} nœuds · ${zones.length} zones`);
}

/* ══════════════ 1 · matériel et réseau ══════════════ */
const vmA = (x, y, ico, t, s) => ({ x, y, w: 128, h: 54, t, s, ico, forme: 'noeud' });
rendre({
  f: 'exemple-infra.svg', w: 1280, h: 760,
  titre: 'Socle — machines, réseau, virtualisation',
  sous: "Niveau matériel · ce schéma ne contient aucun composant applicatif",
  zones: [
    { x: 232, y: 100, w: 250, h: 200, t: 'DMZ', s: 'exposée' },
    { x: 522, y: 100, w: 718, h: 520, t: 'LAN production', s: 'VLAN 20 · non routé vers l’extérieur' },
  ],
  noeuds: [
    { x: 40, y: 150, w: 150, h: 64, t: 'Internet', s: 'hors périmètre', ico: 'cdn', forme: 'externe' },
    { x: 262, y: 170, w: 190, h: 70, t: 'Pare-feu', s: 'pfSense', ico: 'pfsense', id: 'fw-edge-01', forme: 'service' },
    { x: 552, y: 150, w: 190, h: 66, t: 'Commutateur', s: '48 ports', ico: 'commutateur', forme: 'service' },
    { x: 790, y: 150, w: 190, h: 66, t: 'Routeur', s: 'BGP', ico: 'routeur', forme: 'service' },
    { x: 1028, y: 150, w: 190, h: 66, t: 'Résolveur DNS', s: 'interne', ico: 'dns', id: 'ns1.interne', forme: 'service' },

    { x: 552, y: 280, w: 320, h: 180, t: 'Serveur A', s: '2 × Xeon · 256 Gio', ico: 'serveur', id: 'srv-a', forme: 'noeud', vedette: true },
    { x: 572, y: 336, w: 280, h: 44, t: 'Proxmox VE', s: 'hyperviseur', ico: 'proxmox', forme: 'service' },
    vmA(572, 392, 'ubuntu', 'vm-app-1', 'Ubuntu 24.04'),
    vmA(724, 392, 'ubuntu', 'vm-app-2', 'Ubuntu 24.04'),

    { x: 900, y: 280, w: 320, h: 180, t: 'Serveur B', s: '2 × Xeon · 256 Gio', ico: 'serveur', id: 'srv-b', forme: 'noeud' },
    { x: 920, y: 336, w: 280, h: 44, t: 'Hyperviseur', s: 'KVM', ico: 'hyperviseur', forme: 'service' },
    vmA(920, 392, 'linux', 'vm-data-1', 'Debian 12'),
    vmA(1072, 392, 'linux', 'vm-data-2', 'Debian 12'),

    { x: 552, y: 500, w: 320, h: 78, t: 'Baie de disques', s: 'RAID 10 · 12 To', ico: 'volume', id: 'baie-01', forme: 'stockage' },
    { x: 900, y: 500, w: 320, h: 78, t: 'Sauvegarde', s: 'hors site · quotidienne', ico: 'stockage-objet', id: 'sauv-distante', forme: 'stockage' },
  ],
  liens: [
    { d: 'M190,182 H254' },
    { d: 'M452,205 H510 V183 H544' },
    { d: 'M742,183 H782' },
    { d: 'M980,183 H1020' },
    { d: 'M647,216 V272' },
    { d: 'M995,216 V272' },
    { d: 'M712,460 V492' },
    { d: 'M1060,460 V492' },
  ],
  marques: [['https', 222, 158, 0.7]],
  notes: [[490, 176, 'trafic filtré', 'middle'], [700, 246, 'VLAN 20', 'middle'], [1048, 246, 'VLAN 20', 'middle'],
          [745, 480, 'iSCSI', 'middle'], [1093, 480, 'réplication', 'middle']],
});

/* ══════════════ 2 · plateforme Kubernetes ══════════════ */
const pod = (x, y, t, s, ico) => ({ x, y, w: 132, h: 52, t, s, ico, forme: 'service' });
const clusterip = (x, y) => ({ x, y, w: 268, h: 48, t: 'Service ClusterIP', ico: 'service-cluster', forme: 'service' });
rendre({
  f: 'exemple-k8s.svg', w: 1280, h: 780,
  titre: 'Plateforme — cluster Kubernetes',
  sous: 'Niveau plateforme · les VM du schéma précédent sont ici les nœuds du cluster',
  zones: [{ x: 40, y: 100, w: 1000, h: 540, t: 'Cluster de production', s: '3 nœuds · Istio en maillage', ico: 'kubernetes' }],
  noeuds: [
    { x: 400, y: 150, w: 280, h: 62, t: 'Ingress', s: 'terminaison TLS', ico: 'passerelle-api', forme: 'service' },

    { x: 60, y: 262, w: 300, h: 196, t: 'nœud-1', s: 'vm-app-1', ico: 'noeud-cluster', forme: 'noeud' },
    pod(78, 322, 'commandes', '2 réplicas', 'pod'), pod(214, 322, 'panier', '2 réplicas', 'pod'),
    clusterip(78, 388),

    { x: 390, y: 262, w: 300, h: 196, t: 'nœud-2', s: 'vm-app-2', ico: 'noeud-cluster', forme: 'noeud', vedette: true },
    pod(408, 322, 'paiement', '2 réplicas', 'pod'), pod(544, 322, 'notifs', '2 réplicas', 'pod'),
    clusterip(408, 388),

    { x: 720, y: 262, w: 300, h: 196, t: 'nœud-3', s: 'vm-data-1', ico: 'noeud-cluster', forme: 'noeud' },
    pod(738, 322, 'maillage', 'Istio', 'istio'), pod(874, 322, 'secrets', 'Vault', 'vault'),
    clusterip(738, 388),

    { x: 60, y: 490, w: 300, h: 66, t: 'Registre d’images', s: 'tiré par les nœuds', ico: 'registre', id: 'registry.interne', forme: 'stockage' },
    { x: 400, y: 490, w: 300, h: 66, t: 'Volume persistant', s: 'monté par les pods', ico: 'volume', id: 'pvc-donnees', forme: 'stockage' },

    { x: 1080, y: 262, w: 170, h: 92, t: 'Relationnel', s: 'PostgreSQL 16', id: 'voltis-commandes', ico: 'postgresql', forme: 'stockage' },
    { x: 1080, y: 392, w: 170, h: 92, t: 'Objets', s: 'S3', id: 'voltis-factures', ico: 's3', forme: 'stockage' },
  ],
  liens: [
    { d: 'M540,212 V240 H210 V254' }, { d: 'M540,240 V254' }, { d: 'M540,240 H870 V254' },
    // les accès aux magasins partent du bord du cluster : une flèche qui
    // traverserait une boîte de nœud dirait qu'elle y entre
    { d: 'M1020,300 H1072' }, { d: 'M1020,420 H1072' },
    { d: 'M210,458 V482' }, { d: 'M540,458 V482' },
  ],
  marques: [['grpc', 610, 232, 0.66]],
  notes: [[1046, 292, 'SQL', 'middle'], [1046, 412, 'objets', 'middle'],
          [246, 478, 'docker pull', 'middle'], [578, 478, 'monte', 'middle']],
});

/* ══════════════ 3 · intérieur d'un service ══════════════ */
// Dans une vue de code, « stockage » ne s'emploie pas : une entité ou un fichier
// de configuration ne survit pas au redémarrage, c'est un élément de code. Les
// magasins réels sont dehors. De même, aucun badge de protocole à l'intérieur :
// un protocole marque un franchissement de frontière, pas un appel de méthode.
rendre({
  f: 'exemple-composant.svg', w: 1400, h: 660,
  titre: 'Composant — intérieur du service Commandes',
  sous: 'Niveau code · un seul des pods du schéma précédent, ouvert',
  zones: [
    { x: 210, y: 100, w: 900, h: 420, t: 'Service Commandes', s: 'Spring Boot · un conteneur', ico: 'springboot' },
    { x: 234, y: 148, w: 258, h: 262, t: 'Entrées', s: 'adaptateurs', imbrique: true },
    { x: 514, y: 148, w: 258, h: 262, t: 'Domaine', s: 'sans dépendance', imbrique: true },
    { x: 794, y: 148, w: 296, h: 262, t: 'Sorties', s: 'adaptateurs', imbrique: true },
  ],
  noeuds: [
    { x: 30, y: 258, w: 150, h: 70, t: 'Bus', s: 'Kafka', id: 'mesures.v1', ico: 'kafka', forme: 'flux' },

    { x: 252, y: 200, w: 222, h: 54, t: 'Contrôleur REST', s: '/v2/commandes', ico: 'controleur', forme: 'service' },
    { x: 252, y: 266, w: 222, h: 54, t: 'Consommateur', s: 'topic mesures', ico: 'worker', forme: 'service' },
    { x: 532, y: 200, w: 222, h: 54, t: 'Service métier', s: 'règles de gestion', ico: 'service-applicatif', forme: 'service', vedette: true },
    { x: 532, y: 266, w: 222, h: 54, t: 'Commande', s: 'entité du domaine', ico: 'entite', forme: 'service' },
    { x: 812, y: 200, w: 260, h: 54, t: 'Dépôt JPA', s: 'Hibernate', ico: 'hibernate', forme: 'service' },
    { x: 812, y: 266, w: 260, h: 54, t: 'Migrations', s: 'Flyway', ico: 'flyway', forme: 'service' },
    { x: 812, y: 332, w: 260, h: 54, t: 'Client objets', s: 'SDK S3', ico: 'depot', forme: 'service' },

    { x: 234, y: 436, w: 378, h: 54, t: 'Configuration', s: 'profils · variables', ico: 'configuration', forme: 'service' },
    { x: 632, y: 436, w: 458, h: 54, t: 'Sécurité', s: 'Spring Security · filtre de jetons', ico: 'springsecurity', forme: 'service' },

    { x: 1150, y: 190, w: 220, h: 86, t: 'Relationnel', s: 'PostgreSQL 16', id: 'voltis-commandes', ico: 'postgresql', forme: 'stockage' },
    { x: 1150, y: 316, w: 220, h: 86, t: 'Objets', s: 'S3', id: 'voltis-factures', ico: 's3', forme: 'stockage' },
  ],
  liens: [
    { d: 'M180,293 H244' },
    { d: 'M180,227 H244' },
    { d: 'M474,227 H524' },
    { d: 'M474,293 H500 V240 H524' },
    { d: 'M643,254 V258' },
    { d: 'M754,227 H804' },
    { d: 'M754,240 H780 V293 H804' },
    { d: 'M754,240 H780 V359 H804' },
    { d: 'M1072,227 H1142' },
    { d: 'M1072,293 H1110 V240 H1142' },
    { d: 'M1072,359 H1142' },
  ],
  marques: [['rest', 108, 200, 0.62]],
  notes: [[212, 282, 'consomme', 'end'], [1106, 218, 'SQL', 'middle'], [1106, 350, 'PUT', 'middle'],
          [499, 218, 'appelle', 'middle'], [779, 218, 'persiste', 'middle']],
});

/* ══════════════ 4 · chaîne de livraison ══════════════ */
// C'est ici que vit la moitié des « concepts candidats » : un formateur, un
// analyseur, une couverture ne sont pas des composants du système — ils sont des
// étapes qui le produisent. Les mettre dans une vue d'exécution serait un
// mélange de niveaux d'abstraction.

const etape = (x, t, s, ico) => ({ x, y: 180, w: 170, h: 64, t, s, ico, forme: 'service' });
const outil = (x, y, t, s, ico, forme = 'service') => ({ x, y, w: 190, h: forme === 'stockage' ? 66 : 48, t, s, ico, forme });

const M = [
  marqueur(790, 168, 'immuable'),
  marqueur(990, 168, 'SemVer'),
  marqueur(586, 380, 'contract-first'),
  marqueur(1216, 168, 'moindre privilège', '#C0392F'),
];

rendre({
  f: 'exemple-livraison.svg', w: 1400, h: 760,
  titre: 'Livraison — de la modification au déploiement',
  sous: 'Niveau chaîne · aucune de ces boîtes n’existe à l’exécution',
  zones: [{ x: 40, y: 120, w: 1030, h: 360, t: 'Intégration continue', s: 'déclenchée à chaque poussée', ico: 'gitlab' }],
  noeuds: [
    etape(64, 'Compilation', 'Maven', 'maven'),
    etape(264, 'Qualité', 'Spotless · format', 'formateur'),
    etape(464, 'Tests', 'JUnit 5', 'junit'),
    etape(664, 'Empaquetage', 'image OCI', 'oci'),
    etape(864, 'Publication', 'registre', 'registre'),

    outil(264, 272, 'Analyse statique', 'Error Prone · NullAway', 'analyse-statique'),
    outil(264, 330, 'Test d’architecture', 'ArchUnit', 'test-architecture'),
    outil(464, 272, 'Couverture', 'JaCoCo', 'couverture'),
    outil(464, 330, 'Test de mutation', 'PIT', 'test-mutation'),
    outil(464, 388, 'Test de contrat', 'OpenAPI · AsyncAPI', 'test-contrat'),
    outil(664, 266, 'SBOM', 'SPDX', 'sbom', 'stockage'),

    { x: 1160, y: 180, w: 200, h: 64, t: 'Déploiement', s: 'Kubernetes', ico: 'kubernetes', id: 'voltis-prod', forme: 'service', vedette: true },
    { x: 1160, y: 300, w: 200, h: 64, t: 'Décisions', s: 'ADR versionnés', ico: 'decision', forme: 'service' },
    { x: 1160, y: 400, w: 200, h: 64, t: 'Schémas', s: 'draw.io versionné', ico: 'drawio', forme: 'service' },
  ],
  liens: [
    { d: 'M234,212 H256' }, { d: 'M434,212 H456' }, { d: 'M634,212 H656' }, { d: 'M834,212 H856' },
    { d: 'M1034,212 H1152' },
    { d: 'M359,244 V264' }, { d: 'M359,320 V322' },
    { d: 'M559,244 V264' }, { d: 'M559,320 V322' }, { d: 'M559,378 V380' },
    { d: 'M749,244 V258' },
  ],
  marques: [],
  notes: [[1078, 202, 'artefact signé', 'middle']],
  apres: M.join(''),
});
