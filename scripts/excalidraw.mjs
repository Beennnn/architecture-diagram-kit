// Génère excalidraw/badges.excalidraw : une scène contenant les 82 badges,
// à ouvrir puis à copier-coller vers ses propres schémas.
//
// Pourquoi une SCÈNE et non une bibliothèque .excalidrawlib : le type
// ExportedLibraryData d'Excalidraw ne comporte que { type, version, source,
// libraryItems } — aucune propriété « files ». loadLibraryFromBlob ne renvoie
// que des LibraryItem[]. Une bibliothèque ne peut donc pas transporter de
// binaire d'image : un élément image y référencerait un fileId inexistant.
// Le type ExportedDataState d'une scène, lui, porte bien « files ».
// Vérifié sur @excalidraw/excalidraw 0.18.1.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { encreLisible } from './couleurs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/rows.json'), 'utf8'));
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));

const famVersCouche = {};
for (const [k, c] of Object.entries(couches)) for (const f of c.familles) famVersCouche[f] = k;

const CANVAS = '#FFFFFF', CONTRASTE = 4.5;
const TAILLE = 48, PAS_X = 132, PAS_Y = 116, PAR_LIGNE = 8;

const couleur = (r) => {
  const brut = r.couleur ? r.couleur
    : (r.marqueOfficielle && r.hex) ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`)
    : couches[famVersCouche[r.famille]].clair;
  return encreLisible(brut, CANVAS, CONTRASTE);
};
const court = (r) => r.court || r.label.split(' /')[0].split(' (')[0];

// Excalidraw identifie un fichier par un condensé ; on emploie le SHA-1 du SVG,
// ce qui rend la scène reproductible d'une génération à l'autre.
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

let n = 0;
const id = () => `logolibres-${String(++n).padStart(4, '0')}`;
const ent = () => 1; // seed et version constants : la scène doit être reproductible

const base = (x, y, w, h, groupIds) => ({
  id: id(), x, y, width: w, height: h, angle: 0,
  strokeColor: '#1e1e1e', backgroundColor: 'transparent',
  fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
  roundness: null, roughness: 0, opacity: 100,
  seed: ent(), version: ent(), versionNonce: ent(), index: null,
  isDeleted: false, groupIds, frameId: null, boundElements: null,
  updated: 1, link: null, locked: false,
});

const elements = [], files = {};
let ligne = 0, col = 0, groupe = 0;
const titres = [];

for (const type of ['protocole', 'produit', 'role']) {
  const lot = rows.filter((r) => r.type === type);
  if (col !== 0) { ligne++; col = 0; }
  titres.push({ y: ligne * PAS_Y, texte: { protocole: 'Protocoles', produit: 'Produits', role: "Rôles d'infrastructure" }[type], n: lot.length });
  ligne++;

  for (const r of lot) {
    const x = col * PAS_X, y = ligne * PAS_Y;
    const svg = fs.readFileSync(path.join(ROOT, 'symboles', `${r.slug}.svg`), 'utf8');
    const fileId = sha1(svg);
    files[fileId] = {
      mimeType: 'image/svg+xml', id: fileId,
      dataURL: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
      created: 1,
    };
    const g = [`ll-groupe-${++groupe}`];
    elements.push({ ...base(x, y, TAILLE, TAILLE, g), type: 'image', fileId, status: 'saved', scale: [1, 1], crop: null });
    const nom = court(r);
    elements.push({
      ...base(x - (PAS_X - TAILLE) / 2, y + TAILLE + 8, PAS_X - 12, 20, g),
      type: 'text', strokeColor: couleur(r),
      fontSize: 16, fontFamily: 2, text: nom, originalText: nom,
      textAlign: 'center', verticalAlign: 'top',
      containerId: null, autoResize: true, lineHeight: 1.25,
    });
    if (++col === PAR_LIGNE) { col = 0; ligne++; }
  }
}

for (const t of titres) {
  const texte = `${t.texte} · ${t.n}`;
  elements.push({
    ...base(0, t.y + 60, 320, 25, []),
    type: 'text', strokeColor: '#495057',
    fontSize: 20, fontFamily: 2, text: texte, originalText: texte,
    textAlign: 'left', verticalAlign: 'top',
    containerId: null, autoResize: true, lineHeight: 1.25,
  });
}

// ─── conformité ───────────────────────────────────────────────────────────
// Cette voie est secondaire (ADR 0004) : sans utilisateur quotidien, elle
// casserait en silence à la première évolution du format. Ces assertions
// transforment ce risque en échec de build.
const VERSION_VERIFIEE = '0.18.1';   // @excalidraw/excalidraw sur lequel le format a été lu

function verifier(sc) {
  const err = (m) => { throw new Error(`scène Excalidraw non conforme : ${m}`); };
  if (sc.type !== 'excalidraw' || sc.version !== 2) err('type ou version inattendus');
  if (!sc.files || typeof sc.files !== 'object') err('« files » absent — c’est ce que ne porte pas une bibliothèque');

  const ids = new Set();
  const BASE = ['id', 'x', 'y', 'width', 'height', 'angle', 'strokeColor', 'backgroundColor',
    'fillStyle', 'strokeWidth', 'strokeStyle', 'roundness', 'roughness', 'opacity', 'seed',
    'version', 'versionNonce', 'index', 'isDeleted', 'groupIds', 'frameId', 'boundElements',
    'updated', 'link', 'locked'];

  for (const e of sc.elements) {
    for (const c of BASE) if (!(c in e)) err(`champ « ${c} » manquant sur ${e.id}`);
    if (ids.has(e.id)) err(`identifiant en double : ${e.id}`);
    ids.add(e.id);
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) err(`coordonnée non finie sur ${e.id}`);
    if (e.type === 'image') {
      if (!sc.files[e.fileId]) err(`l’image ${e.id} référence un fileId absent de « files »`);
      if (e.status !== 'saved') err(`l’image ${e.id} n’est pas marquée « saved »`);
    }
    if (e.type === 'text' && e.text !== e.originalText) err(`text et originalText divergent sur ${e.id}`);
  }

  for (const [k, f] of Object.entries(sc.files)) {
    if (f.id !== k) err(`clé et id divergent pour le fichier ${k}`);
    const pref = 'data:image/svg+xml;base64,';
    if (!f.dataURL.startsWith(pref)) err(`dataURL malformée pour ${k}`);
    const svg = Buffer.from(f.dataURL.slice(pref.length), 'base64').toString('utf8');
    if (!svg.startsWith('<svg') || !svg.trimEnd().endsWith('</svg>')) err(`le fichier ${k} ne redécode pas en SVG`);
    if (sha1(svg) !== k) err(`le fichier ${k} n’est pas nommé par le condensé de son contenu`);
  }

  // chaque badge est un groupe de deux éléments : le signe et son nom
  const parGroupe = {};
  for (const e of sc.elements) for (const g of e.groupIds) (parGroupe[g] ||= []).push(e.type);
  const mauvais = Object.entries(parGroupe).filter(([, t]) => t.length !== 2 || !t.includes('image') || !t.includes('text'));
  if (mauvais.length) err(`${mauvais.length} groupe(s) ne sont pas une paire image + texte`);
}

const scene = {
  type: 'excalidraw', version: 2, source: 'https://github.com/Beennnn/logo-libres',
  elements,
  appState: { gridSize: 20, gridStep: 5, gridModeEnabled: false, viewBackgroundColor: '#ffffff' },
  files,
};
verifier(scene);
fs.mkdirSync(path.join(ROOT, 'excalidraw'), { recursive: true });
const sortie = JSON.stringify(scene, null, 2) + '\n';
fs.writeFileSync(path.join(ROOT, 'excalidraw/badges.excalidraw'), sortie);
console.log(`  excalidraw/badges.excalidraw · ${elements.length} éléments · ${Object.keys(files).length} images · ${(sortie.length / 1024).toFixed(0)} Ko · conforme au format ${VERSION_VERIFIEE}`);
