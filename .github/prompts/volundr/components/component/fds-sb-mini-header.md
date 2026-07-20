---
component: fds-sb-mini-header
classification: component   # user-overridden from Volundr's initial "widget" suggestion
fileKey: WK1o7C9Dd2qm9yOvUKqVsU
pageName: fds-sb-mini-header
nodeId: "38:1045"
generatedAt: 2026-07-20T16:56:16.000Z
docsRoot: "45:22"
---
## Abstract
(none — description empty in Figma; Header abstract kept visible with
`⚑ TODO — component has no description in Figma` flag)

## Control Props
- right-margin: No, Yes            # single variant axis, no exposed BOOLEAN/TEXT properties found

## Dependencies
`{fds-sb:toggle}` (fds-sb-toggle instance, fixed embedded, not INSTANCE_SWAP)

Note: the component tree also contains a `descriptor` frame (Text + `FDS-Badge`
instance) and an `fds-sb-prebuilt.chain-button` instance, but both are
`visible = false` on every variant of this component — treated as inactive/
legacy layers and excluded from Dependencies/Anatomy.

## Anatomy
parts: root, FDS-SB-cell, icon, Text, fds-sb-toggle — tokens:
- root: Gap → spacing/fds-spacing-const/utility/fds-spacing-const-ui-gap
- FDS-SB-cell: Gap (same) + Padding right → spacing/fds-spacing-const/gap/h/fds-spacing-const-gap-h-pattern
- icon: Instance of General / user-profile-2
- Text: Type → Paragraphs/fds/fds-paragraphs-lead-bold; Color → on-surface-hi
- fds-sb-toggle: Instance of fds-sb-toggle (internal tokens belong to that component's own anatomy)

## section--component
moved — the original `fds-sb-mini-header` component set (both variants) was
moved from its original canvas position into `section--component`; no other
page/frame referenced its prior position.

## Doc-kit atoms used
design-system-label, component-title, description, description--bullet-points,
section-title, section-title--control-props, control-props--header,
control-props--row, anatomy--item (missing: none — all 9 were freshly
published on `❖ volundr-components-doc` in this file, since the file had no
doc-kit page yet)

## New atoms proposed (if any)
none — component structure mapped cleanly to the existing 9 doc-kit atoms
