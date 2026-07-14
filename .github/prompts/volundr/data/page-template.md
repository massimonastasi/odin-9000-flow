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
- Page header: title **"Design Component"** + subtitle
  "Design the component based on Figma tokens plugin".
- All doc columns share an `x: 128` left margin from the section origin.

---

## Per-component layout (left → right)

```
"Design Component"  (page header + subtitle)
        │
   Heading  — component name
        │
 ┌──────────────────────┐   ┌──────────────────────┐
 │ Doc column 1  (≈938) │   │ Doc column 2  (≈995) │
 │ padding 40, vertical │   │ padding 40, vertical │
 │                      │   │                      │
 │ • Usage         [P]  │   │ • Behaviour      [P] │
 │ • Anatomy       [P]  │   │ • Best Practices [P] │
 │ • Icons              │   │ • Animation      [P] │
 │ • Control Props ✎    │   │ • Variant grid   ✎   │
 │                      │   │ • Examples       [P] │
 └──────────────────────┘   └──────────────────────┘
        │
 Surfaces matrix  — context columns × surface-background rows
```

`✎` = Volundr derives it from variants. `[P]` = placeholder + flag (no source
content).

1. **Heading** — component name (single text/heading node).
2. **Doc column 1** (≈938 wide, padding 40, vertical stack):
   - **Usage** `[P]` — placeholder frame labelled `Usage — TODO (no source)`.
   - **Anatomy** `[P]` — placeholder; if a canonical node is given, mirror its
     annotation style.
   - **Icons** — list icon names found in the variant strings (`Icon=...`), or
     placeholder if none.
   - **Control Props** `✎` — table, see below.
3. **Doc column 2** (≈995 wide, padding 40, vertical stack):
   - **Behaviour / Best Practices / Animation / Examples** `[P]` — each a
     labelled placeholder + flag.
   - **Variant grid** `✎` — every variant combination, labelled; see below.
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

Detection:
```
if (variants have key "Type" with 2+ distinct values) → Sub-type A
else → Sub-type B
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
