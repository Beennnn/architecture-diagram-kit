# 0006 — Qualities are markers, not badges

- **Status**: accepted
- **Completes**: [0003](0003-shape-grammar.md) and [0005](0005-node-shape-and-clarifications.md)
- **Date**: 2026-08-28

## Context

A list of fifty-three candidate concepts was submitted for entry into the set.
Sorting them revealed that the set had **no device at all** for a large part of
them.

A badge names **a thing you can point at on a diagram**: a box, an arrow. Yet the
list mixed four very different natures:

| Nature | Examples | Can you point at it? |
|---|---|---|
| Product | Java, Kafka, Docker, draw.io | yes — a box |
| Role | static analysis, outbox table, coverage | yes — a box |
| **Quality or policy** | idempotent, immutable, least privilege, SemVer, RLS | **no — it qualifies a box** |
| **Architectural style** | microservices, layered, event-driven | **no — the diagram embodies it** |

## Decision

### A new device: the marker

A **quality** or a **policy** attaches to a box or an arrow as a **marker**: a
small pill with a thin outline, text in a monospaced face, no pictogram. It sits
at the edge of what it qualifies.

It is neither a shape nor a badge, and that is deliberate: giving it a shape would
suggest that an object called “immutability” exists somewhere in the system.
There is none — there is an artefact which happens to be immutable.

Two tones: neutral for an observed property, alert for a security constraint.

### An architectural style is never added to the set

“Microservices”, “layered”, “event-driven”, “functional core”,
“stateless services”, “single source of truth” will get no badge.

A style reads in the **structure** of the diagram, not in a box. The layered view
says “layered architecture” through its three bands; adding a “Layered
Architecture” label would be redundant at best and false at worst — a diagram
that has to announce its style is a diagram that does not show it.

The right place for these concepts is the ADR that decides them, not the drawing.

### Practices live in the delivery view

Formatter, static analysis, architecture test, coverage, mutation test, contract
test, SBOM, versioned decisions: these are real boxes, but **of a pipeline, not
of a system**. None of them exists at runtime.

Putting them in a runtime view would mix two levels of abstraction. A dedicated
view is therefore given to them:
[`example-delivery.svg`](../example-delivery.svg).

## Consequences

- `marker()` joins `scripts/diagram.mjs`, alongside the shapes and the badges.
- Eleven roles and five products were added from the list — the ones that really
  were things.
- Concepts with no redistributable logo take a generic pictogram: Spotless, Error
  Prone, ArchUnit, JaCoCo and PIT have no available mark, but “formatter”,
  “static analysis”, “architecture test”, “coverage” and “mutation test”
  are perfectly drawable roles — and more durable ones, since they survive a
  change of tool.
- One guard rail was added along the way: a `store` less than 60 px tall stops
  the build, because the cylinder's two ellipses then cover the label. The defect
  had reappeared three times.

## Alternatives ruled out

- **Making qualities badges like any other.** Rejected: it creates boxes for
  things that do not exist, and the reader looks for the “idempotency”
  component.
- **Writing them as free notes.** Rejected: a note gets lost in the noise of the
  arrow labels. A marker is recognisable as a class.
- **Adding architectural styles as a badge family.** Rejected for the reason set
  out above.
