---
name: "mimr"
description: "**FIGMA WORKFLOW SKILL** — MIMR (Metadata Inventory & Mapping Repository): hybrid two-pass audit combining REST fetch + Token Studio shared plugin data with Plugin API native variable resolution. Merged report with conflict detection, token suggestions from registry, bulk writes via mapping rules. USE FOR: auditing TS + NV bindings; detecting conflicts; bulk token migrations. NOT FOR: HTML/CSS code generation (use saga). INPUTS NEEDED: {frame_url} + {pat}."
agent: agent
argument-hint: "Figma frame URL"
---
## First Render
Always start from displaying following at beginning of the workflow:

█▀▄▀█ █ █▀▄▀█ █▀▄
█ ▀ █ █ █ ▀ █ █▀▄
▀   ▀ ▀ ▀   ▀ ▀  ▀
[ MIMR (Metadata Inventory & Mapping Repository) ]
[ DATA & TOKENS ]

Color it yellow in console output if possible, or just print as plain text if not.


# MIMR — Metadata Inventory & Mapping Repository

## Purpose

Audit, compare and bulk-update token bindings across Token Studio (TS) and native Figma variables (NV).

| Workflow | Trigger | Phases |
|---|---|---|
| **Audit** | user provides a Figma URL | 1 → 1b → 2 |
| **Bulk update** | "apply mapping rules" after an audit | 3 |

---

## External files

| File | Purpose | Edit? |
|---|---|---|
| `scripts/audit.figma.js` | **Phase 1 — MANDATORY** plugin-side tree walk. Use for ALL discovery. | No |
| `scripts/resolve.figma.js` | Phase 1b — variable resolution (Plugin API), batched in chunks of 50 | No |
| `scripts/bulk-update.figma.js` | Phase 3 — write engine (Plugin API), chunked in batches of 100 | No |
| `data/token-registry.md` | All available tokens — human-readable reference | **User** |
| `data/token-index.json` | All available tokens — compact machine index for agent lookups | **Auto-generated** |
| `data/mapping-rules.md` | Bulk-update rules (YAML blocks) | **User** |
| `data/ts-core-fabric.json` | Raw Token Studio export — source for registry/index generation | **No — never load** (21K lines, context overflow risk) |

---

## Slots

| Slot | Source | Format |
|---|---|---|
| `{frame_url}` | User | Full Figma URL |
| `{file_key}` | Extracted from URL | path segment after `/design/` |
| `{node_id}` | Extracted from URL `node-id` param | replace `-` → `:` |
| `{node_id_param}` | REST URL param | keep `-` (e.g. `21774-64113`) |
| `{pat}` | User provides directly — never guess | `figd_xxxx…` |

**Before Phase 1:** verify `{frame_url}` and `{pat}`.
**Before Phase 3:** verify `data/mapping-rules.md` has at least one rule block.

---

## Phase 1 — Discovery (ALWAYS use scripts)

> **⚠️ MANDATORY: Use `scripts/audit.figma.js` for ALL discovery.**
> Never write ad-hoc Plugin API code to walk the tree or inspect nodes.
> Never make multiple `getNodeByIdAsync` calls in a loop.
> The script is optimized to return only bound nodes, uses variant sampling,
> supports PRIOR_SCAN forwarding, and costs 4× fewer context tokens.

The script handles all component sizes — from single frames to 500+ variant COMPONENT_SETs — with built-in sampling and batching. There is no size threshold; always use it.

### Script load (session-cached)

Read `scripts/audit.figma.js` only if not already loaded this session. Cache under key `audit-script`.

### Variant sampling (built into the script)

Before running the script, determine whether variant sampling is needed:

1. Use `get_metadata` (Figma MCP) or a shallow REST call with `depth=1` to read the node type and direct child count
2. **If the root is a `COMPONENT_SET` with > 20 direct COMPONENT children:**
   - Read `variantGroupProperties` from the COMPONENT_SET
   - **Sample variants** — select 1 variant per unique value of the **primary axis** (the axis with the most values). Keep all other axes at their default (first) value.
   - Pass sampled IDs via `SAMPLE_IDS` injection slot
3. **If ≤ 20 children** → set `SAMPLE_IDS = null` for full audit

### Injection slots

Inject at the top of the script:
```js
const ROOT_ID    = "{node_id}";
const MAX_DEPTH  = 4;
const SAMPLE_IDS = [{sampled_ids}];  // null for full audit, or array of variant IDs
const PRIOR_SCAN = null;             // or array of {id, name} from VALI scan (ODIN only)
```

**`PRIOR_SCAN` fast path (ODIN pipeline only):**
When ODIN runs VALI before MIMR, the VALI scan already discovers every node that needs tokens. ODIN forwards this as a `PRIOR_SCAN` array of `{id, name}` objects. When provided, the script skips the full tree walk and fetches only the listed nodes (batched 50 at a time), reading just their bound variables (`TS`/`NV`). This eliminates a redundant tree traversal and reduces plugin execution time significantly. The return shape is identical; `fromPriorScan: true` is set so the agent knows the fast path was used.

When invoking MIMR standalone (not via ODIN), leave `PRIOR_SCAN = null` — the script falls back to the standard tree walk automatically.

### Script output

The script returns `{ root, variantGroupProperties, nodes, varIds, stats, fromPriorScan }`.
- Use `nodes` directly as Phase 1 results (already filtered to bound nodes only)
- Use `varIds` as `allVarIds` for Phase 1b
- `stats` gives totals for the Phase 2 summary line
- `fromPriorScan` indicates whether the fast path was used

### REST fallback (ONLY when Plugin API is unavailable)

Use REST **only** if `mcp_figma_use_figma` is unavailable (e.g. Figma MCP not connected). This is the exception, not the default.

```
GET https://api.figma.com/v1/files/{file_key}/nodes?ids={node_id_param}&plugin_data=shared&depth={depth}
X-Figma-Token: {pat}
```

`plugin_data=shared` is mandatory — without it `sharedPluginData` is silently absent.

**Depth parameter:**
- Default: omit `depth` (full tree)
- **For COMPONENT_SET with > 20 variants:** use `depth=3` + variant sampling
- For single frames or small components: omit `depth`

---

## Phase 1b — Variable resolution (Plugin API)

**Script load (session-cached):** Read `scripts/resolve.figma.js` only if not already loaded this session. Store the content in session memory under key `resolve-script`. On subsequent calls within the same session, read from session memory instead of the file.

Inject at the top of the cached script content, then execute via `mcp_figma_use_figma`:

```js
const VAR_IDS  = [ /* allVarIds from Phase 1 */ ];
const NODE_IDS = [ /* ids where hasBoundVars === true */ ];
```

Node resolution is batched internally (chunks of 50 via `Promise.all`) — no need to split the injected arrays. For very large node sets (500+), the batching prevents plugin timeout.

Use `fileKey = {file_key}`.

Merge returned `nodeBindings` into `results[]` by `node.id`, replacing `rawBoundVars` with `resolved` (human-readable names + collections).

---

## Phase 2 — Merged report (STOP — confirm before any write)

### Token registry lookup

**Never read `data/token-registry.md` in full — it is large and will fill the context window.**

Use this lookup strategy:
1. **grep_search first** — search `data/token-registry.md` by the token short name or partial TS path. This returns only matching rows at negligible cost.
2. **JSON index fallback** — if programmatic access is needed (e.g. to resolve NV from a TS path in a script), `require('data/token-index.json')`. Schema: `{ tokens: [[shortName, tsPath, type, nv?, desc?], ...] }`.
3. **Never load the full MD** — only use grep_search or the JSON index.

For every `⚠️ CONFLICT` row: grep the short name and surface the **canonical TS path** as a suggestion inline.

### Conflict detection

Emit `⚠️ CONFLICT` when a node has **both** TS and NV on the same logical property **and the last path segments differ**:

| TS key | NV property |
|---|---|
| `paddingLeft` / `horizontalPadding` / `spacing` | `paddingLeft`, `paddingRight` |
| `itemSpacing` | `itemSpacing` |
| `borderRadius` | `cornerRadius` / corner radius variants |
| `fill` | `fills` |
| `border` | `strokes` |

### Tree format

```
Legend: 🎨 TS = Token Studio  📐 NV = Native variable  ∅ = no bindings  ⚠️ = conflict  🔒 = Instance (read-only, not expanded)

{RootName}  [{TYPE}]  {id}
├── {prop}  🎨 {ts.short}  |  📐 {nv.name}  [{nv.collection} · {nv.type}]                       ← TS+NV chain
├── {prop}  🎨 {ts.short}  |  📐 {nv.name}  [{nv.collection} · {nv.type}]  ⚠️ CONFLICT  → suggest: {canonical}
├── 🎨 {key}  →  {ts.short}                                                                       ← TS only
├── 📐 {prop}  →  {nv.name}  [{nv.collection} · {nv.type}]                                       ← NV only
├── 🔒 {name}  [INSTANCE]                                                                         ← instance leaf — not expanded
└── ∅
```

Append `(prop1/prop2/…)` when multiple native props share the same variable.
Legend printed once at the top.

**Truncation rules (apply when node count > 40):**
- **Collapse ∅ subtrees** — if a parent and all its descendants are `∅`, replace the entire subtree with a single `└── ∅ ({N} unbound children)` line.
- **Group identical siblings** — if 3 or more consecutive siblings have the exact same binding pattern, collapse to `├── {pattern}  ×{N}` and show only the first and last node names.
- **Cap depth at 4 levels** — beyond level 4, print `… ({N} deeper nodes, {M} with bindings)` and stop descending. If any deeper nodes have conflicts, note `{K} conflicts deeper` on the same line.
- Always show the full path for any node that has a `⚠️ CONFLICT` regardless of depth or grouping.

### Summary line

```
{total} nodes — {withTS} TS · {withNV} native · {conflicts} conflicts · {unbound} unbound
```

Then ask:

> **Do you want to write/update any bindings?**
> Options: (a) author rules in `data/mapping-rules.md` then say "apply mapping rules" · (b) describe a specific change now

### Option (b) — ad-hoc write from natural language

When the user describes a change directly (e.g. "update all Square nodes' gap to fds-spacing-const-gap-h-pattern"), derive a RULES entry without touching `mapping-rules.md`:

1. **Extract** from the description:
   - `layerPattern` — the layer name substring or exact name the user mentioned
   - `matchType` — `contains` (default) unless user says "exact" or gives a regex
   - `key` — the CSS/layout property (`fill`, `borderRadius`, `itemSpacing`, `paddingLeft`, etc.)
   - `value` — the TS token path; grep_search `data/token-registry.md` by the token name the user gave to confirm the exact path

2. **Show a derived rule preview** before executing:

   | Rule ID | Layer Pattern | Match | Key | Token Path |
   |---|---|---|---|---|
   | `ad-hoc-{key}` | `{layerPattern}` | `{matchType}` | `{key}` | `{value}` |

   Ask: **"Apply this rule? (yes/no)"**

3. On confirmation proceed directly to Phase 3 Step 3 — Execute, using the derived RULES array.

4. Do **not** write the ad-hoc rule back to `data/mapping-rules.md` unless the user explicitly asks to save it.

---

## Phase 3 — Bulk write (only after confirmation)

> **⚠️ MANDATORY: Use `scripts/bulk-update.figma.js` for ALL writes.**
> Never write ad-hoc Plugin API code to apply tokens, bind variables, or modify node properties.
> The script handles TS metadata, auto NV resolution, fill binding, chunked execution,
> and skip-if-already-bound logic. Ad-hoc code bypasses all of these safeguards.

### 1 — Parse rules

Read `data/mapping-rules.md`. Extract every fenced YAML block. Parse into a `RULES` array matching the shape in `scripts/bulk-update.figma.js`.

If a rule uses `type: "nv"` with a `varId` field, verify the `varId` string is a valid `VariableID:xxx` value — grep_search `data/token-registry.md` by token short name (column `Native Variable Name`) to confirm. If not found, stop and ask.

**For every `ts` write:** the script auto-resolves NV via `tsPathToNvName` + `getLocalVariablesAsync()` — no `rawValue` lookup is required in the registry. If you need to verify a token path exists, use grep_search on `data/token-registry.md` by short name.

> **Explicit `type: "nv"` writes are a manual override only.** The script auto-resolves NV for every `ts` write — you do not need to add `nv` entries for standard cases.

> **Writes are safe on already-bound nodes (append, don't overwrite).** For `ts` writes: the TS metadata is always updated, but an existing NV binding on the same property is never cleared — the script skips the rawValue fallback if an NV is already bound. This means bulk rules can be applied to a mixed set of nodes (some already bound, some not) without risk of regressing nodes that are correctly set up.

### 2 — Preview (mandatory)

| Rule ID | Layer Pattern | Match | Matched Nodes | Writes |
|---|---|---|---|---|
| `{id}` | `{layer_pattern}` | `{match}` | N | `{key} → {value}` |

Ask: **"Apply these N rules to X nodes? (yes/no)"**

### 3 — Execute

**Script load (session-cached):** Read `scripts/bulk-update.figma.js` only if not already loaded this session. Store the content in session memory under key `bulk-update-script`. On subsequent calls within the same session, read from session memory instead of the file.

Inject at the top of the cached script content:

```js
const ROOT_ID = "{node_id}";    // colon format
const RULES   = [ /* parsed rules */ ];
```

Execute via `mcp_figma_use_figma` with `fileKey = {file_key}`.

**Auto-NV resolution** happens inside the script for every `ts` write:
1. The TS dot-path is converted to slash-name (`a.b.c` → `a/b/c`)
2. `getLocalVariablesAsync()` is searched for an exact name match
3. If found → `setBoundVariable` is called for each mapped prop (`borderRadius` → all 4 corners, etc.) — Figma resolves the value natively
4. If not found → `rawValue` is applied directly to the node style

**Fill handling — solid vs gradient:**
- **Solid fills:** excluded from auto-NV (`setBoundVariableForPaint` is needed); rawValue fallback applies the color.
- **Gradient fills (`-shade` / `-g` suffix):** TS tokens ending with `-shade` or `-g` are gradient paint styles, NOT variables. The script auto-detects these and applies via `node.fillStyleId = style.id` using `getLocalPaintStylesAsync()`. No rawValue needed.

### 4 — Audit log

| Result | Count |
|---|---|
| ✅ Applied | N |
| ✅ NV auto-bound | N |
| ✅ Component value updated | N |
| ⚠️ Component value skipped (has NV / unparseable) | N |
| ⚠️ Already same value | N |
| ❌ Failed | N |

For each `nv-auto` entry with `status: 'ok'`, show: node name, prop, varName.
For each `component-value` entry with `status: 'ok'`, show: node name, key, rawValue applied.
For each `component-value` entry with `status: 'skipped'`, show: node name, key, reason.
List `status: 'error'` entries with `nodeId`, `rule`, `error`.

---

> **Component-type token rules** (buttons, headers, list items, elevation, border radius) are in [`data/mapping-rules.md`](data/mapping-rules.md).

---

## Critical rules

| Rule | Detail |
|---|---|
| REST `node_id` | `-` separator in URL param, e.g. `21774-64113`. Plugin API: replace `-` → `:` in JS code |
| `plugin_data=shared` | Required — omitting silently drops `sharedPluginData` |
| TS namespace | Always `"tokens"` |
| TS value encoding | Stored as `'"token.path"'` — includes surrounding double-quotes |
| `resolveLastSegment` | Split on `/`, take last; strip surrounding quotes first |
| Variable ID prefix | Pass `VariableID:abc/123` as-is to `getVariableByIdAsync` |
| Library variables | `getVariableByIdAsync` resolves local + library — always use it |
| Null-guard children | Always `node.children ?? []` |
| Confirm before write | Hard stop between Phase 2 and Phase 3 — no exceptions. **Padding writes require extra confirmation:** before applying any padding token (`paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`, `verticalPadding`, `horizontalPadding`) to any COMPONENT or FRAME node, always stop and confirm with the user via `vscode_askQuestions`. Present the exact candidate token path(s) and the list of affected node ids/names. Do not proceed until explicit approval is received. |
| Phase 4 is opt-in | Never scaffold unless user explicitly requests it |
| PAT security | Never log or expose `{pat}` in any output |
| Page switching | `await figma.setCurrentPageAsync(page)` — never assign `figma.currentPage =` |
| Conflict vs chain | TS+NV on same property = direct-apply chain. Only `⚠️` when last segments differ |
| Content fills | **Never omit.** After binding background fill on the COMPONENT, always bind `fds-on-*-hi` (or chosen emphasis) on every TEXT and `icon` VECTOR inside each variant. Omitting content fills is a checklist failure. |
| `on-*` ≠ background | `fds-btn-on-surface-*`, `fds-on-btn-*`, `fds-on-surface-*` — all `on-*` tokens are content colours. **Never** apply them as a COMPONENT background fill. |
| Gradient fills (`-shade`/`-g`) | TS tokens whose last path segment ends with `-shade` or `-g` are **gradient paint styles**, not NV variables. Figma variables only support solid colours. The `bulk-update.figma.js` script auto-detects these and applies via `fillStyleId`. In audit reports, gradient fills appear as `fillStyleId: "S:..."` instead of `boundVariables.fills`. |
| Token suggestions | Never guess a token path. Always use `grep_search` on `data/token-registry.md` by short name or partial TS path. Never read the full file. |
| ts-core-fabric.json | **Never read or load** `data/ts-core-fabric.json` — it is 21K lines and will overflow the context window. Use `token-registry.md` (grep_search) or `token-index.json` instead. |
| User input | **Always use `vscode_askQuestions` for any decision or confirmation needed from the user** — never use inline chat text. Specific decision points in `data/mapping-rules.md` provide the exact question + options; use those templates directly. For any unexpected decision not covered by a template, construct a `vscode_askQuestions` call on the spot. |
| Annotations | **Never use `setSharedPluginData` for annotations.** When `Annotations: True` is requested, write Figma native annotations via `node.setAnnotations([{ label, properties }])`. If `setAnnotations` is not available in the current API context, log a warning and skip — do not fall back to shared plugin data. |
