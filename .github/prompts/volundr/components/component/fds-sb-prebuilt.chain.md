---
component: fds-sb-prebuilt.chain
classification: component
fileKey: WK1o7C9Dd2qm9yOvUKqVsU
pageName: fds-sb-chain-list
nodeId: 2:37
generatedAt: 2026-07-24T14:30:00Z
docsRoot: 88:210
---
## Abstract
(none — description empty)

## Control Props
- Position: First, Middle, Last
- State: Open, Won, Lost
- Size: Big, Small
- Alt-Surface: False, True

## Dependencies
- fds-sb-prebuilt.con-chain (instance, State=Open)

## Icons
- fds-sb-prebuilt.con-chain (State=Open)
- Remove-Circle Streamline Ultimate (State=Lost)
- Check-Circle-1 Streamline Ultimate (State=Won)

## Anatomy
parts: fds-sb-prebuilt.con-chain (INSTANCE), Chain (RECTANGLE), Remove-Circle Streamline Ultimate (FRAME, no bound token), Check-Circle-1 Streamline Ultimate (FRAME, no bound token) — tokens:
- fds-sb-prebuilt.con-chain: Instance of `fds-sb-prebuilt.con-chain`
- Chain: Fill `var/fds/fds-on-surface-low` (default) / `var/fds/fds-on-alternate-surface-low` (Alt-Surface=True)
- Remove-Circle / Check-Circle icons resolve **zero** bound tokens (flagged in legend)

5 diagrams built: Base (First/Open/Big/False), Position=Middle, State=Lost, State=Won, Alt-Surface=True (dark background — no local `artwork` variable found in this file, fell back to a hardcoded dark hex, flagged to the user/design team).

## section--component
copied — user explicitly chose to keep the original component-set in place (not moved) since it is referenced elsewhere as the live source component.

## Doc-kit atoms used
design-system-label, component-title, description, description--bullet-points, section-title, section-title--control-props, control-props--header/row, anatomy--item (missing: none)

## New atoms proposed (if any)
none
