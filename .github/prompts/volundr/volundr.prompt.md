# Volundr — FDS Component Documentation Generator

## Overview
Volundr generates component documentation in Figma following the **FDS "Design Component"** page layout. It operates in 3 phases:
1. **Phase 1 (Analyse)**: Extract component metadata and variant information
2. **Phase 2 (Confirm)**: Display text preview of documentation for user approval
3. **Phase 3 (Generate)**: Build the page **incrementally**, following `data/page-template.md`

> **Layout authority**: `data/page-template.md` is the single source of truth for
> the page layout, naming, terminology, entry-checks and background rules. Load it
> in Phase 3 and follow it — do not hardcode a layout here.

## FDS "Design Component" layout

Three-column documentation arranged around the component set on the same page.
The page header **title is the component name** + a one-line abstract subtitle.
Volundr derives `✎` sections from the component (variants + description +
token-bound properties); `[P]` sections have no source content and are emitted
as a **labelled placeholder + flag for the user** (never fabricate UX copy).

```
<component name>     (page header title)
<one-line abstract>  (subtitle)
 ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐
 │ Doc col 1 1000 │  │ Doc col 2  1000  │  │ Doc col 3 hug ≤2000│
 │ • Usage      ✎ │  │ • Animation   [P]│  │ • Anatomy       ✎  │
 │ • Behaviour [P]│  │ • Icons          │  │   callout pins +   │
 │ • Best Prac.[P]│  │ • Variants    ✎  │  │   numbered legend  │
 │ • Control Pr.✎ │  │ • Examples    [P]│  │   (tokens only)    │
 └────────────────┘  └──────────────────┘  └────────────────────┘
 Surfaces matrix  ✎  — context columns × surface-background rows
```

Full measurements, Control-Props/Variant-grid/Surfaces specs, canonical frame
naming and entry-checks live in `data/page-template.md`.

## Phase 1: Analyse

**Input**: Figma component URL or node ID (e.g., rhSXN8LjWELGgCvtCnIxM6, 8225:12554)

**Tasks**:
1. Call `get_design_context` → extract component name and **description**.
   Read the component's `description` field (via `use_figma`:
   `set.description`) — its **lead paragraph** becomes the **Usage** section
   content (see `page-template.md`). Do not discard it as metadata.
2. Call `get_metadata` → get variant structure. Prefer reading
   `component.variantProperties` per variant (a clean `{axis: value}` map)
   over parsing the name string.
3. Parse variants to extract **Control Props** using rules from `data/variant-parsing-rules.md`
   - Split each variant name by `, ` (comma-space)
   - Extract Key=Value pairs
   - Collect unique keys as property names
   - Collect unique values for each key
4. Choose the **variant-grid grouping** (see `page-template.md` Sub-type A/B/C):
   with ≥3 axes or >20 variants, use **Sub-type C — nested** (Section = primary
   axis, Subsection = secondary axis, remaining axes → per-cell caption).
5. Sort each property's values alphabetically

**Control Props Format**:
```json
{
  "Theme": ["on-surface", "on-alternate-surface"],
  "State": ["off", "on"],
  "Icon": ["off", "on"],
  "Style": ["Default"],
  "text": ["no", "yes"]
}
```

**Variant Groups Format**:
```json
[
  {
    "groupKey": "Theme",
    "groupValue": "on-surface",
    "variants": [
      "Theme=on-surface, State=off, Icon=off, Style=Default, text=no",
      "Theme=on-surface, State=on, Icon=off, Style=Default, text=no",
      ...
    ]
  },
  {
    "groupKey": "Theme",
    "groupValue": "on-alternate-surface",
    "variants": [...]
  }
]
```

## Phase 2: Confirm

**Input**: Phase 1 analysis output (control props + variant groups)

**Display to user**:
```
📋 Documentation Preview for {ComponentName}

CONTROL PROPS:
┌──────────────┬─────────────────────────────────┐
│ Property     │ Possible Values                 │
├──────────────┼─────────────────────────────────┤
│ Theme        │ on-surface, on-alternate-surface│
│ State        │ off, on                         │
│ Icon         │ off, on                         │
│ Style        │ Default                         │
│ text         │ no, yes                         │
└──────────────┴─────────────────────────────────┘

VARIANT GROUPS:
• Theme = on-surface (5 variants)
• Theme = on-alternate-surface (3 variants)

Ready to generate documentation? (yes/no)
```

**Logic**:
- If user says NO → ask what to modify, return to Phase 1 with adjusted component/parameters
- If user says YES → proceed to Phase 3

## Phase 3: Generate

**Input**: Approved Phase 1 analysis (control props + variant groups + page reference)

**Reference**: Load `data/page-template.md` before building any frame — it is the authoritative layout spec.

**Execution** (build incrementally — there is NO monolithic generator script):
1. **Open Hermes run**:
   ```
   state.write(runId, { skill:"volundr", goal:"generate docs", componentName, pageName, phase:"Phase 3" })
   episode.append({ phase:"open", skill:"volundr", summary:`Generate documentation: ${componentName} on ${pageName}` })
   ```
2. Run **Entry-point checks** (from `page-template.md`):
   - **Resolve the component's page** (walk `node.parent` to the `PAGE`) and `await figma.setCurrentPageAsync(compPage)` — the docs MUST be built on the **same page as the selected component**. `figma.currentPage` resets to the first page each `use_figma` call, so appending blindly drops the docs on the wrong page.
   - Scan that page for existing documentation frames; if found or generic `Frame X` names present, notify user and wait for answer
3. Check for **ODIN-forwarded metadata**: if `volundr_forwarded_metadata` is present in the run context, skip the `get_metadata` call — reuse it directly.
4. If the user gave a **canonical reference node**, inspect it (`get_metadata` / `get_design_context`) and match its real measurements; otherwise use the defaults in `page-template.md`.
5. Build the page **incrementally** in the `page-template.md` build order — `figma-use` before every `use_figma`, **≤10 ops per call**, validate between steps:
   - **create the docs root on the component's page and place it to the LEFT of the component**: `docs.x = comp.x - docs.width - 200; docs.y = comp.y` (re-assert once the real width is known)
   - page header: **title = component name** (Bold) + one-line **abstract** subtitle (first sentence of the description, else the placeholder)
   - **Doc column 1** (1000 wide): **Usage** `✎` (description lead paragraph) + **Behaviour** `[P]` + **Best Practices** `[P]` + **Control Props** table (`Header` + `Row_[PropName]` rows) `✎`
   - **Doc column 2** (1000 wide): **Animation** `[P]` + **Icons** (or `[P]` if none) + **Variant grid** (Sub-type A / B / C-nested) `✎` + **Examples** `[P]`
   - **Doc column 3** (**hug content, `maxWidth = 2000`** — never a fixed width): **Anatomy** `✎` — callout pins on a reference instance + numbered legend of token-bound properties. Follow **`data/anatomy-rules.md`** (tokens only, never hardcoded).
   - **Surfaces matrix** `✎` (or placeholder if the component has no surface/context axis)
   - `[P]` sections = labelled placeholder + flag for the user; never fabricate UX copy
6. Use **instances** of the existing component set for the variant grid and surfaces matrix — never rebuild the set. Apply Body background per the keyword map in `page-template.md`.
7. `get_screenshot` the full page; fix overlaps/clipping; verify all frames use canonical names (no `Frame X`).
8. **Close Hermes run**:
   ```
   state.write(runId, { phase:"done", blocksCreated, variantSubtype, genericNamesFound })
   episode.append({ phase:"close", skill:"volundr", summary:`Docs created: ${blocksCreated} blocks, sub-type ${variantSubtype}` })
   lesson.append({ skill:"volundr", component:componentName, subtype:variantSubtype, propsCount })
   ```

**Result**:
```
Page: [pageName]
Blocks created: [list]
Variant sub-type: A (organized) or B (flat)
Generic names found: [list or "none"]
```

## Hermes Integration

### Opening a Run
```javascript
state.write(runId, {
  skill: "volundr",
  componentNodeId: "...",
  componentName: "...",
  phase: "Phase 1 — Analyse"
});
episode.append({
  phase: "open",
  skill: "volundr",
  summary: `Component documentation: {fds:ComponentName}`
});
```

### Logging Outcomes
```javascript
// Phase transitions
state.write(runId, { phase: "Phase 2 — Confirm" });
episode.append({ 
  phase: "progress",
  skill: "volundr",
  action: "Presented Phase 2 preview for user approval"
});

state.write(runId, { phase: "Phase 3 — Generate" });
episode.append({ 
  phase: "progress",
  skill: "volundr",
  action: "Generated documentation frames in Figma"
});
```

### Capturing Lessons
```javascript
lesson.append({
  skill: "volundr",
  insight: "Component {name} used non-standard variant naming pattern",
  ruleProposal: "Add variant pattern X to variant-parsing-rules.md",
  applied: false
});
```

### Closing a Run
```javascript
episode.append({
  phase: "close",
  skill: "volundr",
  summary: `Documentation updated: {fds:ComponentName} — {pageUrl}`
});
```

## Control Props Extraction Algorithm

**Input**: Array of variant names  
**Example**: `["State=Filled, Theme=Surface", "State=Focus, Theme=Alternate", ...]`

**Algorithm**:
1. Split each variant name by `, `
2. For each pair `Key=Value`:
   - Extract `Key` as Control Prop name
   - Extract `Value` as possible value
3. De-duplicate: collect all unique Values per Key
4. Sort alphabetically within each prop

**Output**:
```javascript
{
  "State": ["Filled", "Focus", "Danger"],
  "Theme": ["Surface", "Alternate-Surface", "On-Header", "On-Surface"],
  "Assistive Text": ["On", "Off"],
  ...
}
```

## Background Handling

Variant-grid group/cell and Surfaces backgrounds are governed by
**`data/page-template.md`** (light keyword map) and **`data/anatomy-rules.md`**
(dark `artwork` background). Key rule: a group/diagram whose Theme is an
alternate/dark surface — or whose component is very light — renders on the dark
`artwork` background so the component stays visible; everything else uses the
light keyword fill. Figma fills are `{r, g, b}` (0–1 range) or a bound variable —
**never a CSS-var string**.

## Data Files

- `data/page-template.md` — **Authoritative** "Design Component" page layout, naming, terminology, entry-checks, background map
- `data/variant-parsing-rules.md` — Rules for parsing variant names and edge cases (incl. nested Sub-type C grid)
- `data/anatomy-rules.md` — **Authoritative** Anatomy section spec (column 3): token-only legend, callout pins, reference variants, dark `artwork` background rule

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

## Model Routing

**Default**: Claude Sonnet 4.6

**Escalate to Claude Opus 4.8** if:
- Component has >100 variants (complex variant matrix)
- Variant naming is highly non-standard or ambiguous
