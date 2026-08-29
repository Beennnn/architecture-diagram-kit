# 8. A logotype does not write its name twice

Date: 2026-08-29

## Status

Accepted. Amends [ADR 0002](0002-reuse-existing-logos.md), which states the
lockup as “sign + name” without foreseeing the case where the sign *is* the
name.

## Context

The catalogue went from 40 to 78 products. What held at 90 badges started to
jump out at 163: three marks in the set — `.NET`, `Go`, `vmware` — have no
symbol. They **write** the name, full stop. The lockup therefore set our label
beside them, and the name appeared twice in the same pill: “.NET” next to
“.NET”.

That is not dual coding. Moody asks for a sign **and** a text, two different
channels of reading; two texts make one, only wider.

The inventory was done by eye, on the 83 official marks enlarged, after an
attempt at automatic detection — counting sub-paths — that failed: Jaeger's owl
has 31 of them without writing anything at all, while `go` and `mysql` do not
reach the top sixteen.

The sorting displaced the initial diagnosis. Combination marks — a mark carrying
a symbol **and** its lettering — are not duplicates **at our sizes**:

| mark | ink | lettering at 30 px | verdict |
|---|---|---|---|
| `.NET` | 24 × 8.9 | 11 px, legible | logotype |
| `Go` | 24 × 9.0 | 11 px, legible | logotype |
| `vmware` | 24 × 3.8 | 4.7 px, illegible | logotype |
| `MySQL` | 24 × 16.3 (dolphin + word) | ~7 px, illegible | combination |
| `Helm` | 20.8 × 24 (wheel + word) | ~2.7 px, illegible | combination |

And it was in measuring that a second thing appeared: **`vmware` was already
illegible before the word was removed.** Inscribed in the square of the viewBox,
a band of 24 × 3.8 units writes at 4.7 px tall in a 48 px pill. We kept the word
because the mark did not speak. Removing the word without dealing with that would
have removed the duplicate by removing the information.

## Decision

**1. An entry may declare `"logotype": true`.** It means: the mark writes the
name and shows nothing else. The lockup is then the mark alone, in all three
layouts. The build refuses to lay the word back on it — it compares the number of
paths in the output with that of the source mark.

**2. A mark is placed by its ink, not by its viewBox.**
`scripts/ink-box.mjs` measures the rectangle actually inked by flattening the
path — curves sampled, arcs reduced to their centre form (SVG 1.1, F.6.5). A
logotype is then placed at the **cap height of the word it replaces**: the name
keeps its optical size, and the pill widens accordingly. `vmware` goes from 4.7 to
14 px of lettering, in a 122 px pill where the duplicate took 123.

**3. The lettering of a combination mark does not count.** A mark carrying a
symbol keeps its label, even if it also writes its name: at 30 px that lettering
is illegible, so it duplicates nothing. The word does work there.

## What was ruled out

- **Detecting logotypes automatically**, by sub-path count or ink share. No
  threshold separates Jaeger's owl from the word “vmware”. The declaration is
  editorial, and says so: it lives in `products.json`, beside the choice of mark.
- **Not generating a lockup for a logotype**, on the grounds that the mark stands
  in for one. That would have holed the catalogue: every slug has its four files,
  and a consumer iterating over the entries should not have to know the
  exception.
- **Placing the mark at the size of the sign (30 px) rather than that of the
  word.** Correct for a square mark, wrong for a band: `.NET` and `GO` would have
  gone to 30 px of lettering, twice the size of the word on a neighbouring badge.
  Cap height is what keeps the series homogeneous.
- **Fitting the ink of every mark, not just the logotypes.** No effect: Simple
  Icons already normalises each mark to the square, so for any mark as tall as it
  is wide the fit falls back on the current inscription. Only a band gains — and
  a band, here, is a logotype.
- **Widening `symbols/` too.** The square does not widen, that is its purpose
  (“constrained space”). The logotype is simply placed there by its ink, which
  gives it the usable width of the square without changing the format.

## Consequences

- Three entries out of 163 follow this rule. It is declared, not guessed.
- `scripts/ink-box.mjs` is a reusable primitive: it measures the 83 marks without
  error, which was verified by eye with a witness rectangle superimposed.
- The `annotation()` path — an arrow annotated by a logotype — exists and works,
  but **no view in the repository exercises it** and no guard rail protects it.
  That is the known debt of this decision.
- `docs/diagram-review-checklist.md` is unchanged: the rule applies to the
  lockup, not to reviewing a diagram.
