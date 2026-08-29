# draw.io libraries

Four shape libraries. Install them, do not import the SVGs.

| File | Contains |
|---|---|
| `protocols.xml` | the 32 protocol signs |
| `products.xml` | the 78 product signs |
| `roles.xml` | the 81 infrastructure role signs |
| `grammar.xml` | the nine shapes, their fills, the nested zone, the accent and the annotated arrow |

## Installing

1. `File ▸ Open Library from ▸ Device…`
2. Pick one or more of the files above.
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
node scripts/drawio.mjs
```

The generator refuses to write a library that does not carry all nine fills of
the grammar: without that check it could ship a stale version of
[ADR 0007](../docs/adr/0007-fill-scale-and-accent.md) to whoever starts from
draw.io.
