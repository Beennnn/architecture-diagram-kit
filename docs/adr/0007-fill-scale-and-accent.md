# 7. Widen the fill scale, and accent one subject per diagram

Date: 2026-08-28

## Status

Accepted. Completes [ADR 0003](0003-shape-grammar.md) on fills, and finally
applies step 6 of `docs/shapes-colors-arrows.html`.

## Context

Feedback from use on the six views: “the icons are beautiful but not visible
enough, which makes it all a bit austere”, then “the boxes might be told apart
better, for an overall grasp”.

Measurement confirmed the second point and displaced the first. The nine shapes
were separated by two variables only: the corner radius and the fill. And the
fills sat in a handkerchief, measured as contrast against white:

| shape | fill | contrast with white |
|---|---|---|
| actor, device | `#F8F9FA` | 1.054 : 1 |
| zone | `#F7F9FA` | 1.056 : 1 |
| node | `#F4F6F7` | 1.084 : 1 |
| external | `#EDEFF1` | 1.153 : 1 |

Four values out of five below 1.09 : 1. That is not weak contrast, it is the
absence of contrast: a projector or a printer renders them all as white. They
claimed to separate without separating. Combined with corner radii of 0, 2 and
3 px — indistinguishable at the scale of a diagram — two pairs of shapes were one
to the eye: `application` and `actor` (same `rx`), and `service`, `node` and
`device`.

This is exactly Moody's principle of *Perceptual Discriminability* that
`docs/state-of-the-art-diagrams.md` already flagged as our weak point — but only
for the palette under deuteranopia. The same weakness was in plain sight in the
shape grammar, and nobody had seen it.

A second, more embarrassing observation: our own recipe says “add colour last,
for one dimension only”. Not one of the six views had an accented subject. We had
written the rule without ever applying it to ourselves.

## Decision

**1. The value of the fill encodes the shape and the nesting.** The scale goes
from 1.05–1.15 : 1 to 1.09–1.27 : 1, with one extra value for a zone nested
inside another:

| shape | fill | contrast with white |
|---|---|---|
| service, application, stream, store | `#FFFFFF` | reference |
| zone | `#F2F5F6` | 1.096 : 1 |
| external | `#F3F5F6` | 1.094 : 1 |
| device | `#EDF0F2` | 1.145 : 1 |
| actor | `#E8ECEF` | 1.188 : 1 |
| nested zone | `#E7EBEE` | 1.201 : 1 |
| node | `#DFE5E9` | 1.271 : 1 |

Nesting becomes readable **without following a border**: light zone, darker
nested zone, darker node still, white boxes at the bottom.

Value *doubles* that information, it does not carry it: a contained box is inside
its container, grey or not. The distinction matters, because C4 states the
opposite rule as a survival criterion for a diagram — “make sure it still makes
sense if you take away all colour, shape and size”. See
[the conventions audit](../conventions-audit.md).

**2. A diagram carries at most one accented subject,** marked by a stroke and a
title in `ACCENT` — a magenta `#A3196F` — carried by a 3.2 px stroke, thicker
than any normal stroke (the node's 2.4 included). That is the `featured`
parameter of `box()`.

`ACCENT` is a **functional colour, not a seventh layer**. It says only “this is
the subject of this diagram”, never “this belongs to that domain”. It is
therefore absent from `layers.json`, and the legend declares it separately, under
the heading “subject of the diagram”, as soon as a diagram uses it — otherwise
the reader looks for it among the layers.

The thick stroke is not decorative, it is **constitutive**. Measured under a
Viénot-Brettel-Mollon (1999) simulation, this magenta falls to **ΔE00 = 1.5 under
deuteranopia and 2.0 under protanopia from the `files` teal**: the same colour
for roughly 8 % of men, who would then read the accent as a layer — precisely
what it must not be. Weight is the second variable our own greyscale test
demands: when colour carries alone, a variable is missing.

**3. `box()` implements all nine shapes,** `boundary` included. It knew only
eight: the zones had their own local geometry in `example-systems.mjs`, which
explains how they kept their old fill without anything saying so. The source of
the fills is now unique (`FILLS` in `scripts/diagram.mjs`), and `shapes.json` is
checked against it.

## What was ruled out

- **Enlarging the symbol** (34 → 44 px). Measured: it takes the symbol from 12 %
  to 20 % of the box, without adding any variable — it still says nothing about
  the layer or the shape. And the cylinder, cut by 14 px by its ellipse, caps at
  36 px: the grammar cannot even accommodate it everywhere.
- **Replacing the label with the lockup**, and **making the lockup the box
  itself**. Both detach the name of the technology from its image: the lockup can
  only write the name of the product, never that of the instance — a bucket is
  called `voltis-invoices`, not `S3`. Putting the instance in the title relegated
  “S3” to a subtitle, far from its symbol. And recognising logos has been a
  requirement from the outset.
- **The layer ink as accent** — the first version of this ADR. It had the elegance
  of adding no colour, but re-reading the six views refuted it: four of them have
  an infrastructure subject, whose ink is an almost neutral slate. The accent was
  invisible there, and in particular unable to tell a node from its twins — same
  shape, same layer.
- **Weight alone**, without colour. It works in every layer and adds nothing to
  the palette, but was judged too discreet in use.
- **Layer hue and weight combined.** Passes both cases, but makes the visibility
  of the accent depend on the subject's layer: on a single-layer view it falls
  back to weight alone, with the same defect.

## Consequences

- The views change appearance without changing content.
- The greyscale test stays valid, and stops being a tautology: the structure used
  to survive because everything was neutral; it now survives because value really
  carries the information.
- **The set now counts seven colours, only six of which are layers.** That is the
  price paid: `ACCENT` means nothing by itself, it has to be learned. The legend
  compensates by naming it, and its use is capped at one box per diagram — beyond
  that it stops designating anything.
- The accent works whatever the subject's layer, including on a view entirely
  made of infrastructure, and tells a node from its twins.
- Three arbitration sheets keep the record of the reasoning:
  `docs/candidates-nodes.svg` (seven renderings on the nine shapes),
  `docs/candidates-fills.svg` (the variable isolated, with the blur test) and
  `docs/candidates-accent.svg`, which judges each option on the two cases that
  separate them.
