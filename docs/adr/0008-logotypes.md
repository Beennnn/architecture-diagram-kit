# 8. Un logotype n'écrit pas son nom deux fois

Date : 2026-08-29

## Statut

Accepté. Amende l'[ADR 0002](0002-reutiliser-les-logos-existants.md), qui pose
le bloc-marque comme « signe + nom » sans prévoir le cas où le signe *est* le
nom.

## Contexte

Le catalogue est passé de 40 à 78 produits. Ce qui tenait sur 90 badges s'est
mis à sauter aux yeux sur 163 : trois marques du jeu — `.NET`, `Go`, `vmware` —
n'ont pas de symbole. Elles **écrivent** le nom, un point c'est tout. Le
bloc-marque leur accolait donc notre libellé, et le nom apparaissait deux fois
dans la même pastille : « .NET » à côté de « .NET ».

Ce n'est pas du codage double. Moody demande un signe **et** un texte, deux
canaux de lecture différents ; deux textes n'en font qu'un, plus large.

L'inventaire s'est fait à l'œil, sur les 83 marques officielles agrandies, après
une tentative de détection automatique — compter les sous-tracés — qui a échoué :
la chouette de Jaeger en compte 31 sans écrire quoi que ce soit, tandis que `go`
et `mysql` n'entrent pas dans les seize premières.

Le tri a déplacé le diagnostic initial. Les cas mixtes — une marque qui porte un
symbole **et** son lettrage — ne sont pas des doublons **à nos tailles** :

| marque | encre | lettrage à 30 px | verdict |
|---|---|---|---|
| `.NET` | 24 × 8,9 | 11 px, lisible | logotype |
| `Go` | 24 × 9,0 | 11 px, lisible | logotype |
| `vmware` | 24 × 3,8 | 4,7 px, illisible | logotype |
| `MySQL` | 24 × 16,3 (dauphin + mot) | ~7 px, illisible | mixte |
| `Helm` | 20,8 × 24 (roue + mot) | ~2,7 px, illisible | mixte |

Et c'est en mesurant qu'une seconde chose est apparue : **`vmware` était déjà
illisible avant qu'on retire le mot.** Inscrite dans le carré du `viewBox`, une
bande de 24 × 3,8 unités s'écrit en 4,7 px de haut dans une pastille de 48. On
gardait le mot parce que la marque ne parlait pas. Retirer le mot sans traiter
cela aurait supprimé le doublon en supprimant l'information.

## Décision

**1. Une entrée peut se déclarer `"logotype": true`.** Elle signifie : la marque
écrit le nom et ne montre rien d'autre. Le bloc-marque est alors la marque
seule, dans les trois dispositions. Le build refuse d'y reposer le mot — il
compare le nombre de tracés de la sortie à celui de la marque source.

**2. Une marque se pose par son encre, pas par son viewBox.**
`scripts/boite-encre.mjs` mesure le rectangle réellement noirci en aplatissant
le tracé — courbes échantillonnées, arcs ramenés à leur forme centrale (SVG 1.1,
F.6.5). Un logotype est ensuite posé à la **hauteur de capitale qu'avait le mot
qu'il remplace** : le nom garde sa taille optique, et la pastille s'élargit
d'autant. `vmware` passe de 4,7 à 14 px de lettrage, dans une pastille de 122 px
là où le doublon en faisait 123.

**3. Le lettrage d'une marque mixte ne compte pas.** Une marque qui porte un
symbole garde son libellé, même si elle écrit aussi son nom : à 30 px, ce
lettrage-là est illisible, donc il ne double rien. Le mot y travaille.

## Ce qui a été écarté

- **Détecter les logotypes automatiquement**, par le nombre de sous-tracés ou la
  part d'encre. Aucun seuil ne sépare la chouette de Jaeger du mot « vmware ».
  La déclaration est éditoriale, et l'assume : elle est dans `produits.json`, à
  côté du choix de la marque.
- **Ne pas générer de bloc-marque pour un logotype**, sous prétexte que la
  marque en tient lieu. Cela aurait troué le catalogue : chaque slug a ses
  quatre fichiers, et un consommateur qui itère sur les entrées n'a pas à
  connaître l'exception.
- **Poser la marque à la taille du signe (30 px) plutôt qu'à celle du mot.**
  Correct pour une marque carrée, faux pour une bande : `.NET` et `GO` seraient
  passés à 30 px de lettrage, deux fois plus gros que le mot d'un badge voisin.
  La hauteur de capitale est ce qui garde la série homogène.
- **Ajuster l'encre de toutes les marques, et pas seulement des logotypes.**
  Sans effet : Simple Icons normalise déjà chaque marque au carré, donc pour
  toute marque aussi haute que large l'ajustement retombe sur l'inscription
  actuelle. Seule une bande y gagne — et une bande, ici, c'est un logotype.
- **Élargir aussi `symboles/`.** Le carré ne s'élargit pas, c'est sa raison
  d'être (« place contrainte »). Le logotype y est simplement posé par son
  encre, ce qui lui rend la largeur utile du carré sans en changer le format.

## Conséquences

- Trois entrées sur 163 suivent cette règle. Elle est déclarée, pas devinée.
- `scripts/boite-encre.mjs` est une primitive réutilisable : elle mesure les 83
  marques sans erreur, ce qui a été vérifié à l'œil, témoin superposé.
- Le chemin `annotation()` — une flèche annotée par un logotype — existe et
  fonctionne, mais **aucune vue du dépôt ne l'exerce** et aucun garde-fou ne le
  protège. C'est la dette connue de cette décision.
- `docs/checklist-relecture-schema.md` reste inchangée : la règle s'applique au
  bloc-marque, pas à la relecture d'un schéma.
