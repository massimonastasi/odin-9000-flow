# FDS Documentation Wireframe Examples

## Example 1: FDS-Badge (Reference Template)
**Source**: https://figma.com/design/Dli7JA3N6vuTTYi4lD9qMF?node-id=41890-21119

### Page Structure
```
Page: 🧣 DS Fabric Components --WIP-
└── Section: FDS-Badge (1269×3544px)
    ├── Frame 1: Badge (overview) [541×383px]
    │   ├── Visual Example (156×154px): shows actual badge component
    │   ├── Description text: "Badge is a non-interactive component..."
    │   └── "Control Props" label
    │
    ├── Frame 2: Control (properties table) [550×334px]
    │   ├── Header: Name | Control
    │   ├── Row: Type | Default, Status, status surface, neutral
    │   ├── Row: Context | Success, Error, Alert, Info, Neutral, Neutral-alternate...
    │   ├── Row: Content Type | Numerical, Text (context), Blank
    │   ├── Row: Size | Regular, Large
    │   └── Row: Shape | Default, Alternate
    │
    ├── Frame 3: Variants [1013×2229px]
    │   ├── Title: "Variants" + divider line
    │   │
    │   ├── Group: Default
    │   │   ├── Label: "Type: default"
    │   │   └── Body: [contains 2-8 variants in grid]
    │   │
    │   ├── Group: Status
    │   │   ├── Label: "Type: STATUS"
    │   │   └── Body: [background color for theme, contains variants]
    │   │
    │   ├── Group: Status Surface
    │   │   ├── Label: "Type: STATUS SURFACE"
    │   │   └── Body: [background color for theme, contains variants]
    │   │
    │   └── Group: Neutral
    │       ├── Label: "Type: NEUTRAL"
    │       └── Body: [background color for theme, contains variants]
    │
    └── Frame 4: FDS-Badge (instances grid) [1013×1956px]
        └── Contains ~60 symbol instances arranged in grid
            Type=Default, Context=Primary, Content Type=Numerical, Size=Regular...
            Type=Status, Context=Success, Content Type=Numerical...
            Type=Neutral, Context=Neutral, Content Type=Text...
            (etc.)
```

---

## Example 2: fds-sb-toggle (Target Documentation)
**Source**: rhSXN8LjWELGgCvtCnIxM6 (8225:12554)

### Current Component State
```
Frame: fds-sb-toggle [324×558px]
├── Symbol: Theme=on-surface, State=off, Icon=off, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-alternate-surface, State=off, Icon=off, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-surface, State=on, Icon=off, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-alternate-surface, State=on, Icon=off, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-surface, State=on, Icon=on, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-alternate-surface, State=on, Icon=on, Style=Default, text=no [60×36px]
├── Symbol: Theme=on-surface, State=off, Icon=off, Style=Default, text=yes [110×36px]
└── Symbol: Theme=on-surface, State=on, Icon=off, Style=Default, text=yes [110×36px]
```

### Expected Documentation Structure (on same page)
```
Page: [Figma file page containing fds-sb-toggle]
└── Starting at Y: 600
    │
    ├── Frame 1: fds-sb-toggle (overview) [541×383px]
    │   ├── Visual Example of toggle component
    │   ├── Description: "Toggle switch component with icon, state, and theme variants"
    │   └── "Control Props" label
    │
    ├── Frame 2: Control (properties table) [550×348px]
    │   ├── Header: Name | Control
    │   ├── Row: Theme | on-surface, on-alternate-surface
    │   ├── Row: State | off, on
    │   ├── Row: Icon | off, on
    │   ├── Row: Style | Default
    │   └── Row: text | no, yes
    │
    ├── Frame 3: Variants [1013×2229px]
    │   ├── Title: "Variants" + divider line
    │   │
    │   ├── Group: on-surface
    │   │   ├── Label: "Type: Theme=on-surface"
    │   │   ├── Body: [Background: #f2f2f2 (on-surface color)]
    │   │   │   └── Contains 5 variants:
    │   │   │       - State=off, Icon=off, text=no
    │   │   │       - State=on, Icon=off, text=no
    │   │   │       - State=on, Icon=on, text=no
    │   │   │       - State=off, Icon=off, text=yes
    │   │   │       - State=on, Icon=off, text=yes
    │   │   └── "5 variant instances" indicator
    │   │
    │   └── Group: on-alternate-surface
    │       ├── Label: "Type: Theme=on-alternate-surface"
    │       ├── Body: [Background: #e6e6e6 (on-alternate-surface color)]
    │       │   └── Contains 3 variants:
    │       │       - State=off, Icon=off, text=no
    │       │       - State=on, Icon=off, text=no
    │       │       - State=on, Icon=on, text=no
    │       └── "3 variant instances" indicator
    │
    └── Frame 4: fds-sb-toggle (instances grid) [1013×1956px]
        └── Contains all 8 symbol instances in grid layout
```

### Control Props Extraction
```
Theme:  [on-surface, on-alternate-surface]
State:  [off, on]
Icon:   [off, on]
Style:  [Default]
text:   [no, yes]
```

### Variant Groups Organization
```
Group 1:
  Key: Theme
  Value: on-surface
  Count: 5 variants
  Background: #f2f2f2

Group 2:
  Key: Theme
  Value: on-alternate-surface
  Count: 3 variants
  Background: #e6e6e6
```

---

## Frame Dimensions (FDS Standard)

| Section | Width | Height | Notes |
|---------|-------|--------|-------|
| Component Overview | 541 | 383 | Visual example + description |
| Control Props Table | 550 | 48 + (propCount × 60) | Header + data rows |
| Variants Organization | 1013 | 2000+ | Title + groups + dividers |
| Instances Grid | 1013 | 1900+ | Grid of symbol instances |

**Total Page Height**: 600 (start Y) + 383 + spacing + tableHeight + 2229 + 1956 = ~5200px

---

## Color Mapping for Backgrounds

When variant names contain theme keywords, apply matching background colors:

| Keyword | Color | RGB |
|---------|-------|-----|
| on-surface | Light gray | #f2f2f2 (r:0.95, g:0.95, b:0.95) |
| on-alternate-surface | Alt light gray | #e6e6e6 (r:0.9, g:0.9, b:0.9) |
| on-header | Light header | #d9d9d9 (r:0.85, g:0.85, b:0.85) |
| surface | Light | #f2f2f2 (r:0.95, g:0.95, b:0.95) |
| alternate-surface | Alt light | #e6e6e6 (r:0.9, g:0.9, b:0.9) |

---

## Generation Algorithm

### Input Phase 1 Analysis (fds-sb-toggle example):
```json
{
  "componentName": "fds-sb-toggle",
  "description": "Toggle switch component with icon, state, and theme variants",
  "controlProps": {
    "Theme": ["on-surface", "on-alternate-surface"],
    "State": ["off", "on"],
    "Icon": ["off", "on"],
    "Style": ["Default"],
    "text": ["no", "yes"]
  },
  "variantGroups": [
    {
      "groupKey": "Theme",
      "groupValue": "on-surface",
      "variants": [
        "Theme=on-surface, State=off, Icon=off, Style=Default, text=no",
        "Theme=on-surface, State=on, Icon=off, Style=Default, text=no",
        "Theme=on-surface, State=on, Icon=on, Style=Default, text=no",
        "Theme=on-surface, State=off, Icon=off, Style=Default, text=yes",
        "Theme=on-surface, State=on, Icon=off, Style=Default, text=yes"
      ]
    },
    {
      "groupKey": "Theme",
      "groupValue": "on-alternate-surface",
      "variants": [
        "Theme=on-alternate-surface, State=off, Icon=off, Style=Default, text=no",
        "Theme=on-alternate-surface, State=on, Icon=off, Style=Default, text=no",
        "Theme=on-alternate-surface, State=on, Icon=on, Style=Default, text=no"
      ]
    }
  ]
}
```

### Output Phase 3 Frames:
1. ✅ Overview frame created at Y:600
2. ✅ Control Props table created at Y:1007 (with 5 rows)
3. ✅ Variants groups created at Y:1405 (2 groups)
4. ✅ Instances grid created at Y:3655

**Total**: 4 frames, 2 groups, 5 control props, 8 variant instances
