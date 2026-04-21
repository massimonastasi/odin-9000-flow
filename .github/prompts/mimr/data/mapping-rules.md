# Mapping Rules
<!-- schema-version: 1 -->

> **Bulk-update rules for token migrations.**
> Agent parses these YAML blocks during Phase 3 to generate the write payload.
>
> — See `examples/mapping-rules.example.md` for format reference and field descriptions.
> — Rules are applied in order. Use `scope` to limit which properties each rule touches.
> — After parsing, the agent previews all target nodes and waits for confirmation before writing.

---

## Button token rules

Apply these rules whenever the target component is a button (layer name contains `btn`, `button`, `Button`, or variant properties contain `Appearance` / `State` / `Device`).

### Fill colours

> **Rule: `fds-btn-on-*` and `fds-on-btn-*` are NEVER background fills.** `on-*` tokens are always for content rendered ON TOP of a surface (text, icons, borders). Button background fill uses `fds-surface-variant` / `fds-alternate-surface-variant` (or a custom team token).

| Use case | Background fill token | Content (`on-*`) token |
|---|---|---|
| **Surface-style button on surface** (`Appearance=onSurface`) | `var.fds.fds-surface-variant` | `fds-on-surface-*` for text/icon |
| **Surface-style button on alternate surface** (`Appearance=onAlternate`) | `var.fds.fds-alternate-surface-variant` | `fds-on-alternate-surface-*` for text/icon |
| **Core FDS standard button** | `fds-btn-*` (e.g. `fds-btn-default`) | `fds-on-btn-*` for text/icon on top |
| **Custom team button** | Keep the team's fill token — do **not** overwrite. Ask the user to confirm which fill token to use. | |

> **Per-state fill:** `fds-surface-variant` is a single variable — state changes (hover/active/default) are resolved via Figma variable modes, not by switching to a different fill token. Do **not** use `fds-btn-on-surface-default/active` etc. as fill — those are wrong.

> **Fill NV binding:** `setBoundVariable('fills', v)` is not supported on COMPONENTs. Always use `figma.variables.setBoundVariableForPaint(paints[0], 'color', v)` and reassign `node.fills`.

### Border radius

Use `fds-round-const-btn-*` — **never** `fds-border-radius-btn-*` for radius on buttons.

| Button size tier | Token |
|---|---|
| Small / compact | `fds-round-const-btn-sm` → `fds-round-const.ui-controls.btn.fds-round-const-btn-sm` |
| Regular (default) | `fds-round-const-btn-reg` → `fds-round-const.ui-controls.btn.fds-round-const-btn-reg` |
| Large / hero | `fds-round-const-btn-lg` → `fds-round-const.ui-controls.btn.fds-round-const-btn-lg` |

### Spacing (padding + gap)

| Property | Token family | Notes |
|---|---|---|
| `paddingTop/Bottom` | `fds-spacing-const-btn-{size}-v` | Match size tier to the button's visual density |
| `paddingLeft/Right` | `fds-spacing-const-btn-{size}-h` | Same size tier as vertical |
| `itemSpacing` inside button (icon + label) | `fds-spacing-const-ui-gap` | Always `ui-gap` — this is a UI-level spacing, not a pattern gap |

### When unsure about size tier (sm / reg / lg)

**Always ask before writing** using `vscode_askQuestions`:

```json
{
  "questions": [{
    "header": "btn-size-tier",
    "question": "Which button size tier should I use for spacing and radius tokens?",
    "allowFreeformInput": false,
    "options": [
      { "label": "sm — Small / compact / toolbar", "description": "fds-spacing-const-btn-sm-v/h + fds-round-const-btn-sm" },
      { "label": "reg — Regular / standard (default)", "description": "fds-spacing-const-btn-reg-v/h + fds-round-const-btn-reg", "recommended": true },
      { "label": "lg — Large / hero CTA", "description": "fds-spacing-const-btn-lg-v/h + fds-round-const-btn-lg" }
    ]
  }]
}
```

### Content fills (text + icons) — REQUIRED step, never omit

After binding the background fill on the COMPONENT frame, you **must** also bind fill NV on every TEXT and `icon` VECTOR node inside each component variant.

**Rule:** content fill token is determined by `Appearance` — same as background, but using `fds-on-*` counterpart.

| Appearance | Content fill token | Variable name |
|---|---|---|
| `onSurface` | `var.fds.fds-on-surface-hi` | `var/fds/fds-on-surface-hi` |
| `onAlternate` | `var.fds.fds-on-alternate-surface-hi` | `var/fds/fds-on-alternate-surface-hi` |
| Core FDS button | `var.fds.fds-on-btn-hi` (or equivalent) | Confirm with user |

**Emphasis level:** default to `hi` unless the design uses a different emphasis. Ask with `vscode_askQuestions` if unsure:

```json
{
  "questions": [
    {
      "header": "Text fill token",
      "question": "Which emphasis level for the label text?",
      "options": [
        { "label": "fds-on-surface-hi / fds-on-alternate-surface-hi", "recommended": true },
        { "label": "fds-on-surface-m / fds-on-alternate-surface-m" },
        { "label": "fds-on-surface-color / fds-on-alternate-surface-color" }
      ]
    },
    {
      "header": "Icon fill token",
      "question": "Which emphasis level for the icons?",
      "options": [
        { "label": "Same as text", "recommended": true },
        { "label": "fds-on-surface-m / fds-on-alternate-surface-m" }
      ]
    }
  ]
}
```

**How to collect content nodes:** recurse the full component subtree; collect nodes where `type === 'TEXT'` or `(type === 'VECTOR' && name === 'icon')`. Apply `setBoundVariableForPaint` + TS metadata on each.

**TS key:** `fill` (same key as background fill — set on the content node itself, not the parent frame).

### Custom team buttons

When a button component has custom fill properties (e.g. a product-specific accent colour not in the core `fds-btn-*` set):

1. Do **not** overwrite the fill with a generic FDS token
2. Apply spacing, radius, border, and gap tokens as normal
3. For the fill: write the team's own token path (confirm with user if ambiguous)
4. Note in the Phase 2 report: `⚠️ Custom fill — team token applied, FDS fill skipped`

---

## Elevation (box shadow) rules

Elevation is applied via **Figma Effect Styles** (`effectStyleId`), not variables. TS metadata key is `boxShadow`.

### Tier selection

| Component size / context | Token | Effect style name |
|---|---|---|
| **Heavy** — large cards, hero panels | `fds-elevation-const-surface-heavy` | `on-surface/fds-elevation-const-surface-heavy` |
| **Medium** — popovers, dropdowns, sort overlays, tooltips | `fds-elevation-const-surface-medium` | `on-surface/fds-elevation-const-surface-medium` |
| **Light** — badges, buttons, chips, tiny elements | `fds-elevation-const-surface-light` | `on-surface/fds-elevation-const-surface-light` |

Choose `on-alternate-surface/*` variants when component sits on an alternate surface.

### How to apply

```js
var allEffectStyles = figma.getLocalEffectStyles();
var style = allEffectStyles.find(function(s) { return s.name === 'on-surface/fds-elevation-const-surface-medium'; });
node.effectStyleId = style.id;
node.setSharedPluginData('tokens', 'boxShadow', '"on-surface.fds-elevation-const-surface-medium"');
```

> **TS path encoding:** replace `/` with `.` when writing the effect style name as a TS token path.

---

## Header / section strip rules

Apply when the target component is a **header row** or **section strip** (layer name contains `Header`, `Section Header`, `Navigation Strip`, or component variants use `Surface=on-surface` / `Surface=on-alternate-surface` without a list or overlay context).

### Identifying characteristics
- Horizontal layout row, typically 32–48px tall
- No background fill on the COMPONENT itself (fills = 0) → **no background fill binding needed**
- Zero corner radius → **no radius binding needed**
- Children are title/label INSTANCEs + action/navigation button INSTANCEs

### Spacing tokens

| Property | Typical design value | Token strategy |
|---|---|---|
| `paddingTop/Bottom` | 4px | Use `fds-spacing-050` primitive — no semantic header-v token exists |
| `paddingLeft/Right` | 16px | Use `fds-spacing-200` primitive — no semantic header-h token exists |
| `itemSpacing` | 8px (gap between title group and action group) | `fds-spacing-const-ui-gap` → `fds-spacing-100` = 8px |

> **When no semantic header token exists for a given design value, use the matching spacing primitive** (`fds-spacing-050` / `fds-spacing-100` / `fds-spacing-150` / `fds-spacing-200`). Do not force a `btn-*` or `density-*` token onto a header component.

> **Confirmed variable IDs for this file:**
> - `fds-spacing-050`: `VariableID:8094:59602` (4px)
> - `fds-spacing-200`: `VariableID:8094:59605` (16px)
> - `fds-spacing-const-ui-gap`: `VariableID:8094:59638` (→ `fds-spacing-100`, 8px)

### Content fills — same rule as buttons

Recurse full subtree; bind `fds-on-surface-hi` / `fds-on-alternate-surface-hi` on all TEXT and `icon` VECTOR nodes, matched to the `Surface=on-surface` / `Surface=on-alternate-surface` variant.

---

## List item density rules

List items inside containers (popovers, menus, dropdowns, drawers) use **density tokens** for `paddingTop/Bottom` only. Horizontal padding uses the spacing primitive.

> **Density applies only to `paddingTop` and `paddingBottom`** — never to left/right padding.

### Density token tier selection

| Token | Resolves to | Description | Use when |
|---|---|---|---|
| `fds-spacing-const-density-compact` | `fds-spacing-050` = **4px** | Maximizes data density; power-user views | Very dense data tables, compact lists |
| `fds-spacing-const-density-reg` | `fds-spacing-100` = **8px** | Balanced; standard lists & menus | **Default** — sort menus, dropdowns, navigation lists |
| `fds-spacing-const-density-wide` | `fds-spacing-200` = **16px** | Editorial; high-value items | Feature lists, onboarding, premium cards |

TS path: `spacing.fds-spacing-const.density.fds-spacing-const-density-{compact|reg|wide}`

### Horizontal padding

List item left/right padding = `fds-spacing-100` (8px primitive — no semantic density equivalent for horizontal).

TS path: `spacing.fds-spacing.fds-spacing-100`

### Hardcoded value rule

If the design value (e.g. 12px) does not match any density token, **do not silently hardcode** — use the nearest spacing primitive (`fds-spacing-150` = 12px) and ask the user to confirm before writing.

### How to detect inconsistency

Before applying, check that all sibling rows in the same component have matching `paddingTop`. If any row has `paddingTop: 0` while siblings have non-zero values, flag it as a design inconsistency and fix it to match the chosen density tier.

---

## Border radius — container/overlay rules

| Use case | Token | TS path |
|---|---|---|
| **Standard containers** — lists, panels, cards, popovers, overlays | `fds-round-const-container-reg` | `fds-round-const.containers.standard.fds-round-const-container-reg` |
| **Large containers** — wide/tall card variants | `fds-round-const-container-lg` | `fds-round-const.containers.standard.fds-round-const-container-lg` |
| **Modal-class** — full-screen drawers, modal dialogs | `fds-round-const-modal-reg` / `fds-round-const-modal-lg` | `fds-round-const.containers.modal-class.*` |
| **Buttons** | see Button token rules section — `fds-round-const-btn-*` | |

> **Note:** `fds-round-const-container-reg` and `fds-round-const-modal-reg` both resolve to 8px but have distinct semantic meaning. Use `container-reg` for overlay/popover panels; reserve `modal-reg` for true modal dialogs.

---

## Annotations

When `Annotations: True` is passed to ODIN-9000 or MIMR, write Figma **native annotations** on each node that receives token bindings. Do **not** use `setSharedPluginData` for this purpose.

### API

```js
node.setAnnotations([{
  label: 'borderRadius → fds-round-const-container-reg\nspacing → fds-spacing-const-container-card\nboxShadow → on-surface.fds-elevation-const-surface-heavy',
  properties: []
}]);
```

### Format

The `label` string should list every token binding applied to the node, one per line:

```
{tsKey} → {tsPath}
{tsKey} → {tsPath}
...
```

### Failure handling

If `node.setAnnotations` throws or is unavailable in the current API context:
1. Log `{ nodeId, error }` to the audit report under a `⚠️ annotation-skipped` row.
2. **Do not fall back to `setSharedPluginData`.** Shared plugin data is only for Token Studio (`tokens` namespace) and verified workflow metadata — never for display annotations.

---

<!-- Add YAML bulk-update rules below. Each rule is a fenced YAML block. -->
