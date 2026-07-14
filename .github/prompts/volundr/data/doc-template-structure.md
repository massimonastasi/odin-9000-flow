# Volundr Template — FDS Component Documentation Structure

Source analysis: FDS-Badge (primary reference) cross-validated with FDS-Cell, FDS-Collapsible, FDS-ProgressBar, FDS-Toggle, FDS-Tooltip.
Figma file: `Dli7JA3N6vuTTYi4lD9qMF` — DS Fabric Components WIP

---

## Overview

Documentation is added to the **same page** as the component, positioned below existing frames.
All blocks share `x: 128px` margin from the left edge of the section.

---

## Canonical Frame Naming

Original Figma files use generic frame names. Volundr always uses semantic names and **notifies the user** whenever generic names are found in existing documentation.

| Generic name (original) | Semantic name (Volundr standard) |
|---|---|
| `Frame 4` | `Control` |
| `Frame 2` (inside Control) | `Header` |
| `Frame 3`, `Frame 5`, `Frame 7`... (property rows) | `Row_[PropertyName]` |
| `Frame 17` (category banner inside variant group) | `Banner` |
| `Rectangle 2` | `Section` |

---

## Terminology Rules

1. **Variants label**: always `"Variants"` — never "Component Variants" or anything else.
2. **Control Props label**: always `"Control Props"`. Only append sub-component name for sub-components: `"Control Props (fds-accordion)"`.
3. **Row naming**: use the exact property key from the component variant strings: `Row_Theme`, `Row_State`, `Row_Icon`.
4. **Component terminology**: follow the exact key names found in the component variant strings. When a key name differs from FDS standard, **ask the user** before using it.
5. **Generic frame names**: notify the user whenever a `Frame X` name is found in existing documentation. Ask whether to rename.

---

## Layout — Vertical Stack (top to bottom)

```
y = 128    Block 1 - Component Header        h ~ 383px
           33px gap
y = 544    Block 2 - Control Props Table     h = 48 + (rows x 48-82px)
           33px gap
           "Variants" text label             h = 33px
           Block 3 - Variants                h = variable
           Block 4 - Section #f7f7f7         h = 586px   (only if Blocks 5-6 needed)
           Block 5 - Dependencies            optional
           Block 6 - Building Blocks         optional
```

---

## Block 1 — Component Header

**Frame name**: `[componentName]`  (e.g. `Badge`, `fds-toggle`)
**Size**: 541 x 383px | **Fill**: #ffffff | **x**: 128

### 1a. Component Preview

Frame name: `Group 31`  (~170 x 150px)

```
Group 31
+-- image 1   rounded-rect 130 x 24px  - component preview screenshot
+-- text      "Fabric Foundations  Components _"  - library tag
+-- text      "{fds:componentName}"  - component reference label
```

### 1b. Description text

- Width: 541px | Height: variable (~75-225px depending on length)
- y: ~200-330px (below the preview group)
- Content: full component description paragraph

### 1c. "Control Props" heading

- Text: `"Control Props"`  (or `"Control Props (fds-subcomponent)"` for sub-components)
- Size: 161 x 33px
- y: below description (~y:350-494)

---

## Block 2 — Control Props Table

**Frame name**: `Control`
**Width**: 550px | **Height**: 48 + (N x row_height) | **x**: 128

### 2a. Header row

**Frame name**: `Header`  (original in FDS: `Frame 2` — generic, always rename)
**Size**: 550 x 48px | y: 0

| Node | Text | x | y | width |
|---|---|---|---|---|
| text | `Name` | 8 | 14.5 | 267 |
| text | `Control` | 275 | 14.5 | 267 |

### 2b. Property rows

**Frame name**: `Row_[PropertyName]`  (original: `Frame 3`, `Frame 5`, `Frame 8`... — generic, always rename)
**Width**: 550px
**Height**: 48px for single-line values — 60-82px for multi-line values
**y**: stacked from previous row, no gap

| Node | Content | x | y | width |
|---|---|---|---|---|
| text | property name | 8 | 13 | 267 |
| text | comma-separated values | 275 | 8 | 267 |

### 2c. Property row for Animation (only if present in variants)

`Row_Animation` is added **only** when the component's variant strings contain an `Animation` property key.
Do not add it if the component does not have it.

**Frame name**: `Row_Animation`

| Node | Content | x | y | width |
|---|---|---|---|---|
| text | `Animation` | 8 | 13 | 267 |
| text | `off` | 275 | 8 | 267 |

---

## Block 3 — Variants

### Variants label

- Text node: `"Variants"` — **always this term**
- Size: ~100 x 33px
- y: directly below the `Control` frame

### Sub-type A — Organized groups

**When to use**: the component has a `Type` property key with 2+ semantically distinct values
(e.g. Default / Status / Status-Surface / Neutral as in FDS-Badge).

**Frame name**: `Variants`
**Width**: 1013px | **Height**: variable | **Fill**: #ffffff | **x**: 128

```
Variants frame
+-- Content (702 x 60px, y:0)
|   +-- text "Variants"                 y:0
|   +-- text "Description goes here..."  y:64, hidden=true
+-- Divider line (1013px wide, y:84)
|
+-- [TypeValue] group frame (1013 x variable)
|   +-- Banner (1013 x 52px, y:0)     FIRST GROUP ONLY
|   |   +-- text "[CATEGORY]"  all-caps
|   +-- text "Type: [value]"   y:80 with Banner  |  y:0 without Banner
|   +-- Body (1013 x variable) y:160 with Banner  |  y:56 without Banner
|       +-- [component symbol instances]
|
+-- [TypeValue] group frame ... (repeat for each Type value)
```

**Body frame fill** — determined by keyword in the group value:

| Keyword in value | Fill |
|---|---|
| `on-surface` | `#f5f5f5` |
| `on-alternate-surface` | `#ebebeb` |
| `on-header` | `#e0e0e0` |
| (no keyword match) | `#f7f7f7` |

### Sub-type B — Flat grid

**When to use**: variants differ only by Theme / State / configuration. No semantic `Type` grouping. Typically <= 20 total variants.

**Frame name**: `[componentName]`  (e.g. `fds-toggle`, `Tooltip - TL`)
**Width**: variable | **Height**: variable
Contents: all symbol instances arranged row-by-row in a grid.

---

## Block 4 — Section background (optional)

Present only when Building Blocks or Dependencies exist below.

**Frame name**: `Section`  (original: `Rectangle 2` — generic, always rename)
**Size**: 1052 x 586px | **Fill**: `#f7f7f7` | **x**: 128
y: approximately 1610 from section origin, or directly below the Variants block

---

## Block 5 — Dependencies (optional)

Present only when the component depends on one or more other FDS components.

```
text "Dependencies"       166 x 33px
text [dependency names]   541 x ~50px
```

---

## Block 6 — Building Blocks (optional)

Present only when the component exposes a named content slot.

```
text "Building Blocks (fds-X.Content-Slot)"   473 x 33px
[componentName].Content-Slot frame             contains slot symbol instances
```

---

## Detection Logic — Sub-type A vs B

```
if (component variants contain a key "Type" with 2+ distinct values)
  use Sub-type A  (Organized groups by Type value)
else
  use Sub-type B  (Flat grid)
```

---

## Entry Point Checks (Volundr startup)

Before generating documentation, Volundr must:

1. **Save** the page name where the component lives.
2. **Scan** the page for any frames named: `Control`, `Variants`, `Section`, or `[componentName]` matching a documentation block.
3. **If documentation found**: notify the user:
   "Documentation already exists for [componentName] on page [pageName]. Overwrite, update, or skip?"
   Wait for the answer before continuing.
4. **If generic names found** in existing docs: notify the user:
   "Generic frame names detected: [Frame 2, Frame 4, ...]. Rename to semantic names?"
   Wait for the answer before continuing.
5. **If nothing found**: proceed directly with generation.

---

## Cross-Component Verification Summary

| Component | Sub-type | Has Section | Has Dependencies | Has Building Blocks |
|---|---|---|---|---|
| FDS-Badge | A | no | no | no |
| FDS-Cell | B | yes | no | no |
| FDS-Toggle | B | yes | no | no |
| FDS-Tooltip | B | yes | no | no |
| FDS-Collapsible | B | yes | yes | yes |
| FDS-ProgressBar | B | yes | no | yes |
