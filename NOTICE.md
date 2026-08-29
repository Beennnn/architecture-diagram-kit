# Licences of the redistributed icons

The glyphs in `sources/` are not produced by this repository: they are extracted
as they are from three third-party projects, each under its own licence.

| Directory | Project | Pinned version | Licence | Attribution |
|---|---|---|---|---|
| `sources/tabler/` | [Tabler Icons](https://tabler.io/icons) | 3.46.0 | MIT | not required |
| `sources/lucide/` | [Lucide](https://lucide.dev) | 1.34.0 | ISC | not required |
| `sources/marks/` | [Simple Icons](https://simpleicons.org) | 16.28.0 | CC0 1.0 | not required |

The versions are pinned in `regenerate.sh` and can be overridden by environment
variable (`TABLER_VERSION`, `LUCIDE_VERSION`, `SIMPLE_VERSION`).

## Trademarks

**A free licence on the SVG file carries no right whatsoever over the mark it
depicts.**

The files in `sources/marks/` reproduce marks belonging to their respective
holders — among them GraphQL, MQTT, XMPP, WireGuard, RabbitMQ, BitTorrent, IPFS,
RSS, Socket.io, OpenSSL, OpenAPI Initiative, XML, JSON Web Tokens, and the marks
of every product in `products.json`.

Among the protocol marks, only six are used as a sign in `lockups/` and
`symbols/` — GraphQL, MQTT, XMPP, RSS, BitTorrent, IPFS — because there the
brand designates the protocol itself. The seven others are kept for reference
but never used: RabbitMQ, WireGuard and OpenSSL are *implementations*, and
putting them in place of AMQP, VPN or HTTPS would designate a standard by a
product.

These logos may be used to **designate the technology** — in an architecture
diagram, in documentation, in a comparison. They may not be used in a way that
suggests a partnership, a sponsorship or a certification by the holder of the
mark, nor incorporated into your own visual identity.

Every brand publishes its own rules. The `source` field of `mapping.json` points
to the origin page of each logo; that is the starting point for checking the
applicable conditions before publishing.

Simple Icons publishes its own disclaimer on this point:
<https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md>
