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

Two-column documentation arranged around the component set on the same page.
Volundr derives `✎` sections from the variant strings; `[P]` sections have no
source content and are emitted as a **labelled placeholder + flag for the user**
(never fabricate UX copy).

```
"Design Component"  (page header + subtitle)
   Heading  — component name
 ┌──────────────────────┐   ┌──────────────────────┐
 │ Doc column 1  (≈938) │   │ Doc column 2  (≈995) │
 │ • Usage         [P]  │   │ • Behaviour      [P] │
 │ • Anatomy       [P]  │   │ • Best Practices [P] │
 │ • Icons              │   │ • Animation      [P] │
 │ • Control Props ✎    │   │ • Variant grid   ✎   │
 │                      │   │ • Examples       [P] │
 └──────────────────────┘   └──────────────────────┘
 Surfaces matrix  ✎  — context columns × surface-background rows
```

Full measurements, Control-Props/Variant-grid/Surfaces specs, canonical frame
naming and entry-checks live in `data/page-template.md`.

## Phase 1: Analyse

**Input**: Figma component URL or node ID (e.g., rhSXN8LjWELGgCvtCnIxM6, 8225:12554)

**Tasks**:
1. Call `get_design_context` → extract component name and description
2. Call `get_metadata` → get variant structure 
3. Parse variant names to extract **Control Props** using rules from `data/variant-parsing-rules.md`
   - Split each variant name by `, ` (comma-space)
   - Extract Key=Value pairs
   - Collect unique keys as property names
   - Collect unique values for each key
4. Group variants by **primary property** (first key in variant names)
   - Example: if all variants start with `Theme=...`, group by Theme values
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
   - Confirm page name was saved in Phase 1
   - Scan for existing documentation frames; if found or generic `Frame X` names present, notify user and wait for answer
3. Check for **ODIN-forwarded metadata**: if `volundr_forwarded_metadata` is present in the run context, skip the `get_metadata` call — reuse it directly.
4. If the user gave a **canonical reference node**, inspect it (`get_metadata` / `get_design_context`) and match its real measurements; otherwise use the defaults in `page-template.md`.
5. Build the page **incrementally** in the `page-template.md` build order — `figma-use` before every `use_figma`, **≤10 ops per call**, validate between steps:
   - page header ("Design Component" + subtitle) → `Heading`
   - **Doc column 1**: Usage/Anatomy/Icons placeholders `[P]` + **Control Props** table (`Header` + `Row_[PropName]` rows) `✎`
   - **Doc column 2**: Behaviour/Best Practices/Animation/Examples placeholders `[P]` + **Variant grid** (Sub-type A or B) `✎`
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

## Background Handling Logic

**When generating variant instances, check theme keywords**:

```javascript
const bgTokenMap = {
  "on-surface": "--fds-color-on-surface",
  "on-alternate-surface": "--fds-color-on-alternate-surface",
  "on-header": "--fds-color-on-header",
  "surface": "--fds-color-surface",
  "alternate-surface": "--fds-color-alternate-surface"
};

// For each variant group:
const variantTheme = extractTheme(variantName);
if (bgTokenMap[variantTheme]) {
  // Apply background to frame containing this variant instance
  frame.fills = [{ color: bgTokenMap[variantTheme] }];
}
```

**Purpose**: Show the visual context where the variant is intended to be used.

## Data Files

- `data/page-template.md` — **Authoritative** "Design Component" page layout, naming, terminology, entry-checks, background map
- `data/variant-parsing-rules.md` — Rules for parsing variant names and edge cases

## Plugin API Scripts

- `scripts/scan-component.figma.js` — Extracts component metadata and variant list

Frame generation has **no dedicated script**: Volundr builds the page incrementally with `use_figma` following `data/page-template.md` (`figma-use` first, ≤10 ops per call).

## Error Handling

**If Phase 1 analysis fails**:
- Insufficient variant data → ask user to expand component if incomplete
- Ambiguous naming → suggest naming convention correction

**If Phase 3 generation fails**:
- Permission error → user must have edit access to Figma file
- Duplicate documentation → script detects existing page and updates instead

## Model Routing

**Default**: Claude Sonnet 4.6

**Escalate to Claude Opus 4.8** if:
- Component has >100 variants (complex variant matrix)
- Variant naming is highly non-standard or ambiguous
