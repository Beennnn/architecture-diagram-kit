# Audit: our choices against the established conventions

Date: 2026-08-28

This audit came out of an assertion I had made from memory — “laying the label
on the line is the convention of draw.io, of AWS and of PlantUML” — which had to
be verified. It holds, but the verification brought back more than its
confirmation: two of our recent decisions are corroborated by independent
sources, one wording in our ADR 0007 has to be corrected, and a gap appears that
nobody had seen.

## What is confirmed

**The label on the line, with a knockout.** draw.io exposes
`labelBackgroundColor` on edges, commonly at `#ffffff`, and its own issue tracker
carries a request titled “add edge labels with a transparent background without
the label crossing the edge”: the text/line crossing is treated there as a
defect, and the knockout as the remedy. That is exactly the mechanism of our
`annotation()`. A nuance to my initial wording: it is a tooled convention, not a
universal factory default.

**The protocol on the arrow.** C4-PlantUML makes it a first-class parameter:
`Rel($from, $to, $label, $techn)`, where `$techn` carries “HTTPS”, “gRPC” and
is displayed on the arrow. On the AWS side, the recommendation is to label the
arrow “when the protocol or the object is not obvious”. Our choice to annotate
arrows with a protocol is therefore aligned, and our set of 32 protocols serves
precisely that point.

**Naming the instance, not the category.** The AWS diagram-writing guides
recommend that every icon carry a short, specific label describing its role —
“orders RDS (PostgreSQL)” rather than “database”. That is word for word rule
7 of our checklist, which arrived from practice (“saying we use S3 is fine, but
the bucket has to be given a name too”) and not from the literature. An
independent convergence: a good sign.

**Orthogonal routing.** AWS asks for straight lines and right angles, diagonals
only when a right angle is impossible. That is what our views do.

**The legend.** Required by C4. It is our rule R5, and our legends are derived
from the content so that they cannot lie.

## What has to be corrected on our side

**ADR 0007 overstates the role of value.** It writes that “nesting now reads by
value alone”. C4 states the opposite rule, and it is the better one: *“make
sure the diagram still makes sense if you take away all colour, shape and size —
these serve appeal and reading, not the transport of the necessary
information.”*

Our grey scale does not violate that principle, because nesting is carried first
by geometry: a contained box is inside its container, grey or not. Value
**doubles** that information, it does not carry it. But the ADR's wording
suggested otherwise, and that is exactly the kind of slippage that produces a
diagram collapsing in black and white. Corrected.

## The gap the audit reveals

**Our arrows carry the protocol or the intent, rarely both.** C4 is explicit: a
relationship reads “sends order events to, via Kafka” — the intent *and* the
transport. “Avoid saying that A uses B; say how A uses B.”

Yet in the Voltis view, five arrows carried a bare protocol (HTTPS, gRPC, MQTT,
SSH, SMTP) and four a bare verb (“publishes”, “consumes”, “drops the
invoices”, “SQL”). None carried both. A reader could see that the mobile app
speaks HTTPS to the public API, but not what it is asking for.

That was the main substantive gap between our set and the state of the art. It
is all the more notable in that our own checklist already asked for it — rule 4.
We had added the protocol and dropped the verb.

**Corrected.** The views now carry both, with two exceptions drawn from the AWS
wording — “label when the protocol or the object is not obvious”: the transport
stays silent when the receiving box already names it, and the intent stays silent
when the topology says it.

The correction cost geometry, which is the real lesson: a verb is 110 px and our
arrows were 82. It is the gaps that had to widen, not the sentences that had to
shorten until they said nothing. A mechanical check now refuses to generate a
view where a label covers a box — and it revealed an earlier overflow,
“HTTPS / TLS” over “Internet” in the foundation view, that nobody had seen.

## What we knowingly do differently

**AWS separates the label from its icon**, to allow adjustment and abbreviation.
We lock the two into a lockup. The divergence is deliberate: the AWS iconography
is a public vocabulary the reader has already learned, ours is not. *Dual coding*
is therefore more necessary to us than to them — the same argument that imposes a
legend on us where the AWS and Azure sets do without one.

**C4 wants a name, a type and a description per element.** Our runtime views
carry the name, the technology and the instance identifier, but no description:
at twelve or seventeen nodes, a sentence per box would make them unreadable.

The right answer was not to give up but to recognise that the description belongs
to another level. C4 places it at the context level, where the boxes can be
counted on one hand — and that level was missing from our set.
`example-context.svg` fills it and carries all three fields. The rule is
therefore: description at the context level, instance identifier at runtime.

## Sources

- [C4 model — notation and guidance](https://c4model.com/)
- [C4-PlantUML — relationship macros](https://plantuml-stdlib.github.io/C4-PlantUML/)
- [jgraph/drawio #1743 — edge labels and background](https://github.com/jgraph/drawio/issues/1743)
- [drawio-app — shape and edge styles](https://drawio-app.com/blog/shape-styles/)
- [AWS — architecture diagram best practices](https://miro.com/diagramming/aws-architecture-best-practices/)
- [How to Create Good AWS Architecture Diagrams](https://www.naddison.com/blog/2025_04_20_how_to_create_good_aws_architecture_diagrams/)
