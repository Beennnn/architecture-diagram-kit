# Licences des icônes redistribuées

Les fichiers de `icons/` ne sont pas produits par ce dépôt : ils sont extraits
tels quels de trois projets tiers, chacun sous sa propre licence.

| Dossier | Projet | Version épinglée | Licence | Attribution |
|---|---|---|---|---|
| `icons/tabler/` | [Tabler Icons](https://tabler.io/icons) | 3.46.0 | MIT | non requise |
| `icons/lucide/` | [Lucide](https://lucide.dev) | 1.34.0 | ISC | non requise |
| `icons/logos-officiels/` | [Simple Icons](https://simpleicons.org) | 16.28.0 | CC0 1.0 | non requise |

Les versions sont épinglées dans `regenerer.sh` et surchargeables par variable
d'environnement (`TABLER_VERSION`, `LUCIDE_VERSION`, `SIMPLE_VERSION`).

## Marques déposées

**Une licence libre sur le fichier SVG n'emporte aucun droit sur la marque
qu'il représente.**

Les 13 fichiers de `icons/logos-officiels/` reproduisent des marques
appartenant à leurs détenteurs respectifs : GraphQL, MQTT, XMPP, WireGuard,
RabbitMQ, BitTorrent, IPFS, RSS, Socket.io, OpenSSL, OpenAPI Initiative, XML,
JSON Web Tokens.

Ces logos peuvent être employés pour **désigner la technologie** — dans un
schéma d'architecture, une documentation, un comparatif. Ils ne peuvent pas
être employés d'une manière qui suggère un partenariat, un parrainage ou une
certification par le détenteur de la marque, ni intégrés à votre propre
identité visuelle.

Chaque marque publie ses propres règles. Le champ `source` de `mapping.json`
pointe vers la page d'origine de chaque logo ; c'est le point de départ pour
vérifier les conditions applicables avant une publication.

Simple Icons publie par ailleurs son propre avertissement sur ce point :
<https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md>
