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

const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const compte = (type) => mapping.filter((e) => e.type === type).length;
const fichiers = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.svg')).length;

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
  if (Number(m[1]) !== attendu) {
    erreurs.push(`  ${fichier} : annonce ${m[1]}, il y a ${attendu} ${quoi}.`);
  }
}
if (erreurs.length) {
  throw new Error(`La documentation cite des nombres faux :\n${erreurs.join('\n')}`);
}
console.log(`  documentation : ${REGLES.length} nombres vérifiés contre les sources`);
