# 0002 — Réutiliser le logo officiel dès qu'il existe et qu'il est redistribuable

- **Statut** : acceptée
- **Date** : 2026-08-28

## Contexte

Le jeu couvre deux populations distinctes :

- des **protocoles** (`protocoles.json`) — des spécifications, qui n'ont pour
  la plupart aucune marque ;
- des **produits** (`produits.json`) — Java, Kafka, PostgreSQL, Kubernetes…,
  qui en ont tous une, largement reconnue.

Fallait-il dessiner un signe homogène pour tout le monde, ou employer les
logos existants ?

## Décision

**Employer le logo officiel dès qu'il existe et qu'il est redistribuable sous
licence libre.** Un signe dessiné n'est un repli que lorsque aucun logo n'est
disponible.

Trois niveaux, dans cet ordre :

| Niveau | Condition | Signe | Couleur |
|---|---|---|---|
| **1** | Un logo officiel existe et désigne bien l'objet | le logo | sa couleur de marque |
| **2** | La marque existe mais n'est pas redistribuable | le logo du substitut ouvert de référence | celle du substitut |
| **3** | Rien de disponible | un picto Tabler | celle de la couche ([0001](0001-six-couleurs-de-couche.md)) |

## Justification

**Un logo connu se lit sans légende.** L'éléphant PostgreSQL, la barre de
Kafka, la roue Kubernetes sont identifiés instantanément par le public visé.
Aucun picto générique ne peut rivaliser : il faudrait le lire, puis le
rattacher au nom. L'homogénéité du jeu ne vaut pas la perte de cette
reconnaissance immédiate.

**Le nom est écrit à côté**, donc le mélange de logos de marque et de pictos
génériques dans un même schéma ne crée aucune ambiguïté.

## Conséquences

### Un logo de produit ne vaut pas pour un protocole

Sept logos du catalogue sont **conservés en référence mais jamais employés
comme signe de protocole** : RabbitMQ, WireGuard, OpenSSL, Socket.io,
OpenAPI Initiative, XML, JSON Web Tokens.

Ce sont des *implémentations*. Employer le logo RabbitMQ pour AMQP, ou
WireGuard pour VPN, désignerait un standard par un produit — une erreur de
fond, pas une question de goût. Six protocoles seulement portent leur logo,
parce que là, la marque **est** le protocole : GraphQL, MQTT, XMPP, RSS,
BitTorrent, IPFS.

Ces mêmes logos redeviennent légitimes s'ils sont ajoutés à `produits.json`
en tant que produits.

### Deux substitutions documentées

- **Java** → logo **OpenJDK**. Le logo Java est une marque Oracle, non
  redistribuable sous licence libre. OpenJDK est l'implémentation de
  référence, et son logo est reconnu du même public.
- **S3** → picto **`bucket`**. AWS ne redistribue pas ses marques sous licence
  libre. Le mot « bucket » est le vocabulaire même de S3 : ses utilisateurs le
  reconnaissent.

Le champ `note` de `produits.json` porte la justification, et la planche de
specimen l'affiche.

### Libre de droits n'est pas libre de marque

Les licences MIT, ISC et CC0 couvrent le **fichier SVG**, pas la marque
représentée. Les logos employés restent la propriété de leurs détenteurs : ils
désignent la technologie, jamais un partenariat ou une certification. Voir
[`NOTICE.md`](../../NOTICE.md).

### La couleur de marque échappe aux six couches

Un logo de niveau 1 ou 2 conserve sa couleur officielle, qui n'appartient pas
à la palette de l'[ADR 0001](0001-six-couleurs-de-couche.md). C'est voulu :
cette couleur fait partie de la reconnaissance. Les fonds restent toutefois
calés sur une luminance constante, pour que la série garde un poids visuel
homogène.

## Alternatives écartées

- **Tout redessiner en pictos homogènes.** Rejeté : sacrifie la reconnaissance
  immédiate, qui est le premier service rendu par un schéma.
- **Employer le logo de l'implémentation dominante pour chaque protocole.**
  Rejeté : factuellement faux, et trompeur pour le lecteur.
- **Recolorer les logos de marque à la couleur de leur couche.** Rejeté : un
  logo recoloré perd l'essentiel de sa reconnaissance, et l'altération d'une
  marque est plus contestable que son emploi tel quel.
