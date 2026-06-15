---
name: "hermes-memory-adapter"
description: "The ONLY indirection point for ODIN/skill memory + caching. All skills call these verbs; the backend (local files now, external Hermes service later) is swappable here without touching any skill prompt."
---

# Hermes Memory Adapter

> Single seam between the skills and where memory lives.
> **Skills never read/write `.hermes/` paths directly — they call the verbs below.**
> To migrate to an external Hermes service later, only the "Backend binding" table changes.

## Backend binding (current = LOCAL)

| Verb | Local backend (active) | External Hermes backend (future) |
|------|------------------------|----------------------------------|
| `state.read(runId)` | read `.hermes/state/<runId>.json` | `GET /runs/<runId>` |
| `state.write(runId, obj)` | write `.hermes/state/<runId>.json` | `PUT /runs/<runId>` |
| `episode.append(ev)` | append one JSON line to `.hermes/episodes.jsonl` | `POST /episodes` |
| `lesson.append(le)` | append one JSON line to `.hermes/lessons.jsonl` | `POST /lessons` |
| `lesson.recall(tags)` | grep `.hermes/lessons.jsonl` by `skill`/`tags` | `GET /lessons?tags=…` |
| `cache.read(key)` | read `.hermes/cache/<key>.json` | `GET /cache/<key>` |
| `cache.write(key, obj)` | write `.hermes/cache/<key>.json` | `PUT /cache/<key>` |
| `cache.valid(key, ver)` | compare `version` field in cache vs `ver` | server-side ETag |

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
  "status": "running"
}
```

### Episode event — one line in `episodes.jsonl`
```json
{ "ts": "ISO8601", "runId": "...", "skill": "mimr", "phase": "close",
  "summary": "Bound 308 nodes, 2 conflicts resolved", "result": "ok",
  "writes": 308, "frame": "FDS-Badge" }
```
`phase` ∈ `open | step | observe | close`. An `open`+`close` pair per skill run is the audit trail (what `bd create`/`bd close` used to provide).

### Lesson — one line in `lessons.jsonl`
```json
{ "ts": "ISO8601", "skill": "mimr", "tags": ["padding","conflict"],
  "trigger": "what went wrong / was corrected",
  "lesson": "actionable rule, imperative voice",
  "ruleProposal": { "file": "mimr/data/mapping-rules.md", "diff": "optional unified diff" },
  "applied": false }
```

### Cache entry — `cache/<key>.json`
```json
{ "key": "vars-<fileKey>-<version>", "version": "<figma file version>",
  "builtAt": "ISO8601", "data": { } }
```
Cache **key convention**: `<kind>-<fileKey>-<nodeId?>-<version>`. `cache.valid` returns false when the stored `version` ≠ the supplied `ver`, forcing a rebuild.

## Usage rules

- **Open a run** (replaces `bd create`): generate `runId = odin-<yyyymmdd-hhmmss>`; `state.write`; `episode.append({phase:"open"})`.
- **Close a run** (replaces `bd close`): set `state.status="done"`; `episode.append({phase:"close", summary})`.
- **Mid-session new request after close** (replaces "open a new bd issue"): start a NEW `runId`. Never mutate a closed run's state.
- **Recall before work**: every skill calls `lesson.recall([skill])` at startup and honours returned lessons.
- **No PATs in any store file** — reference the PAT via `patRef`, never inline it.
