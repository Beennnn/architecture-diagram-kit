# Excalidraw

Two scenes, to open and then copy-paste into your own diagrams. Copy-pasting
between scenes carries the images along.

| File | Content |
|---|---|
| `badges.excalidraw` | the 191 signs, with their names |
| `grammar.excalidraw` | the nine shapes, the nested zone, the accented subject |

## What the grammar loses here

`grammar.excalidraw` carries the fills of
[ADR 0007](../docs/adr/0007-fill-scale-and-accent.md) exactly — and those are
what carry shape and nesting. The rest degrades, which the sheet writes on
itself rather than passing over in silence:

- `strokeWidth` takes only **1, 2 or 4**: our 1.3 · 1.6 · 2.4 · 3.2 px collapse
  to 1 · 1 · 2 · 4;
- the interface offers two roundnesses only, with no radius exposed: `rx` 3, 8,
  10 and 12 become the same corner, so “device” and “application” merge;
- there is no cylinder: the store is a rectangle and an ellipse grouped, which
  nothing stops anyone from separating;
- the dashes are not parameterisable: “external” and “zone” are told apart
  by their fill alone.

This is the reason for
[ADR 0004](../docs/adr/0004-excalidraw-secondary-route.md): sketch here, produce
in draw.io, whose `grammar.xml` library carries the grammar without loss.

## Why a scene and not a library

Because an Excalidraw library **cannot contain images**.

Verified in `@excalidraw/excalidraw` 0.18.1: the `ExportedLibraryData` type
declares only `{ type, version, source, libraryItems }` — no `files` property —
and `loadLibraryFromBlob` returns nothing but `LibraryItem[]`. An `image`
element placed in a library would therefore reference a `fileId` that does not
exist, and would show as an empty frame.

A scene's `ExportedDataState` type does carry `files`. It is the only Excalidraw
format able to transport our badges.

## What the scene contains

Groups of two elements — an image (the symbol) and a text (the name) — arranged
by population. As with draw.io, **Excalidraw writes the name**, not the SVG: the
label stays selectable, editable and searchable.

Every file's identifier is the SHA-1 of its SVG, which makes the scene
reproducible from one generation to the next.

## An alternative with nothing to install

Excalidraw accepts a **drag and drop of an SVG file** onto the canvas. The files
in `symbols/` and `lockups/` therefore work directly, without going through this
scene.

## Regenerating

```bash
node scripts/excalidraw.mjs
```
