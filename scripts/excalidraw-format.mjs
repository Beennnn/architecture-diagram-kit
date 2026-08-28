// Le format de scène Excalidraw, partagé par les générateurs. Extrait de
// excalidraw.mjs pour que la bibliothèque de grammaire écrive exactement la même
// structure : deux copies auraient divergé au premier changement de format.
import crypto from 'node:crypto';

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

let n = 0;
export const id = () => `logolibres-${String(++n).padStart(4, '0')}`;
export const ent = () => 1; // seed et version constants : la scène doit être reproductible

export const base = (x, y, w, h, groupIds) => ({
  id: id(), x, y, width: w, height: h, angle: 0,
  strokeColor: '#1e1e1e', backgroundColor: 'transparent',
  fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
  roundness: null, roughness: 0, opacity: 100,
  seed: ent(), version: ent(), versionNonce: ent(), index: null,
  isDeleted: false, groupIds, frameId: null, boundElements: null,
  updated: 1, link: null, locked: false,
});


export const VERSION_VERIFIEE = '0.18.1';   // @excalidraw/excalidraw sur lequel le format a été lu

export function verifier(sc) {
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
}

// Un contrôle de composition, à part : il n'appartient pas au format mais à la
// scène qui s'en sert. La planche de badges veut des paires signe + nom ; la
// planche de grammaire groupe un rectangle et une ellipse pour son cylindre.
export function verifierGroupes(sc, attendu) {
  const parGroupe = {};
  for (const e of sc.elements) for (const g of e.groupIds) (parGroupe[g] ||= []).push(e.type);
  const mauvais = Object.entries(parGroupe).filter(([, t]) => !attendu(t));
  if (mauvais.length) {
    throw new Error(`${mauvais.length} groupe(s) de composition inattendue : `
      + mauvais.map(([g, t]) => `${g} = [${t.join(', ')}]`).join(' · '));
  }
}
