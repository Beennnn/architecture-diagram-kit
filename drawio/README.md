# draw.io libraries and example pages

Four shape libraries to **install**, and one diagram to **open**.

| File | What it is | How to use it |
|---|---|---|
| `grammar.xml` | the nine shapes, their fills, the nested zone, the accent and the annotated arrow | install |
| `protocols.xml` | the 32 protocol signs | install |
| `products.xml` | the 78 product signs | install |
| `roles.xml` | the 81 infrastructure role signs | install |
| `examples.drawio` | the 10 example views, one per page, fully editable | open |

## Opening the examples

`File ▸ Open from ▸ Device…`, pick `examples.drawio`. The 10 views appear as
**page tabs along the bottom**, in the order of the README's table — from the
context view down to the inside of one component.

They are real diagrams, not pictures: every box moves, every label is text you
can edit, and **every arrow that starts or ends on a box is bound to it**, so
dragging a box takes its arrows with it: 94 of the 102 arrows are bound at both
ends, and the 8 that are not leave from a point on a bus rather than from a box,
exactly as they do in the SVG.

To lift one view into a diagram of your own: open both files, select all on the
page (`Ctrl+A`), copy, and paste into yours. To keep only some pages, right-click
a tab ▸ *Delete*. Pages can be reordered by dragging their tabs, and renamed by
double-clicking them — but draw.io has no folders for pages: the tab bar is a
flat list, which is why the pages are numbered.

Each page carries its own background colour (`Format ▸ Diagram ▸ Background`);
here all 10 are white.

Two things the pages deliberately do **not** carry:

- **the legend.** In the SVG it is derived from the content, which is what makes
  it unable to lie (rule R5 of [ADR 0003](../docs/adr/0003-shape-grammar.md)). On
  a page you are free to edit, a frozen legend would start lying at the first box
  you add. `grammar.xml` is the honest equivalent.
- **the protocol sign on the arrows.** draw.io writes an edge label as text; the
  sign would have to be a second floating cell, and it would come adrift from its
  arrow on the first move. The label keeps both registers the grammar asks for —
  the intent and the transport — as text.

## Installing the libraries

1. `File ▸ Open Library from ▸ Device…` — or `▸ URL…` and paste the raw URL of
   the file, which needs no download.
2. Pick one or more of the four libraries above.
3. Each one appears as an extra palette in the left sidebar. Drag a shape onto
   the canvas and type its name.

`grammar.xml` is the one to install first: without it you have signs but not the
conventions, and you would have to reapply the shapes, the fills and the accent
by hand.

## Why the sign alone, and not the lockup

The entries ship the **sign** — a 48 × 48 tinted square — and let draw.io write
the name itself, as the shape's label. That is not a shortcut, it is the point:

- the label stays searchable with `Ctrl+F`;
- it is editable in place, so `HTTPS` becomes `HTTPS :8443` without leaving the
  canvas;
- it exports as real text in SVG and HTML, which a screen reader can read;
- it follows the diagram's own font.

A lockup with vectorised text loses all four, and gains only a rendering
identical everywhere — which matters for a slide, not for a tool that composes.
The full reasoning is in
[the state of the art, §5](../docs/state-of-the-art-diagrams.md#5-the-consequence-for-drawio).

The label colour is set in the entry's `style`, as `fontColor`, computed to reach
4.5:1 against a white canvas — the same threshold as everywhere else in the
project. Light marks such as RSS or IPFS would otherwise give unreadable text.

## Non-obvious details of the format

A library is an `<mxlibrary>` node containing a JSON array; each entry carries a
compressed `mxGraphModel` —
`base64(deflateRaw(encodeURIComponent(xml)))`, exactly what the application
writes when it exports a library.

Two things cost an hour each and are worth recording:

- **A draw.io style is a sequence of `key=value;`**, so a value can contain
  neither `;` nor `=`. That rules out `data:image/svg+xml;base64,…`. The base64
  form without the `;base64` gets around the semicolon but no renderer decodes it
  — verified: `naturalWidth = 0`. What works is the URL-encoded SVG, where
  `encodeURIComponent` escapes precisely `;` (`%3B`) and `=` (`%3D`).
- **`arcSize` is a diameter** when `absoluteArcSize=1`, hence twice our `rx`. And
  draw.io's cylinder is `shape=cylinder3`, whose `size` is the vertical
  semi-axis of the ellipse — our `ry` of 13.

## Regenerating

```bash
node scripts/drawio.mjs            # the four libraries
node scripts/drawio-examples.mjs   # examples.drawio, from what the views recorded
```

The generator refuses to write a library that does not carry all nine fills of
the grammar: without that check it could ship a stale version of
[ADR 0007](../docs/adr/0007-fill-scale-and-accent.md) to whoever starts from
draw.io.

`examples.drawio` is written from the same declarative description as the SVGs —
`scripts/view-spec.mjs` records it as each view is rendered — so the two cannot
drift apart. Its generator refuses to write a page that loses an annotation, and
one whose arrows point at a cell that does not exist.
