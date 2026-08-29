# 0002 — Reuse the official logo as soon as one exists and is redistributable

- **Status**: accepted, amended once
- **Date**: 2026-08-28
- **Amended by**: [0008](0008-logotypes.md), for the case this document does not
  foresee — the mark that *is* the name, where the “sign + name” lockup would
  write the name twice.

## Context

The set covers two distinct populations:

- **protocols** (`protocols.json`) — specifications, most of which have no mark
  at all;
- **products** (`products.json`) — Java, Kafka, PostgreSQL, Kubernetes…, all of
  which have one, widely recognised.

Should a consistent sign be drawn for everyone, or should the existing logos be
used?

## Decision

**Use the official logo as soon as one exists and is redistributable under a
free licence.** A drawn sign is a fallback only when no logo is available.

Three levels, in this order:

| Level | Condition | Sign | Colour |
|---|---|---|---|
| **1** | An official logo exists and does designate the object | the logo | its brand colour |
| **2** | The mark exists but is not redistributable | the reference open substitute's logo | the substitute's |
| **3** | Nothing available | a Tabler pictogram | the layer's ([0001](0001-six-layer-colours.md)) |

## Justification

**A known logo reads without a legend.** The PostgreSQL elephant, the Kafka bar,
the Kubernetes helm are identified instantly by the intended audience. No generic
pictogram can compete: it would have to be read, then attached to the name. The
consistency of the set is not worth losing that immediate recognition.

**The name is written beside it**, so mixing brand logos and generic pictograms
in one diagram creates no ambiguity.

## Consequences

### A product logo does not stand for a protocol

Seven logos in the catalogue are **kept for reference but never used as a
protocol sign**: RabbitMQ, WireGuard, OpenSSL, Socket.io, OpenAPI Initiative,
XML, JSON Web Tokens.

They are *implementations*. Using the RabbitMQ logo for AMQP, or WireGuard for
VPN, would designate a standard by a product — an error of substance, not a
matter of taste. Only six protocols carry their logo, because there the brand
**is** the protocol: GraphQL, MQTT, XMPP, RSS, BitTorrent, IPFS.

Those same logos become legitimate again if they are added to `products.json` as
products.

### Two documented substitutions

- **Java** → the **OpenJDK** logo. The Java logo is an Oracle trademark, not
  redistributable under a free licence. OpenJDK is the reference implementation,
  and its logo is recognised by the same audience.
- **S3** → the **`bucket`** pictogram. AWS does not redistribute its marks under
  a free licence. The word “bucket” is S3's own vocabulary: its users
  recognise it.

The `note` field of `products.json` carries the justification, and the specimen
sheet displays it.

### Free of rights is not free of trademark

The MIT, ISC and CC0 licences cover the **SVG file**, not the mark depicted. The
logos used remain the property of their holders: they designate the technology,
never a partnership or a certification. See [`NOTICE.md`](../../NOTICE.md).

### The brand colour escapes the six layers

A level 1 or 2 logo keeps its official colour, which does not belong to the
palette of [ADR 0001](0001-six-layer-colours.md). That is intended: the colour is
part of the recognition. The fills, however, stay set on a constant luminance, so
that the series keeps a consistent visual weight — and, since
[ADR 0008](0008-logotypes.md), a capped chroma.

## Alternatives ruled out

- **Redraw everything as consistent pictograms.** Rejected: it sacrifices
  immediate recognition, which is the first service a diagram renders.
- **Use the dominant implementation's logo for every protocol.** Rejected:
  factually false, and misleading for the reader.
- **Recolour the brand logos to their layer's colour.** Rejected: a recoloured
  logo loses most of its recognisability, and altering a mark is more
  objectionable than using it as it is.
