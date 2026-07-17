---
component: fds-sb-toggle
classification: component   # atomic, single reusable element — no sub-component dependencies
fileKey: rhSXN8LjWELGgCvtCnIxM6
pageName: "🟣  FDS-SB-Toggle"
nodeId: "8175:31438"
generatedAt: 2026-07-15T17:05:00Z
variantSubtype: C
docsRoot: "8285:4"
---
## Abstract
(none — description empty; header abstract left as placeholder)

## Control Props
- Theme: on-alternate-surface, on-surface
- State: off, on
- Icon: off, on
- Style: Default
- text: no, yes

## Variant grid
Sub-type C (nested) — Section = Theme, Subsection = State, caption = `Icon · text`.
8 variants (5 on-surface + 3 on-alternate-surface), one `variants--cell` instance per variant.
Group backgrounds bound to local variables: on-surface → `var/fds/fds-surface`,
on-alternate-surface → `var/fds/fds-alternate-surface` (dark artwork).

## Anatomy
Instanced from `Anatomy--item`. Component is untokenised (no bound variables /
text styles) → every legend row shows `⚑ no bound token`. Parts: root (COMPONENT),
Toggle (FRAME), Switch (ELLIPSE). Diagrams: base on `fds-surface`, alternate on
`fds-alternate-surface` (both bound).

## Surfaces
Two `surfaces--row` instances (on-surface, on-alternate-surface), row backgrounds
bound to `fds-surface` / `fds-alternate-surface`.

## Doc-kit used
Page Header, Section, control-props--header, control-props--row, variants--cell,
surfaces--row, Anatomy--item — full kit, all instanced. (variants--cell +
surfaces--row were built in this file's Components page for this run.)

## Placeholders flagged
Usage (empty description), Behaviour, Best Practices, Animation, Examples.
