# SAGA — component & asset codegen rules

Durable rules promoted from run lessons. SAGA reads this at startup (`lesson.recall(["saga"])`
covers the journal; this file is the consolidated rule set).

## Asset / icon handling

### Icon SVG export — preserve viewBox, never stretch

Figma MCP icon/SVG exports frequently arrive with `preserveAspectRatio="none"` and
`width="100%" height="100%"`. For a non-square icon this **stretches** the artwork.

Before placing an exported SVG in a component `assets/` folder:

1. Keep the intrinsic `viewBox` exactly as exported (e.g. `viewBox="0 0 11.7267 8.94"`).
2. Set `preserveAspectRatio="xMidYMid meet"` (or remove the attribute — `meet` is the default).
3. Add explicit intrinsic `width`/`height` matching the viewBox aspect ratio.
4. Render inside a fixed-aspect box and use `object-fit: contain` (or fixed `width`/`height`
   on the `<img>`). Never force `width:100%; height:100%` on a non-square box.

### ODIN pre-fetches remote assets for SAGA

When SAGA runs as a subagent it may lack a terminal to download Figma MCP asset URLs (which
expire in ~7 days). ODIN should `curl` the asset SVG/PNG URLs (from `get_design_context`) into
the component `assets/` folder **before or right after** SAGA writes markup, and keep the
filenames stable so SAGA's `src` references survive. SAGA must reference the pre-placed files
rather than hand-authoring approximate SVGs.
