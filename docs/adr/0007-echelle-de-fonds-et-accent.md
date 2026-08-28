# 7. Écarter l'échelle des fonds, et accentuer un sujet par schéma

Date : 2026-08-28

## Statut

Accepté. Complète l'[ADR 0003](0003-grammaire-de-formes.md) sur les fonds, et
applique enfin l'étape 6 de `docs/formes-couleurs-fleches.html`.

## Contexte

Retour d'usage sur les six vues : « les icônes sont belles mais pas assez
visibles, du coup ça fait un peu austère », puis « on distinguerait peut-être
mieux les boîtes entre elles pour une compréhension globale ».

La mesure a confirmé le second point et déplacé le premier. Les neuf formes ne
se séparaient que par deux variables : l'arrondi et le fond. Or les fonds
tenaient dans un mouchoir de poche, mesurés en contraste avec le blanc :

| forme | fond | contraste avec le blanc |
|---|---|---|
| acteur, matériel | `#F8F9FA` | 1,054 : 1 |
| zone | `#F7F9FA` | 1,056 : 1 |
| nœud | `#F4F6F7` | 1,084 : 1 |
| externe | `#EDEFF1` | 1,153 : 1 |

Quatre valeurs sur cinq sous 1,09 : 1. Ce n'est pas un contraste faible, c'est
l'absence de contraste : un vidéoprojecteur ou une impression les rendent tous
en blanc. Elles prétendaient séparer sans séparer. Combinées à des arrondis de
0, 2 et 3 px — indiscernables à l'échelle d'un schéma — deux paires de formes
n'en faisaient qu'une à l'œil : `application` et `acteur` (même `rx`),
`service`, `nœud` et `matériel`.

C'est exactement le principe de *Perceptual Discriminability* de Moody que
`docs/etat-de-l-art-schemas.md` signalait déjà comme notre point faible — mais
seulement pour la palette en deutéranopie. La même faiblesse était à découvert
dans la grammaire de formes, et personne ne l'avait vue.

Second constat, plus embarrassant : notre propre recette dit « ajoutez la
couleur en dernier, pour une seule dimension ». Aucune des six vues n'avait de
sujet accentué. Nous avions écrit la règle sans jamais nous l'appliquer.

## Décision

**1. La valeur du fond code la forme et l'emboîtement.** L'échelle passe de
1,05–1,15 : 1 à 1,09–1,27 : 1, avec une valeur supplémentaire pour une zone
imbriquée dans une autre :

| forme | fond | contraste avec le blanc |
|---|---|---|
| service, application, flux, stockage | `#FFFFFF` | référence |
| zone | `#F2F5F6` | 1,096 : 1 |
| externe | `#F3F5F6` | 1,094 : 1 |
| matériel | `#EDF0F2` | 1,145 : 1 |
| acteur | `#E8ECEF` | 1,188 : 1 |
| zone imbriquée | `#E7EBEE` | 1,201 : 1 |
| nœud | `#DFE5E9` | 1,271 : 1 |

L'emboîtement se lit désormais par la valeur seule : zone claire, zone
imbriquée plus sombre, nœud plus sombre encore, boîtes blanches au fond. Sans
suivre une seule bordure.

**2. Un schéma porte au plus un sujet accentué,** marqué par un liseré et un
titre en `ACCENT` — un magenta `#A3196F` — porté par un liseré de 3,2 px, plus
épais que n'importe quel liseré normal (le nœud, à 2,4 px, compris). C'est le
paramètre `vedette` de `boite()`.

`ACCENT` est une **couleur fonctionnelle, pas une septième couche**. Elle ne dit
que « c'est le sujet de ce schéma », jamais « ceci appartient à tel domaine ».
Elle est donc absente de `couches.json`, et la légende la déclare à part, sous
l'intitulé « sujet du schéma », dès qu'un schéma s'en sert — sinon le lecteur la
cherche parmi les couches.

Le liseré épais n'est pas décoratif, il est **constitutif**. Mesuré en simulation
de Viénot-Brettel-Mollon (1999), ce magenta tombe à **ΔE00 = 1,5 en deutéranopie
et 2,0 en protanopie de la sarcelle `fichiers`** : la même couleur pour environ
8 % des hommes, qui liraient donc l'accent comme une couche — précisément ce
qu'il ne doit pas être. L'épaisseur est la seconde variable qu'exige notre propre
test des niveaux de gris : quand la couleur porte seule, il manque une variable.

**3. `boite()` implémente les neuf formes,** `frontiere` comprise. Elle n'en
connaissait que huit : les zones avaient leur propre géométrie locale dans
`exemples-systeme.mjs`, ce qui explique qu'elles aient gardé leur ancien fond
sans que rien ne le signale. La source des fonds est désormais unique
(`FONDS` dans `scripts/schema.mjs`), et `formes.json` est vérifié contre elle.

## Ce qui a été écarté

- **Grossir le symbole** (34 → 44 px). Mesuré : cela porte le symbole de 12 % à
  20 % de la boîte, sans ajouter aucune variable — cela ne dit toujours rien de
  la couche ni de la forme. Et le cylindre, amputé de 14 px par son ellipse,
  plafonne à 36 px : la grammaire ne peut même pas l'accueillir partout.
- **Remplacer le libellé par le bloc-marque**, et **faire du bloc-marque la
  boîte elle-même**. Les deux détachent le nom de la technologie de son image :
  le bloc-marque ne sait écrire que le nom du produit, jamais celui de
  l'instance — un bucket s'appelle `voltis-factures`, pas `S3`. Mettre
  l'instance en titre reléguait « S3 » en sous-titre, loin de son symbole. Or
  la reconnaissance des logos est une exigence posée dès l'origine.
- **L'encre de la couche comme accent** — la première version de cet ADR. Elle
  avait l'élégance de n'ajouter aucune couleur, mais la relecture des six vues
  l'a réfutée : quatre d'entre elles ont un sujet d'infrastructure, dont l'encre
  est une ardoise presque neutre. L'accent y était invisible, et notamment
  incapable de distinguer un nœud de ses jumeaux — même forme, même couche.
- **Le poids seul**, sans couleur. Fonctionne dans toutes les couches et
  n'ajoute rien à la palette, mais jugé trop discret à l'usage.
- **Teinte de couche et poids combinés.** Passe les deux cas, mais fait dépendre
  la visibilité de l'accent de la couche du sujet : sur une vue mono-couche il
  retombe sur le poids seul, avec le même défaut.

## Conséquences

- Les six vues changent d'aspect sans changer de contenu.
- Le test des niveaux de gris reste valide, et cesse d'être une tautologie :
  la structure survivait jusqu'ici parce que tout était neutre ; elle survit
  désormais parce que la valeur porte réellement l'information.
- **Le jeu compte désormais sept couleurs, dont six seulement sont des
  couches.** C'est le prix payé : `ACCENT` ne signifie rien par lui-même, il
  s'apprend. La légende le compense en le nommant, et son emploi est plafonné à
  une boîte par schéma — au-delà, il cesse de désigner quoi que ce soit.
- L'accent fonctionne quelle que soit la couche du sujet, y compris sur une vue
  entièrement d'infrastructure, et distingue un nœud de ses jumeaux.
- Une troisième planche garde la trace de cet arbitrage :
  `docs/rendus-accent.svg`, qui juge chaque option sur les deux cas qui les
  départagent.
- Deux planches d'arbitrage gardent la trace du raisonnement :
  `docs/rendus-candidats.svg` (sept rendus sur les neuf formes) et
  `docs/rendus-fonds.svg` (la variable isolée, avec le test du flou).
