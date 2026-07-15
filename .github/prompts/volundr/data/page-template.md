# Volundr Page Template — FDS "Design Component" layout

Authoritative layout spec Volundr follows in Phase 3. Mirrors the FDS-SB
`fdssb-page-template` ("Design Component") page. Volundr builds this layout
**incrementally** (`figma-use` before every `use_figma`, ≤10 ops per call,
validate between steps) — there is no monolithic generator script.

Volundr derives everything it can from the component's **variant strings**
(Control Props, Variant grid, Surfaces matrix). Sections that need written UX
content it does not have (Usage, Anatomy, Behaviour, Best Practices, Animation,
Examples) are emitted as a **labelled placeholder + flag for the user** — never
fabricate UX guidance.

---

## Measurements — defaults vs. canonical node

The measurements below are FDS defaults. If the user supplies a **canonical
reference node** (an existing well-formed doc page), inspect it
(`get_metadata` / `get_design_context` on its sub-frames) and match its real
column widths, paddings, gaps, text styles and radii instead of the defaults.

<!-- ponytail: hardcoded FDS defaults; read from a canonical node when one is
     given, so the page can be tuned to a file's actual measurements. -->

---

## Page-level

- Documentation is added to the **same page** as the component, below/around
  the existing variant set (Volundr never moves the component set).
- Page header: title = the **component name** (e.g. `fds-sb-odds-button`, Bold)
  + a one-line **abstract** subtitle. Default the abstract to the **first
  sentence** of the component description; if the description is unavailable,
  emit the placeholder `**sostituire con uno piccolo abstract**` for the user
  to fill.
- All doc columns share an `x: 128` left margin from the section origin.

---

## Per-component layout (left → right)

```
<component name>     (page header title, Bold)
<one-line abstract>  (subtitle)
        │
 ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │ Doc col 1 1000 │  │ Doc col 2  1000  │  │ Doc col 3 hug ≤2000  │
 │ pad 40, vert.  │  │ pad 40, vert.    │  │ pad 40, vert.        │
 │                │  │                  │  │                      │
 │ • Usage      ✎ │  │ • Animation   [P]│  │ • Anatomy         ✎  │
 │ • Behaviour [P]│  │ • Icons          │  │   callout pins on    │
 │ • Best Prac.[P]│  │ • Variants    ✎  │  │   an instance +      │
 │ • Control Pr.✎ │  │ • Examples    [P]│  │   numbered legend    │
 │                │  │                  │  │   (tokens, per       │
 │                │  │                  │  │   anatomy-rules.md)  │
 └────────────────┘  └──────────────────┘  └──────────────────────┘
        │
 Surfaces matrix  — context columns × surface-background rows
```

`✎` = Volundr derives it. `[P]` = placeholder + flag (no source content).

The page header **title is the component name** (no separate `Heading` node and
no fixed `"Design Component"` string). Columns are laid out left→right inside a
horizontal `Doc Columns` frame.

1. **Doc column 1** (**1000 wide**, padding 40, vertical stack):
   - **Usage** `✎` — the component's **description** (Figma component
     `description` field). Use its **lead paragraph** as the Usage summary. Only
     if the description is empty, fall back to a `[P]` placeholder labelled
     `Usage — TODO (no source)`.
   - **Behaviour** `[P]` — labelled placeholder + flag.
   - **Best Practices** `[P]` — labelled placeholder + flag.
   - **Control Props** `✎` — table, see below.
2. **Doc column 2** (**1000 wide**, padding 40, vertical stack):
   - **Animation** `[P]` — labelled placeholder + flag.
   - **Icons** — list icon names found in the variant strings (`Icon=...`), or a
     placeholder if none.
   - **Variant grid** `✎` — every variant combination, labelled; see below.
   - **Examples** `[P]` — labelled placeholder + flag.
3. **Doc column 3** (**hug content**, capped at **max 2000 wide**; padding 40,
   vertical stack). Do **not** hardcode a fixed width — set
   `layoutSizingHorizontal = "HUG"` and `maxWidth = 2000` so the column grows to
   fit the anatomy diagrams + legend and wraps once it hits 2000.
   - **Anatomy** `✎` — callout pins on a reference instance + a numbered legend
     of every part with its **token-bound** properties. See
     **`data/anatomy-rules.md`** for the authoritative generation rules (tokens
     only, never hardcoded values).
4. **Surfaces matrix** `✎` — see below.

---

## Control Props table  (column 1)

**Frame name**: `Control`. Width 550, height `48 + Σ(row heights)`.

- **Header** row (rename any generic `Frame 2` → `Header`): `Name | Control`,
  height 48. `Name` at x:8, `Control` at x:275.
- One **`Row_[PropName]`** per control prop (rename generic `Frame 3/5/8…`):
  height 48 single-line / 60–82 multi-line, no gap between rows.
  Left cell x:8 = prop key; right cell x:275 = comma-separated values.
- Label the table **"Control Props"** (append `(fds-subcomponent)` only for a
  sub-component). Add `Row_Animation` **only** if the variants contain an
  `Animation` key.

Control props come from the variant strings: split each name by `, `, collect
unique `Key=Value` pairs, dedupe values per key, sort alphabetically.

---

## Variant grid  (column 2)

Label the block **"Variants"** (always this term) + divider line.

**Sub-type A — organized groups.** Use when the variants have a `Type` key with
2+ distinct values. Frame `Variants`, width 1013. One group frame per `Type`
value: `Type: [value]` label + `Body` frame holding the instances. First group
carries a `Banner` (all-caps category).

**Sub-type B — flat grid.** Use when variants differ only by
Theme/State/config (no semantic `Type`), typically ≤20. Frame `[componentName]`,
all instances arranged row-by-row.

**Sub-type C — nested groups (multi-axis).** Use when the set has **≥3 variant
axes** OR a flat grid would exceed **~20** instances. Never dump a flat wall of
instances — nest it so it reads as **sections and subsections**:

```
Section    = primary axis   (e.g. Direction)  → labelled `Section — <axis>: <value>`, first carries a Banner
  Subsection = secondary axis (e.g. Event)     → labelled `<axis>: <value>  (<count>)`
    Body     = WRAP frame of cells
      cell   = variant instance + a caption of the REMAINING axes
               (e.g. `Default · Selected · Pre-built`)
```

Only the two chosen axes become section/subsection; **every remaining axis goes
into the per-cell caption** so each instance is identifiable. Read the axes and
per-variant values from `component.variantProperties` (not the name string) —
pick the primary/secondary axes by lowest cardinality first, or confirm the two
grouping axes with the user when ambiguous.

Detection:
```
if (variants have key "Type" with 2+ distinct values) → Sub-type A
else if (axisCount >= 3 OR variantCount > 20)          → Sub-type C (nested)
else                                                   → Sub-type B (flat)
```

**Body background** — by keyword in the group value:

| Keyword | Fill |
|---|---|
| `on-surface` | #f5f5f5 |
| `on-alternate-surface` | #ebebeb |
| `on-header` | #e0e0e0 |
| (no match) | #f7f7f7 |

Use **instances** of the existing component set — never rebuild it.

---

## Surfaces matrix

Panel with **context columns** (Success / Error / Alert / Info / Brand) ×
**surface rows** (Surface-Variant / Surface / Alternate Surface). Each cell is
an instance of the component on that surface background. Emit only the
context/surface values that actually exist in the component's variants; if the
component has no surface/context axis, replace the matrix with a placeholder +
flag.

---

## Canonical frame naming

Original Figma files use generic names. Volundr always renames to semantic
names and **notifies the user** whenever generic names are found in existing docs.

| Generic (original) | Semantic (Volundr) |
|---|---|
| `Frame 4` | `Control` |
| `Frame 2` (inside Control) | `Header` |
| `Frame 3/5/7…` (prop rows) | `Row_[PropName]` |
| `Frame 17` (category banner) | `Banner` |
| `Rectangle 2` | `Section` |

---

## Terminology rules

1. Variant block label is always **"Variants"**.
2. Control props label is always **"Control Props"** (`(fds-subcomponent)` suffix only for sub-components).
3. Row names use the exact property key from the variant strings.
4. If a key name differs from FDS standard, **ask the user** before using it.
5. Notify the user whenever a `Frame X` name is found; ask whether to rename.

---

## Entry-point checks (before generating)

1. **Save** the page name where the component lives.
2. **Scan** the page for frames named `Control`, `Variants`, `Section`, or `[componentName]`.
3. If documentation exists → ask: overwrite, update, or skip? Wait for the answer.
4. If generic `Frame X` names exist → ask whether to rename. Wait for the answer.
5. If nothing found → proceed.

---

## Build order (incremental)

inspect canonical node (if given) → page header → Heading → column 1
(Usage/Anatomy/Icons/Control Props) → column 2 (placeholders + Variant grid) →
Surfaces matrix → `get_screenshot` → fix overlaps/clipping → report.

`figma-use` before every `use_figma`; ≤10 ops per call; validate between steps.
Return: page id, frames created, which sections are complete vs. placeholder,
and the list of placeholders flagged for the user.
