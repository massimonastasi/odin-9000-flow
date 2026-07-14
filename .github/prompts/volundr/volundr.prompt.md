# Volundr — FDS Component Documentation Generator

## Overview
Volundr generates component documentation in Figma using the **Fabric Design System** template structure. It operates in 3 phases:
1. **Phase 1 (Analyse)**: Extract component metadata and variant information
2. **Phase 2 (Confirm)**: Display text preview of documentation for user approval
3. **Phase 3 (Generate)**: Create documentation frames following FDS wireframe structure

## FDS Wireframe Structure

Documentation is created as 4-section layout on the same page as the component:

```
┌─────────────────────────────────────┐
│ Section 1: Component Overview       │
│ (visual example + description)       │
│ Size: ~541×383px                    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Section 2: Control Props Table      │
│ (Name | Control value columns)       │
│ Size: 550×(48 + props×60)px         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Section 3: Variants Organization    │
│ (groups organized by primary prop)   │
│ Size: 1013×2229px                   │
│ - Type label + divider              │
│ - Body frame with background        │
│ - Variant count indicator           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Section 4: Component Instances Grid │
│ (all variants in grid layout)        │
│ Size: 1013×1956px                   │
└─────────────────────────────────────┘
```

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

**Reference**: Load `data/doc-template-structure.md` before generating any frame.

**Execution**:
1. **Open Hermes run**:
   ```
   state.write(runId, { skill:"volundr", goal:"generate docs", componentName, pageName, phase:"Phase 3" })
   episode.append({ phase:"open", skill:"volundr", summary:`Generate documentation: ${componentName} on ${pageName}` })
   ```
2. Run **Entry Point Checks** (from doc-template-structure.md):
   - Confirm page name was saved in Phase 1
   - Scan for existing documentation frames
   - If found: notify user and wait for answer
   - If generic names found: notify user and wait for answer
3. Check for **ODIN-forwarded metadata**: if `volundr_forwarded_metadata` is present in the run context, skip the `get_metadata` call — reuse it directly.
4. Use `use_figma` with `generate-docs.figma.js` plugin script
5. Script builds the blocks strictly following `doc-template-structure.md`:
   - **Block 1** — `[componentName]` header frame (541x383px, #ffffff)
   - **Block 2** — `Control` table frame (550px wide, `Header` + `Row_[PropName]` rows)
   - **Block 3** — Variants: detect Sub-type A or B, generate accordingly
   - **Block 4/5/6** — Section + Dependencies + Building Blocks only if needed
6. Background fill in Body frames: apply keyword-based fill from doc-template-structure.md
7. After generation, verify all created frames follow the canonical names (no `Frame X` names)
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

- `data/doc-template-structure.md` — Template frame hierarchy and naming conventions
- `data/variant-parsing-rules.md` — Rules for parsing variant names and edge cases

## Plugin API Scripts

- `scripts/scan-component.figma.js` — Extracts component metadata and variant list
- `scripts/generate-docs.figma.js` — Creates/updates documentation frames in Figma

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
