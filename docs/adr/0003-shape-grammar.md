# 0003 — A shape grammar, normative and closed

- **Status**: accepted, amended twice
- **Date**: 2026-08-28
- **Amended by**: [0005](0005-node-shape-and-clarifications.md), which adds a
  **ninth** shape — the deployment node — and rules R9 and R10;
  [0007](0007-fill-scale-and-accent.md), which widens the fill scale and adds the
  accent. This document says “eight shapes”: that was the state at the time of
  writing, not the current state.

## Context

The repository provides badges, that is to say **signs**. A sign says *which*
object you are looking at. It does not say *what kind* of object it is: a
PostgreSQL badge on a rectangle and the same badge on a cylinder do not tell the
same story.

Without an explicit shape grammar, every author invents their own, and the corpus
of diagrams stops being readable from one diagram to the next — the reader
relearns the notation on every page.

Moody describes this as the blind spot of the discipline: effort goes into
semantics, the visual syntax is handled at the end, by eye, and no method
evaluates it.

## Decision

A grammar of **eight shapes**, described in [`shapes.json`](../../shapes.json)
and binding: the build fails if an entry references a shape that is absent.

| Shape | Nature encoded | Geometry |
|---|---|---|
| `service` | a component that runs code | square-cornered rectangle |
| `application` | something a person interacts with directly | rounded rectangle |
| `store` | data that survives a restart | cylinder |
| `stream` | a queue, a topic, a bus | capsule |
| `actor` | a person, or the workstation they act through | rounded rectangle, light grey fill |
| `device` | a physical device outside the information system | square-cornered rectangle, light grey fill |
| `external` | a system outside our control | rounded rectangle, dashed stroke |
| `boundary` | a zone: network, trust, deployment, context | dashed frame |

### The eight rules

**R1 — The shape encodes the nature, never anything else.** Not importance, not
state, not ownership, not criticality. A critical component has no special shape:
it has a size, a position, or a colour accent.

**R2 — One nature, one shape, across the whole corpus.** Not just inside one
diagram. This is Moody's principle of *semiotic clarity*: the correspondence
between symbol and concept must be one-to-one. Two shapes for one concept
(*redundancy*) or one shape for two concepts (*overload*) are the two most
expensive anomalies for the reader.

**R3 — Eight shapes, and not one more.** Adding a shape means removing one. This
is the principle of *graphic economy*: the number of graphically distinct symbols
must stay within the limits of human discrimination. Beyond that, the reader goes
back to the legend for every object.

**R4 — Shape takes precedence over colour.** Every diagram must stay readable
desaturated. Shape survives black and white, colour blindness and a projector;
colour does not. This is also what makes the knowingly accepted weakness of the
palette in [ADR 0001](0001-six-layer-colours.md) acceptable.

**R5 — Any non-universal shape goes into the legend.** The cylinder for a store
and the figure for an actor are acquired — their *semantic transparency* suffices
without explanation. The distinction between `service` and `application`, on the
other hand, is a convention: it gets explained.

**R6 — Boundaries nest or separate, they never overlap.** A frame exploits
*common region*, the strongest perceptual grouping — stronger than proximity,
stronger than similarity. Two frames cutting across each other destroy that
signal instead of using it.

**R7 — Shape and label, always both.** *Dual coding* establishes that text and
graphics together are more effective than either alone. A shape without a name is
not a shortcut, it is a riddle.

**R8 — Three shapes are explicitly ruled out.** See below.

### Shapes ruled out, and why

| Shape | Reason |
|---|---|
| **Diamond** | A decision has no place in an architecture view. The diamond belongs to the flowchart; importing it mixes two levels of abstraction. |
| **Cloud** | Ambiguous: it means “the internet”, “a cloud provider” or “I don't know”, depending on the reader. That is a *symbol overload* in the sense of R2. Use `external`. |
| **Hexagon** | No established meaning. It competes with `stream` without adding anything, and consumes a shape budget in the sense of R3. |

## Justification

Shape is the most **under-used** visual variable in architecture diagrams, and
that is a waste: it is free, it is memorable, it survives photocopying and colour
blindness. Many diagrams use nothing but rectangles and then make colour carry
all the meaning — the more fragile of the two variables.

Making it normative rather than indicative is what makes it useful: a convention
anybody can reinterpret is not a convention.

## Consequences

- Every entry in `products.json` and `roles.json` carries a `shape` field. The
  build checks that it exists in `shapes.json` and stops otherwise.
- `protocols.json` carries none: a protocol annotates an **arrow**, it is not a
  node.
- [`scripts/example.mjs`](../../scripts/example.mjs) applies the grammar; the
  diagram [`example-voltis.svg`](../example-voltis.svg) is its executable
  demonstration and serves as a visual regression test.
- Adding a ninth shape requires a new ADR superseding this one.

## Alternatives ruled out

- **Not standardising shape, relying on the guide alone.** Rejected: that is the
  starting state, and it produces a corpus where every diagram has its own
  notation.
- **Taking the UML notation as it is.** Rejected: UML trades simplicity for
  exhaustiveness, and exhaustiveness is not our problem. C4 makes the opposite
  choice and prescribes no shape at all — that void is precisely what this ADR
  fills, without contradicting C4.
- **Encoding criticality through shape** (an octagon for “critical”, say).
  Rejected by R1: the shape would then be overloaded with two dimensions, and the
  diagram would lose the ability to say what kind of object it is.

## Sources

See [the state of the art](../state-of-the-art-diagrams.md) for the full
references — Moody (*The "Physics" of Notations*, IEEE TSE 2009) for semiotic
clarity, graphic economy, semantic transparency and dual coding; Gestalt
psychology for common region; the C4 model for the legend requirement.
