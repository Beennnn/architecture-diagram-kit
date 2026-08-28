// La grammaire de formes, portée dans Excalidraw.
//
// Elle s'y dégrade, et c'est écrit dans la planche plutôt que tu par omission.
// Ce qui est vérifié : strokeWidth ne prend que 1, 2 ou 4 — fin, gras, très
// gras. L'interface ne propose que deux rondeurs, anguleux ou rond, sans
// exposer de rayon. Et il n'existe pas de cylindre parmi les formes.
//
// Ce que je ne peux pas affirmer : le format porte un champ « value » sur la
// rondeur, donc un rayon est peut-être exprimable dans le JSON. Ce serait sans
// effet ici de toute façon, puisqu'un utilisateur qui bascule la rondeur dans
// l'application repartirait des deux presets.
//
// C'est la raison même pour laquelle l'ADR 0004 range cette voie en second :
// elle sert à esquisser, draw.io sert à produire.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, FONDS, FOND_IMBRIQUE, ACCENT, ACCENT_EP, TRAIT, LIGNE, ENCRE } from './schema.mjs';
import { base, verifier, verifierGroupes, VERSION_VERIFIEE } from './excalidraw-format.mjs';

// Excalidraw n'accepte que trois épaisseurs — fin, gras, très gras.
const epaisseur = (px) => (px >= 3 ? 4 : px >= 2 ? 2 : 1);
// Et deux arrondis : anguleux, ou « rond » dont le rayon lui appartient.
const arrondi = (rx) => (rx > 0 ? { type: 3 } : null);

const FORMES = [
  { cle: 'service', nom: 'Service', rx: 0, ep: 1.6, fond: FONDS.service, trait: TRAIT },
  { cle: 'application', nom: 'Application', rx: 10, ep: 1.6, fond: FONDS.application, trait: TRAIT },
  { cle: 'flux', nom: 'Flux', rx: 40, ep: 1.6, fond: FONDS.flux, trait: TRAIT, perte: 'la pilule devient un rectangle arrondi' },
  { cle: 'stockage', nom: 'Stockage', rx: 0, ep: 1.6, fond: FONDS.stockage, trait: TRAIT, cylindre: true, perte: 'aucun cylindre natif : rectangle et ellipse groupés' },
  { cle: 'acteur', nom: 'Acteur', rx: 10, ep: 1.6, fond: FONDS.acteur, trait: TRAIT },
  { cle: 'materiel', nom: 'Matériel', rx: 3, ep: 1.6, fond: FONDS.materiel, trait: TRAIT, perte: 'même arrondi que « application »' },
  { cle: 'noeud', nom: 'Nœud de déploiement', rx: 2, ep: 2.4, fond: FONDS.noeud, trait: TRAIT },
  { cle: 'externe', nom: 'Externe', rx: 8, ep: 1.6, fond: FONDS.externe, trait: LIGNE, tirets: true },
  { cle: 'frontiere', nom: 'Zone', rx: 12, ep: 1.3, fond: FONDS.frontiere, trait: LIGNE, tirets: true, perte: 'les tirets 5-4 et 8-6 se confondent' },
  { cle: 'frontiere2', nom: 'Zone imbriquée', rx: 12, ep: 1.3, fond: FOND_IMBRIQUE.frontiere, trait: LIGNE, tirets: true },
  { cle: 'vedette', nom: 'Sujet du schéma', rx: 0, ep: ACCENT_EP, fond: FONDS.service, trait: ACCENT, encre: ACCENT },
];

const W = 200, H = 96, PAS_X = 260, PAS_Y = 170, COLS = 4;
const elements = [];

const texte = (x, y, w, contenu, taille, couleur) => ({
  ...base(x, y, w, taille * 1.25, []),
  type: 'text', strokeColor: couleur,
  fontSize: taille, fontFamily: 2, text: contenu, originalText: contenu,
  textAlign: 'center', verticalAlign: 'top',
  containerId: null, autoResize: true, lineHeight: 1.25,
});

FORMES.forEach((f, i) => {
  const x = 40 + (i % COLS) * PAS_X, y = 120 + Math.floor(i / COLS) * PAS_Y;
  const commun = {
    strokeColor: f.trait, backgroundColor: f.fond, fillStyle: 'solid',
    strokeWidth: epaisseur(f.ep), strokeStyle: f.tirets ? 'dashed' : 'solid',
  };
  if (f.cylindre) {
    // Un cylindre se compose : c'est ce qu'un utilisateur ferait à la main.
    const g = [`grp-${f.cle}`];
    elements.push({ ...base(x, y + 14, W, H - 14, g), type: 'rectangle', ...commun, roundness: null });
    elements.push({ ...base(x, y, W, 28, g), type: 'ellipse', ...commun, roundness: null });
  } else {
    elements.push({ ...base(x, y, W, H, []), type: 'rectangle', ...commun, roundness: arrondi(f.rx) });
  }
  elements.push(texte(x, y + H + 10, W, f.nom, 14, f.encre || ENCRE));
  if (f.perte) elements.push(texte(x, y + H + 32, W, `⚠ ${f.perte}`, 11, '#B36208'));
});

const yNote = 120 + Math.ceil(FORMES.length / COLS) * PAS_Y + 20;
const NOTE = [
  'Ce que la grammaire perd en passant dans Excalidraw',
  '',
  'Excalidraw n’offre que trois épaisseurs de trait (fin, gras, très gras) : nos 1,3 · 1,6 · 2,4 · 3,2 px s’y ramènent à 1 · 1 · 2 · 4.',
  'Son interface ne propose que deux arrondis, anguleux ou rond, sans exposer de rayon : rx 3, 8, 10 et 12 deviennent le même angle.',
  'Il n’a pas de cylindre : le stockage est un rectangle et une ellipse groupés, que rien n’empêche de dissocier.',
  'Son tireté n’est pas paramétrable : « externe » et « zone » ne se distinguent plus que par leur fond.',
  '',
  'Les fonds, eux, passent exactement — ce sont eux qui portent la forme et l’emboîtement depuis l’ADR 0007.',
  'Esquissez ici, produisez dans draw.io : c’est le sens de l’ADR 0004.',
];
NOTE.forEach((l, i) => {
  elements.push({ ...texte(40, yNote + i * 20, 1000, l, i === 0 ? 18 : 13, i === 0 ? ENCRE : '#5B6873'), textAlign: 'left' });
});

const scene = {
  type: 'excalidraw', version: 2, source: 'https://github.com/Beennnn/logo-libres',
  elements, appState: { gridSize: null, viewBackgroundColor: '#ffffff' }, files: {},
};
verifier(scene);
// le seul groupe de cette planche est le cylindre composé
verifierGroupes(scene, (t) => t.length === 2 && t.includes('rectangle') && t.includes('ellipse'));

// Contrôle : les fonds de la grammaire doivent tous être présents, sinon la
// scène livre une version périmée de l'échelle de l'ADR 0007.
const fonds = new Set(elements.map((e) => e.backgroundColor));
for (const [forme, fond] of Object.entries(FONDS)) {
  if (!fonds.has(fond)) throw new Error(`grammaire.excalidraw : le fond de « ${forme} » (${fond}) n'y figure pas.`);
}

const sortie = JSON.stringify(scene, null, 2) + '\n';
fs.mkdirSync(path.join(ROOT, 'excalidraw'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'excalidraw', 'grammaire.excalidraw'), sortie);
console.log(`  excalidraw/grammaire.excalidraw · ${elements.length} éléments · ${FORMES.length} formes · ${FORMES.filter((f) => f.perte).length} pertes documentées · format ${VERSION_VERIFIEE}`);
