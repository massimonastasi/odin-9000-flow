# Volundr Anatomy Rules — token-driven anatomy section

Authoritative spec for the **Anatomy** section (Doc column 3). Volundr builds it
**incrementally** (`figma-use` before every `use_figma`, ≤10 ops per call,
validate between steps).

> **Prime directive: tokens only, never hardcoded.** Every property shown in the
> legend must resolve to a **variable**, **text style**, or **effect style**.
> If a property does not resolve to a token, **omit the line** — never print a
> raw hex, px, font size, or family. Instance references (`Instance of …`) and
> exposed component properties are allowed (they are references, not raw values).

---

## Layout

`section--anatomy` (in `doc-column-3`) — gap 24, vertical, hug width sized to
its content (~560px in the reference; not a fixed column width). One
`section-title` ("Anatomy") + `content--anatomy` (gap 24, vertical):

```
Anatomy                                   (section label)
 ┌─ Diagrams row ─────────────────────────────────────────┐
 │  [ base instance + pins ]  [ Pre-built=Yes + pins ]     │
 │  [ Odds Up + pin ]         [ Odds Down + pin ]          │
 └────────────────────────────────────────────────────────┘
 Legend  (one continuous numbered list across all diagrams)
   ① root            ⑦ Up Icon
   ② Selection_…     ⑧ Down Icon
   …
```

- **Diagrams**: reference component **instances** with numbered **callout pins**.
- **Legend**: one continuous numbered list; each item = pin number + node name +
  its **token-bound** properties (token name only).

---

## Which variants / parts to annotate  (base + key structural)

1. **Base** variant — the most neutral combination (per axis: `Event=Default`,
   `UI State=Default`, `Selected=False`, `Pre-built=No`, first `Direction`).
   Annotate every **named leaf** + key container that carries **≥1 token**. Skip
   purely structural wrappers that carry no token and add no meaning.
2. **Pre-built=Yes** — a second diagram exposing the chained structure; annotate
   the extra parts (e.g. `FDS-SB-prebuilt-odd`, chain block, chain icon).
3. **Odds Up / Odds Down** — small diagrams to call out the `Up Icon` / `Down
   Icon` parts (the only parts those variants add).

**Number pins continuously** across all diagrams so the legend is a single list
(part `root` = ①, … `line` = ⑩, `FDS-SB-prebuilt-odd` = ⑪, etc.). A part shown
in more than one diagram keeps **one** pin number.

---

## Token resolution — per property

Variables in this design system are usually **library (remote)** variables, so
`figma.variables.getLocalVariableCollectionsAsync()` returns `[]`. Resolve names
by **ID** with `await figma.variables.getVariableByIdAsync(id)` → `.name` (this
works for remote variables). Show the variable **`name`** as the token.

| Property | How to resolve to a token | Legend line (if resolved) |
|---|---|---|
| Fill / background color | `node.fills[i].boundVariables?.color?.id` **or** `node.boundVariables?.fills` | `Background: <var name>` / `Color: <var name>` |
| Stroke color | `node.strokes[i].boundVariables?.color?.id` **or** `node.boundVariables?.strokes` | `Stroke: <var name>` |
| Stroke weight | `node.boundVariables?.strokeWeight` | `Stroke weight: <var name>` |
| Corner radius | `node.boundVariables?.topLeftRadius` (+ 3 others) | `Corner radius: <var name>` (show once if all four share it) |
| Item spacing / gap | `node.boundVariables?.itemSpacing` | `Gap: <var name>` |
| Padding | `node.boundVariables?.paddingLeft/Right/Top/Bottom` | `Padding <side>: <var name>` |
| **Typography** (TEXT) | `node.textStyleId` → `await figma.getStyleByIdAsync(id)` → `.name` | `Type: <text style name>` (collapse the individual font props) |
| Effects | `node.effectStyleId` → `getStyleByIdAsync` → `.name`, else bound effect vars | `Effect: <style name>` |
| Instance / icon | `instance.mainComponent` (`await getMainComponentAsync()`) `.name` | `Instance of: <component name>` |
| Exposed component props | `instance.componentProperties` (name→value) | `<Prop>: <value>` (allowed — a reference, not a raw value) |
| **Width / Height** | layout-derived — **not** a token | **omit** (unless a size variable is bound) |

**Rules:**
- **Omit** any property whose value does not resolve to a token/style. Never
  print raw `#hex`, `px`, font size, family, weight, or line-height.
- For TEXT, prefer the **text style name** and drop the individual font props
  (Font Size / Family / Style / Line Height). Add `Color: <var name>` only if
  the text fill is variable-bound.
- If a node has **no** resolvable token on any property, still list it (by name)
  so the anatomy is complete, but with no property lines — or skip it if it is a
  pure structural wrapper.

---

## Diagram background — light vs. dark `artwork`

Each diagram sits on its own background frame. Pick the background per reference
variant so the component stays **visible**:

- **Default: neutral light** background.
- **Dark `artwork` background** when **either** holds:
  1. the reference variant targets an **alternate / dark surface** — its variant
     axes name an alternate surface (e.g. `Theme=on-alternate-surface`,
     `Surface=Alternate`, `on-header`), **or**
  2. the component itself is **very light** — its main fill/artwork luminance is
     near-white (approx. relative luminance ≥ 0.85), so it would wash out on a
     light background.

Use the design system's **`artwork`** background variable for the dark case.
First query **local variables** (`getLocalVariablesAsync('COLOR')`) for a name
match (`artwork`, `fds-alternate-surface`, darkest surface) and **bind** it with
`setBoundVariableForPaint` — do **not** hardcode a hex. Only if no such variable
exists, fall back to a dark hex and flag it to the user. Likewise the light case
binds `fds-surface` when a local variable exists.

> Decide per diagram: a light base variant → light background; the same
> component's alternate-surface variant → dark `artwork` background.

## Callout pins  (readability of the component)

- Render each reference instance at a **legible size** on the chosen background
  (light or dark `artwork`; small variants scaled up so labels/odds are readable).
- Pin = a small numbered circular badge with a thin leader line to the part.
  Place badges **outside** the instance bounds where possible; leader lines must
  not cross the odds value / labels. No overlapping pins.
- Pin number ↔ legend number must match exactly.

---

## Legend format  (readability of the description)

Instance the **`Anatomy--item`** doc component (found `105:219` in the
reference file, spec in `doc-components.md` §9) — one per part — overriding
its `num` text (pin number) and its two `txt` lines (node name + type, then
the resolved property line or the `⛑ no bound token` flag). Only fall back to
hand-built rows if `Anatomy--item` is missing in the current file (see
`page-template.md` Discovery). The no-token flag at the top of the column is
the optional `flag-optional` frame — include it only when the component is
untokenised.

- One continuous numbered list. Each item:
  - `⟨n⟩  <NodeName>` — number badge + node name **Semi Bold**.
  - Under it, one **`<Property>: <token name>`** line per resolved property,
    Regular, muted, consistent left indent. **Token name only** (no resolved
    value in parentheses).
- No category grouping — a flat property list per node, top-to-bottom.
- Keep legend text ≈13–14px; node name ≈14px Semi Bold; property lines ≈12–13px.
- The Usage/abstract text elsewhere stays ≤ ~800px wide, line-height 150%.

---

## Build order (incremental)

1. Create `section--anatomy` (`section-title` "Anatomy" + `content--anatomy`,
   hug width) if not present.
2. Read the base instance subtree; for each annotated node resolve its tokens
   (table above) — **collect resolved lines only**.
3. Build the **diagram(s)**: place instance(s) directly in `content--anatomy`
   (wrap in a `Diagrams` frame only if more than one), add numbered pins.
4. Build the **legend**: numbered items with their resolved property lines.
5. `get_screenshot` → check pins align, no overlaps, no raw values leaked into
   the legend. Fix before finishing.

Return: column id, diagram instance ids, legend item count, and a list of any
parts that resolved to **zero** tokens (surface these to the user — they may be
un-tokenized layers worth flagging to the designer).
