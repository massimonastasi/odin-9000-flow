---
name: "saga"
description: "**FIGMA WORKFLOW SKILL** — SAGA (Storybook Automation & Generative Asset): generates semantic HTML + vanilla CSS + CSS Modules from a Figma Auto Layout node, deriving CSS custom properties from native variable (NV) bindings. USE FOR: scaffolding component HTML/CSS from a Figma frame; generating --fds-* CSS vars from token bindings; producing .html + .css + .module.css output files. NOT FOR: token writes or audits (use mimr); layer renaming (use vali). INPUTS NEEDED: {frame_url}."
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

### Step 3 — Output files

Output three files, name derived from the Figma layer name (kebab-case):

| File | Description |
|---|---|
| **`{name}.html`** | Semantic structure mirroring the layer hierarchy |
| **`{name}.css`** | Vanilla CSS with `--fds-*` custom properties |
| **`{name}.module.css`** | CSS Modules version (scoped class names, same values) |

---

## Critical rules

| Rule | Detail |
|---|---|
| Explicit trigger only | Never activate unless the user explicitly requests code generation — do not auto-trigger after a MIMR audit |
| No hardcoded values | Every property with an NV binding must use a `--fds-*` CSS var — never inline the resolved pixel value |
| User input | Use `vscode_askQuestions` for any ambiguous decision (e.g. which variant to scaffold, output file location). Never use inline chat text. |
| CLAUDE.md assets | If Figma MCP returns a localhost image/SVG source, use it directly — do not create placeholders or import new icon packages |
