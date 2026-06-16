---
name: "hermes-memory-adapter"
description: "The ONLY indirection point for ODIN/skill memory + caching. All skills call these verbs; the backend (local files now, external Hermes service later) is swappable here without touching any skill prompt."
---

# Hermes Memory Adapter

> Single seam between the skills and where memory lives.
> **Skills never read/write `.hermes/` paths directly — they call the verbs below.**
> To migrate to an external Hermes service later, only the "Backend binding" table changes.

## Backend binding (current = LOCAL)

The "future" column targets the **real** Hermes internals (`hermes_state.py`,
`hermes_cli/kanban_db.py`, `hermes_cli/goals.py`) so the swap is a near drop-in — not a
guessed REST API. See `## Hermes contract map` below for the rationale.

| Verb | Local backend (active) | Real Hermes binding (future) |
|------|------------------------|------------------------------|
| `state.read(runId)` | read `.hermes/state/<runId>.json` | `SessionDB.get_meta("run:<runId>")` → JSON |
| `state.write(runId, obj)` | write `.hermes/state/<runId>.json` | `SessionDB.set_meta("run:<runId>", json)` — the `state_meta` k/v table; same pattern Hermes uses for `goal:<session_id>` |
| `episode.append(ev)` | append one JSON line to `.hermes/episodes.jsonl` | a `kanban_db.Run` row transition (claim = `open` → complete/block/crash = `close`); carries `status/outcome/summary/error` |
| `lesson.append(le)` | append one JSON line to `.hermes/lessons.jsonl` | agent-curated memory write (`MEMORY.md`) or a skill self-improvement edit |
| `lesson.recall(tags)` | grep `.hermes/lessons.jsonl` by `skill`/`tags` | injected memory + FTS5 session search (`messages_fts`) |
| `lesson.sweep(filter?)` | read `.hermes/lessons.jsonl`; return entries where `applied=false` **and** `ruleProposal` is non-null, grouped by `ruleProposal.file`, near-duplicates collapsed (same `skill`+`file`+similar `lesson` text) | curated-memory review query (the "pending self-improvements" backlog) |
| `lesson.update(matcher, patch)` | rewrite the matching JSONL line(s) in place — read all lines, patch the matched object(s), write the file back (one object per line) | curated-memory edit (Hermes treats lessons as mutable agent memory) |
| `cache.read(key)` | read `.hermes/cache/<key>.json` | local-only (rebuildable; no Hermes equivalent needed) |
| `cache.write(key, obj)` | write `.hermes/cache/<key>.json` | local-only |
| `cache.valid(key, ver)` | compare `version` field in cache vs `ver` | local-only |

`BACKEND=local` is the only supported value today. Do not hardcode `.hermes/` paths anywhere except this file.

## Store layout (local backend)

```
.hermes/
  memory-adapter.md      ← this file (the seam)
  episodes.jsonl         ← run journal — REPLACES the old `bd` issue trail (committed)
  lessons.jsonl          ← distilled insights, read at startup (committed)
  state/<runId>.json     ← live run state (gitignored — volatile)
  cache/<key>.json       ← version-keyed caches (gitignored — rebuildable)
  cache/kb-manifest.json ← synced KB/token repo SHAs (gitignored)
```

## Schemas

### State object — `state/<runId>.json`
```json
{
  "runId": "odin-20260615-облик",
  "goal": "Apply tokens to FDS-Badge",
  "frameUrl": "https://figma.com/design/...",
  "fileKey": "abc123",
  "nodeId": "8866:76128",
  "patRef": ".odin-session",
  "plan": [ { "skill": "vali", "why": "groups need AL" }, { "skill": "mimr", "why": "tokens" } ],
  "done": [ { "skill": "vali", "digestRef": "cache/vali-...", "at": "ISO8601" } ],
  "observations": [ "VALI converted 6 groups", "MIMR found 2 conflicts" ],
  "openIssues": [ "padding token unconfirmed on Large" ],
  "status": "active",
  "outcome": null,
  "summary": null
}
```
`status` ∈ `active | paused | done | cleared` (mirrors Hermes `goals.GoalState.status`).
`outcome` (set at close) ∈ `complete | blocked | failed | timeout | reclaimed` (mirrors
`kanban_db.Run.outcome`). `summary` is the one-line handoff string a downstream worker reads.

### Episode event — one line in `episodes.jsonl`
```json
{ "ts": "ISO8601", "runId": "...", "skill": "mimr", "phase": "close",
  "summary": "Bound 308 nodes, 2 conflicts resolved", "result": "ok",
  "outcome": "complete", "writes": 308, "frame": "FDS-Badge" }
```
`phase` ∈ `open | step | observe | close`. An `open`+`close` pair per skill run is the audit trail (what `bd create`/`bd close` used to provide). On `close`, `outcome` mirrors `kanban_db.Run.outcome` (`complete | blocked | failed | timeout | reclaimed`).

### Lesson — one line in `lessons.jsonl`
```json
{ "ts": "ISO8601", "skill": "mimr", "tags": ["padding","conflict"],
  "trigger": "what went wrong / was corrected",
  "lesson": "actionable rule, imperative voice",
  "ruleProposal": { "file": "mimr/data/mapping-rules.md", "diff": "optional unified diff" },
  "applied": false, "appliedAt": null }
```
`applied` is the reconciliation flag: `false` = the `ruleProposal` is still pending promotion into
its data file; `true` = it has been folded in. `appliedAt` (ISO8601, optional) is stamped by
`lesson.update` when the proposal is applied. Both fields are optional on legacy lines — a missing
`applied` is treated as `false` by `lesson.sweep`.

> **JSONL invariant:** `lesson.update` must preserve exactly one JSON object per line and never
> reorder or drop other lines. After any rewrite, the file must still parse line-by-line.

### Cache entry — `cache/<key>.json`
```json
{ "key": "vars-<fileKey>-<version>", "version": "<figma file version>",
  "builtAt": "ISO8601", "data": { } }
```
Cache **key convention**: `<kind>-<fileKey>-<nodeId?>-<version>`. `cache.valid` returns false when the stored `version` ≠ the supplied `ver`, forcing a rebuild.

## Usage rules

- **Open a run** (replaces `bd create`): generate `runId = odin-<yyyymmdd-hhmmss>`; `state.write`; `episode.append({phase:"open"})`.
- **Close a run** (replaces `bd close`): set `state.status="done"` + `state.outcome` (`complete`|`blocked`|`failed`) + `state.summary`; `episode.append({phase:"close", summary})`.
- **Mid-session new request after close** (replaces "open a new bd issue"): start a NEW `runId`. Never mutate a closed run's state.
- **Recall before work**: every skill calls `lesson.recall([skill])` at startup and honours returned lessons.
- **Reconcile at close** (self-improvement loop): on run close, `lesson.sweep()` for pending rule proposals (`applied=false` + non-null `ruleProposal`). If any exist, surface them as a single gated `vscode_askQuestions` prompt; for each **approved** proposal, apply its `diff` to the target data file, then `lesson.update` that line to `applied=true` + stamp `appliedAt`. Declined proposals stay `applied=false`. **Never auto-write a rule file without approval.** Cap a single sweep to ~5 most recent proposals.
- **No PATs in any store file** — reference the PAT via `patRef`, never inline it.

## Hermes contract map

Why the bindings above target specific Hermes internals — keep these analogies intact so the
local store stays swap-compatible:

- **`runId` ↔ a `kanban_db.Run`.** A run is "one attempt to execute a task — created on claim,
  closed on complete/block/crash/timeout/reclaim." Our `open`/`close` episode pair = claim/close;
  our `outcome`/`summary`/`error` fields are named to match its columns.
- **The ODIN loop ↔ the Hermes "Ralph loop" (`goals.py`).** Plan→Choose→Execute→Observe→Refine is
  the same shape: after each turn a judge asks "is the goal satisfied?" → `done` | `continue`.
  Our Observe/Refine step is that judge; `state.status` reuses its `active|paused|done|cleared`.
- **Lessons ↔ Memory; skill prompts ↔ Skills.** Hermes' rule of thumb: *"If you'd put it in a
  reference document, it's a skill. If you'd put it on a sticky note, it's memory."* Our
  `lessons.jsonl` is the sticky-note tier (compact, recalled at startup); the `.prompt.md` /
  `SKILL.md` files are the procedural tier (loaded on demand). Do not blur the two.
- **`manifest.json` ↔ a Hermes skill-bundle.** A bundle is `{name, description, skills[],
  instruction}` that codifies "how we always use these together." Our manifest's `skills` +
  `pipelineOrder` + `handoffContracts` is exactly that bundle, expressed locally. When syncing,
  it can be emitted as `~/.hermes/skill-bundles/odin.yaml`.
- **`state_meta` is the universal sub-state escape hatch.** Hermes stores arbitrary serializable
  per-session state as JSON under a string key (`goal:<id>`, etc.). Our `state/<runId>.json`
  maps 1:1 onto `set_meta("run:<runId>", json)` — no schema migration needed.
