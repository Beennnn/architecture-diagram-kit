# 0005 — A ninth shape: the deployment node

- **Status**: accepted
- **Amends**: [0003 — A shape grammar, normative and closed](0003-shape-grammar.md)
- **Date**: 2026-08-28

## Context

[ADR 0003](0003-shape-grammar.md) fixed eight shapes, and stated that a ninth
would require a new ADR. It was written **before** being put to the test: the two
example diagrams of the time went neither down to the hardware nor up to the
code.

Three views were built to test it — hardware and network foundation, Kubernetes
platform, the inside of a Spring Boot service. They revealed one gap and three
imprecisions.

## Decision

### A ninth shape: `node`

| Shape | Nature encoded | Geometry |
|---|---|---|
| `node` | a machine that **hosts**: physical server, virtual machine, cluster node | square-cornered rectangle, thick stroke, recessed fill |

It really was missing. A server is neither a `service` — it does not run code, it
hosts it — nor a `device`, which designates equipment **outside** the information
system. Without it, the three views could not tell the machine from what runs on
it.

The budget of ADR 0003 therefore goes from eight shapes to nine. That is an
overrun knowingly accepted, not a drift: nine stays within the limits of human
discrimination, and no other shape was judged necessary once the test was over.

### R9 — A container carries its label at the top

A shape containing others — `boundary`, and `node` as soon as it hosts — cannot
centre its label: the child boxes cover it. Observed literally on the first
version of the hardware view, where the titles “Server A” and “Server B” were
invisible.

### R10 — A pictogram serves one entry only

An executable corollary of rule R2. The check now lives in the build, which stops
and names the offending entries.

It immediately found four pre-existing collisions: `server-2` shared between NFS
and the server role, `file-code` between SOAP and configuration, `router` between
DHCP and the router role, `bucket` between S3 and object storage. All arbitrated
— the pictogram goes to the entry it designates most accurately, and the other
takes a metaphor of its own: NFS becomes a share, DHCP a lease.

### Two clarifications of use

**`store` designates data that survives a restart — not data as such.** In a code
view, a domain entity or a configuration file are pieces of code: they take
`service`. The real stores are outside the component. The first version of the
component view drew the “Order” entity as a cylinder, which made it look like a
table.

**A protocol badge marks the crossing of a boundary, not a method call.** Inside
a component, links carry a verb — “calls”, “persists” — never a badge. A
protocol only means something between two boxes that do not share the same
execution space.

## Consequences

- `shapes.json` holds nine shapes; the “no addition without a removal” rule of
  ADR 0003 stays in force from nine onwards.
- The three views now serve as regression tests for the grammar:
  [foundation](../example-infra.svg), [platform](../example-k8s.svg),
  [component](../example-component.svg).
- They are **deliberately separate**. Hardware, platform and code are three
  levels of abstraction; putting them together would break the rule forbidding
  two of them in one diagram. Each view names in its subtitle the link with the
  previous one: the VMs of the foundation are the nodes of the cluster, a pod of
  the cluster is the component opened up.

## Alternatives ruled out

- **Using `device` for servers.** Rejected: `device` designates equipment outside
  the information system — a charge point, a sensor. A production server is an
  integral part of it, and above all it hosts.
- **Using `boundary` for servers.** Rejected: a boundary is a logical grouping
  with no existence of its own, and no arrow connects to it. A server is a real
  object, one you cable up and reboot.
- **Adding a `module` shape as well, for code views.** Rejected after testing:
  `boundary` is enough to group the layers of a component, as the component view
  shows.
