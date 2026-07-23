---
component: fds-sb-showcase
classification: component   # corrected 2026-07-23 — user explicitly stated this is a component, not a widget (Volundr's prior structural inference was wrong)
fileKey: WK1o7C9Dd2qm9yOvUKqVsU
pageName: fds-sb-showcase
nodeId: "3:1759"
generatedAt: "2026-07-23T09:49:51Z"
docsRoot: "68:106"
---
## Abstract
This component is the accordion variant for sportsbook and contains the event tables.

## Control Props
- Card Style: content, full, no-h-alignment            # variant axis
- Show Descriptor: False (boolean)
- Show Descriptor Badge: False (boolean)
- Show Extra Line: False (boolean)
- Show Favorites Icon: False (boolean)
- Show Leading Icon: False (boolean)
- Show Toggle: False (boolean)

## Dependencies
`{fds-sb:cell}` (header row), `{fds:accordion.content-slot}` (INSTANCE_SWAP content slot, confirmed via layer evidence — dot-notation name, `{children}` receiver, present across all Card Style variants), `{fds-sb:toggle}` (shown when Show Toggle = true), `{fds-sb-prebuilt:chain-button}` (favorites icon button, shown when Show Favorites Icon = true), `{fds:badge}` (descriptor badge, shown when Show Descriptor Badge = true)

## Icons
`user-profile-2` (General library) — leading icon, shown when Show Leading Icon = true

## Anatomy
Base variant annotated: Card Style = no-h-alignment. Parts (8): header, FDS-SB-cell, user-profile-2, Text (Cell Title), FDS-Badge, fds-sb-prebuilt.chain-button, fds-sb-toggle, FDS-Accordion.Content-Slot — tokens: fds-spacing-const-ui-gap (gap, multiple nodes), fds-spacing-const-gap-h-pattern (padding-right), Paragraphs/fds/fds-paragraphs-lead-bold (text style), spacing/spacing-small (padding), plus 4 Instance-of references (user-profile-2, FDS-Badge, fds-sb-prebuilt.chain-button, fds-sb-toggle). No diagrams built for "content"/"full" variants — the shared header anatomy is representative across all three; only the accordion content-slot styling differs between them (not separately annotated).

## section--component
moved — only doc frame + reference on this page; no other page referenced the component-set's prior canvas position.

## Doc-kit atoms used
design-system-label, component-title, description, description--bullet-points, section-title, section-title--control-props, control-props--header, control-props--row, anatomy--item (missing: none)

## New atoms proposed (if any)
none
