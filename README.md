# logo-libres — badges et schémas

Deux choses, qui vont ensemble :

1. **Un jeu de bloc-marques** homogène et libre de droits pour les protocoles
   réseau et les technologies — SSH, HTTP, MQTT, Kafka, PostgreSQL, Kubernetes…
2. **De quoi bien s'en servir** : l'état de l'art de la recherche sur les
   schémas, une checklist de relecture, et les décisions de conception avec
   leur justification.

Le second point n'est pas de l'ornement. La littérature est constante sur un
point : **ce qui décide de la lisibilité d'un schéma n'est presque jamais ce
sur quoi on passe du temps** — un croisement de flèches supprimé vaut plus que
toute l'iconographie du monde. Les badges ne servent à rien sur un schéma mal
posé.

## Le problème

SSH, HTTP, FTP, REST, SMTP, DNS **n'ont pas de logo officiel.** Ce sont des
spécifications (RFC, W3C, IETF), pas des marques. Chercher « le logo FTP » ne
donnera jamais un résultat homogène : il n'existe pas.

L'homogénéité vient donc d'une convention appliquée partout, pas d'une chasse
aux logos.

## Vocabulaire

| Terme (EN) | Terme (FR) | Ce que c'est |
|---|---|---|
| wordmark, logotype | logotype | le nom seul, dessiné en typo |
| logomark, symbol | symbole, picto | le signe seul, sans texte |
| **lockup** | **bloc-marque** | l'assemblage figé signe + nom, dans une disposition constante |
| icon, pictogram | icône, picto | un signe fonctionnel, pas identitaire |

Ce dépôt produit des **bloc-marques** : un signe et un nom verrouillés
ensemble. Ce ne sont pas des logos — on ne construit aucune identité de
marque — mais des repères de lecture pour un schéma.

## Trois populations

- **Protocoles** (`protocoles.json`) — 32 spécifications : HTTP, SSH, MQTT…
- **Produits** (`produits.json`) — 25 technologies nommées : Java, Kafka,
  PostgreSQL, Kubernetes, Redis, nginx, Terraform…
- **Rôles** (`roles.json`) — 25 fonctions d'infrastructure : répartiteur de
  charge, cache, bastion, passerelle d'API… Un rôle décrit ce qu'une brique
  **fait**, indépendamment du produit qui l'implémente : « cache », pas
  « Redis ». C'est ce qui permet de dessiner un schéma avant d'avoir choisi la
  technologie.

## Grammaire de formes

Huit formes, normatives et fermées — `service`, `application`, `stockage`,
`flux`, `acteur`, `materiel`, `externe`, `frontiere`. La forme code la **nature**
d'un objet, jamais son importance ni son état. Définies dans
[`formes.json`](formes.json), le build échoue sur une forme inconnue. Les huit
règles et leur justification : [ADR 0003](docs/adr/0003-grammaire-de-formes.md).

## Trois niveaux de signe

**Règle : on emploie le logo officiel dès qu'il existe et qu'il est
redistribuable.** Un logo connu se lit sans légende — l'éléphant PostgreSQL ou
la roue Kubernetes sont identifiés instantanément, ce qu'aucun picto générique
ne peut égaler.

| Niveau | Quand | Signe | Couleur |
|---|---|---|---|
| **1 — logo officiel** | il existe et désigne bien l'objet | le logo | sa couleur de marque |
| **2 — substitut ouvert** | la marque n'est pas redistribuable | le logo du substitut de référence | celle du substitut |
| **3 — picto** | rien de disponible | un picto Tabler | celle de la couche |

Deux substitutions documentées : **Java** emploie le logo **OpenJDK** (le logo
Java est une marque Oracle), **S3** emploie le picto `bucket` (AWS ne
redistribue pas ses marques) — « bucket » étant le vocabulaire même de S3.

Six protocoles seulement portent leur logo, parce que là la marque **est** le
protocole : GraphQL, MQTT, XMPP, RSS, BitTorrent, IPFS. Sept autres logos du
catalogue (RabbitMQ, WireGuard, OpenSSL, Socket.io, OpenAPI, XML, JWT) sont
conservés en référence mais **jamais employés comme signe de protocole** : ce
sont des *implémentations*, et utiliser RabbitMQ pour AMQP désignerait un
standard par un produit. Ils redeviennent légitimes ajoutés à
`produits.json`.

## Ce que la CI vérifie

Un workflow relance `./regenerer.sh` sur chaque proposition, puis vérifie que
l'arbre git est resté propre. Cette seconde vérification est la plus utile :
elle prouve que la sortie versionnée correspond exactement à ses sources. Sans
elle, un fichier généré modifié à la main passerait sans que personne le sache.

La régénération porte au passage tous les garde-fous du dépôt — unicité des
pictos, hauteur minimale d'un cylindre, étiquette qui recouvre une boîte,
description qui déborde, légende posée sur un nœud, texte illisible en variante
sombre, concordance de `formes.json` avec `FONDS`, fond de la grammaire absent
d'une bibliothèque. Chacun fait échouer la génération, donc rougir la CI.

## Quatre dispositions

| Dossier | Format | Usage |
|---|---|---|
| `symboles/` | le signe seul · 48 × 48 | **défaut dans un schéma** — dans une boîte, ou sur une flèche avec son nom à côté |
| `lockups/horizontal/` | signe à gauche, nom à droite · 48 px de haut | hors schéma — une diapositive, un README, une page web |
| `lockups/empile/` | signe au-dessus, nom dessous · 84 px de haut | une grille de logos, un pied de page |
| `lockups/mono/` | horizontal, encre unique | impression N&B, schéma déjà colorié |

**Le bloc-marque n'annote pas une flèche.** Il fait environ 150 px pour des
flèches qui en font 82 : posé dessus il déborde sur les boîtes, posé au-dessus
il flotte sans qu'on sache à quelle flèche il appartient. Une flèche s'annote
avec le symbole et le nom posés *sur* le trait, qui s'interrompt derrière eux —
voir [`docs/rendus-fleches.svg`](docs/rendus-fleches.svg) pour l'arbitrage, et
`annotation()` dans `scripts/schema.mjs` pour la primitive.

Ces fichiers sont **autonomes** : couleurs en dur, texte vectorisé, aucune
dépendance. Glissez-les dans Figma, une diapositive, un README, une page web.

### draw.io

N'importez pas `lockups/` dans draw.io — **installez les bibliothèques** :
`File ▸ Open Library from ▸ Device…` puis `drawio/protocoles.xml`,
`drawio/produits.xml`, `drawio/roles.xml` et surtout `drawio/grammaire.xml`,
qui porte les neuf formes, leurs fonds, l'accent et la flèche annotée.

Elle livre le **signe seul**, et draw.io écrit le nom lui-même comme étiquette.
Le libellé reste ainsi cherchable (`Ctrl+F`), modifiable sur place
(« HTTPS :8443 ») et exporté comme du vrai texte. Détails :
[`drawio/README.md`](drawio/README.md) · raisonnement :
[l'état de l'art](docs/etat-de-l-art-schemas.md#5-la-conséquence-pour-drawio).

### Excalidraw — voie secondaire

`excalidraw/badges.excalidraw` est une **scène** à ouvrir puis copier-coller :
le format de bibliothèque d'Excalidraw ne transporte pas d'images.

Gardez les `.excalidraw` **dans le dépôt git** plutôt que dans le cloud
d'Excalidraw : le format est du JSON simple, l'éditeur gratuit et le greffon
VS Code les ouvrent en place, et la limite d'une seule scène du plan gratuit ne
se déclenche jamais. Pourquoi cette voie existe et ce qu'elle coûte :
[ADR 0004](docs/adr/0004-excalidraw-voie-secondaire.md).

## Comment la couleur est calculée

Le fond n'est pas une part fixe de la teinte. Une part fixe donne des pastilles
de poids très inégal — à 14 %, le noir de BitTorrent tombe à 0,72 de luminance
quand l'orange de RSS reste à 0,90. Chaque fond est donc **calé sur la même
luminance** (0,87) : l'écart sur les 32 passe de 0,184 à 0,012.

L'encre est ensuite assombrie jusqu'à **3,5:1 de contraste** sur son propre
fond. C'est ce qui rend lisibles des marques claires comme RSS ou IPFS sans
toucher aux marques sombres.

Six couches portent la couleur des pictos — Web & temps réel, API, Fichiers,
Messages & mail, Accès & sécurité, Infrastructure. **Six teintes, pas
trente-deux** : une légende de six entrées se retient. Le raisonnement complet,
mesures de dichromatie comprises, est dans
l'[ADR 0001](docs/adr/0001-six-couleurs-de-couche.md).

## Structure

```
protocoles.json           source de vérité : 32 protocoles
produits.json             source de vérité : 78 produits
roles.json                source de vérité : 53 rôles
formes.json               la grammaire de formes
scripts/couches.json      les 6 couches colorées
docs/                     état de l'art, checklist, décisions (ADR)
regenerer.sh              reconstruit tout depuis npm

lockups/horizontal/       163 SVG · disposition par défaut
lockups/empile/           163 SVG · nœud de schéma
lockups/mono/             163 SVG · encre unique
symboles/                 163 SVG · signe seul

drawio/protocoles.xml     bibliothèque de formes draw.io · 32
drawio/produits.xml       bibliothèque de formes draw.io · 25
drawio/roles.xml          bibliothèque de formes draw.io · 25

sources/tabler/           glyphes bruts · MIT
sources/lucide/           glyphes bruts · ISC
sources/marques/          logos de marque bruts · CC0

mapping.csv / .json       table de correspondance
specimen/lockups.html     planche de référence du jeu assemblé
specimen/styles.html      comparateur des traitements écartés
specimen/index.html       catalogue des glyphes, Tabler contre Lucide
```

## Régénérer

```bash
./regenerer.sh              # télécharge les paquets npm puis reconstruit tout
./regenerer.sh --offline    # reconstruit depuis .cache/ déjà téléchargé
```

Node ≥ 18 et npm. Versions épinglées dans `regenerer.sh`.

## Documentation

### Faire des schémas

- **[Ce que la recherche dit des schémas](docs/etat-de-l-art-schemas.md)** —
  Moody (*Physics of Notations*), Purchase (les croisements d'arêtes dominent),
  Petre (la notation secondaire), la méta-analyse sur la contiguïté spatiale
  (g = 0,63), le modèle C4. Et pourquoi cette littérature tranche la question de
  l'intégration dans draw.io.
- **[Faire un schéma qui se lit](docs/formes-couleurs-fleches.html)** — guide
  pratique : quelle forme pour quel usage, les six règles de couleur, les
  flèches, l'espacement, le test des niveaux de gris.
- **[Relire un schéma — la checklist](docs/checklist-relecture-schema.md)** —
  sept points, dans l'ordre de l'impact mesuré.
- **[Exemple complet](docs/exemple-voltis.svg)** — un schéma d'architecture
  assemblé avec les badges du dépôt.
- **[Exemple en couches](docs/exemple-couches.svg)** — présentation,
  microservices, stockage relationnel et bucket, avec le dimensionnement.

### Décisions

- [0001 — Six couleurs de couche, imposées](docs/adr/0001-six-couleurs-de-couche.md)
- [0002 — Réutiliser le logo officiel dès qu'il existe](docs/adr/0002-reutiliser-les-logos-existants.md)
- [0003 — Une grammaire de formes, normative et fermée](docs/adr/0003-grammaire-de-formes.md)
- [0004 — Garder la voie Excalidraw, en second](docs/adr/0004-excalidraw-voie-secondaire.md)
- [0005 — Neuvième forme : le nœud de déploiement](docs/adr/0005-forme-noeud-et-precisions.md)
- [0006 — Les qualités sont des marqueurs, pas des badges](docs/adr/0006-marqueurs-de-qualite.md)

## Ajouter un protocole

1. Ajoutez une entrée dans `protocoles.json` :

```json
{ "slug": "quic", "label": "QUIC", "famille": "Réseau",
  "tabler": "bolt", "lucide": "zap", "simpleIcons": null }
```

Ajoutez `"marqueOfficielle": true` seulement si le logo de `simpleIcons`
désigne le protocole lui-même, et non une implémentation.

2. Relancez `./regenerer.sh`.

## Ajouter un produit

Dans `produits.json` :

```json
{ "slug": "redis", "label": "Redis", "categorie": "Données",
  "simpleIcons": "redis" }
```

Cherchez d'abord le logo sur [simpleicons.org](https://simpleicons.org). S'il
n'existe pas, mettez `"simpleIcons": null` et donnez un picto de repli plus une
couleur : `"tabler": "database", "couleur": "#0B7A6E"`, avec un champ `note`
qui explique pourquoi — la planche de specimen l'affiche.

Le script échoue avec un message explicite si le nom d'icône n'existe pas.
Noms disponibles : [tabler.io/icons](https://tabler.io/icons),
[lucide.dev](https://lucide.dev), [simpleicons.org](https://simpleicons.org).

Pour rattacher une nouvelle famille à une couleur, complétez
`scripts/couches.json` — le build signale toute famille orpheline.

## Licences

MIT pour le contenu du dépôt (`LICENSE`). Les glyphes de `sources/` sont
redistribués sous MIT, ISC et CC0.

**Libre de droits ≠ libre de marque** : les six logos de niveau 1 restent la
propriété de leurs détenteurs. Ils désignent la technologie, jamais un
partenariat ou une certification. Voir [`NOTICE.md`](NOTICE.md).
