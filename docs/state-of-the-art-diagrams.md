# What the research says about diagrams

> Laid-out version: [`state-of-the-art-diagrams.html`](state-of-the-art-diagrams.html)
> (open it in a browser — GitHub does not render HTML).

There is a literature on the design of visual notations, and it is largely
ignored by the people who make diagrams. Its most consistent result: **what
decides whether a diagram reads is almost never what you spend time on.**

---

## 1. The frame of reference — Moody, *The "Physics" of Notations* (2009)

The founding paper, still without serious competition. Moody starts from a harsh
observation: in software engineering, the design effort for a notation goes
almost entirely into *semantics*, and the graphical form is handled at the end,
by eye. The discipline has mature methods for evaluating a semantics, and none
for evaluating a visual syntax.

Nine principles, four of which concern us directly:

| Principle | Statement |
|---|---|
| **Dual Coding** | Text and graphics together are more effective than either alone |
| **Graphic Economy** | The number of distinct symbols must stay within the limits of human discrimination |
| **Perceptual Discriminability** | Two symbols must be separated by a measurable *visual distance* |
| **Semantic Transparency** | The form of a symbol should suggest its meaning to someone who has never seen it |

**What we take from it.** Two decisions already taken find their theoretical
justification here. *Dual Coding* validates the lockup — sign **and** name, not
one or the other. *Graphic Economy* validates six layer colours rather than
thirty-two ([ADR 0001](adr/0001-six-layer-colours.md)).

**Where the set is weak.** *Perceptual Discriminability* is the principle our
palette breaks: under deuteranopia, `web` and `api` have a visual distance of
zero. ADR 0001 accepts that on the grounds that the name carries the information
— which is precisely the *Dual Coding* argument. It has to be said plainly: we
compensate for a weakness with another principle, we do not correct it.

---

## 2. What the empirical work measured — Purchase et al.

Where Moody theorises, Purchase measures. A series of experiments on UML class
diagrams varies five layout properties and measures actual comprehension:
accuracy, time, visual effort.

The result has not moved in twenty-five years: **minimising edge crossings is by
far the most important property** — “by far the most important” — ahead of
symmetry, angular resolution and orthogonality.

> **What we take from it.** Redrawing the layout to remove three crossings does
> more for readability than all the iconography work put together. Our lockups
> will never redeem a badly laid-out graph.

### Secondary notation — Petre (1995)

What distinguishes the expert from the novice is not knowledge of the notation
but mastery of the **secondary notation**: alignment, white space, spatial
grouping — everything defined by no formal semantics, and that the author often
produces without thinking.

A counter-intuitive consequence: **aligning the boxes that belong together, and
separating with white space those that have nothing to do with each other, is a
semantic act.** The reader will decode it, whether you meant it or not. An
accidental alignment lies.

---

## 3. Why the name must touch the sign

The most solidly established result here, because it rests on a meta-analysis
and not on an isolated study.

The **spatial contiguity principle**: people learn better when the words and the
images that refer to one another are spatially close. Its reverse, the
**split-attention effect**, measures the degradation caused by having to
mentally integrate separated sources.

A random-effects meta-analysis, 58 independent comparisons (n = 2,426):
**g = 0.63** (p < 0.001) — a medium to strong effect.

A nuance: the effect is conditioned by the **complexity of the material**. On
simple content, proximity changes little; on content with strong interactivity
between elements — which is what an architecture diagram is — the effect is
strong.

> **What we take from it.** A legend in the margin associating a colour with a
> layer **imposes** a split of attention. The name written inside the pill
> removes it. That is the empirical justification for choosing “label” over
> “symbol alone”, and it is stronger than the aesthetic argument.

---

## 4. The practical consensus — C4, arc42, Views & Beyond

The main contribution of the C4 model is not graphical: it is
**abstraction-first**, the idea that you choose the level of abstraction first —
context, container, component, code — and that a diagram never mixes two.

Often misunderstood: **C4 is deliberately notation-independent.** It prescribes
neither shape, nor colour, nor arrow style. It states one absolute requirement on
form: **every diagram must carry a key / legend** explaining the notation used.

The rest of the consensus, identical in arc42 and in the SEI's *Documenting
Software Architectures*:

- a **title** on every diagram, saying the type and the scope;
- every element carries a **name**, a **type**, a **technology** and a
  **sentence** of description;
- every arrow is **directed** and **named** — “reads the orders from”, not
  “uses”;
- **no unexplained acronym**;
- the diagram is understood **on its own**, without its author beside it.

> **What we take from it.** Our set serves the “technology” point — that is
> exactly what a lockup encodes. But it exempts none of the other rules, and
> least of all the legend: our six layer colours are a convention the reader
> cannot guess.

---

## 5. The consequence for draw.io

The question looks technical. It is settled by section 3, and the answer is the
opposite of the intuition.

Our lockups have **vectorised text** — self-contained, identical everywhere, no
font to install. That is the right answer for a sheet, a README, a slide, a
Figma file: contexts **without a composition layer**.

**In draw.io it is the wrong answer**, because draw.io *can* compose.

| Property | Name baked into the SVG | Name rendered by draw.io |
|---|---|---|
| Ctrl+F search | no | **yes** |
| Editable in place | no | **yes** — “HTTPS :8443” |
| Real text on export | no, curves | **yes**, readable by a screen reader |
| Follows the diagram's font | no | **yes** |
| Identical rendering everywhere | **yes** | depends on the available fonts |
| Usable outside the tool | **yes** | no |

**The construction**: a draw.io `.xml` library — an `<mxlibrary>` node containing
a JSON array — where every entry carries the **sign alone** (`symbols/`) as a
`data:image/svg+xml` URI, plus a `title` that becomes the label and a `style`
fixing the layer colour in `fontColor`. Separate libraries — protocols, products,
roles, and the grammar — so the picker stays navigable.

> **What we take from it.** The two sets do not compete, they serve two contexts.
> **draw.io composes** → give it the sign, it writes the name.
> **A slide does not compose** → give it the baked lockup. The repository
> produces both.

---

## Sources

- **Daniel L. Moody**, “The "Physics" of Notations: Toward a Scientific Basis
  for Constructing Visual Notations in Software Engineering”, *IEEE
  Transactions on Software Engineering* 35(6), 2009, pp. 756–779.
  [Semantic Scholar](https://www.semanticscholar.org/paper/The-%E2%80%9CPhysics%E2%80%9D-of-Notations:-Toward-a-Scientific-for-Moody/bcd2c5379a34068040750a751e4fd2710d90c15c) ·
  [ACM](https://dl.acm.org/doi/abs/10.1145/1810295.1810442)
- **Purchase, McGill et al.**, graph drawing aesthetics and the comprehension of
  UML diagrams.
  [Semantic Scholar](https://www.semanticscholar.org/paper/527ca0518fca9efdbea27c8a3289a4c8d67e22f6) ·
  [Empirical Software Engineering](https://link.springer.com/article/10.1023/A:1016344215610) ·
  [A survey of user evaluations (PDF)](https://eprints.gla.ac.uk/227646/1/227646.pdf)
- **Marian Petre**, “Why Looking Isn't Always Seeing: Readership Skills and
  Graphical Programming”, *CACM* 38(6), 1995.
  [PDF](http://www.cs.toronto.edu/~chechik/courses18/csc2125/paper12.pdf) ·
  [ACM](https://dl.acm.org/doi/abs/10.1145/203241.203251)
- **Schroeder & Cenkci**, “Spatial Contiguity and Spatial Split-Attention
  Effects in Multimedia Learning Environments: a Meta-Analysis”, *Educational
  Psychology Review*, 2018.
  [Springer](https://link.springer.com/article/10.1007/s10648-018-9435-9) ·
  [Cambridge Handbook, split-attention chapter](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/splitattention-principle-in-multimedia-learning/497A2FCB9737E3009B3CF0E4D97F7B99)
- **Simon Brown**, the C4 model. [c4model.com](https://c4model.com/) ·
  [notation](https://c4model.com/diagrams/notation) ·
  [InfoQ article](https://www.infoq.com/articles/C4-architecture-model/)
- **The draw.io library format**.
  [Documentation](https://www.drawio.com/doc/faq/format-custom-shape-library) ·
  [jgraph/drawio-libs](https://github.com/jgraph/drawio-libs)

Going further: Larkin & Simon, *Why a Diagram is (Sometimes) Worth Ten Thousand
Words* (1987) · Bertin, *Sémiologie graphique* (1967) · Cleveland & McGill
(1984) · Ware, *Information Visualization: Perception for Design* · Green &
Petre, *Cognitive Dimensions of Notations* (1996).
