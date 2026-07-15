# Volundr Page Template — FDS "Design Component" layout

Authoritative layout spec Volundr follows in Phase 3. Mirrors the FDS-SB
`fdssb-page-template` ("Design Component") page. Volundr builds this layout
**incrementally** (`figma-use` before every `use_figma`, ≤10 ops per call,
validate between steps) by **instancing the doc-kit components** (see
"Generation model" below) — it never hand-builds chrome it can instance, and it
**never generates, writes, or emits a script of any kind**: Volundr only creates
documentation directly on the selected component's Figma page.

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

- Documentation lives on the **same page as the selected component** — never on
  another page. In `use_figma`, `figma.currentPage` **resets to the first page
  every call**, so Volundr MUST: resolve the component's page (walk
  `node.parent` up to the `PAGE`), `await figma.setCurrentPageAsync(compPage)`,
  and append the docs root to **that page** — never `figma.currentPage.appendChild`
  blindly (that silently drops the docs on the first page).
- Position the docs root to the **LEFT of the component**, tops aligned:
  `docs.x = comp.x - docs.width - 200; docs.y = comp.y`. Volundr never moves the
  component set.
- Page header: title = the **component name** (e.g. `fds-sb-odds-button`, Bold)
  + a one-line **abstract** subtitle. Default the abstract to the **first
  sentence** of the component description; if the description is unavailable,
  emit the placeholder `**sostituire con uno piccolo abstract**` for the user
  to fill.
- The docs root is a self-contained frame (padding 48); the three doc columns
  sit inside its horizontal `Doc Columns` frame — there is no external section
  margin to honour.

---

## Generation model — instance the doc-kit (never hand-build chrome)

Volundr builds the documentation by **instancing purpose-built doc components**
and overriding their inner text — not by drawing raw frames + text. This keeps
every doc identical in style and lets the user restyle all docs by editing one
master. Hand-building is only a last-resort fallback (see Discovery).

### Doc-kit components (matched by name in the current file)

| Component name | Role | Fill by |
|---|---|---|
| `Page Header` | docs title + one-line abstract | override inner title / abstract text |
| `Section` | a prose/placeholder section (Usage, Behaviour, Best Practices, Animation, Icons, Examples) | override label + body text |
| `control-props--header` | Control Props table header row (Name / Control) | — |
| `control-props--row` | one Control Props row (prop key / values) | override the two cells; repeat once per prop |
| `Anatomy--item` | one numbered Anatomy legend row | override its 3 TEXT nodes: `num` (number), node name, token line |
| `variants--cell` *(to build+publish)* | a variant showcase cell: component instance (INSTANCE_SWAP) + caption | swap the instance, set caption |
| `surfaces--row` *(to build+publish)* | one Surfaces-matrix row (surface label + component instance on that surface bg) | swap instance, set label + bg variable |

The kit components have **no component properties** — set their editable text by
locating the inner TEXT nodes by name/order and overriding `characters` (load
the node's current font first, per the canonical text-edit recipe).

> **Long body text (e.g. the Usage description) clips.** `Section`'s body box is
> fixed-height, so a long paragraph overflows. After overriding the
> `Section description` node, set it `textAutoResize = "HEIGHT"` and walk its
> ancestor frames up to the instance setting `primaryAxisSizingMode = "AUTO"`
> (HUG height) so the box grows to fit instead of clipping.

### Reference layouts (frames to mirror, not components)

These are well-formed example frames in the FDS-SB Components file — copy their
structure and naming, don't instance them:

- **`Section--variants`** — the nested variant grid: `Variants` label +
  `Section — Theme: <value>` groups → `State: <value>` subsections → `Body` →
  `cell` (component instance + caption).
- **`Doc Column 3`** — the Anatomy column: `Anatomy` label + `flag-optional`
  (the no-token flag, omit when tokens exist) + `Diagrams` (each diagram = a
  component instance + numbered pins built from an `Ellipse` + number text) +
  `Legend` (a stack of `Anatomy--item` instances).

### Discovery (never import cross-file)

The user maintains the doc-kit **in every Figma file**. Before building:

1. Search the current file for each needed kit component by name
   (`findAllWithCriteria({ types: ['COMPONENT','COMPONENT_SET'] })` per page, or
   the enabled team library).
2. If a needed component is **missing**, **ask the user which page it is on**
   (or whether to proceed hand-built). Do **not** import it from another file by
   key, and do **not** silently hand-build a look-alike.
3. Once found, instance it (`component.createInstance()`), place it, override text.

Dynamic containers (the 3-column layout, the nested Variant grid, the Anatomy
diagram) are still **composed by code** — but their repeating atoms
(`control-props--row`, `variants--cell`, `Anatomy--item`, `surfaces--row`)
are instances, not hand-drawn.

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

Built from **instances** of the doc-kit, inside a `Control` frame:

- **"Control Props"** label (append `(fds-subcomponent)` only for a sub-component).
- One `control-props--header` instance (Name / Control).
- One `control-props--row` instance **per control prop** — override left cell =
  prop key, right cell = comma-separated values. Add a row for every axis;
  include an `Animation` row only if the variants carry an `Animation` key.

If the kit components are unavailable (see Discovery), fall back to a hand-built
table: `Control` frame, `Header` row (Name / Control), one `Row_[PropName]` per
prop.

Control props come from `component.variantProperties` (preferred) or the variant
name strings: collect unique `Key=Value` pairs, dedupe values per key, sort
alphabetically.

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

**Body / group background — prefer local variables.** Before choosing a fill,
query local variables (`figma.variables.getLocalVariablesAsync('COLOR')`). If the
file has surface variables (name match `fds-surface`, `fds-alternate-surface`,
`*surface*`), **bind** them to the group background instead of a hex:

| Group Theme | Bind (if a local var exists) | Hex fallback |
|---|---|---|
| `on-surface` / `surface` | `…/fds-surface` | #f5f5f5 |
| `on-alternate-surface` | `…/fds-alternate-surface` | #ebebeb |
| `on-header` | `…/fds-*-header` | #e0e0e0 |
| (no match) | — | #f7f7f7 |

**Override — dark `artwork`:** if the group's Theme is an alternate/dark surface
OR the component is very light (would wash out on a light fill), use the dark
`artwork` background instead — bind the `artwork` / darkest-surface variable (see
`anatomy-rules.md`). This override **supersedes** the light `#ebebeb`
alternate-surface fallback, which applies only to a genuinely light alternate
surface. Bind with `setBoundVariableForPaint`; **never** a hex when a variable
exists, and never a CSS-var string.

**Same rule for the Surfaces matrix and Anatomy diagrams:** every `surfaces--row`
and every Anatomy diagram picks its background the same way — bind the matching
surface variable, dark `artwork` for alternate/dark or very-light components.

Use **instances** of the existing component set for the cells — never rebuild it;
prefer the `variants--cell` doc component (INSTANCE_SWAP + caption) when present.

---

## Surfaces matrix

One **`surfaces--row`** instance per surface the component actually supports
(Surface-Variant / Surface / Alternate Surface, plus any context axis
Success / Error / Alert / Info / Brand it has). Each row shows a component
instance on that surface background — **bind** the matching local surface
variable (`fds-surface`, `fds-alternate-surface`, …) as the row background,
falling back to the hex map above only when no variable exists. Emit only the
surface/context values that actually exist in the component's variants; if the
component has no surface/context axis, replace the matrix with a placeholder +
flag.

If `surfaces--row` is unavailable (see Discovery), hand-build the rows.

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

1. **Resolve & switch to the component's page.** Walk the selected node's
   `parent` chain up to its `PAGE`; save that page's id + name;
   `await figma.setCurrentPageAsync(compPage)`. All build calls target **this**
   page. Never rely on `figma.currentPage` (it resets to the first page).
2. **Discover the doc-kit** (see Generation model): find `Page Header`, `Section`,
   `control-props--header`, `control-props--row`, `variants--cell`,
   `Anatomy--item`, `surfaces--row` in the current file. If any needed one is
   **missing → ask the user which page it is on** (or whether to proceed
   hand-built). Never import cross-file by key.
3. **Query local variables** (`getLocalVariablesAsync('COLOR')`): note whether
   `fds-surface` / `fds-alternate-surface` / `artwork` exist so backgrounds bind
   variables instead of hex.
4. **Scan the page** for existing doc frames (`Control`, `Variants`, `Section`,
   `[componentName]`). If documentation exists → ask: overwrite, update, or skip?
5. If generic `Frame X` names exist → ask whether to rename. Wait for the answer.
6. If nothing found → proceed.

---

## Build order (incremental)

discover doc-kit + query local surface variables → switch to the component's
page → create the docs root and place it to the **LEFT** of the component
(`docs.x = comp.x - docs.width - 200; docs.y = comp.y`) → instance `Page Header`
(name + abstract) → column 1 (`Section` ×3 for Usage/Behaviour/Best Practices +
Control Props from `control-props--*`) → column 2 (`Section` ×2 for
Animation/Icons + Variant grid using `variants--cell`, group bg bound to surface
vars) → column 3 (Anatomy with `Anatomy--item`, per `anatomy-rules.md`) →
Surfaces (`surfaces--row`) → `get_screenshot` → fix overlaps/clipping → **write
the per-component `.md`** (see `volundr.prompt.md`) → report.

`figma-use` before every `use_figma`; ≤10 ops per call; validate between steps.
Once the docs root's real width is known, re-assert `docs.x = comp.x -
docs.width - 200` so it stays left-aligned as content grows.
Return: page id, frames created, which sections are complete vs. placeholder,
and the list of placeholders flagged for the user.
