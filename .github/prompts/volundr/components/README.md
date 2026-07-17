# Volundr per-component archive

One `.md` per component Volundr has documented, written automatically at the end
of each run (schema in `../volundr.prompt.md` → "Per-component archive").

**Folder structure (2026-07-17)**: archives are split by classification —
`component/` for atomic, single-purpose reusable components; `widget/` for
components composed of multiple sub-components built for a specific
purpose/context (see `../data/doc-components.md` for the exact criterion).
When documenting a new component, decide which it is and write the `.md` into
the matching subfolder — ask the user if the classification isn't obvious.

Purpose:

- **Fast edits** — to update an existing doc, read `<component-name>.md` in
  the matching subfolder instead of re-scanning Figma.
- **Training corpus** — on request, Volundr reviews these files and proposes
  gated improvements to `../data/page-template.md`,
  `../data/variant-parsing-rules.md`, and `../data/anatomy-rules.md`. Proposals
  are applied only with user approval; the rule files are never auto-edited.

Filenames match the Figma component name (e.g. `component/fds-sb-toggle.md`,
`widget/fds-sb-odds-button.md`).
