# Volundr Doc-Kit — `doc-components.md`

Canonical spec of the **doc-kit atoms** used by Volundr to build the visual
documentation of a Figma component, derived by analyzing via Figma MCP the
real set already existing in the reference file.

> **Source**: Figma file `RNbMGKPqYRz2vkANBdSJWx`, `components` section
> (node `120:1984`). **The `components` section itself is not an atom** — it
> is only the container/organizer used in that file to group the 8 real
> components below. Volundr instances the components listed below, never the
> container.
>
> **Decision made with the user (2026-07-17)**: this set (`design-system-label`,
> `component-title`, `description`, `description--bullet-points`,
> `section-title`, `section-title--control-props`, `control-props--header`,
> `control-props--row`) is **canonical** and replaces the `Page Header` /
> `Section` naming used until now in `page-template.md` (which in the same
> file existed in parallel with duplicate names `control-props--header/row`
> but different specs — collision now resolved in favor of this set).
> The source set's colors are **hardcoded** (rgba); they need to be
> **re-tokenized** to the equivalent FDS variables before/during publishing to
> a new file (see "Proposed token" column in each table — to be confirmed with
> the user/design team **before binding**, not yet applied).

---

## 1. `design-system-label`

**Source node**: `105:229` (166×42, hug content, `flex-col items-start`)

- **a. Purpose**: eyebrow/label at the top-left of the header that identifies
  the design system and the library category the documented component belongs
  to (e.g. "Fabric Foundations / Components").
- **b. Structure**: frame with two stacked TEXT nodes, no extra container.
- **c. Alignment**: vertical, `items-start` (left-aligned).
- **d. Ordering**: row 1 = design system name (uppercase), row 2 =
  category/library name.
- **e. Sizing**: hug width (166px in the source, not fixed — it adapts to the
  text); no fixed height.
- **f. Padding/margin**: no inner padding; gap 0 between the two rows (the two
  `<p>` are adjacent, not a frame with `gap`).
- **g. Internal elements**:
  | Row | Font | Size | Tracking | Case | Hardcoded color | Proposed token |
  |---|---|---|---|---|---|---|
  | 1 — design system name | Open Sans Bold | 15px | -0.15px | UPPERCASE | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |
  | 2 — library name | Open Sans Regular | 16px | -0.16px | normal | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

---

## 2. `component-title`

**Source node**: `105:230` (352×49, hug, `items-center`)

- **a. Purpose**: main title of the documentation page — the component name
  in **`{prefix:component-name}`** format.
- **b. Structure**: a single TEXT node.
- **c. Alignment**: `items-center` (within its own frame, which is still hug).
- **d. Ordering**: n/a (single element).
- **e. Sizing**: horizontal hug, `whitespace-nowrap` (does not wrap — if the
  name is very long the frame widens).
- **f. Padding/margin**: none.
- **g. Internal elements**:
  | Font | Size | Tracking | Hardcoded color | Proposed token |
  |---|---|---|---|---|
  | Open Sans Bold | 36px | -0.36px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

  **Title format** (confirmed by the real reference `Button-Control`):
  `{prefix:component-name}` — e.g. the component `fds-sb-odds-button` becomes
  `{fds-sb:odds-button}`, `fds-button` becomes `{fds:button}`. The prefix is
  the part before the second meaningful hyphen (`fds` / `fds-sb` / other
  design-system namespaces); the rest of the name goes after the colon.

---

## 3. `description`

**Source node**: `105:231` (550×25 in the kit — **550px is the preview kit's
width, not a fixed value to reuse**: in real use inside a documentation
column, the width follows the column's content, e.g. 920/937px in
`Button-Control`, the original hand-made reference)

- **a. Purpose**: free-text paragraph — used for the abstract, Usage,
  Behaviour, Best Practices, Animation, Examples: any plain-prose section.
- **b. Structure**: a single TEXT node, `flex-[1_0_0]` (stretches to fill the
  container).
- **c. Alignment**: vertical `items-center` in its own frame (text not
  horizontally centered, only the block is vertically centered if the frame
  is taller than the text).
- **d. Ordering**: n/a.
- **e. Sizing**: horizontal **fill** (follows the width of the hosting
  column), hug height.
- **f. Padding/margin**: none on the node itself (padding comes from the
  hosting container, e.g. `Doc Column N` with padding 40).
- **g. Internal elements**:
  | Font | Size | Tracking | Hardcoded color | Proposed token |
  |---|---|---|---|---|
  | Open Sans Regular | 18px | -0.18px | `black` (`#000`) | `var/fds/fds-on-surface-hi` |

---

## 4. `description--bullet-points`

**Source node**: `108:2843` (550×25 in the kit, same width note as
`description`)

- **a. Purpose**: variant of `description` for **bulleted-list** content
  (e.g. "Dependencies" — instances/names of sub-components; "Icons" — icon
  list). Corresponds to the `content--bullet-point` container (see
  `page-template.md`).
- **b. Structure**: `<ul>` with one or more `<li class="list-disc">`; each
  bullet is a text `<span>`.
- **c. Alignment**: vertical `items-center` in the hosting frame, horizontal
  `flex-[1_0_0]`.
- **d. Ordering**: one `<li>` per row, in the order the elements
  (instances/icons) are listed.
- **e. Sizing**: horizontal fill (same note as `description`).
- **f. Padding/margin**: bullet indent `ms-[27px]` (list margin-start); no
  outer padding.
- **g. Internal elements**:
  | Font | Size | Tracking | Hardcoded color | Proposed token |
  |---|---|---|---|---|
  | Open Sans Bold Italic | 18px | -0.18px | `black` (`#000`) | `var/fds/fds-on-surface-hi` |

  **Duplication rule**: if the section (e.g. Dependencies) has more than one
  instance to list, duplicate the `<li>` inside the same block — don't create
  more separate instances of the component.

---

## 5. `section-title`

**Source node**: `108:2812` (142×33, hug, `items-center`)

- **a. Purpose**: generic sub-section title (Usage, Behaviour, Best
  Practices, Animation, Icons, Composition, Examples, etc.) — the placeholder
  text in the kit is `section-title`, replace it with the real name.
- **b. Structure**: a single TEXT node.
- **c. Alignment**: `items-center`.
- **d. Ordering**: n/a.
- **e. Sizing**: hug, `whitespace-nowrap`.
- **f. Padding/margin**: none.
- **g. Internal elements**:
  | Font | Size | Tracking | Hardcoded color | Proposed token |
  |---|---|---|---|---|
  | Open Sans Bold | 24px | -0.24px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

---

## 6. `section-title--control-props`

**Source node**: `105:232` (537×33, `flex items-center gap-[8px]`)

- **a. Purpose**: special title for the **Control Props** section — combines
  the fixed name "Control Props" with a suffix in parentheses indicating the
  **role/name of the (sub-)component** the table refers to (e.g. "Main
  Wrapper / Composition Host" for the main component). For a sub-component the
  suffix becomes its name (detection pattern:
  `[component-name].[block/subcomponent-name]`, confirmed by the user on
  2026-07-17 — see table below).
- **b. Structure**: two TEXT nodes side by side with an 8px gap: fixed label +
  descriptive suffix.
- **c. Alignment**: `items-center`, horizontal.
- **d. Ordering**: "Control Props" label **first**, suffix in parentheses
  **after**.
- **e. Sizing**: hug, `whitespace-nowrap`.
- **f. Padding/margin**: 8px gap between the two nodes, no outer padding.
- **g. Internal elements**:
  | Part | Font | Hardcoded color | Proposed token |
  |---|---|---|---|
  | "Control Props" (fixed) | Open Sans Bold, 24px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |
  | "(sub-component role/name)" | Open Sans Italic, 24px | `rgba(0,0,0,0.6)` | `var/fds/fds-on-surface-m` |

  **Duplication rule (pattern confirmed 2026-07-17)**:
  if the page contains other components used **inside** the main component —
  named `[component-name].[block/subcomponent-name]` (e.g.
  `fds-sb-odds-button.chain`: parent component name, a literal dot, then the
  block/sub-component name) — duplicate the entire Control Props block (this
  title + `control-props--header` + one `control-props--row` per property)
  once for each sub-component, with the suffix updated to its name.

---

## 7. `control-props--header`

**Source node**: `105:233` (width 550px in the kit — see the note on
`description`: in real use it follows the width of the column/table, e.g.
920–937px)

- **a. Purpose**: header row of the Control Props table — "Name" / "Control"
  columns.
- **b. Structure**: horizontal flex frame, two `flex-[1_0_0]` cells.
- **c. Alignment**: `items-center`, horizontal, evenly split cells.
- **d. Ordering**: "Name" on the left, "Control" on the right.
- **e. Sizing**: horizontal fill (table width), height hug, minimum height 32px.
- **f. Padding/margin**: `padding-y: 12px`; **bottom-only** 1px solid border
  (`strokeBottomWeight = 1`, `strokeTopWeight/Left/Right = 0`,
  `strokeAlign = 'INSIDE'` — not a border on all 4 sides).
- **g. Internal elements**:
  | Element | Font | Size | Tracking | Case | Hardcoded color | Token |
  |---|---|---|---|---|---|---|
  | "Name" / "Control" | Open Sans Bold | 14px | -0.14px | UPPERCASE | `black`, opacity 80%, border `rgba(0,0,0,0.24)` | text → `var/fds/fds-on-surface-hi`; border → **`var/fds/fds-on-surface-ulow`** (confirmed and bound successfully on 2026-07-17 on the test file) |

---

## 8. `control-props--row`

**Source node**: `105:234` (width 550px in the kit, same note as
`control-props--header`)

- **a. Purpose**: one row of the Control Props table — a property (Name) and
  its possible values (Control), comma-separated.
- **b. Structure**: horizontal flex frame, two `flex-[1_0_0]` cells; left cell
  = single text (prop name), right cell = single text (comma-separated
  values).
- **c. Alignment**: `items-start`, horizontal.
- **d. Ordering**: property name on the left, values on the right — **one row
  per detected Control Prop** (see `variant-parsing-rules.md`).
- **e. Sizing**: horizontal fill, height hug, minimum height 32px.
- **f. Padding/margin**: `padding-y: 12px`; **bottom-only** 1px solid border,
  same implementation as `control-props--header`
  (`strokeBottomWeight = 1`, other sides 0), so the rows stack with a
  continuous separator.
- **g. Internal elements**:
  | Element | Font | Size | Tracking | Hardcoded color | Token |
  |---|---|---|---|---|---|
  | Prop name (e.g. "Count") | Open Sans Bold | 16px | -0.16px | `black`, opacity 80% | `var/fds/fds-on-surface-hi` |
  | Values (e.g. "1,2,3") | Open Sans Regular | 16px | -0.16px | `black`, opacity 80% | `var/fds/fds-on-surface-hi` |
  | Bottom border | — | — | — | `rgba(0,0,0,0.24)` | **`var/fds/fds-on-surface-ulow`** (confirmed and bound successfully on 2026-07-17 on the test file) |

---

## 9. `anatomy--item`

**Source node**: `105:219` (340px, `flex gap-[10px] items-start`) — **found on
2026-07-17**, already exists as a real component elsewhere on the same page of
file `RNbMGKPqYRz2vkANBdSJWx` (outside the `components` section that groups
the other 8). This corrects what was written so far in `page-template.md` and
`anatomy-rules.md` (which listed it as missing/hand-built) — it must be
**instanced** like the other atoms.

- **a. Purpose**: a numbered row in the Anatomy legend — pairs the numbered
  pin on the diagram with the node name and its token-bound properties (or
  the "no token" flag when it isn't bound).
- **b. Structure**: horizontal frame (`num` + `txt`), gap 10.
  - `num`: 22×22 circle, `rounded-[11px]` (50%), centered content = number.
  - `txt`: column (gap 2) with two rows: node name + type, then a
    property/flag row.
- **c. Alignment**: horizontal `items-start` (root), `items-center` inside
  `num`, `items-start` in `txt`.
- **d. Ordering**: `num` on the left, `txt` on the right; inside `txt`, node
  name above, property/flag row below.
- **e. Sizing**: 340px width in the kit (hug/adaptable to text, not a rigid
  value — verify against a canonical node if available); `num` fixed at
  22×22.
- **f. Padding/margin**: gap 10 between `num` and `txt`; gap 2 between the two
  `txt` rows; no outer padding.
- **g. Internal elements**:
  | Element | Font | Size | Hardcoded color | Proposed token |
  |---|---|---|---|---|
  | Number inside `num` | Open Sans Bold | 12px | `white` on `#d93326` background (red, hardcoded) | text → unchanged (white on accent); background → **to be verified** (no FDS "pin/accent" token identified yet — propose `var/fds/fds-*-accent` or similar and confirm with the design team before binding) |
  | Node name + type (e.g. "root (COMPONENT)") | Inter Semi Bold | 14px | `#17171c` | `var/fds/fds-on-surface-hi` |
  | Property / flag row (e.g. "⚑ no bound token") | Open Sans Regular | 12px | **already tokenized**: `var/on-surface-m` (`rgba(0,0,0,0.6)` fallback) | unchanged — it's the only text in the set already bound to a variable in the source file |

  Follows exactly the format already described in `anatomy-rules.md` (number +
  node name + one row per resolved property, or the flag when there's no
  token) — that file remains authoritative on **which** properties to show and
  how to resolve them; this atom is just its visual container, now real.

---

## Atoms still missing from the kit (updated 2026-07-17)

`anatomy--item` **is no longer missing** (see §9 above). Still to close:
`variants--cell`, `surfaces--row`, `Banner` — but these three are **deprecated**
after the `page-template.md` v2 rewrite (the original component is moved as-is
into `section--component`, no longer shown via a curated grid) and **should no
longer be searched for or rebuilt**, unless the user explicitly requests a
curated showcase for a specific case.

`section--component` (the section at the bottom of the page that hosts the
original component) remains a **frame composed by Volundr**, not a standalone
component — it reuses the `section-title--control-props` atom for its title
(see `page-template.md`).

---

## Kit extension — detecting repeated patterns (added 2026-07-17)

Rule valid both in **Phase 1** (analysis/construction of `doc-components.md`)
and at **runtime** (Volundr generating/updating documentation, Phase 3):

> If during the analysis of a component, or during the construction of the
> visual documentation, Volundr notices **one or more modules following a
> repeated pattern** (a recurring structure not yet covered by an existing
> atom — e.g. a block that repeats identically across several sections or
> across several different components) — **it must not silently hand-build it
> and must not ignore it**. It must **ask the user** whether they prefer to:
> 1. **promote it to a new doc-kit atom** — in that case: add its full spec
>    (same format as sections 1–9 above: purpose, structure, alignment,
>    ordering, sizing, padding/margin, internal elements with proposed
>    tokens) to **this file**, then publish it as a real component on the
>    **`❖ volundr-components-doc`** page in Figma (see `volundr.prompt.md` —
>    create that page, plus an empty `---` divider page directly above it,
>    if the file doesn't have one yet) — **always asking for confirmation
>    before publishing**, never automatically (rule already confirmed for
>    the missing atoms); or
> 2. **leave it as is** (hand-built one-off, without promoting it).
>
> Do not decide on your own which of the two options to choose — it is always
> a question to ask, not an automatic heuristic.

Examples of a "repeated pattern" to flag: a row/cell/badge structure that
recurs identically across multiple `section--*` of the same component; a
block that repeats identically documenting several different
components/widgets (a strong candidate for becoming a shared atom, as
historically happened with `control-props--row` or `anatomy--item`).

## Status

All 9 atoms are documented here, and `page-template.md` and
`anatomy-rules.md` (v2) already reflect `anatomy--item` as a real, instanced
atom rather than missing/hand-built.
