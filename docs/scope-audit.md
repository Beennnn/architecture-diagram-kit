# Scope audit: does this set serve an architect, or one architecture?

Date: 2026-08-29

The question put to the set: does it cover the breadth of what an IT architect
has to draw, or is it shaped around one particular architecture? The audit is by
measurement, not by impression — the counts below come from `mapping.json` and
from the generator scripts.

## What the measurement found

**The role vocabulary is product-agnostic, and that is the strong point.** A role
describes what a building block *does* — « cache », « API gateway », « search
index » — independently of the product implementing it. That is what lets a
diagram be drawn before the technology is chosen, and it is the part of the set
least tied to any one architecture.

**But the grammar promised nine shapes the vocabulary could not express.**
Counting the roles by shape, before this audit:

| shape | roles | verdict |
|---|---|---|
| `service` | 31 | fine |
| `store` | 12 | fine |
| `node` | 3 | thin |
| `actor` | 4 | fine |
| `stream` | **1** | a queue could not be drawn generically |
| `boundary` | **1** | no network zone, no region, no tenant |
| `device` | **1** | thin |
| `application` | **0** | the shape existed and nothing could take it |
| `external` | **0** | C4's most common element at context level, absent |

Three shapes with zero or one generic role is not a matter of taste: an architect
who had not yet chosen between Kafka, RabbitMQ and SQS had no way to draw a
queue, and no way to draw a third-party system at all.

**The example views were built on one architecture.** Seven views, all of them
JVM services on Kubernetes with PostgreSQL and Kafka, all describing the same
fictional company. 52 of the 78 products never appeared in any of them. The
vocabulary was broader than the demonstration, which made the set *look* narrower
than it was.

## What was changed

**28 generic roles added**, filling the empty shapes and the domains the set did
not name:

- *message flow* — queue, topic, event bus, message broker, stream processor;
- *systems outside our control* — third-party API, SaaS provider, partner system,
  payment provider;
- *things people interact with* — web application, desktop application, admin
  console, dashboard;
- *perimeters* — network zone, availability zone, tenant;
- *hosting* — container, edge node, mainframe;
- *data and analytics* — data lake, ingestion job, batch ETL job, data catalogue;
- *machine learning* — training job, model registry, model serving, feature store;
- *integration* — file transfer.

Roles go from 53 to 81, the whole set from 163 to 191 entries. Every shape now
has at least four generic roles:

| shape | roles |
|---|---|
| `service` | 38 |
| `store` | 16 |
| `node` | 6 |
| `actor` | 4 |
| `stream` | 4 |
| `boundary` | 4 |
| `external` | 4 |
| `application` | 4 |
| `device` | 1 |

**One view in a deliberately different style.**
[`example-analytics.svg`](example-analytics.svg) draws an analytics and machine
learning pipeline on a cloud provider: no cluster, no long-running service, no
JVM. Ingestion on demand, a topic, a data lake, a nightly ETL, a warehouse, a
feature store, training, a model registry and an autoscaled inference endpoint.
It exists to prove the vocabulary is not moulded on one architecture — and it
was the test that revealed the missing roles in the first place.

## What is still missing, knowingly

- **`device` still has one role.** Physical equipment outside the information
  system is thin — no sensor, no terminal, no vehicle. It would be filled by a
  concrete IoT or industrial need, not speculatively.
- **No workflow or process notation.** Deliberate: ADR 0003 rules out the
  diamond, and a BPMN-style process is a different notation, not a gap in this
  one.
- **No cost, capacity or SLA vocabulary.** `example-layers.svg` sizes its
  services by hand; nothing in the set encodes it. That would be a marker
  family (ADR 0006), not new shapes.
- **The example views still describe one fictional company** apart from the
  layered marketplace and the analytics pipeline. That is a demonstration
  choice, not a vocabulary limit: a single running example is easier to follow
  across levels of abstraction than seven unrelated ones.
