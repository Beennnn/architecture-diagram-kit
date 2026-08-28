# Licences des icônes redistribuées

Les glyphes de `sources/` ne sont pas produits par ce dépôt : ils sont extraits
tels quels de trois projets tiers, chacun sous sa propre licence.

| Dossier | Projet | Version épinglée | Licence | Attribution |
|---|---|---|---|---|
| `sources/tabler/` | [Tabler Icons](https://tabler.io/icons) | 3.46.0 | MIT | non requise |
| `sources/lucide/` | [Lucide](https://lucide.dev) | 1.34.0 | ISC | non requise |
| `sources/marques/` | [Simple Icons](https://simpleicons.org) | 16.28.0 | CC0 1.0 | non requise |

Les versions sont épinglées dans `regenerer.sh` et surchargeables par variable
d'environnement (`TABLER_VERSION`, `LUCIDE_VERSION`, `SIMPLE_VERSION`).

## Marques déposées

**Une licence libre sur le fichier SVG n'emporte aucun droit sur la marque
qu'il représente.**

Les 13 fichiers de `sources/marques/` reproduisent des marques appartenant à
leurs détenteurs respectifs : GraphQL, MQTT, XMPP, WireGuard, RabbitMQ,
BitTorrent, IPFS, RSS, Socket.io, OpenSSL, OpenAPI Initiative, XML,
JSON Web Tokens.

Six d'entre elles seulement sont employées comme signe dans `lockups/` et
`symboles/` — GraphQL, MQTT, XMPP, RSS, BitTorrent, IPFS — parce que la marque
y désigne le protocole lui-même. Les sept autres sont conservées en référence
mais jamais employées : RabbitMQ, WireGuard ou OpenSSL sont des
*implémentations*, et les faire figurer à la place d'AMQP, de VPN ou de HTTPS
désignerait un standard par un produit.

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
