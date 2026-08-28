# 0001 — Six couleurs de couche, imposées, plutôt qu'une couleur par protocole

- **Statut** : acceptée
- **Date** : 2026-08-28

## Contexte

Le jeu couvre 32 protocoles. Deux stratégies de couleur s'offraient :

1. **Générer** une couleur par protocole, en cherchant à les rendre toutes
   discernables les unes des autres.
2. **Restreindre** à un petit nombre de couleurs imposées, chacune attachée à
   une catégorie de protocoles.

## Décision

**Six couleurs, imposées par couche** — Web & temps réel, API, Fichiers,
Messages & mail, Accès & sécurité, Infrastructure. Un protocole n'a pas de
couleur propre : il hérite de celle de sa couche.

Les valeurs retenues, inchangées :

| Couche | Clair | Sombre |
|---|---|---|
| Web & temps réel | `#1B5FD9` | `#6FA6FF` |
| API | `#7038D8` | `#B08CFF` |
| Fichiers | `#0B7A6E` | `#43C9B8` |
| Messages & mail | `#B36208` | `#F0A64B` |
| Accès & sécurité | `#C0392F` | `#FF8A80` |
| Infrastructure | `#4C5A66` | `#A3B3C0` |

Une exception, traitée dans [0002](0002-reutiliser-les-logos-existants.md) :
lorsqu'un logo de marque officiel est employé, il conserve **sa** couleur.

## Justification

**La couleur catégorielle a une capacité dure.** Au-delà de six à huit teintes,
un lecteur ne les reconnaît plus : il les cherche dans la légende à chaque
occurrence. L'encodage cesse de fonctionner et ne subsiste que comme
décoration.

**Avec 32 couleurs, plus rien n'est un groupe.** Si chaque protocole a la
sienne, la couleur ne dit plus « ceci relève du messaging » — elle ne fait que
redire ce que le nom écrit déjà à côté.

**Le jeu doit rester extensible.** Ajouter QUIC avec six couches revient à
choisir « Réseau ». Avec 32 couleurs, il faudrait trouver une 33ᵉ teinte
discernable des 32 autres — ce qui n'existe pas.

## Conséquences

### Assumée : la palette n'est pas sûre en dichromatie

Écarts perceptuels CIEDE2000, avec simulation de dichromatie
(Viénot, Brettel & Mollon, 1999) :

| | Vision normale | Pire des trois visions |
|---|---|---|
| Palette retenue | ΔE00 = **14,7** | ΔE00 = **0,1** |

En deutéranopie — environ 6 % des hommes — `web` et `api` sont **strictement
la même couleur**. `messaging` et `acces` tombent à 4,0.

Cette conséquence est **acceptée**, pour une raison précise : dans ce jeu, la
couleur est **redondante**. Chaque bloc-marque porte son nom écrit. Un lecteur
qui ne distingue pas le bleu du violet lit quand même « HTTP » et « REST » sans
ambiguïté. Le critère WCAG 1.4.1 — ne jamais faire porter l'information par la
seule couleur — est satisfait par le texte, pas par la palette. La couleur ne
sert qu'à regrouper au premier coup d'œil.

**Cette décision devient invalide si l'usage bascule vers `symboles/`** — les
signes sans nom. Là, la couleur redeviendrait le seul canal, et il faudrait
reprendre cette ADR.

### Autres conséquences

- Une légende de six entrées, transmissible à qui n'a pas le catalogue.
- Toute nouvelle famille de protocoles doit être rattachée à une couche dans
  `scripts/couches.json` ; le build échoue sur une famille orpheline.

## Alternatives écartées

Quatre palettes ont été calculées et mesurées avant de trancher.

| Alternative | ΔE00 garanti (3 visions) | Motif du rejet |
|---|---|---|
| 6 teintes vives, optimum brut | 14,1 | Quatre magentas, aucun vert : l'ancrage sémantique disparaît |
| 6 teintes, ancrage sémantique conservé | 20,7 | Palette délavée, « accès » devient brun — coût esthétique pour 100 % des lecteurs |
| 6 teintes, seule `api` déplacée | 4,4 | Déplace simplement la collision de `web`/`api` vers `messaging`/`acces` |
| 5 catégories | 16,7 | Fusion de couches, perte de granularité |
| 4 catégories | 18,8 | Deux fusions ; reste l'option si l'usage bascule vers `symboles/` |

**Conclusion de la mesure : six teintes à la fois vives, sémantiquement
ancrées et sûres en dichromatie n'existent pas.** L'orange et le rouge
fusionnent, le bleu et le violet fusionnent. Il faut renoncer à l'une des trois
propriétés — nous renonçons à la troisième, parce que le texte la compense.
