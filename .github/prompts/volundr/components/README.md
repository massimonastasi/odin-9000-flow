# Volundr per-component archive

One `.json` per component Volundr has documented, written automatically at
the end of each run (schema in `../volundr.prompt.md` → "Per-component
archive", extending `../data/analysis.schema.json`).

> **Legacy `.md` archives**: files written before the 2026-07 JSON/build-plan
> refactor are left untouched (historical) — only new runs write `.json`.
> There is no bulk-migration step.

**Folder structure (2026-07-17)**: archives are split by classification —
`component/` for atomic, single-purpose reusable components; `widget/` for
components composed of multiple sub-components built for a specific
purpose/context (see `../data/doc-components.md` for the definitions, used as
guidance only). **The classification is never inferred** — Volundr always
asks the user explicitly, for every component, with no exceptions (a past run
misclassified a real component as a widget by inferring from structure) — and
writes the `.json` into the subfolder matching the user's explicit answer.

Purpose:

- **Fast edits** — to update an existing doc, read `<component-name>.json` in
  the matching subfolder instead of re-scanning Figma.
- **Training corpus** — on request, Volundr reviews these files and proposes
  gated improvements to `../data/page-template.md`,
  `../data/variant-parsing-rules.md`, and `../data/anatomy-rules.md`. Proposals
  are applied only with user approval; the rule files are never auto-edited.

Filenames match the Figma component name (e.g. `component/fds-sb-toggle.json`,
`widget/fds-sb-odds-button.json`).

