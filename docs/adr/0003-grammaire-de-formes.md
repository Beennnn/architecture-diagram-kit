# 0003 — Une grammaire de formes, normative et fermée

- **Statut** : acceptée
- **Date** : 2026-08-28

## Contexte

Le dépôt fournit des badges, c'est-à-dire des **signes**. Un signe dit *quel*
objet on regarde. Il ne dit pas *de quelle sorte* d'objet il s'agit : un badge
PostgreSQL sur un rectangle et le même badge sur un cylindre ne racontent pas la
même chose.

Sans grammaire de formes explicite, chaque auteur invente la sienne, et le
corpus de schémas cesse d'être lisible d'un schéma à l'autre — le lecteur
réapprend la notation à chaque page.

Moody décrit ce phénomène comme le point aveugle de la discipline : l'effort
porte sur la sémantique, la syntaxe visuelle est traitée en fin de course, au
jugé, et aucune méthode ne l'évalue.

## Décision

Une grammaire de **huit formes**, décrite dans [`formes.json`](../../formes.json)
et opposable : le build échoue si une entrée référence une forme absente.

| Forme | Nature codée | Géométrie |
|---|---|---|
| `service` | un composant qui exécute du code | rectangle à angles vifs |
| `application` | une chose avec laquelle on interagit directement | rectangle arrondi |
| `stockage` | une donnée qui survit au redémarrage | cylindre |
| `flux` | une file, un sujet, un bus | capsule |
| `acteur` | un humain, ou le poste par lequel il agit | rectangle arrondi, fond gris clair |
| `materiel` | un appareil physique hors du SI | rectangle à coins vifs, fond gris clair |
| `externe` | un système hors de notre contrôle | rectangle arrondi, trait pointillé |
| `frontiere` | une zone : réseau, confiance, déploiement, contexte | cadre en pointillés |

### Les huit règles

**R1 — La forme code la nature, jamais autre chose.** Ni l'importance, ni
l'état, ni le propriétaire, ni la criticité. Un composant critique n'a pas une
forme particulière : il a une taille, une position, ou un accent de couleur.

**R2 — Une nature, une forme, sur tout le corpus.** Pas seulement à l'intérieur
d'un schéma. C'est le principe de *clarté sémiotique* de Moody : la
correspondance entre symbole et concept doit être bijective. Deux formes pour un
même concept (*redondance*) ou une forme pour deux concepts (*surcharge*) sont
les deux anomalies les plus coûteuses pour le lecteur.

**R3 — Huit formes, et pas une de plus.** Ajouter une forme suppose d'en retirer
une. C'est le principe d'*économie graphique* : le nombre de symboles
graphiquement distincts doit rester dans les limites de la discrimination
humaine. Au-delà, le lecteur retourne à la légende à chaque objet.

**R4 — La forme prime sur la couleur.** Tout schéma doit rester lisible
désaturé. La forme survit au noir et blanc, au daltonisme et au vidéoprojecteur ;
la couleur non. C'est aussi ce qui rend acceptable la faiblesse assumée de la
palette dans l'[ADR 0001](0001-six-couleurs-de-couche.md).

**R5 — Toute forme non universelle va en légende.** Le cylindre pour un stockage
et le personnage pour un acteur sont acquis — leur *transparence sémantique* est
suffisante pour se passer d'explication. La distinction entre `service` et
`application`, elle, est une convention : elle s'explique.

**R6 — Les frontières s'emboîtent ou se séparent, jamais ne se chevauchent.**
Le cadre exploite la *région commune*, le regroupement perceptif le plus fort —
plus fort que la proximité, plus fort que la similarité. Deux cadres qui se
recoupent détruisent ce signal au lieu de l'employer.

**R7 — Forme et libellé, toujours les deux.** Le *double codage* établit que le
texte et le graphique ensemble sont plus efficaces que l'un ou l'autre seul. Une
forme sans nom n'est pas un raccourci, c'est une devinette.

**R8 — Trois formes sont explicitement écartées.** Voir ci-dessous.

### Formes écartées, et pourquoi

| Forme | Motif |
|---|---|
| **Losange** | Une décision n'existe pas dans une vue d'architecture. Le losange appartient au logigramme ; l'importer mélange deux niveaux d'abstraction. |
| **Nuage** | Ambigu : il veut dire « internet », « fournisseur cloud » ou « je ne sais pas » selon le lecteur. C'est une *surcharge de symbole* au sens de R2. Employer `externe`. |
| **Hexagone** | Aucune signification établie. Il concurrence `flux` sans rien apporter, et consomme un budget de forme au sens de R3. |

## Justification

La forme est la variable visuelle la plus **sous-employée** des schémas
d'architecture, et c'est un gâchis : elle est gratuite, elle se retient, elle
survit à la photocopie et au daltonisme. Beaucoup de schémas n'emploient que des
rectangles et font ensuite porter tout le sens à la couleur — la plus fragile
des deux variables.

La rendre normative plutôt qu'indicative est ce qui la rend utile : une
convention que chacun peut réinterpréter n'est pas une convention.

## Conséquences

- Chaque entrée de `produits.json` et `roles.json` porte un champ `forme`. Le
  build vérifie qu'elle existe dans `formes.json` et s'arrête sinon.
- `protocoles.json` n'en porte pas : un protocole annote une **flèche**, il n'est
  pas un nœud.
- [`scripts/exemple.mjs`](../../scripts/exemple.mjs) applique la grammaire ; le
  schéma [`exemple-voltis.svg`](../exemple-voltis.svg) en est la démonstration
  exécutable et sert de test de non-régression visuelle.
- Ajouter une neuvième forme demande un nouvel ADR qui remplace celui-ci.

## Alternatives écartées

- **Ne pas normer la forme, se contenter du guide.** Rejeté : c'est l'état de
  départ, et il produit un corpus où chaque schéma a sa propre notation.
- **Reprendre la notation UML telle quelle.** Rejeté : UML échange la simplicité
  contre l'exhaustivité, et l'exhaustivité n'est pas notre problème. C4 fait le
  choix inverse et ne prescrit aucune forme — ce vide est précisément ce que cet
  ADR comble, sans contredire C4.
- **Coder la criticité par la forme** (par exemple un octogone pour « critique »).
  Rejeté par R1 : la forme serait alors surchargée de deux dimensions, et le
  schéma perdrait la capacité de dire de quelle sorte d'objet il s'agit.

## Sources

Voir [l'état de l'art](../etat-de-l-art-schemas.md) pour les références
complètes — Moody (*The "Physics" of Notations*, IEEE TSE 2009) pour la clarté
sémiotique, l'économie graphique, la transparence sémantique et le double
codage ; la psychologie de la forme pour la région commune ; le modèle C4 pour
l'exigence de légende.
