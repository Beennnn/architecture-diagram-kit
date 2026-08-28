# logo-libres

Un jeu de **bloc-marques** homogène et libre de droits pour les protocoles
réseau — SSH, HTTP, FTP, REST, MQTT, SMTP… — pensé pour les **schémas
d'architecture**.

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

## Deux niveaux de signe

| Niveau | Quand | Signe | Couleur |
|---|---|---|---|
| **1 — logo de marque** | la marque **est** le protocole | le logo officiel | sa couleur officielle |
| **2 — picto générique** | aucune marque ne désigne le protocole | un picto Tabler | la couleur de la couche |

Six protocoles relèvent du niveau 1 : **GraphQL, MQTT, XMPP, RSS, BitTorrent,
IPFS**. Les 26 autres relèvent du niveau 2.

Le catalogue contient sept autres logos (RabbitMQ, WireGuard, OpenSSL,
Socket.io, OpenAPI, XML, JWT) mais ils ne sont **pas** employés comme signe :
ce sont des *implémentations*. Utiliser le logo RabbitMQ pour AMQP, ou
WireGuard pour VPN, reviendrait à désigner un standard par un produit.

## Quatre dispositions

| Dossier | Format | Usage |
|---|---|---|
| `lockups/horizontal/` | signe à gauche, nom à droite · 48 px de haut | **défaut** — annoter une flèche, légender |
| `lockups/empile/` | signe au-dessus, nom dessous · 84 px de haut | représenter un nœud, à la place d'une boîte |
| `lockups/mono/` | horizontal, encre unique | impression N&B, schéma déjà colorié |
| `symboles/` | le signe seul · 48 × 48 | repli quand la place manque — exige une légende |

Ces fichiers sont **autonomes** : couleurs en dur, texte vectorisé, aucune
dépendance. Glissez-les dans draw.io, Figma, Excalidraw ou une page web.

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
trente-deux** : une légende de six entrées se retient.

## Structure

```
protocoles.json           source de vérité : 32 protocoles
scripts/couches.json      les 6 couches colorées
regenerer.sh              reconstruit tout depuis npm

lockups/horizontal/       32 SVG · disposition par défaut
lockups/empile/           32 SVG · nœud de schéma
lockups/mono/             32 SVG · encre unique
symboles/                 32 SVG · signe seul

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

## Ajouter un protocole

1. Ajoutez une entrée dans `protocoles.json` :

```json
{ "slug": "quic", "label": "QUIC", "famille": "Réseau",
  "tabler": "bolt", "lucide": "zap", "simpleIcons": null }
```

Ajoutez `"marqueOfficielle": true` seulement si le logo de `simpleIcons`
désigne le protocole lui-même, et non une implémentation.

2. Relancez `./regenerer.sh`.

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
