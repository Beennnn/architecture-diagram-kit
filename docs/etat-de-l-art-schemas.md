# Ce que la recherche dit des schémas

> Version mise en page : [`etat-de-l-art-schemas.html`](etat-de-l-art-schemas.html)
> (à ouvrir dans un navigateur — GitHub ne rend pas le HTML).

Il existe une littérature sur la conception des notations visuelles, et elle est
largement ignorée de ceux qui font des schémas. Son résultat le plus constant :
**ce qui décide de la lisibilité d'un schéma n'est presque jamais ce sur quoi on
passe du temps.**

---

## 1. Le cadre de référence — Moody, *The "Physics" of Notations* (2009)

L'article fondateur, toujours sans concurrent sérieux. Moody part d'un constat
sévère : en génie logiciel, l'effort de conception d'une notation porte quasi
exclusivement sur la *sémantique*, et la forme graphique est traitée en fin de
course, au jugé. La discipline a des méthodes matures pour évaluer une
sémantique, et aucune pour évaluer une syntaxe visuelle.

Neuf principes, dont quatre nous concernent directement :

| Principe | Énoncé |
|---|---|
| **Dual Coding** | Texte et graphique ensemble sont plus efficaces que l'un ou l'autre seul |
| **Graphic Economy** | Le nombre de symboles distincts doit rester dans les limites de la discrimination humaine |
| **Perceptual Discriminability** | Deux symboles doivent être séparés par une *distance visuelle* mesurable |
| **Semantic Transparency** | La forme du symbole doit suggérer son sens à qui ne l'a jamais vu |

**Ce qu'on en tire.** Deux décisions déjà prises trouvent ici leur justification
théorique. *Dual Coding* valide le bloc-marque — signe **et** nom, pas l'un ou
l'autre. *Graphic Economy* valide les six couleurs de couche plutôt que
trente-deux ([ADR 0001](adr/0001-six-couleurs-de-couche.md)).

**Où le jeu est faible.** *Perceptual Discriminability* est le principe que notre
palette enfreint : en deutéranopie, `web` et `api` ont une distance visuelle
nulle. L'ADR 0001 l'assume au motif que le nom porte l'information — ce qui est
précisément l'argument *Dual Coding*. Il faut le dire ainsi : nous compensons
une faiblesse par un autre principe, nous ne la corrigeons pas.

---

## 2. Ce que l'empirique a mesuré — Purchase et al.

Là où Moody théorise, Purchase mesure. Une série d'expériences sur des
diagrammes de classes UML fait varier cinq propriétés de mise en page et mesure
la compréhension réelle : exactitude, temps, effort visuel.

Le résultat n'a pas bougé depuis vingt-cinq ans : **minimiser les croisements
d'arêtes est de très loin la propriété la plus importante** — « by far the most
important » — devant la symétrie, la résolution angulaire et l'orthogonalité.

> **Ce qu'on en tire.** Redessiner la disposition pour supprimer trois
> croisements fait plus pour la lisibilité que tout le travail d'iconographie
> réuni. Nos bloc-marques ne rachèteront jamais un graphe mal posé.

### La notation secondaire — Petre (1995)

Ce qui distingue l'expert du novice n'est pas la connaissance de la notation,
mais la maîtrise de la **notation secondaire** : l'alignement, les blancs, le
regroupement spatial — tout ce qui n'est défini par aucune sémantique formelle
et que l'auteur produit souvent sans y penser.

Conséquence contre-intuitive : **aligner les boîtes qui vont ensemble, et
séparer par du blanc celles qui n'ont rien à voir, est un acte sémantique.** Le
lecteur le décodera, que vous l'ayez voulu ou non. Un alignement accidentel ment.

---

## 3. Pourquoi le nom doit toucher le signe

Le résultat le plus solidement établi ici, parce qu'il repose sur une
méta-analyse et non sur une étude isolée.

Le **principe de contiguïté spatiale** : on apprend mieux quand les mots et les
images qui se rapportent l'un à l'autre sont proches spatialement. Son revers,
l'**effet de partage attentionnel**, mesure la dégradation causée par la
nécessité d'intégrer mentalement des sources séparées.

Méta-analyse à effets aléatoires, 58 comparaisons indépendantes (n = 2 426) :
**g = 0,63** (p < 0,001) — effet moyen à fort.

Nuance : l'effet est conditionné par la **complexité du matériau**. Sur un
contenu simple, la proximité change peu ; sur un contenu à forte interactivité
entre éléments — ce qu'est un schéma d'architecture — l'effet est fort.

> **Ce qu'on en tire.** Une légende en marge qui associe une couleur à une
> couche **impose** un partage attentionnel. Le nom écrit dans la pastille le
> supprime. C'est la justification empirique du choix « étiquette » contre
> « symbole seul », et elle est plus forte que l'argument esthétique.

---

## 4. Le consensus pratique — C4, arc42, Views & Beyond

L'apport principal du modèle C4 n'est pas graphique : c'est l'**abstraction-first**,
l'idée qu'on choisit d'abord le niveau d'abstraction — contexte, conteneur,
composant, code — et qu'un schéma n'en mélange jamais deux.

Fait souvent mal compris : **C4 est délibérément indépendant de la notation.**
Il ne prescrit ni forme, ni couleur, ni style de flèche. Il pose une seule
exigence de forme, absolue : **tout schéma doit porter une clé / légende**
expliquant la notation employée.

Le reste du consensus, identique chez arc42 et dans *Documenting Software
Architectures* du SEI :

- un **titre** sur chaque schéma, qui dit le type et la portée ;
- chaque élément porte un **nom**, un **type**, une **technologie** et une
  **phrase** de description ;
- chaque flèche est **orientée** et **nommée** — « lit les commandes dans », pas
  « utilise » ;
- **aucun acronyme non explicité** ;
- le schéma se comprend **seul**, sans son auteur à côté.

> **Ce qu'on en tire.** Notre jeu sert le point « technologie » — c'est
> exactement ce qu'encode un bloc-marque. Mais il ne dispense d'aucune des
> autres règles, et surtout pas de la légende : nos six couleurs de couche sont
> une convention que le lecteur ne peut pas deviner.

---

## 5. La conséquence pour draw.io

La question paraît technique. Elle est tranchée par la section 3, et la réponse
est l'inverse de l'intuition.

Nos bloc-marques ont le **texte vectorisé** — autonomes, identiques partout,
sans police à installer. C'est la bonne réponse pour une planche, un README,
une diapositive, un fichier Figma : des contextes **sans couche de composition**.

**Dans draw.io, c'est la mauvaise réponse**, parce que draw.io *sait* composer.

| Propriété | Nom cuit dans le SVG | Nom rendu par draw.io |
|---|---|---|
| Recherche Ctrl+F | non | **oui** |
| Modifiable sur place | non | **oui** — « HTTPS :8443 » |
| Texte réel à l'export | non, des courbes | **oui**, lisible par lecteur d'écran |
| Suit la police du schéma | non | **oui** |
| Rendu identique partout | **oui** | dépend des polices disponibles |
| Utilisable hors outil | **oui** | non |

**Construction proposée** : une bibliothèque `.xml` draw.io — un nœud
`<mxlibrary>` contenant un tableau JSON — dont chaque entrée porte le
**symbole seul** (`symboles/`) en `data:image/svg+xml;base64`, plus un `title`
qui devient le libellé et un `style` qui fixe la couleur de couche en
`fontColor`. Deux bibliothèques séparées, protocoles et produits, pour que le
sélecteur reste navigable.

> **Ce qu'on en tire.** Les deux jeux ne se concurrencent pas, ils servent deux
> contextes. **draw.io compose** → on lui donne le signe, il écrit le nom.
> **Une diapositive ne compose pas** → on lui donne le bloc-marque cuit. Le
> dépôt produit déjà les deux.

---

## Sources

- **Daniel L. Moody**, « The "Physics" of Notations: Toward a Scientific Basis
  for Constructing Visual Notations in Software Engineering », *IEEE
  Transactions on Software Engineering* 35(6), 2009, p. 756–779.
  [Semantic Scholar](https://www.semanticscholar.org/paper/The-%E2%80%9CPhysics%E2%80%9D-of-Notations:-Toward-a-Scientific-for-Moody/bcd2c5379a34068040750a751e4fd2710d90c15c) ·
  [ACM](https://dl.acm.org/doi/abs/10.1145/1810295.1810442)
- **Purchase, McGill et al.**, graph drawing aesthetics et compréhension des
  diagrammes UML.
  [Semantic Scholar](https://www.semanticscholar.org/paper/527ca0518fca9efdbea27c8a3289a4c8d67e22f6) ·
  [Empirical Software Engineering](https://link.springer.com/article/10.1023/A:1016344215610) ·
  [État de l'art des évaluations utilisateur (PDF)](https://eprints.gla.ac.uk/227646/1/227646.pdf)
- **Marian Petre**, « Why Looking Isn't Always Seeing: Readership Skills and
  Graphical Programming », *CACM* 38(6), 1995.
  [PDF](http://www.cs.toronto.edu/~chechik/courses18/csc2125/paper12.pdf) ·
  [ACM](https://dl.acm.org/doi/abs/10.1145/203241.203251)
- **Schroeder & Cenkci**, « Spatial Contiguity and Spatial Split-Attention
  Effects in Multimedia Learning Environments: a Meta-Analysis », *Educational
  Psychology Review*, 2018.
  [Springer](https://link.springer.com/article/10.1007/s10648-018-9435-9) ·
  [Cambridge Handbook, chap. split-attention](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/splitattention-principle-in-multimedia-learning/497A2FCB9737E3009B3CF0E4D97F7B99)
- **Simon Brown**, modèle C4. [c4model.com](https://c4model.com/) ·
  [notation](https://c4model.com/diagrams/notation) ·
  [présentation InfoQ](https://www.infoq.com/articles/C4-architecture-model/)
- **Format des bibliothèques draw.io**.
  [Documentation](https://www.drawio.com/doc/faq/format-custom-shape-library) ·
  [jgraph/drawio-libs](https://github.com/jgraph/drawio-libs)

Pour aller plus loin : Larkin & Simon, *Why a Diagram is (Sometimes) Worth Ten
Thousand Words* (1987) · Bertin, *Sémiologie graphique* (1967) · Cleveland &
McGill (1984) · Ware, *Information Visualization: Perception for Design* ·
Green & Petre, *Cognitive Dimensions of Notations* (1996).
