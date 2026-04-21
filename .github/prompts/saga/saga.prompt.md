---
name: "saga"
description: "**FIGMA WORKFLOW SKILL** — SAGA (Storybook Automation & Generative Asset): generates semantic HTML + vanilla CSS + CSS Modules OR a StencilJS component folder (tsx + css + Storybook story) from a Figma Auto Layout node, deriving CSS custom properties from native variable (NV) bindings. USE FOR: scaffolding component HTML/CSS from a Figma frame; generating --fds-* CSS vars from token bindings; producing .html + .css + .module.css output files; generating StencilJS Web Components with shadow DOM, @Prop() variant axes, named slots, and Storybook 9/10 CSF3 stories. NOT FOR: token writes or audits (use mimr); layer renaming (use vali). INPUTS NEEDED: {frame_url}."
agent: agent
argument-hint: "Figma frame URL or component name"
---

## First Render
Always display this at the start of the workflow:

█▀▀▀ █▀▀█ █▀▀█ █▀▀█
▀▀▀█ █▄▄█ █ ▄▄ █▄▄█
▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀  ▀
[ SAGA (Storybook Automation & Generative Asset) ]
[ CODE & DOCS ]


---

# SAGA — Storybook Automation & Generative Asset

## Purpose

Generate semantic HTML + CSS from a Figma Auto Layout node. CSS custom properties (`--fds-*`) are derived from native variable bindings — no hardcoded values unless no binding exists.

## Trigger

Activate when the user explicitly says:
- "generate component"
- "scaffold component from…"
- "generate HTML/CSS from…"
- "saga" or "bard" (direct skill invocation)

---

## Slots

| Slot | Source | Format |
|---|---|---|
| `{frame_url}` | User | Full Figma URL |
| `{file_key}` | Extracted from URL | path segment after `/design/` |
| `{node_id}` | Extracted from URL `node-id` param | replace `-` → `:` |

---

## Flow

### Step 1 — Fetch design context

Run `get_design_context` on the node. If the response is too large or truncated, run `get_metadata` for the high-level node map, then re-fetch only the required node(s).

### Step 2 — Map Auto Layout → CSS

For each frame in the node tree, map Figma properties to CSS:

| Figma property | CSS output |
|---|---|
| `layoutMode` HORIZONTAL / VERTICAL | `flex-direction: row / column` |
| `primaryAxisAlignItems` | `justify-content` |
| `counterAxisAlignItems` | `align-items` |
| `paddingTop/Right/Bottom/Left` | `padding` — see CSS var rule below |
| `itemSpacing` | `gap` — see CSS var rule below |
| `fills[0]` | `background` — see CSS var rule below |
| `cornerRadius` | `border-radius` — see CSS var rule below |
| `width` / `height` (FIXED sizing) | explicit `width` / `height` |

**CSS var derivation rule:** For any property that has an NV binding, derive the CSS custom property as `--{shortName}` where `shortName` is the last `/`-separated segment of the NV variable name.

> Example: NV name `spacing/fds-spacing-const/gap/h/fds-spacing-const-gap-h-pattern` → `--fds-spacing-const-gap-h-pattern`

Fall back to the raw resolved value for any property with no NV binding.

### Step 3 — Output format

Before writing any files, ask:

```
vscode_askQuestions([{
  header: "Output format",
  question: "What should SAGA produce for this component?",
  options: [
    { label: "HTML + CSS (vanilla)" },
    { label: "StencilJS component folder (tsx + css + story)" },
    { label: "Both" }
  ]
}])
```

Also ask for the **output directory** (default: `src/components/{name}/`).

If the user selects **StencilJS** or **Both**, ask:

```
vscode_askQuestions([{
  header: "Named slots",
  question: "List the named slots this component should expose (comma-separated, e.g. icon, content, actions).",
}])
```

**If vanilla (or Both):** output three files:

| File | Description |
|---|---|
| **`{name}.html`** | Semantic structure mirroring the layer hierarchy |
| **`{name}.css`** | Vanilla CSS with `--fds-*` custom properties |
| **`{name}.module.css`** | CSS Modules version (scoped class names, same values) |

**If StencilJS (or Both):** proceed to Phase 4.

---

## Phase 4 — StencilJS Component

Runs only when output format is **StencilJS** or **Both**.

### 4.1 — Component name & tag

- Derive a kebab-case name from the Figma COMPONENT_SET name.
- Prefix with `fds-`: e.g. `Notification banner` → tag `fds-notification-banner`, class `FdsNotificationBanner`.
- File stem = tag name: `fds-notification-banner.tsx`, `fds-notification-banner.css`.

### 4.2 — Output folder

```
{output-dir}/fds-{name}/
  fds-{name}.tsx
  fds-{name}.css
  fds-{name}.stories.ts
```

### 4.3 — TSX generation rules

**`@Component` decorator — always shadow: true**

```tsx
@Component({
  tag: 'fds-{name}',
  styleUrl: 'fds-{name}.css',
  shadow: true,
})
```

**One `@Prop()` per Figma variant axis, typed as string union**

Derive from `COMPONENT_SET.variantGroupProperties`. Each axis becomes one prop. Prop name = axis name lowercased/camelCased. Default = first listed value.

```tsx
// Example for "Type=Status|Neutral" and "Context=Success|Error|Alert|Info|surface|surface-variant"
@Prop() type: 'Status' | 'Neutral' = 'Status';
@Prop() context: 'success' | 'error' | 'alert' | 'info' | 'surface' | 'surface-variant' = 'success';
```

**Named slots — declared by the user at Step 3, not inferred from layer names**

Each slot name provided by the user becomes a `<slot name="…">` in `render()`. Never infer slots from VALI-renamed layers.

```tsx
render() {
  return (
    <Host class={`${this.type.toLowerCase()} ${this.context}`}>
      <slot name="icon" />
      <slot name="content" />
      <slot name="actions" />
    </Host>
  );
}
```

**Host sizing — map from root frame `layoutSizingHorizontal`**

| Figma value | `:host` CSS |
|---|---|
| `FILL` | `display: block; width: 100%;` |
| `FIXED` | `display: block; width: {value}px;` |
| `HUG` | `display: inline-block;` |

**Variant CSS — classes, not JS conditionals**

Write variant overrides in the `.css` file as host-state selectors:

```css
:host(.success) { --fds-surface: var(--fds-color-success-surface); }
:host(.error)   { --fds-surface: var(--fds-color-error-surface); }
```

Never branch on props in `render()` for visual differences — use CSS classes mapped from prop values via `Host class={…}`.

**No `defineCustomElements` call.** Add a comment in the file:

```tsx
// Registration: import this component via your Stencil build's dist-custom-elements loader.
// e.g. import { defineCustomElements } from 'fds-components/loader';
```

### 4.4 — CSS file rules

- All values via `--fds-*` CSS custom properties from the NV binding map (Phase 2).
- `:host` block first, then variant overrides, then internal layout.
- No hardcoded pixel values for any property that has an NV binding.
- Shadow DOM scoping — no BEM, no descendant selectors deeper than one level.

```css
:host {
  display: block;
  width: 100%;
  background: var(--fds-surface);
  border-radius: var(--fds-container-reg);
  padding: var(--fds-container-card);
}

/* Variant overrides */
:host(.success) { --fds-surface: var(--fds-color-success-surface); }
:host(.error)   { --fds-surface: var(--fds-color-error-surface); }

/* Internal layout */
.banner-content {
  display: flex;
  flex-direction: column;
  gap: var(--fds-gap-v-group);
}
```

### 4.5 — Storybook story (CSF3, Storybook 9/10, `@storybook/web-components`)

```ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Ensure the component is registered
import '../fds-{name}';

type ComponentArgs = {
  type: 'Status' | 'Neutral';
  context: 'success' | 'error' | 'alert' | 'info' | 'surface' | 'surface-variant';
  // one entry per slot declared by the user:
  iconSlot?: string;
  contentSlot?: string;
  actionsSlot?: string;
};

const meta: Meta<ComponentArgs> = {
  title: 'Components/Fds{PascalName}',
  tags: ['autodocs'],
  argTypes: {
    type:    { control: 'select', options: ['Status', 'Neutral'] },
    context: { control: 'select', options: ['success', 'error', 'alert', 'info', 'surface', 'surface-variant'] },
  },
  render: ({ type, context, iconSlot, contentSlot, actionsSlot }) => html`
    <fds-{name} type=${type} context=${context}>
      ${iconSlot    ? html`<span slot="icon">${iconSlot}</span>`       : ''}
      ${contentSlot ? html`<span slot="content">${contentSlot}</span>` : ''}
      ${actionsSlot ? html`<span slot="actions">${actionsSlot}</span>` : ''}
    </fds-{name}>
  `,
};
export default meta;
type Story = StoryObj<ComponentArgs>;

// One story per primary variant; no story if combinations > 12
export const Default: Story = {
  args: { type: 'Status', context: 'success', contentSlot: 'Banner message goes here.' },
};
export const Error: Story = {
  args: { type: 'Status', context: 'error', contentSlot: 'Something went wrong.' },
};
export const Alert: Story = {
  args: { type: 'Status', context: 'alert', contentSlot: 'Attention required.' },
};
export const Info: Story = {
  args: { type: 'Status', context: 'info', contentSlot: 'For your information.' },
};
export const Neutral: Story = {
  args: { type: 'Neutral', context: 'surface', contentSlot: 'Neutral banner.' },
};
```

**Story rules:**
- Use `lit` `html` template tag for rendering — required by `@storybook/web-components`.
- Slot args are plain strings wrapped in a `<span slot="…">` — keeps the story controls simple.
- If the component has no variant axes, emit a single `Default` story only.
- `tags: ['autodocs']` always present — enables the auto-generated docs page.

---

## Critical rules

| Rule | Detail |
|---|---|
| Explicit trigger only | Never activate unless the user explicitly requests code generation — do not auto-trigger after a MIMR audit |
| No hardcoded values | Every property with an NV binding must use a `--fds-*` CSS var — never inline the resolved pixel value |
| User input | Use `vscode_askQuestions` for any ambiguous decision (e.g. which variant to scaffold, output file location). Never use inline chat text. |
| CLAUDE.md assets | If Figma MCP returns a localhost image/SVG source, use it directly — do not create placeholders or import new icon packages |
| Shadow DOM always | StencilJS output always uses `shadow: true` — never `shadow: false` |
| Slots are explicit | Named slots come from the user's answer at Step 3 — never infer from VALI layer names |
| No JS variant logic | Visual variant differences go in CSS (`:host(.class)`) — never branch in `render()` |
| Stencil tag prefix | All generated tags must be prefixed `fds-` |
| Story renderer | Always use `lit` `html` tag in stories — required by `@storybook/web-components` |
