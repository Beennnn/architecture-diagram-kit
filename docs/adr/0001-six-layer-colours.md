# 0001 — Six layer colours, imposed, rather than one colour per protocol

- **Status**: accepted
- **Date**: 2026-08-28

## Context

The set covers 32 protocols. Two colour strategies were open:

1. **Generate** one colour per protocol, trying to keep them all distinguishable
   from one another.
2. **Restrict** to a small number of imposed colours, each attached to a
   category of protocols.

## Decision

**Six colours, imposed by layer** — Web & real time, API, Files, Messages &
mail, Access & security, Infrastructure. A protocol has no colour of its own: it
inherits its layer's.

The values chosen, unchanged:

| Layer | Light | Dark |
|---|---|---|
| Web & real time | `#1B5FD9` | `#6FA6FF` |
| API | `#7038D8` | `#B08CFF` |
| Files | `#0B7A6E` | `#43C9B8` |
| Messages & mail | `#B36208` | `#F0A64B` |
| Access & security | `#C0392F` | `#FF8A80` |
| Infrastructure | `#4C5A66` | `#A3B3C0` |

One exception, handled in [0002](0002-reuse-existing-logos.md): when an official
brand logo is used, it keeps **its own** colour.

## Justification

**Categorical colour has a hard capacity.** Beyond six to eight hues a reader no
longer recognises them: they go back to the legend at every occurrence. The
encoding stops working and survives only as decoration.

**With 32 colours nothing is a group any more.** If every protocol has its own,
the colour no longer says “this belongs to messaging” — it merely repeats what
the name already writes beside it.

**The set has to stay extensible.** Adding QUIC with six layers means choosing
“Network”. With 32 colours it would mean finding a 33rd hue distinguishable
from the other 32 — which does not exist.

## Consequences

### Accepted: the palette is not safe under dichromacy

CIEDE2000 perceptual distances, with a dichromacy simulation
(Viénot, Brettel & Mollon, 1999):

| | Normal vision | Worst of the three visions |
|---|---|---|
| Chosen palette | ΔE00 = **14.7** | ΔE00 = **0.1** |

Under deuteranopia — roughly 6 % of men — `web` and `api` are **strictly the
same colour**. `messaging` and `access` fall to 4.0.

This consequence is **accepted**, for a precise reason: in this set, colour is
**redundant**. Every lockup carries its name in writing. A reader who does not
distinguish blue from purple still reads “HTTP” and “REST” unambiguously.
WCAG criterion 1.4.1 — never let colour alone carry information — is satisfied by
the text, not by the palette. Colour only groups at a glance.

**This decision becomes invalid if usage shifts towards `symbols/`** — the signs
without names. There colour would become the only channel again, and this ADR
would have to be reopened.

### Other consequences

- A legend of six entries, transmissible to anyone without the catalogue.
- Every new family of protocols must be attached to a layer in
  `scripts/layers.json`; the build fails on an orphan family.

## Alternatives ruled out

Four palettes were computed and measured before deciding.

| Alternative | Guaranteed ΔE00 (3 visions) | Reason for rejection |
|---|---|---|
| 6 vivid hues, raw optimum | 14.1 | Four magentas, no green: the semantic anchoring disappears |
| 6 hues, semantic anchoring kept | 20.7 | A washed-out palette, “access” becomes brown — an aesthetic cost for 100 % of readers |
| 6 hues, only `api` moved | 4.4 | Merely moves the `web`/`api` collision onto `messaging`/`access` |
| 5 categories | 16.7 | Layers merged, granularity lost |
| 4 categories | 18.8 | Two merges; still the option if usage shifts towards `symbols/` |

**Conclusion from the measurement: six hues that are at once vivid, semantically
anchored and safe under dichromacy do not exist.** Orange and red merge, blue and
purple merge. One of the three properties has to be given up — we give up the
third, because the text compensates for it.
