# Licences

## What this repository owns

Everything written here — the scripts, the JSON sources, the documentation and
the generated SVG, XML and Excalidraw files — is released under the
**BSD Zero Clause License** (see [`LICENSE`](LICENSE)). No attribution, no
notice to preserve, no conditions of any kind. Take it and use it.

## What it redistributes, and under what terms

The glyphs in `sources/` are not produced here: they are extracted as they are
from three third-party projects. **Their licences apply to them, whatever this
repository chooses for its own content** — and two of the three require the
copyright notice to be preserved. The full texts are vendored in
[`licenses/`](licenses/) so that a copy of this repository carries them.

| Directory | Project | Pinned version | Licence | Attribution | Text |
|---|---|---|---|---|---|
| `sources/tabler/` | [Tabler Icons](https://tabler.io/icons) | 3.46.0 | MIT | **required** | [`licenses/tabler-MIT.txt`](licenses/tabler-MIT.txt) |
| `sources/lucide/` | [Lucide](https://lucide.dev) | 1.34.0 | ISC | **required** | [`licenses/lucide-ISC.txt`](licenses/lucide-ISC.txt) |
| `sources/marks/` | [Simple Icons](https://simpleicons.org) | 16.28.0 | CC0 1.0 | not required | [`licenses/simple-icons-CC0.txt`](licenses/simple-icons-CC0.txt) |

The lockups in `lockups/` and `symbols/` embed a Tabler or Lucide glyph, or a
Simple Icons mark, and are therefore covered by the same terms. The labels are
outlines of **IBM Plex Sans** (SIL Open Font License 1.1, text in
[`licenses/ibm-plex-OFL.txt`](licenses/ibm-plex-OFL.txt)); the OFL explicitly
permits embedding a font in a document, which is what a vectorised label is.

Versions are pinned in `regenerate.sh` and can be overridden by environment
variable (`TABLER_VERSION`, `LUCIDE_VERSION`, `SIMPLE_VERSION`, `PLEX_VERSION`).

## Trademarks

**A free licence on the SVG file carries no right whatsoever over the mark it
depicts.** This is the constraint no licence choice can remove.

The files in `sources/marks/` reproduce marks belonging to their respective
holders — GraphQL, MQTT, XMPP, WireGuard, RabbitMQ, BitTorrent, IPFS, RSS,
Socket.io, OpenSSL, OpenAPI Initiative, XML, JSON Web Tokens, and the marks of
every product in `products.json`.

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
