// Variante sombre des vues, par réécriture de la palette.
//
// Pourquoi une réécriture plutôt qu'un thème paramétré : les couleurs de la
// grammaire sont des constantes de module, et les paramétrer toucherait chaque
// vue. La réécriture les traite là où elles se trouvent, et surtout elle permet
// la seule règle qui compte ici : NE PAS toucher aux symboles.
//
// Un symbole est un <svg> imbriqué. Le vert de Spring Boot et le bleu de
// PostgreSQL sont des couleurs de marque : les inverser produirait des logos
// faux, ce que l'ADR 0002 interdit. Leur pastille claire devient donc une
// vignette claire sur fond sombre — c'est ce que font les jeux AWS et Azure en
// thème sombre, et c'est assumé.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './schema.mjs';
import { contraste, encreLisible } from './couleurs.mjs';

// L'échelle de valeurs est retournée, pas inversée : l'ordre doit être conservé
// — la boîte de base la plus sombre, le nœud de déploiement le plus clair —
// sinon l'emboîtement se lirait à l'envers.
const PALETTE = [
  ['#FFFFFF', '#1B1F24'],   // fond de page et boîte de base
  ['#F3F5F6', '#22272E'],   // externe
  ['#F2F5F6', '#232930'],   // zone
  ['#EDF0F2', '#272D34'],   // matériel
  ['#E7EBEE', '#2A3038'],   // zone imbriquée
  ['#E8ECEF', '#2E353D'],   // acteur
  ['#DFE5E9', '#343C45'],   // nœud de déploiement
  ['#16181A', '#E9EDF0'],   // encre
  ['#5B6873', '#9FADB9'],   // encre douce
  ['#3E444A', '#8A96A2'],   // liseré
  ['#8896A2', '#7B8894'],   // trait de flèche
  ['#E3E7EA', '#2C3238'],   // filets de séparation
  ['#FCFDFD', '#1E2329'],   // fond de carte
  ['#A3196F', '#F26BB2'],   // accent
  ['#0B6E7F', '#4FC3D9'],   // marqueur par défaut
  ['#C0392F', '#FF8A80'],   // marqueur d'alerte
];

// Les encres de couche ont leur variante déclarée dans couches.json.
const { couches } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/couches.json'), 'utf8'));
for (const c of Object.values(couches)) {
  PALETTE.push([c.clair.toUpperCase(), c.sombre]);
  // Les annotations n'emploient pas la couleur de couche brute mais l'encre qui
  // en dérive, assombrie jusqu'à 4,5:1 sur blanc. Pour l'orange « messaging »
  // elle diffère de la couleur d'origine, et une table écrite à la main l'aurait
  // manquée — comme elle a manqué au premier essai.
  PALETTE.push([encreLisible(c.clair, '#FFFFFF', 4.5).toUpperCase(), c.sombre]);
}

const TABLE = new Map(PALETTE.map(([a, b]) => [a.toUpperCase(), b]));

// Réécrit les couleurs au niveau racine seulement : tout ce qui est à
// l'intérieur d'un <svg> imbriqué est un symbole ou un bloc-marque, donc une
// marque, donc intouchable.
export function assombrir(svg) {
  let sortie = '', profondeur = 0, i = 0;
  const re = /<svg\b|<\/svg>/g;
  let m;
  while ((m = re.exec(svg))) {
    const bloc = svg.slice(i, m.index);
    sortie += profondeur <= 1 ? reecrire(bloc) : bloc;
    sortie += m[0];
    profondeur += m[0] === '</svg>' ? -1 : 1;
    i = m.index + m[0].length;
  }
  sortie += profondeur <= 1 ? reecrire(svg.slice(i)) : svg.slice(i);
  return sortie;
}

const reecrire = (s) => s.replace(/#[0-9A-Fa-f]{6}/g, (c) => TABLE.get(c.toUpperCase()) || c);

const vues = fs.readdirSync(path.join(ROOT, 'docs'))
  .filter((f) => f.startsWith('exemple-') && f.endsWith('.svg') && !f.includes('-sombre'));

const CANVAS_SOMBRE = '#1B1F24';

// Le vrai contrôle n'est pas « la table a-t-elle tout couvert » mais « tout
// texte se lit-il ». Les encres d'annotation sont dérivées d'une couleur de
// couche par encreLisible() : elles ne figurent dans aucune table, et une table
// exhaustive serait de toute façon à refaire au premier ajout de couche.
function textesIllisibles(svg) {
  const racine = svg.replace(/<svg\b[\s\S]*?<\/svg>/g, '');
  const mauvais = new Map();
  for (const m of racine.matchAll(/<text[^>]*fill="(#[0-9A-Fa-f]{6})"[^>]*>([^<]{0,40})/g)) {
    const r = contraste(m[1], CANVAS_SOMBRE);
    if (r < 4.5) mauvais.set(m[1], { r, ex: m[2].trim().slice(0, 24) });
  }
  return mauvais;
}

let restes = [];
for (const f of vues) {
  const clair = fs.readFileSync(path.join(ROOT, 'docs', f), 'utf8');
  const sombre = assombrir(clair);
  for (const [c, { r, ex }] of textesIllisibles(sombre)) {
    restes.push(`  ${f} : ${c} sur ${CANVAS_SOMBRE} → ${r.toFixed(2)}:1 (« ${ex} »)`);
  }
  fs.writeFileSync(path.join(ROOT, 'docs', f.replace('.svg', '-sombre.svg')), sombre);
}
if (restes.length) {
  throw new Error(`Textes illisibles en variante sombre (< 4,5:1) :\n${restes.join('\n')}`);
}
console.log(`  ${vues.length} vues en variante sombre`);
