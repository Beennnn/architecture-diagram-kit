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

## Deux populations

- **Protocoles** (`protocoles.json`) — 32 spécifications : HTTP, SSH, MQTT…
- **Produits** (`produits.json`) — 9 technologies : Java, Kafka, PostgreSQL,
  Kubernetes…

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

## Quatre dispositions

| Dossier | Format | Usage |
|---|---|---|
| `lockups/horizontal/` | signe à gauche, nom à droite · 48 px de haut | **défaut** — annoter une flèche, légender |
| `lockups/empile/` | signe au-dessus, nom dessous · 84 px de haut | représenter un nœud, à la place d'une boîte |
| `lockups/mono/` | horizontal, encre unique | impression N&B, schéma déjà colorié |
| `symboles/` | le signe seul · 48 × 48 | repli quand la place manque — exige une légende |

Ces fichiers sont **autonomes** : couleurs en dur, texte vectorisé, aucune
dépendance. Glissez-les dans Figma, une diapositive, un README, une page web.

### draw.io

N'importez pas `lockups/` dans draw.io — **installez la bibliothèque de
formes** : `File ▸ Open Library from ▸ Device…` puis `drawio/protocoles.xml` et
`drawio/produits.xml`.

Elle livre le **signe seul**, et draw.io écrit le nom lui-même comme étiquette.
Le libellé reste ainsi cherchable (`Ctrl+F`), modifiable sur place
(« HTTPS :8443 ») et exporté comme du vrai texte. Détails :
[`drawio/README.md`](drawio/README.md) · raisonnement :
[l'état de l'art](docs/etat-de-l-art-schemas.md#5-la-conséquence-pour-drawio).

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
produits.json             source de vérité : 9 produits
scripts/couches.json      les 6 couches colorées
docs/                     état de l'art, checklist, décisions (ADR)
regenerer.sh              reconstruit tout depuis npm

lockups/horizontal/       41 SVG · disposition par défaut
lockups/empile/           41 SVG · nœud de schéma
lockups/mono/             41 SVG · encre unique
symboles/                 41 SVG · signe seul

drawio/protocoles.xml     bibliothèque de formes draw.io · 32
drawio/produits.xml       bibliothèque de formes draw.io · 9

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

### Décisions

- [0001 — Six couleurs de couche, imposées](docs/adr/0001-six-couleurs-de-couche.md)
- [0002 — Réutiliser le logo officiel dès qu'il existe](docs/adr/0002-reutiliser-les-logos-existants.md)

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
