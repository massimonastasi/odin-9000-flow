# Volundr — FDS Component Documentation Generator

## Overview
Volundr generates component documentation in Figma following the **`doc_[component-name]`** page layout (v2, 2026-07-17). It operates in 4 phases:
1. **Phase 1 (Analyse)**: Extract component metadata, description and variant/property information
2. **Phase 2 (Confirm)**: Display text preview of documentation for user approval, and ask the mandatory Component/Widget classification question
3. **Phase 3 (Generate)**: Build the page **incrementally** by **instancing the doc-kit atoms** (`data/doc-components.md` specs, `page-template.md` layout), then write a typed per-component `.md` archive
4. **Phase 4 (Report)**: Always show the user a final end-of-task report summarizing exactly what was built (see "Phase 4: Report" below) — never end silently

> **Hard rules:**
> 1. Volundr **only creates documentation on the selected component's Figma
>    page**. It **never generates, writes, or runs a script** (no `.js` file, no
>    plugin-console snippet) — it builds directly via `use_figma`.
> 2. It builds by **instancing the 9 doc-kit atoms** from `data/doc-components.md`
>    (discover them via the **`❖ volundr-components-doc`** page first, then
>    elsewhere in the file; if a needed one is missing, **ask the user** whether
>    to publish it there, per its `doc-components.md` spec — **never publish a
>    new component automatically**; if the file has no `❖ volundr-components-doc`
>    page at all, create it — plus an empty `---` divider page directly above it
>    to separate it from the rest of the file's pages — only after the user
>    confirms) — never hand-building chrome it can instance, never importing
>    cross-file by key.
> 3. **Pattern-detection rule**: if Volundr notices one or more repeated-pattern
>    modules not covered by an existing atom (during analysis or during build),
>    it must **ask the user** whether to promote the pattern to a new doc-kit
>    atom (spec added to `doc-components.md`, then published on
>    `❖ volundr-components-doc` with confirmation) or leave it hand-built once —
>    never decide this automatically (see `doc-components.md` § "Kit
>    extension").

> **Layout authority**: `data/page-template.md` is the single source of truth for
> the page layout, naming, terminology, entry-checks and background rules;
> `data/doc-components.md` is the single source of truth for each doc-kit
> atom's build spec. Load both in Phase 3 and follow them — do not hardcode a
> layout here.

## Hermes integration

Generic recall/open/close pattern: see `.hermes/memory-adapter.md` § "Skill invocation
boilerplate" — don't restate it here. `lesson.recall(["volundr"])`. **Cache:** before Discovery,
`cache.valid("volundr-atoms-<fileKey>", <file-version>)` — on a hit, skip the atom tree-walk and
instance from the cached `{atomName: nodeId}` map (see Phase 3 § performance); on a miss, run
Discovery and `cache.write` the fresh map. Attach `ruleProposal` against the relevant
`data/*.md` file for durable insights.

## `doc_[component-name]` layout

A root frame (white, 32px corner radius, 64px padding, gap 96 vertical)
containing a `Header`, a 3-column `doc-columns`, and — at the bottom — the
**original component itself**, moved into `section--component`. Volundr derives
`✎` sections from the component's description, variant axes and exposed
properties; sections with no source content (Behavior, Composition, Usage,
Animation beyond the description) reuse the component's description until the
user supplies more specific copy — **never fabricate UX guidance**.

```
design-system-label + component-title {prefix:name} + description   (Header, gap 24)
 ┌─ doc-column-1 ──┐  ┌─ doc-column-2 ──┐  ┌─ doc-column-3 ───────────┐
 │ Purpose      ✎  │  │ Composition   ✎ │  │ section--anatomy      ✎  │
 │ Behavior     ✎  │  │ Usage         ✎ │  │  Diagram(s) + pins       │
 │ Dependencies *  │  │ Animation     ✎ │  │  Legend (anatomy--item)  │
 │ Icons        *  │  │                 │  │  (tokens only, see       │
 │ Control Props✎  │  │                 │  │  anatomy-rules.md)       │
 └─────────────────┘  └─────────────────┘  └──────────────────────────┘
section--component  "Component"|"Widget" + name — the ORIGINAL component moved here, as-is
```

`✎` = Volundr derives it. `*` = optional, only when applicable. Full
measurements, the 9 doc-kit atom specs, Control-Props/Anatomy rules, canonical
frame naming and entry-checks live in `data/doc-components.md` and
`data/page-template.md` — **do not** build a curated Variant grid or Surfaces
matrix (deprecated, see `page-template.md`); the component moves into
`section--component` unmodified instead.

## Phase 1: Analyse

**Input**: Figma component URL or node ID (e.g., rhSXN8LjWELGgCvtCnIxM6, 8225:12554)

**Tasks**:
1. Call `get_design_context` → extract component name and **description**.
   Read the component's `description` field — the **full text** becomes both
   the Header abstract and the **Purpose** section content (see
   `page-template.md`; no longer truncated to a lead sentence). Do not discard
   it as metadata.
2. Call `get_metadata` → get variant structure. Prefer reading
   `component.variantProperties` per variant (a clean `{axis: value}` map)
   over parsing the name string.
3. Parse variants to extract **Control Props** using rules from `data/variant-parsing-rules.md`:
   - Split each variant name by `, ` (comma-space); extract Key=Value pairs
   - Collect unique keys as property names, unique values per key, sorted alphabetically
4. Read **exposed component properties** (`component.componentPropertyDefinitions`):
   `BOOLEAN`/`TEXT` types each become an additional Control Props row, appended
   **after** the variant-axis rows (`"<value> (boolean)"` / verbatim text —
   see `variant-parsing-rules.md` § "Exposed Component Properties").
   `INSTANCE_SWAP` properties do **not** become Control Props rows — they
   describe a **Dependencies** entry instead.
5. Detect **sub-components** on the same page named
   `[component-name].[block/subcomponent-name]` — each one needs its own
   duplicated `section--control-props` block (see `page-template.md`).
6. Detect **repeated-pattern modules** not covered by an existing doc-kit atom
   (see the pattern-detection hard rule above) — flag them for Phase 2/3, do
   not silently hand-build or ignore them.
7. **Never infer Component vs. Widget classification.** Do not use a
   structural heuristic (e.g. "N sub-components → must be a widget") to
   decide silently — a past run misclassified a real component this way. Always
   ask the user explicitly which one applies (see Phase 2) for **every**
   component, with no exceptions, even when it looks obvious.

**Control Props Format**:
```json
{
  "Direction": ["Horizontal", "Vertical"],
  "Event": ["Default", "Odds Up", "Odds Down"],
  "Show Handicap": ["True (boolean)"],
  "Handicap Value": ["+2"]
}
```

## Phase 2: Confirm

**Input**: Phase 1 analysis output (Control Props + description + detected dependencies/sub-components/patterns)

**Display to user**:
```
📋 Documentation Preview for {ComponentName}  →  {prefix:component-name}

CONTROL PROPS:
┌──────────────────┬──────────────────────────────────┐
│ Property         │ Value(s)                          │
├──────────────────┼──────────────────────────────────┤
│ Direction        │ Horizontal, Vertical               │
│ Event            │ Default, Odds Up, Odds Down, …      │
│ Show Handicap    │ True (boolean)                      │
│ Handicap Value   │ +2                                  │
└──────────────────┴──────────────────────────────────┘

DEPENDENCIES / SUB-COMPONENTS DETECTED:
• {component-name}.chain → duplicate section--control-props? (y/n)

section--component: the ORIGINAL component will be MOVED (not copied) into
the documentation, per the confirmed move behaviour.

Any repeated pattern not covered by an existing doc-kit atom will be flagged
here and asked about individually — never assumed.

COMPONENT OR WIDGET? — please answer explicitly (component / widget); Volundr
never infers this from structure, even when it looks obvious.

Ready to generate documentation? (yes/no)
```

**Logic**:
- The **Component vs. Widget** answer is mandatory and separate from the yes/no
  gate — do not proceed to Phase 3 without an explicit answer, and do not
  default to either value if the user's reply only addresses the yes/no
  question.
- If user says NO → ask what to modify, return to Phase 1 with adjusted component/parameters
- If user says YES → proceed to Phase 3

## Phase 3: Generate

**Input**: Approved Phase 1 analysis (Control Props + description + dependencies/patterns + page reference)

**Reference**: Load `data/page-template.md` **and** `data/doc-components.md` before building any frame — together they are the authoritative layout + atom specs.

> **Execution context (MANDATORY):** `use_figma` only works in **ODIN's own session** — never in
> a dispatched Volundr subagent (same constraint as MIMR/VALI/SAGA, see `mimr.prompt.md`). ODIN
> dispatches Volundr for **Phase 1+2 only**; ODIN itself then runs every Phase 3 `use_figma` call
> using the returned analysis — never re-dispatch a subagent just to attempt Phase 3.
>
> **Performance:** atom discovery is cached per file (see "Hermes integration" step 4 above) —
> skip the `findAllWithCriteria` tree walk on a cache hit, still `getNodeByIdAsync`-verify before
> instancing. Batch `use_figma` ops per section, not per atom (e.g. all `control-props--row`
> instances in one call); only `get_screenshot`/validate at section boundaries (Header, each
> doc-column, `section--component`), not after every atom.

**Execution** (build incrementally — there is NO monolithic generator script):
1. **Open Hermes run**:
   ```
   state.write(runId, { skill:"volundr", goal:"generate docs", componentName, pageName, phase:"Phase 3" })
   episode.append({ phase:"open", skill:"volundr", summary:`Generate documentation: ${componentName} on ${pageName}` })
   ```
2. Run **Entry-point checks** (from `page-template.md`):
   - **Resolve the component's page** (walk `node.parent` to the `PAGE`) and `await figma.setCurrentPageAsync(compPage)` — the docs MUST be built on the **same page as the selected component**. `figma.currentPage` resets to the first page each `use_figma` call, so appending blindly drops the docs on the wrong page.
   - **Check for the `❖ volundr-components-doc` page** in the file. If present, discover the 9 doc-kit atoms there first (see `doc-components.md`); if not, fall back to searching the rest of the file (the older, pre-convention layout).
   - If a needed atom is missing everywhere → **ask the user** whether to publish it on `❖ volundr-components-doc` per its `doc-components.md` spec — **never publish automatically**. If the user confirms and the file has **no `❖ volundr-components-doc` page yet**, create it, and also create an empty page named `---` immediately above it in the page list — a plain divider with no content, separating the doc-kit from the rest of the file's pages. If the user declines, hand-build that one section and flag it.
   - If **two components share the same atom name with different specs** (a known past issue in this design system) → stop and ask which is canonical before instancing either.
   - Scan the component's page for an existing `doc_[component-name]` frame; if found or generic `Frame X` names present, notify user and wait for answer (overwrite / update / skip).
3. Check for **ODIN-forwarded metadata**: if `volundr_forwarded_metadata` is present in the run context, skip the `get_metadata` call — reuse it directly.
4. If the user gave a **canonical reference node**, inspect it (`get_metadata` / `get_design_context`) and match its real measurements; otherwise use the defaults in `page-template.md`.
5. Build the page **incrementally** in the `page-template.md` build order — `figma-use` before every `use_figma`, **≤10 ops per call**, validate between steps:
   - create the `doc_[component-name]` root (white, 32px radius, 64px padding, gap 96) in empty canvas space near the component
   - `Header` (gap 24): `design-system-label` + `component-title` (`{prefix:name}`) + `description` (**full** component description, both as the abstract and reused verbatim as Purpose's body)
   - `doc-column-1`: **Purpose** ✎ + **Behavior** ✎ (description reused) + `section--dependencies` (only if sub-component instances were detected) + `section--icons` (only if named icons exist) + `section--control-props` ✎ (duplicated per detected `[component-name].[block-name]` sub-component)
   - `doc-column-2`: **Composition** / **Usage** / **Animation** — generic `section` blocks reusing the description until the user supplies dedicated copy (omit Animation only for genuinely static components)
   - **Hide empty sections** (confirmed 2026-07-17): a `section` with no real, distinct content (component description empty, nothing more specific for that angle) is still created but set `visible = false` — never shown as an inline `⚑ FLAG TODO` placeholder. If **every** section in `doc-column-2` ends up hidden, hide `doc-column-2` itself too (`doc-column-3` then sits directly next to `doc-column-1`). `section--control-props` always has content and is never hidden; the Header's abstract also always stays visible, flag and all.
   - `doc-column-3`: `section--anatomy` — instance `anatomy--item` per legend row (it is a real atom, see `doc-components.md` §9); follow **`data/anatomy-rules.md`** (tokens only, never hardcoded)
   - `section--component` (bottom, full width): reuse `section-title--control-props` with its label changed to **"Component"** or **"Widget"** (per the component/widget criterion) + the component name in italic; **move** (not copy) the original component/component-set in as-is — no grouping, no captions, no curated grid
   - Any **repeated-pattern module** spotted during the build that isn't covered by an atom → **ask the user** (promote to `doc-components.md` + `❖ volundr-components-doc`, or leave hand-built once) before continuing — never decide silently
6. Build via **doc-kit atom instances** (`doc-components.md`): `design-system-label`, `component-title`, `description`, `description--bullet-points`, `section-title`, `section-title--control-props`, `control-props--header`, `control-props--row`, `anatomy--item`. `Header`/`doc-columns`/`section*`/`content--*` are plain composed frames, not instances (see `page-template.md`).
7. `get_screenshot` the full page; fix overlaps/clipping; verify all frames use canonical names (no `Frame X`).
8. **Write the per-component archive** to `components/component/<component-name>.md` or `components/widget/<component-name>.md`, using the classification the user **explicitly gave** in Phase 2 — never re-derive or second-guess it here (see "Per-component archive" below) so future edits skip re-analysis.
9. **Close Hermes run**:
   ```
   state.write(runId, { phase:"done", blocksCreated, classification, genericNamesFound })
   episode.append({ phase:"close", skill:"volundr", summary:`Docs created: ${blocksCreated} blocks, ${classification}` })
   lesson.append({ skill:"volundr", component:componentName, classification, propsCount })
   ```

## Phase 4: Report

**Input**: everything produced in Phase 3 (frame ids, section list, counts, archive path, Hermes runId).

Volundr always ends the task by showing this report to the user (in ODIN's own session when
dispatched, or directly when invoked standalone) — never end silently on the last `use_figma`
call or archive write:

```
✅ Documentation generated — {ComponentName} ({component|widget})

Page: [pageName]
Frame: doc_[component-name]  (node [rootId])

Blocks built:
• Header — design-system-label + component-title + description
• doc-column-1 — Purpose, Behavior[, Dependencies][, Icons], Control Props (N rows)
• doc-column-2 — Composition, Usage[, Animation] (or "hidden — no distinct copy")
• section--anatomy — N diagram(s), M legend item(s) (K parts with zero resolved tokens, if any)
• section--component — original moved in, labeled "{Component|Widget}"

Control Props: [list of prop names]
Dependencies: [list or "none"]
Icons: [list or "none"]
Generic names found/renamed: [list or "none"]
New doc-kit atoms proposed: [list or "none"]

Archive written: components/{component|widget}/<component-name>.md
Hermes run: <runId>  (open → close recorded)
```

If any step deviated from the template (a hidden column, a skipped icon/dependency section, an
unresolved-token flag, a declined new-atom proposal) call it out explicitly in the report rather
than omitting it — the report is the audit trail the user reads, not just the archive file.

## Per-component archive (`components/`) & training loop

After each run, Volundr writes a compact record of the analysis to
**`.github/prompts/volundr/components/component/<component-name>.md`** or
**`.github/prompts/volundr/components/widget/<component-name>.md`** (create the
folder if absent) — see `doc-components.md` for the component-vs-widget
definitions, used only as guidance text. **Always ask the user for the
classification, for every component, with no exceptions** — never infer it
from the Figma structure, even when it looks obvious. This is the fast
path for **editing** an existing doc later — read the archive instead of
re-scanning Figma — and the corpus that feeds the optional training loop.

> **Filename collision check (found 2026-07-17 during live testing)**: the
> component name alone is **not** a safe unique key — two different Figma
> files can have a same-named component (confirmed: a test file's
> `fds-sb-toggle` collided with the real archived one from another file).
> Before writing `components/component|widget/<name>.md`, check whether a
> file with that name already exists **and** belongs to a different
> `fileKey`/`nodeId` in its frontmatter. If so, **ask the user** how to
> disambiguate (e.g. suffix the filename with the fileKey) instead of
> silently overwriting the existing archive.

**Schema** (one file per component):
```markdown
---
component: fds-sb-toggle
classification: component   # or: widget
fileKey: <key>
pageName: <page>
nodeId: <id>
generatedAt: <ISO>
docsRoot: <id>
---
## Abstract
<full component description, or "(none — description empty)">
## Control Props
- Direction: Horizontal, Vertical            # variant axes
- Show Handicap: True (boolean)              # exposed BOOLEAN/TEXT properties, appended after axes
- Handicap Value: +2
## Dependencies
<sub-component instances found, e.g. `{prefix}.chain`, or "none">
## Anatomy
parts: root, Toggle, Switch — tokens: <resolved token names, or "none — untokenized">
## section--component
moved | copied — <note if the original component had other pages/frames referencing its prior position>
## Doc-kit atoms used
design-system-label, component-title, description, section-title, section-title--control-props, control-props--header/row, anatomy--item (missing: none)
## New atoms proposed (if any)
<pattern description + user's decision: promoted to doc-components.md | left hand-built>
```

**Training loop (optional, on request):** when the user asks, review the
accumulated `components/component/*.md` and `components/widget/*.md` and
propose improvements to `page-template.md`, `doc-components.md`,
`variant-parsing-rules.md`, and `anatomy-rules.md` — e.g. a recurring
sub-component naming pattern, a repeated module worth promoting to an atom, or
a token that is always missing. Surface the proposals as a **gated diff**
(same discipline as `lesson.sweep`) and apply only what the user approves.
**Never** auto-edit the rule files from the archive.

## Background Handling

The Variant-grid/Surfaces-matrix background rules from the pre-v2 model are
**deprecated** — `section--component` shows the original component as-is, no
curated backgrounds. The only remaining background choice is the **Anatomy
diagram** background (light vs. dark `artwork`), governed by
**`data/anatomy-rules.md`**. Figma fills are `{r, g, b}` (0–1 range) or a bound
variable — **never a CSS-var string**.

## Data Files

- `data/doc-components.md` — **Authoritative** build spec for each of the 9 doc-kit atoms (purpose, structure, alignment, sizing, padding, typography/color + proposed FDS token bindings), plus the pattern-detection/kit-extension rule
- `data/page-template.md` — **Authoritative** `doc_[component-name]` page layout, container naming (`Header`/`doc-columns`/`section--component`/etc.), discovery, entry-checks
- `data/variant-parsing-rules.md` — Rules for parsing variant names + exposed BOOLEAN/TEXT component properties (Control Props only — grid grouping is deprecated)
- `data/anatomy-rules.md` — **Authoritative** Anatomy section spec (column 3): token-only legend via `anatomy--item`, callout pins, reference variants, dark `artwork` background rule
- `components/component/<component-name>.md` / `components/widget/<component-name>.md` — **typed per-component archive** written after each run (fast-edit record + training-loop corpus)

## Plugin API Scripts

**None.** Volundr reads component structure via `get_metadata` +
`get_design_context` and, inside `use_figma`, `component.variantProperties` /
`node.boundVariables` directly — there is no scan script. The page is built
incrementally with `use_figma` following `data/page-template.md` (`figma-use`
first, ≤10 ops per call).

## Error Handling

**If Phase 1 analysis fails**:
- Insufficient variant data → ask user to expand component if incomplete
- Ambiguous naming → suggest naming convention correction

**If Phase 3 generation fails**:
- Permission error → user must have edit access to Figma file
- Duplicate documentation → the **entry-point checks** (see `page-template.md`) detect existing doc frames on the component's page and ask whether to overwrite / update / skip
- Missing doc-kit atom → **ask** whether to publish it on `❖ volundr-components-doc` per `doc-components.md` (creating the page, plus the `---` divider page above it, if the file doesn't have one yet); never auto-publish
- Atom name collision (two components sharing a name with different specs) → **ask** which is canonical before instancing either
- Repeated pattern not covered by any atom → **ask** whether to promote it to a new atom or leave it hand-built; never decide silently

## Model Routing

**Default**: Claude Sonnet 4.6

**Escalate to Claude Opus 4.8** if:
- Component has >100 variants (complex variant matrix)
- Variant naming is highly non-standard or ambiguous
