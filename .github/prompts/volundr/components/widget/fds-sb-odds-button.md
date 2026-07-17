---
component: fds-sb-odds-button
classification: widget   # composed of multiple sub-components (FDS-SB-prebuilt-odd, chain block/icon, up/down icons)
fileKey: RNbMGKPqYRz2vkANBdSJWx
pageName: arkamadanah
nodeId: "0:236"
generatedAt: 2026-07-15T16:40:00Z
variantSubtype: C
docsRoot: "82:212"
---
## Abstract
A sportsbook odds selection button that displays a betting market outcome with participant name, optional handicap, and current odds value.

## Control Props
- Direction: Horizontal, Vertical
- Event: Default, Disabled, Loading, Odds Down, Odds Up, Price boost
- UI State: Default, Hover
- Selected: False, True
- Pre-built: No, Yes
- Show Particpant Title: True (boolean) — exposed component property, default value shown
- Participant Title: Manchester city (xyz) — exposed component property (text), default value shown
- Show Handicap: True (boolean) — exposed component property, default value shown
- Handicap Value: +2 — exposed component property (text), default value shown

**Updated 2026-07-17**: `section--control-props` in Figma (node `120:2007`) now
includes 4 rows for exposed `BOOLEAN`/`TEXT` component properties, added after
the 5 variant-axis rows — see `variant-parsing-rules.md` § "Exposed Component
Properties" for the source/formatting rule.

## Variant grid
Sub-type C (nested) — Section = Direction, Subsection = Event, caption = `UI State · Selected · Pre-built`. 47 variants (28 Horizontal + 19 Vertical), one `variants--cell` instance per variant.

## Anatomy
Hand-built (`Anatomy--item` absent in this file). Token-resolved parts:
- root (COMPONENT) — Fill: `sportsbook/odds/fds-sb-btn-odds`, Stroke: `var/fds/fds-on-surface-ulow`, Radius: `fds-round-const/ui-controls/btn/fds-round-const-btn-sm`, Gap: `spacing/fds-spacing-const/utility/fds-spacing-const-ui-gap`
- Participant Title (TEXT) — Fill: `sportsbook/odds/fds-sb-on-btn-odds`, Type: `Paragraphs/fds-paragraphs-tiny`
- Odd (TEXT) — Fill: `var/fds/fds-on-surface-hi`, Type: `Paragraphs/fds-paragraphs-regular-bold`

## Surfaces
N/A — no surface/context axis (odds-button has no Theme/surface property).

## Doc-kit used
Page Header, Section, control-props--header, control-props--row, variants--cell.
Missing in file: Anatomy--item (Anatomy hand-built), surfaces--row (not needed — no surface axis).
No local variables in file → doc backgrounds use hex fallback; component tokens resolve to library variables.

## Placeholders flagged
Behaviour, Best Practices, Animation, Examples.
