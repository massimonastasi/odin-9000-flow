# Volundr Page Template — `doc_[component-name]` layout

> **v2 (2026-07-17)** — rewritten against a real, working reference example
> found in Figma file `RNbMGKPqYRz2vkANBdSJWx`, frame `doc_fds-sb-odds-button`
> (node `120:1985`), built entirely from instances of the atoms defined in
> **`doc-components.md`** (Fase 1 of `istruzioni.md`). This supersedes the
> previous `Page Header` / `Section` / curated-"Variants"-grid model — that
> model existed **in parallel, under colliding component names**, in the same
> Figma file. Only one style is now canonical; see `doc-components.md` for why.

Authoritative layout spec Volundr follows in Phase 3. Volundr builds this
layout **incrementally** (`figma-use` before every `use_figma`, ≤10 ops per
call, validate between steps) by **instancing the doc-kit atoms** from
`doc-components.md` — it never hand-builds chrome it can instance, and it
**never generates, writes, or emits a script of any kind**: Volundr only
creates documentation directly on the selected component's Figma page.

Volundr derives everything it can from the component's **description** and
**variant strings** (Control Props, Dependencies, Icons). Sections that need
written UX content it does not have (Behavior, Composition, Usage, Animation)
reuse the same content as **Purpose** (the component's description) until the
user supplies more specific copy — never fabricate UX guidance not present in
the component's Figma description.

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
- **Root frame**: name `doc_[component-name]` (e.g. `doc_fds-sb-odds-button`).
  White background, **32px corner radius**, **64px padding** on all sides,
  vertical auto-layout, **96px gap** between its three direct children
  (`Header`, `doc-columns`, `section--component`). Place it in empty canvas
  space near the component — exact position is not load-bearing (unlike the
  old model, the component no longer stays put — see below).
- **The original component moves into the documentation.** Volundr copies (or
  moves, if the user confirms) the component/component-set into
  **`section--component`** at the bottom of the doc — it is no longer kept in
  place with the doc positioned to its left. This is a deliberate change from
  the previous model; see `section--component` below.

---

## Generation model — instance the doc-kit (never hand-build chrome)

Volundr builds the documentation by **instancing the doc-kit atoms** defined in
**`doc-components.md`** and overriding their inner text — not by drawing raw
frames + text. This keeps every doc identical in style and lets the user
restyle all docs by editing the 8 master components once. Hand-building is
only a last-resort fallback for a genuinely missing atom (see Discovery).

### Doc-kit atoms (full spec in `doc-components.md`)

| Component name | Role | Fill by |
|---|---|---|
| `design-system-label` | eyebrow above the title (design system + library name) | override the two text lines (default: "Fabric Foundations" / "Components") |
| `component-title` | page title, format `{prefix:component-name}` | override the single text node |
| `description` | any free-text paragraph (abstract, Purpose, Behavior, Composition, Usage, Animation) | override text; width fills its column |
| `description--bullet-points` | one bullet-point line (Dependencies, Icons) | override text; **duplicate the instance** for each extra bullet, don't stretch one instance |
| `section-title` | generic sub-section heading | override text (e.g. "Purpose", "Icons", "Anatomy") |
| `section-title--control-props` | Control Props heading **and** the `section--component` heading — label + parenthetical/italic suffix | override both text nodes (see below for each use) |
| `control-props--header` | Control Props table header row (Name / Control) | — (static "Name"/"Control") |
| `control-props--row` | one Control Props row | override the two cells; one instance per Control Prop |

These 8 are the **only** real doc-kit components. Everything else (`Header`,
`doc-columns`, `doc-column-1/2/3`, `section`, `section--dependencies`,
`section--icons`, `section--control-props`, `section--anatomy`,
`content--bullet-point`, `content--control-props`, `content--anatomy`,
`section--component`, `Diagram`, `Legend`, `flag-optional`) are **plain
auto-layout frames Volundr composes and names** — not instanced components.
They wrap/repeat the 8 atoms above; see "Per-component layout" for their exact
structure, sizing and gaps.

### Atoms still missing (no instance anywhere yet)

`anatomy--item` **was found** on 2026-07-17 (node `105:219` in the reference
file) — it is a real, instantiable atom (`num` circle + `txt` name/token
line), documented as atom #9 in `doc-components.md`. Instance it for the
Anatomy legend rows; do not hand-build them when this atom is available (see
Discovery above — only fall back to hand-built rows if it's missing in the
current file).

`variants--cell`, `surfaces--row` and `Banner` (from the pre-v2 model) are
**deprecated** — the curated Variant grid / Surfaces matrix they supported no
longer exists (see `section--component` below). Do not instance them in new
runs; they may still exist as orphaned components in older files. Per the
user's decision (2026-07-17), **leave any existing orphaned instances of these
in Figma alone** — Volundr does not clean them up.

### Discovery (never import cross-file)

The user maintains the doc-kit **in every Figma file**. Before building:

1. Search the current file for each of the 8 atoms by name
   (`findAllWithCriteria({ types: ['COMPONENT','COMPONENT_SET'] })` per page, or
   the enabled team library).
2. If a needed atom is **missing**, **ask the user which page it is on** (or
   whether to proceed hand-built per `doc-components.md`'s spec for that atom).
   Do **not** import it from another file by key, and do **not** silently
   hand-build a look-alike without telling the user.
3. **If two components share the same name with different specs** (this HAS
   happened in this design system before — see `doc-components.md`'s "Set A vs
   Set B" note) — stop and ask the user which one is canonical before
   instancing either. Never guess.
4. Once found, instance it (`component.createInstance()`), place it, override
   text.

---

## Per-component layout (top → bottom)

```
doc_[component-name]                         (root frame, white, 32 corner radius, pad 64, gap 96 vertical)
┌──────────────────────────────────────────────────────────────────────────┐
│ Header                                            (gap 24, vertical)     │
│  design-system-label                                                     │
│  component-title            {prefix:component-name}                     │
│  description                 full component description (abstract)      │
├──────────────────────────────────────────────────────────────────────────┤
│ doc-columns                          (horizontal, gap 96, top-aligned)   │
│ ┌─ doc-column-1 ──┐   ┌─ doc-column-2 ──┐   ┌─ doc-column-3 ───────────┐ │
│ │ gap 96, vert.   │   │ gap 96, vert.   │   │ section--anatomy         │ │
│ │ • Purpose    ✎  │   │ • Composition ✎ │   │  flag-optional (if no    │ │
│ │ • Behavior   ✎  │   │ • Usage       ✎ │   │  tokens/no anatomy--item)│ │
│ │ • Dependencies* │   │ • Animation   ✎ │   │  Diagram(s) + pins       │ │
│ │ • Icons*        │   │                 │   │  Legend (numbered)  ✎    │ │
│ │ • Control Props✎│   │                 │   │  (tokens only, per       │ │
│ │                 │   │                 │   │  anatomy-rules.md)       │ │
│ └─────────────────┘   └─────────────────┘   └──────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ section--component        "Component" | "Widget"  ·  <component-name>   │
│  the ORIGINAL component/component-set, moved here as-is — Volundr does   │
│  NOT re-lay it out, group it, or add captions. Full doc width.           │
└──────────────────────────────────────────────────────────────────────────┘
```

`✎` = Volundr derives it from the component's description/variants. `*` =
optional, only emitted when applicable (see below).

> **Hide empty sections (confirmed 2026-07-17)**: a `section` is always
> **created** (so the frame exists for future edits) but if it has no real,
> distinct content — the component's description is empty, or there's
> nothing more specific to say for that angle — set it `visible = false`
> rather than showing a `⚑ FLAG TODO` placeholder inline. If a component
> **does** have a real description, still reuse it verbatim across
> Purpose/Behavior/Composition/Usage/Animation as before — the hide rule only
> applies when there is truly nothing to show. **If every section in a
> column ends up hidden, hide the whole column too** (`doc-column-1` stays
> visible as long as Control Props has content, which it always does; if
> `doc-column-2`'s three sections are all hidden, hide `doc-column-2` itself
> so `doc-column-3` shifts left to sit next to `doc-column-1`). The
> **Header's** abstract is the one exception — it always stays visible, flag
> and all, so the page never loses its title context.

No internal padding on `Header`, `doc-columns`, the doc-columns themselves, or
any `section*` frame — the **only** padding in the whole page is the root
frame's 64px. Column widths: `doc-column-1` and `doc-column-2` are equal, fixed
width (851px in the reference — treat as tunable to the canvas, not a magic
constant: if a canonical node is supplied, match its real width instead).
`doc-column-3` is **hug width**, sized to its Anatomy content (~560px in the
reference) — never stretched to match column 1/2.

1. **`Header`** (gap 24, vertical, full width):
   - `design-system-label` instance.
   - `component-title` instance — text = `{prefix:component-name}` (see
     `doc-components.md` §2 for the prefix rule).
   - `description` instance — the **full** component description (Figma
     `description` field), not a shortened lead sentence. If the description is
     empty, flag it: `⚑ TODO — component has no description in Figma` (kept
     **visible** — see the Header exception above).
2. **`doc-column-1`** (gap 96, vertical):
   - `section` → title **"Purpose"** + `description` = the component
     description (same text as the Header abstract). **Hidden** if the
     component has no description.
   - `section` → title **"Behavior"** + `description` = the component
     description (reuse until the user gives more specific behaviour copy).
     **Hidden** if there's no description to reuse.
   - `section--dependencies` *(optional)* — only if the component's Figma
     description lists nested sub-component instances it depends on (its
     "COMPOSITION" notes, excluding icons): title **"Dependencies"** +
     `content--bullet-point` holding one `description--bullet-points` instance
     per dependency, named `{prefix:subcomponent-name}`. Duplicate the
     instance for each extra dependency.
   - `section--icons` *(optional)* — only if the component uses named icons:
     title **"Icons"** + `content--bullet-point` (gap 8) holding one
     `description--bullet-points` instance per icon name.
   - `section--control-props` → see "Control Props table" below. Always has
     content (the props table) — never hidden.
3. **`doc-column-2`** (gap 96, vertical) — three generic `section` blocks,
   titles **"Composition"**, **"Usage"**, **"Animation"**: each is a
   `section-title` + `description` reusing the component description until the
   user supplies dedicated copy for that angle. **Hidden** individually when
   empty; if all three end up hidden, hide `doc-column-2` itself (see the
   hide rule above). Omit **Animation** only if the component genuinely has
   no animated/interactive states (static component).
4. **`doc-column-3`** → `section--anatomy`, see **`data/anatomy-rules.md`**
   for the authoritative generation rules (tokens only, never hardcoded
   values); container naming below.
5. **`section--component`** (full doc width, below `doc-columns`) — see its own
   section below. This **replaces** the old curated "Variant grid" +
   "Surfaces matrix": Volundr no longer builds a bespoke showcase grid.

---

## Control Props table  (`section--control-props`, in `doc-column-1`)

```
section--control-props                    (gap 24, vertical)
  section-title--control-props            "Control Props" + italic component-name
  content--control-props                  (vertical stack, rows adjacent, gap 0)
    control-props--header                 ("Name" / "Control")
    control-props--row  × N               one per Control Prop
```

- `section-title--control-props`: left text = fixed **"Control Props"**; italic
  suffix = the **component name** (e.g. `fds-sb-odds-button`) for the main
  component, or the **sub-component's name** when duplicated (see next bullet).
- One `control-props--header` instance (static "Name" / "Control").
- One `control-props--row` instance **per Control Prop** — left cell = prop
  key (e.g. `Direction`), right cell = comma-separated possible values (e.g.
  `Horizontal, Vertical`). Control props come from `component.variantProperties`
  (preferred) or the variant name strings — see `variant-parsing-rules.md` for
  the extraction algorithm (still authoritative for **this** table, even though
  it no longer drives a separate variant-grid display).
- **Exposed component properties** (`BOOLEAN` / `TEXT`, from
  `component.componentPropertyDefinitions`) get a row too, appended **after**
  the variant-axis rows — e.g. `Show Handicap` → `True (boolean)`,
  `Handicap Value` → `+2`. `INSTANCE_SWAP` properties do **not** get a row
  here — they belong in Dependencies. See `variant-parsing-rules.md` §
  "Exposed Component Properties" for the full type/formatting rule.
- **Sub-component duplication**: if the page has other components used
  **inside** the main one, named `[component-name].[block/subcomponent-name]`
  (e.g. `fds-sb-odds-button.chain` — parent component name, a literal dot,
  then the block/subcomponent's own name; **confirmed 2026-07-17**, replaces
  the earlier `block.[nome]`/`[nome].block` guesses) — duplicate the
  **entire** `section--control-props` block once per sub-component, with the
  italic suffix set to that sub-component's name.

If the 8 doc-kit atoms are unavailable (see Discovery), fall back to a
hand-built table using the same structure and naming.

---

## `section--component` (bottom of the page — replaces the old Variant grid + Surfaces matrix)

```
section--component                         (gap 24, vertical, full doc width)
  section-title--control-props             "Component" | "Widget"  +  italic <component-name>
  <the original component / component-set> (moved here as-is, full width)
```

- Reuses the **`section-title--control-props`** atom, but with its fixed left
  text changed to **"Component"** or **"Widget"** (see the classification rule
  below) instead of "Control Props"; the italic suffix is still the component
  name.
- The body is the **actual original component/component-set** Volundr was
  asked to document — copied or moved wholesale into this frame, at its own
  existing internal layout/grid. **Do not** re-group it, add per-cell
  captions, bind group/surface backgrounds, or otherwise curate it — that
  entire model (Sub-type A/B/C nested grids, `variants--cell`,
  `surfaces--row`, per-Theme background binding) is **deprecated**. If the
  user wants a curated/annotated showcase instead of the raw component, ask
  before building one — don't default to it.
- **Component vs. Widget** classification (confirmed with the user
  2026-07-17): **Component** = atomic, systematic — a single reusable element.
  **Widget** = composed of multiple components, usually built for one
  specific purpose/context. Ask the user when a component's classification is
  not obvious from its Figma structure.
- Moving vs. copying the original component into this frame, and whether the
  component keeps a separate reference elsewhere on the page, is an
  **open question** (see `istruzioni.md` — not yet settled for every case).
  Default to **moving** it (per the confirmed Q5 answer) but confirm with the
  user before doing so on a component that has other pages/frames referencing
  its current position.

---

## `section--anatomy` (`doc-column-3`)

```
section--anatomy                           (gap 24, vertical)
  section-title                            "Anatomy"
  content--anatomy                         (gap 24, vertical)
    flag-optional                          (only if no bound tokens / no anatomy--item — "⚑ …")
    Diagram — <variant label>  × 1 or more (reference instance + numbered pins)
    Legend                                 (gap ~12, numbered items: num circle + txt)
```

Full generation rules (which variants to annotate, token resolution table,
diagram background choice, pin/legend formatting) are authoritative in
**`data/anatomy-rules.md`** — this file only defines the **container naming**
(`section--anatomy` / `content--anatomy` / `flag-optional` / `Diagram` /
`Legend`), which now sits directly in `doc-column-3` (there is no more generic
`Doc Column 3` wrapper name — the anatomy section frame **is** the column).
`anatomy--item` **is a real atom** (found `105:219`, see `doc-components.md`
§9) — instance it for each legend row; only hand-build a row if this atom is
missing in the current file, and flag that to the user.

---

## Canonical frame naming

Original Figma files use generic names. Volundr always renames to semantic
names and **notifies the user** whenever generic names are found in existing docs.

| Generic (original) | Semantic (Volundr) |
|---|---|
| `Frame 4` (etc., prop table wrapper) | `content--control-props` |
| `Frame 2` (header row) | `control-props--header` (atom) |
| `Frame 3/5/7…` (prop rows) | `control-props--row` (atom) |
| `Frame 17` (category banner) | *(no longer used — `Banner` is deprecated, see `section--component`)* |
| `Rectangle 2` | `section` |

---

## Terminology rules

1. `section--component`'s title is always **"Component"** or **"Widget"** (see
   classification rule above) — never "Variants".
2. Control Props label is always **"Control Props"**; the italic suffix is
   always the (sub-)component's exact name.
3. Control Props row names use the exact property key from the variant
   strings/`variantProperties`.
4. If a key name differs from FDS standard, **ask the user** before using it.
5. Notify the user whenever a `Frame X` name is found; ask whether to rename.

---

## Entry-point checks (before generating)

1. **Resolve & switch to the component's page.** Walk the selected node's
   `parent` chain up to its `PAGE`; save that page's id + name;
   `await figma.setCurrentPageAsync(compPage)`. All build calls target **this**
   page. Never rely on `figma.currentPage` (it resets to the first page).
2. **Discover the doc-kit** (see Generation model): find the 8 atoms
   (`design-system-label`, `component-title`, `description`,
   `description--bullet-points`, `section-title`,
   `section-title--control-props`, `control-props--header`,
   `control-props--row`) in the current file. If any needed one is **missing →
   ask the user which page it is on** (or whether to proceed hand-built per
   `doc-components.md`). Never import cross-file by key. **If a name collision
   with a different spec is found, stop and ask which is canonical** (see
   `doc-components.md`'s Set A/Set B note) — never silently pick one.
3. **Scan the page** for an existing `doc_[component-name]` frame. If
   documentation exists → ask: overwrite, update, or skip?
4. If generic `Frame X` names exist → ask whether to rename. Wait for the answer.
5. If nothing found → proceed.

---

## Build order (incremental)

discover the 8 doc-kit atoms → switch to the component's page → create the
`doc_[component-name]` root (white, 32 radius, pad 64, gap 96) → `Header`
(`design-system-label` + `component-title` + `description`) → `doc-columns`
→ `doc-column-1` (Purpose/Behavior/Dependencies*/Icons*/Control Props) →
`doc-column-2` (Composition/Usage/Animation) → `doc-column-3`
(`section--anatomy`, per `anatomy-rules.md`) → `section--component`
(move/copy the original component in, titled "Component"/"Widget" + name) →
`get_screenshot` → fix overlaps/clipping → **write the per-component `.md`**
(see `volundr.prompt.md`) → report.

`figma-use` before every `use_figma`; ≤10 ops per call; validate between steps.
Return: page id, frames created, which sections reused the description
verbatim vs. got dedicated copy, and any atom-collision or missing-atom
questions raised to the user.

> **Auto-layout height gotcha (found 2026-07-17 during live testing)**: never
> call `resize(w, h)` on an `AUTO`-height auto-layout frame **before**
> appending its children — it can pin the frame at whatever placeholder
> height was passed, silently clipping every child added afterward (even with
> `clipsContent = false` the frame's own declared height stays wrong, which
> throws off every sibling positioned after it). If a frame's height looks
> wrong after building, force a relayout by toggling its sizing mode off and
> back on (`primaryAxisSizingMode = 'FIXED'` then `'AUTO'`) **after** all
> children exist. Always verify real heights via `get_metadata` — not just a
> screenshot — before trusting the layout and moving to the next step.

