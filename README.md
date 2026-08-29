# logo-libres — badges and diagrams

Two things, which belong together:

1. **A consistent, rights-free set of lockups** for the network protocols and
   the technologies an architect draws — SSH, HTTP, MQTT, Kafka, PostgreSQL,
   Kubernetes…
2. **What it takes to use them well**: the state of the art on diagrams, a
   review checklist, and the design decisions with their justification.

The second point is not ornament. The literature is consistent on one thing:
**what decides whether a diagram reads is almost never what you spend time on**
— one arrow crossing removed is worth more than all the iconography in the
world. Badges do nothing for a badly laid-out diagram.

## The problem

SSH, HTTP, FTP, REST, SMTP, DNS **have no official logo.** They are
specifications (RFC, W3C, IETF), not brands. Searching for “the FTP logo”
will never return a consistent result: there isn't one.

Consistency therefore comes from a convention applied everywhere, not from a
hunt for logos.

## Vocabulary

| Term | What it is |
|---|---|
| wordmark, logotype | the name alone, drawn in type |
| logomark, symbol | the sign alone, no text |
| **lockup** | the fixed assembly sign + name, in a constant layout |
| icon, pictogram | a functional sign, not an identity |

This repository produces **lockups**: a sign and a name locked together. They
are not logos — no brand identity is being built here — but reading marks for a
diagram.

## Three populations

- **Protocols** (`protocols.json`) — source of truth: 32 protocols. HTTP, SSH,
  MQTT…
- **Products** (`products.json`) — source of truth: 78 products. Java, Kafka,
  PostgreSQL, Kubernetes, Redis, nginx, Terraform, PyTorch, ClickHouse…
- **Roles** (`roles.json`) — source of truth: 81 roles. Load balancer, cache,
  bastion, API gateway… A role describes what a building block **does**,
  independently of the product implementing it: “cache”, not “Redis”. That
  is what lets you draw a diagram before the technology has been chosen.

## Shape grammar

Nine shapes, normative and closed — `service`, `application`, `store`,
`stream`, `actor`, `device`, `external`, `boundary`, `node`. The shape encodes
the **nature** of an object, never its importance nor its state. Defined in
[`shapes.json`](shapes.json); the build fails on an unknown shape. The rules and
their justification: [ADR 0003](docs/adr/0003-shape-grammar.md), amended by
[0005](docs/adr/0005-node-shape-and-clarifications.md) and
[0007](docs/adr/0007-fill-scale-and-accent.md).

## Three levels of sign

**Rule: use the official logo as soon as one exists and is redistributable.** A
known logo reads without a legend — the PostgreSQL elephant or the Kubernetes
helm are identified instantly, which no generic pictogram can match.

| Level | When | Sign | Colour |
|---|---|---|---|
| **1 — official logo** | it exists and does designate the object | the logo | its brand colour |
| **2 — open substitute** | the mark is not redistributable | the reference substitute's logo | the substitute's |
| **3 — pictogram** | nothing available | a Tabler pictogram | the layer's |

Two documented substitutions: **Java** uses the **OpenJDK** logo (the Java logo
is an Oracle trademark), **S3** uses the `bucket` pictogram (AWS does not
redistribute its marks) — “bucket” being S3's own vocabulary.

Only six protocols carry their logo, because there the brand **is** the
protocol: GraphQL, MQTT, XMPP, RSS, BitTorrent, IPFS. Seven further logos in the
catalogue (RabbitMQ, WireGuard, OpenSSL, Socket.io, OpenAPI, XML, JWT) are kept
for reference but **never used as a protocol sign**: they are *implementations*,
and using RabbitMQ for AMQP would designate a standard by a product. They become
legitimate again once added to `products.json`.

## What the CI verifies

A workflow re-runs `./regenerate.sh` on every proposal, then verifies that the
git tree stayed clean. That second verification is the most useful one: it
proves that the versioned output corresponds exactly to its sources. Without it,
a generated file edited by hand would go through without anyone knowing.

The regeneration carries all the repository's guard rails along the way —
uniqueness of the pictograms, minimum height of a cylinder, a label covering a
box, a description overflowing, the legend landing on a node, unreadable text in
the dark variant, agreement of `shapes.json` with `FILLS`, a grammar fill
missing from a library. Each one fails the generation, and therefore reddens
the CI.

## Four layouts

| Directory | Format | Use |
|---|---|---|
| `symbols/` | the sign alone · 48 × 48 | **the default inside a diagram** — in a box, or on an arrow with its name beside it |
| `lockups/horizontal/` | sign left, name right · 48 px tall | outside a diagram — a slide, a README, a web page |
| `lockups/stacked/` | sign above, name below · 84 px tall | a grid of logos, a footer |
| `lockups/mono/` | horizontal, single ink | black-and-white printing, an already coloured diagram |

**A lockup does not annotate an arrow.** It is about 150 px wide for arrows that
are 82: laid on one it spills onto the boxes, laid above it floats without
saying which arrow it belongs to. An arrow is annotated with the symbol and the
name laid *on* the line, which breaks behind them — see
[`docs/candidates-arrows.svg`](docs/candidates-arrows.svg) for the arbitration,
and `annotation()` in `scripts/diagram.mjs` for the primitive.

### Logotypes do not write their name twice

3 marks in the set — `.NET`, `Go`, `vmware` — have no symbol: they **write** the
name, full stop. Setting our label beside them would write it twice. Dual coding
asks for a sign **and** a text, not two texts. These entries carry
`"logotype": true` in `products.json`; their lockup is the mark alone, and the
build refuses to lay the word back on it.

The mark still had to be legible. Inscribed in the square of the `viewBox`, the
“vmware” band — 24 × 3.8 units — wrote at 4.7 px tall: we kept the word
because the mark did not speak. It is now placed by its **measured ink**
(`scripts/ink-box.mjs`, which flattens the path, arcs included), at the cap
height the word had.

Helm and MySQL stay outside: their mark carries a symbol — a wheel, a dolphin —
and its lettering is illegible at our sizes. The word does work there.

These files are **self-contained**: colours baked in, text vectorised, no
dependency. Drop them into Figma, a slide, a README, a web page.

### draw.io

Do not import `lockups/` into draw.io — **install the libraries**:
`File ▸ Open Library from ▸ Device…` then `drawio/protocols.xml`,
`drawio/products.xml`, `drawio/roles.xml` and above all `drawio/grammar.xml`,
which carries the nine shapes, their fills, the accent and the annotated arrow.

It ships the **sign alone**, and draw.io writes the name itself as a label. The
label therefore stays searchable (`Ctrl+F`), editable in place
(“HTTPS :8443”) and exported as real text. Details:
[`drawio/README.md`](drawio/README.md) · reasoning:
[the state of the art](docs/state-of-the-art-diagrams.md#5-the-consequence-for-drawio).

### Excalidraw — the secondary route

`excalidraw/badges.excalidraw` is a **scene** to open and then copy-paste:
Excalidraw's library format does not carry images.

Keep the `.excalidraw` files **in the git repository** rather than in
Excalidraw's cloud: the format is plain JSON, the free editor and the VS Code
extension open them in place, and the free plan's single-scene limit never
fires. Why this route exists and what it costs:
[ADR 0004](docs/adr/0004-excalidraw-secondary-route.md).

## How the colour is computed

The fill is not a fixed share of the hue. A fixed share gives pills of very
uneven weight — at 14 %, BitTorrent's black drops to 0.72 of luminance while
RSS's orange stays at 0.90. Every fill is therefore **set on the same
luminance** (0.87): the spread across the protocols falls from 0.184 to 0.012.

The ink is then darkened until it reaches **4.5:1 of contrast** on its own fill.
That is what makes light marks such as RSS or IPFS readable without touching the
dark ones.

Equalising luminance was not enough. At equal luminance a saturated yellow
carries ten times the chroma of a grey and therefore shouts far louder: in a
grid of 191 badges, DuckDB, Vault and ClickHouse jumped out without meaning
anything more. Chroma is therefore **capped at 0.20** — the median of the set is
0.047 and the 95th percentile 0.137, so the cap touches six entries only — and
the luminance is then re-targeted, each desaturating the other in turn. No fill
falls outside ±0.02 around 0.87.

Six layers carry the colour of the pictograms — Web & real time, API, Files,
Messages & mail, Access & security, Infrastructure. **Six hues, not
thirty-two**: a legend of six entries is memorable. The full reasoning,
dichromacy measurements included, is in
[ADR 0001](docs/adr/0001-six-layer-colours.md).

## Structure

```
protocols.json            source of truth: 32 protocols
products.json             source of truth: 78 products
roles.json                source of truth: 81 roles
shapes.json               the shape grammar
scripts/layers.json       the 6 coloured layers
docs/                     state of the art, checklist, decisions (ADR)
regenerate.sh             rebuilds everything from npm

lockups/horizontal/       191 SVG · default layout
lockups/stacked/          191 SVG · diagram node
lockups/mono/             191 SVG · single ink
symbols/                  191 SVG · sign alone

drawio/protocols.xml      draw.io shape library · 32
drawio/products.xml       draw.io shape library · 78
drawio/roles.xml          draw.io shape library · 81

sources/tabler/           raw glyphs · MIT
sources/lucide/           raw glyphs · ISC
sources/marks/            raw brand logos · CC0

mapping.csv / .json       correspondence table
specimen/lockups.html     reference sheet of the assembled set
specimen/styles.html      comparator of the treatments ruled out
specimen/index.html       glyph catalogue, Tabler against Lucide
```

## Regenerating

```bash
./regenerate.sh              # downloads the npm packages, then rebuilds everything
./regenerate.sh --offline    # rebuilds from an already downloaded .cache/
```

Node ≥ 18 and npm. Versions pinned in `regenerate.sh`.

## Documentation

### Making diagrams

- **[What the research says about diagrams](docs/state-of-the-art-diagrams.md)**
  — Moody (*Physics of Notations*), Purchase (edge crossings dominate), Petre
  (secondary notation), the meta-analysis on spatial contiguity (g = 0.63), the
  C4 model. And why that literature settles the question of integrating with
  draw.io.
- **[Making a diagram that reads](docs/shapes-colors-arrows.html)** — the
  practical guide: which shape for which use, the six colour rules, arrows,
  spacing, the greyscale test.
- **[Reviewing a diagram — the checklist](docs/diagram-review-checklist.md)** —
  nine points, in the order of measured impact.
- **[Scope audit](docs/scope-audit.md)** — does the set serve an architect, or
  one architecture? The counts, the gaps found, and what was added to close them.
- **[A complete example](docs/example-voltis.svg)** — an architecture diagram
  assembled with the badges from this repository.
- **[A layered example](docs/example-layers.svg)** — presentation,
  microservices, relational store and bucket, with the sizing.
- **[An analytics pipeline](docs/example-analytics.svg)** — a deliberately
  different architectural style: no cluster, no long-running service, no JVM.

### Decisions

- [0001 — Six layer colours, imposed](docs/adr/0001-six-layer-colours.md)
- [0002 — Reuse the official logo as soon as one exists](docs/adr/0002-reuse-existing-logos.md)
- [0003 — A shape grammar, normative and closed](docs/adr/0003-shape-grammar.md)
- [0004 — Keep the Excalidraw route, second](docs/adr/0004-excalidraw-secondary-route.md)
- [0005 — A ninth shape: the deployment node](docs/adr/0005-node-shape-and-clarifications.md)
- [0006 — Qualities are markers, not badges](docs/adr/0006-quality-markers.md)
- [0007 — Widen the fill scale, and accent one subject per diagram](docs/adr/0007-fill-scale-and-accent.md)
- [0008 — A logotype does not write its name twice](docs/adr/0008-logotypes.md)

## Adding a protocol

1. Add an entry to `protocols.json`:

```json
{ "slug": "quic", "label": "QUIC", "family": "Network",
  "tabler": "bolt", "lucide": "zap", "simpleIcons": null }
```

Add `"officialMark": true` only if the `simpleIcons` logo designates the
protocol itself, and not an implementation.

2. Re-run `./regenerate.sh`.

## Adding a product

In `products.json`:

```json
{ "slug": "redis", "label": "Redis", "family": "Data",
  "simpleIcons": "redis" }
```

Look for the logo on [simpleicons.org](https://simpleicons.org) first. If none
exists, set `"simpleIcons": null` and give a fallback pictogram plus a colour:
`"tabler": "database", "color": "#0B7A6E"`, with a `note` field explaining why —
the specimen sheet displays it.

The script fails with an explicit message if the icon name does not exist.
Available names: [tabler.io/icons](https://tabler.io/icons),
[lucide.dev](https://lucide.dev), [simpleicons.org](https://simpleicons.org).

To attach a new family to a colour, complete `scripts/layers.json` — the build
reports any orphan family.

## Licences

MIT for the content of this repository (`LICENSE`). The glyphs in `sources/` are
redistributed under MIT, ISC and CC0.

**Free of rights ≠ free of trademark**: the level 1 logos remain the property of
their holders. They designate the technology, never a partnership or a
certification. See [`NOTICE.md`](NOTICE.md).
