# Variant Parsing Rules

## Overview
Volundr extracts **Control Props** from Figma variant names using a structured parsing algorithm. This file documents the parsing rules, patterns, and edge cases.

## Standard Variant Naming Pattern

**Format**: `Key1=Value1, Key2=Value2, Key3=Value3, ...`

**Examples**:
```
Type=Default, Content Type=Numerical, Size=Regular, Shape=Default
State=Filled, Theme=Surface-Variant, Assistive Text=On
State=Focus, Leading Icon=On, Trailing Icon=Off, Theme=On-Header
```

## Parsing Algorithm

### Step 1: Split Variant Name
```
Input: "State=Filled, Theme=Surface-Variant, Assistive Text=On"
Delimiter: ", " (comma-space)
Output: ["State=Filled", "Theme=Surface-Variant", "Assistive Text=On"]
```

### Step 2: Extract Key=Value Pairs
```
For each segment:
  Split by "="
  key = segment[0].trim()
  value = segment[1].trim()
  
Result:
  ("State", "Filled")
  ("Theme", "Surface-Variant")
  ("Assistive Text", "On")
```

### Step 3: Deduplicate & Collect
```
For each unique key across ALL variants:
  Collect all unique values
  Sort alphabetically
  
Result (ControlProps):
  State: [Danger, Filled, Focus, ...]
  Theme: [Alternate-Surface, On-Header, On-Surface, Surface, ...]
  Assistive Text: [Off, On]
```

## Nested Variant Grouping (multi-axis grid)

When a set has **≥3 variant axes** or **>20 variants**, a single grouping axis is
too coarse — the grid reads as one undifferentiated wall. Build a **nested**
grid instead (see `page-template.md` Sub-type C):

```
Section    = primary axis    → one per value  (first carries a Banner)
  Subsection = secondary axis → one per value  (label: "<axis>: <value>  (<count>)")
    cell     = one variant instance + caption of ALL remaining axes
```

Algorithm:
1. Read each variant's axes from `component.variantProperties` — a `{axis: value}`
   map — **not** the name string (avoids re-parsing and handles spaces in keys).
2. Pick the **primary** and **secondary** grouping axes. Default: the two lowest
   cardinality axes; confirm with the user when the choice is ambiguous.
3. For each primary value → Section; within it, for each secondary value that
   actually occurs → Subsection; place the matching instances as cells.
4. **Caption every cell** with the remaining axes joined by ` · ` (e.g.
   `Default · Selected · Pre-built`) so each instance is identifiable.
5. Emit only value combinations that **exist** in the component — never the full
   cartesian product.
6. Each cell is a **`variants--cell`** doc-component instance when available
   (swap in the variant instance, set the caption); hand-build the cell only if
   that component is missing (see `page-template.md` Discovery).

Example (`fds-sb-odds-button`, 5 axes, 47 variants): Section = `Direction`,
Subsection = `Event`, caption = `UI State · Selected · Pre-built`.

## Control Prop Classification

**Primary Props** (identify variant groups):
- Usually the first key in variant name (e.g., `State`, `Type`, `Variant`)
- Used to organize variants into sections

**Secondary Props** (describe variations within group):
- Size, Theme, IconPosition, etc.
- Describe finer variations

**Tertiary Props** (optional toggles):
- Assistive Text, Prefix, Suffix, Leading Icon, Trailing Icon
- Usually boolean (On/Off)

## Pattern Variations

### Pattern A: Simple State Pattern
```
Type=Default, Size=Regular, Shape=Default
Type=Filled, Size=Regular, Shape=Default
Type=Outline, Size=Regular, Shape=Default
```
**Result**: Primary key = Type

### Pattern B: State + Theme Pattern
```
State=Filled, Theme=Surface
State=Filled, Theme=On-Header
State=Focus, Theme=Surface
State=Focus, Theme=On-Header
```
**Result**: Primary key = State, Secondary key = Theme

### Pattern C: State + Icon + Theme Pattern
```
State=Filled, Leading Icon=On, Theme=Surface
State=Filled, Leading Icon=Off, Theme=Surface
State=Filled, Leading Icon=On, Theme=On-Header
```
**Result**: Primary = State, Secondary = Leading Icon + Theme

## Edge Cases & Resolution

### Edge Case 1: Hyphenated Values
```
Variant: "State=Filled, Theme=Surface-Variant"
Parsing:
  key = "State", value = "Filled" ✓
  key = "Theme", value = "Surface-Variant" ✓
Action: Preserve hyphens; do not split on hyphens
```

### Edge Case 2: Spaces in Key or Value
```
Variant: "Assistive Text=On, Leading Icon=Default"
Parsing:
  key = "Assistive Text" (with space) ✓
  value = "On" ✓
  key = "Leading Icon" (with space) ✓
  value = "Default" ✓
Action: Split on "=" first, then trim each part
```

### Edge Case 3: Mixed Delimiters (non-standard)
```
Non-standard variant: "State:Filled;Theme:Surface"
Detection: Missing ", " delimiter
Action:
  → Report to Phase 2 preview: "Non-standard naming detected"
  → Ask user to confirm parsing
  → If confirmed, attempt character-by-character parsing
  → If failed, escalate to Claude Opus 4.8
```

### Edge Case 4: Boolean Values (not "On/Off")
```
Variant: "Disabled=true, Required=false"
Parsing: Treat "true/false" as regular values (not boolean)
Action: Display as ["false", "true"] in Control Props
Note: Some components use "Yes/No" or "Active/Inactive" instead
```

### Edge Case 5: Numeric Values
```
Variant: "Size=12, Size=16, Size=24"
Parsing: Treat "12", "16", "24" as string values
Action: Sort numerically-aware (12 < 16 < 24, not "12" < "16")
Implementation: Use numeric sort if all values are numeric
```

### Edge Case 6: Duplicate Key, Different Values
```
Variant names: "State=Filled, Size=Regular" and "State=Filled, Size=Large"
Parsing: 
  State: [Filled]
  Size: [Large, Regular]
Action: Correct behavior; deduplicate across all variants
```

## Theme Keyword Detection (for background handling)

When a variant/group carries a Theme keyword (`on-surface`,
`on-alternate-surface`, `on-header`, `surface`, `alternate-surface`), the
documentation background is chosen by that keyword. **The authoritative mapping
lives elsewhere — do not hardcode colours here:**

- Variant-grid group/cell and Surfaces backgrounds → **`page-template.md`**
  (light keyword → hex map).
- Anatomy diagrams and any **alternate/dark surface** or **very light**
  component → dark **`artwork`** background, see **`anatomy-rules.md`**.

Detection: lowercase the group value / variant name and match the keyword.
Figma fills are `{r, g, b}` (0–1) or a bound variable — **never a CSS-var
string** like `--fds-color-*`.

## Validation Rules

### Rule 1: Consistency
All variants should have the same set of keys (or a consistent subset).

**Valid**:
```
State=Filled, Theme=Surface
State=Filled, Theme=On-Header  ← same keys
State=Focus, Theme=Surface     ← same keys
```

**Warning** (but allow):
```
State=Filled, Theme=Surface, Size=Regular
State=Focus, Theme=Surface     ← missing Size
→ Report: "Inconsistent variant structure"
→ Action: Include Size with empty value or note as optional
```

### Rule 2: No Empty Values
All values should be non-empty strings.

**Invalid**:
```
State=, Theme=Surface  ← empty State value
→ Skip this variant, log warning
```

### Rule 3: Case Sensitivity
Preserve original case in keys and values.

**Valid**:
```
State=Filled (not state, STATE, or State)
Theme=On-Header (not on-header or ON-HEADER)
```

## Parsing Output Format (for Phase 2)

```markdown
## Control Props Detected

| Prop Name | Possible Values | Count |
|-----------|-----------------|-------|
| State | Danger, Filled, Focus | 3 |
| Theme | Alternate-Surface, On-Header, On-Surface, Surface | 4 |
| Size | Large, Medium, Small | 3 |
| Assistive Text | Off, On | 2 |

**Total Variants**: 3 × 4 × 3 × 2 = 72

## Variant Grouping (by primary key)

- State=Danger: 12 variants (4 themes × 3 sizes)
- State=Filled: 12 variants (4 themes × 3 sizes)
- State=Focus: 12 variants (4 themes × 3 sizes)
- ... (etc)
```

## Lessons & Rule Proposals

If a component's variant naming doesn't follow the standard pattern:

1. **Document the pattern** in a lesson with `ruleProposal` field
2. **Propose an update** to this file with the new pattern
3. **Example lesson**:
```javascript
lesson.append({
  skill: "volundr",
  component: "CustomComponent",
  insight: "Uses '|' as key-value separator instead of '='",
  pattern: "Key1|Value1;Key2|Value2;Key3|Value3",
  ruleProposal: "Add Pattern C (delimiter: '|' and ';') to variant-parsing-rules.md",
  applied: false
});
```
