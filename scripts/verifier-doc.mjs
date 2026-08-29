// Les nombres cités dans la documentation sont vérifiés contre la réalité.
//
// C'est la troisième fois aujourd'hui qu'un document affirme quelque chose que
// le dépôt a cessé d'être : le README recommandait le bloc-marque pour annoter
// une flèche après qu'on l'eut écarté, l'ADR 0003 annonçait huit formes après
// qu'une neuvième eut été ajoutée, et sa table des sources annonçait 25 produits
// quand il y en avait 40. Un compte faux est plus nuisible qu'un compte absent :
// il donne au lecteur une raison de ne pas aller voir.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './schema.mjs';

import { CHROMA_MAX } from './couleurs.mjs';

const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
// Deux seuils vivent dans le code ; le README les cite. On les compare à la
// source plutôt qu'à une constante recopiée ici, sans quoi la copie dériverait.
const lockups = fs.readFileSync(path.join(ROOT, 'scripts/lockups.mjs'), 'utf8');
const contrasteMin = Number(lockups.match(/const CONTRASTE_MIN = ([\d.]+)/)[1]);
const compte = (type) => mapping.filter((e) => e.type === type).length;
const fichiers = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.svg')).length;

// L'index des ADR se tenait à jour à la main, et 0007 n'y figurait pas : une
// décision prise mais introuvable vaut une décision non prise.
{
  const dir = path.join(ROOT, 'docs/adr');
  const index = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
  const manquants = fs.readdirSync(dir)
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .filter((f) => !index.includes(`(${f})`));
  if (manquants.length) {
    throw new Error(`Des ADR ne figurent pas dans docs/adr/README.md :\n  ${manquants.join('\n  ')}`);
  }
}

// Chaque règle : un fichier, une expression qui capture le nombre, la valeur
// attendue, et de quoi le dire à l'auteur.
const REGLES = [
  ['README.md', /source de vérité : (\d+) protocoles/, compte('protocole'), 'protocoles dans protocoles.json'],
  ['README.md', /source de vérité : (\d+) produits/, compte('produit'), 'produits dans produits.json'],
  ['README.md', /source de vérité : (\d+) rôles/, compte('role'), 'rôles dans roles.json'],
  ['README.md', /lockups\/horizontal\/\s+(\d+) SVG/, fichiers('lockups/horizontal'), 'fichiers dans lockups/horizontal'],
  ['README.md', /lockups\/empile\/\s+(\d+) SVG/, fichiers('lockups/empile'), 'fichiers dans lockups/empile'],
  ['README.md', /lockups\/mono\/\s+(\d+) SVG/, fichiers('lockups/mono'), 'fichiers dans lockups/mono'],
  ['README.md', /symboles\/\s+(\d+) SVG/, fichiers('symboles'), 'fichiers dans symboles'],
  ['README.md', /drawio\/produits\.xml\s+bibliothèque de formes draw\.io · (\d+)/, compte('produit'), 'produits dans produits.json'],
  ['README.md', /drawio\/roles\.xml\s+bibliothèque de formes draw\.io · (\d+)/, compte('role'), 'rôles dans roles.json'],
  ['README.md', /^(\d+) marques du jeu/m, mapping.filter((e) => e.logotype).length, 'entrées déclarées logotype'],
  ['README.md', /jusqu'à \*\*(\d,\d):1 de contraste\*\*/, contrasteMin, 'seuil CONTRASTE_MIN de scripts/lockups.mjs'],
  ['README.md', /chroma est donc \*\*plafonnée à (\d,\d\d)\*\*/, CHROMA_MAX, 'plafond CHROMA_MAX de scripts/couleurs.mjs'],
  ['excalidraw/README.md', /les (\d+) signes/, mapping.length, 'entrées dans mapping.json'],
];

const erreurs = [];
for (const [fichier, motif, attendu, quoi] of REGLES) {
  const texte = fs.readFileSync(path.join(ROOT, fichier), 'utf8');
  const m = texte.match(motif);
  if (!m) {
    erreurs.push(`  ${fichier} : la formulation attendue par ${motif} a disparu — la règle ne vérifie plus rien.`);
    continue;
  }
  if (Number(m[1].replace(',', '.')) !== attendu) {
    erreurs.push(`  ${fichier} : annonce ${m[1]}, il y a ${attendu} ${quoi}.`);
  }
}
if (erreurs.length) {
  throw new Error(`La documentation cite des nombres faux :\n${erreurs.join('\n')}`);
}
console.log(`  documentation : ${REGLES.length} nombres vérifiés contre les sources`);
