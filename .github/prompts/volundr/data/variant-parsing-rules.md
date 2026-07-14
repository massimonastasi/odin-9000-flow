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

## Theme Keyword Detection

**Used for background handling in documentation**:

### Detected Keywords
| Keyword | Background Token | Visual Use |
|---------|------------------|-----------|
| `on-surface` | `--fds-color-on-surface` | Dark/inverted background |
| `on-alternate-surface` | `--fds-color-on-alternate-surface` | Alternative dark background |
| `on-header` | `--fds-color-on-header` | Header/top-bar dark background |
| `surface` | `--fds-color-surface` | Light/neutral background |
| `alternate-surface` | `--fds-color-alternate-surface` | Alternative light background |

### Detection Logic
```javascript
function getBackgroundToken(variantName) {
  const bgTokens = {
    "on-surface": "--fds-color-on-surface",
    "on-alternate-surface": "--fds-color-on-alternate-surface",
    "on-header": "--fds-color-on-header",
    "surface": "--fds-color-surface",
    "alternate-surface": "--fds-color-alternate-surface"
  };
  
  for (const [keyword, token] of Object.entries(bgTokens)) {
    if (variantName.toLowerCase().includes(keyword)) {
      return token;
    }
  }
  return null; // No background override
}
```

**Usage in Phase 3**:
- Extract variant name from component instance
- Call `getBackgroundToken()`
- If token returned, apply to group frame background

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
