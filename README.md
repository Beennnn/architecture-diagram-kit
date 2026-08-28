# logo-libres

Un jeu d'icônes **homogène et libre de droits** pour les protocoles réseau —
SSH, HTTP, FTP, REST, MQTT, SMTP… — pensé pour les **schémas d'architecture**.

## Le problème

SSH, HTTP, FTP, REST, SMTP, DNS **n'ont pas de logo officiel.** Ce sont des
spécifications (RFC, W3C, IETF), pas des marques. Chercher « le logo FTP » ne
donnera jamais un résultat homogène : il n'existe pas.

L'homogénéité vient donc d'une seule décision — **prendre toutes les icônes
dans la même famille** — et d'une convention de rendu appliquée partout.

## Ce que contient ce dépôt

```
protocoles.json          source de vérité : 32 protocoles → nom d'icône
scripts/couches.json     6 couches colorées (Web, API, Fichiers, …)
regenerer.sh             reconstruit tout depuis npm
icons/tabler/            32 SVG · MIT
icons/lucide/            32 SVG · ISC
icons/logos-officiels/   13 vraies marques · CC0
mapping.csv / .json      table de correspondance
specimen/index.html      planche : les 32 icônes, Tabler vs Lucide
specimen/styles.html     comparateur : 6 traitements sur un schéma témoin
```

Les fichiers sont nommés **par protocole** (`ssh.svg`, `http.svg`), pas par nom
d'icône : `tabler/ssh.svg` et `lucide/ssh.svg` sont interchangeables.

## Les conventions retenues

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| Famille | **Tabler**, tracé 2 px | 5 130 icônes contre 2 035 chez Lucide ; 17 icônes de ce jeu n'ont aucun équivalent Lucide |
| Traitement | **Pastille teintée** (fond à 14 % de la teinte) | Masque le trait de la flèche sans créer un aplat concurrent |
| Variante | **Étiquette** (icône + nom) | Lève l'ambiguïté FTP / SFTP ; exige ≥ 130 px entre boîtes |
| Pastille | Carré arrondi, rayon = 27 % du côté | S'aligne sur les boîtes sans les concurrencer |
| Ratio glyphe / pastille | 62 % | En dessous le glyphe flotte, au-dessus il touche le bord |
| Taille minimale | 20 px sur flèche (16 px en dernier recours) | En dessous, les glyphes chargés se ferment |
| Couleur | **6 couches, pas 32 protocoles** | Une légende de six entrées se retient ; une de trente-deux, non |

Deux icônes ont été choisies contre la métaphore la plus riche, au profit de la
lisibilité à 16 px : HTTP utilise `world` (et non `world-www`, 116 commandes de
tracé) et HTTPS utilise `lock` (et non `lock-square-rounded`, redondant dans une
pastille déjà carrée).

## Régénérer

```bash
./regenerer.sh              # télécharge les paquets npm puis reconstruit tout
./regenerer.sh --offline    # reconstruit depuis .cache/ déjà téléchargé
```

Prérequis : Node ≥ 18 et npm. Les versions des paquets sont épinglées dans
`regenerer.sh`.

## Ajouter un protocole

1. Ajoutez une entrée dans `protocoles.json` :

```json
{ "slug": "quic", "label": "QUIC", "famille": "Réseau",
  "tabler": "bolt", "lucide": "zap", "simpleIcons": null }
```

2. Relancez `./regenerer.sh`.

Le script échoue avec un message explicite si le nom d'icône n'existe pas dans
le paquet. Cherchez les noms disponibles sur [tabler.io/icons](https://tabler.io/icons),
[lucide.dev](https://lucide.dev) et [simpleicons.org](https://simpleicons.org).

Pour rattacher une nouvelle famille à une couleur, complétez
`scripts/couches.json` — `regenerer.sh` signale toute famille orpheline.

## Récupérer les icônes autrement

```bash
npm pack @tabler/icons          # SVG bruts, sans dépendance
npm i @tabler/icons-react       # composants React
npm i simple-icons              # logos de marque + couleurs officielles
```

```jsx
import { IconWorld, IconLock, IconApi } from '@tabler/icons-react';
<IconWorld size={20} stroke={2} />
```

## Licences

Le contenu propre à ce dépôt est sous MIT (voir `LICENSE`). Les fichiers de
`icons/` sont redistribués depuis des projets tiers sous MIT, ISC et CC0.

**Libre de droits ≠ libre de marque** : les 13 logos de
`icons/logos-officiels/` restent la propriété de leurs détenteurs. Voir
[`NOTICE.md`](NOTICE.md).
