/**
 * audit-resolve-digest.figma.js — Phase 1 + 1b + pre-analysis (combined)
 *
 * Single-pass replacement for audit.figma.js + resolve.figma.js.
 * Returns a pre-digested report instead of raw node trees.
 * Target: <8KB inline (avoids file-write threshold). Typical: 2-4KB for small components;
 * 6-7KB for large COMPONENT_SETs (300+ variants, 8 colour combos, 4 sizes).
 * Eliminates: file writes, wc -l probes, python parse calls, read_file chunks.
 *
 * ── Injected by agent before execution ──────────────────────────────────────
 *
 *   const ROOT_ID    = "8866:76128";   // COMPONENT_SET or FRAME node ID
 *   const MAX_DEPTH  = 4;              // recursion depth (default 4)
 *   const SAMPLE_IDS = null;           // null = full audit; or ["id1","id2",...]
 *   const PRIOR_SCAN = null;           // [{id,type},...] from VALI — skips tree walk
 *
 * ── Output (returned as inline JSON string, always <3KB) ────────────────────
 *
 *   {
 *     root:     { id, name, type, childCount },
 *     stats:    { total, withTS, withNV, conflicts, instances, unbound, sampled },
 *     varMap:   { [varId]: shortName },       // COLOR vars only (issue triage + Phase 3 rule authoring)
 *                                              // FLOAT structural vars (spacing/radius/stroke) excluded
 *     matrix:   [                             // one row per unique Colour+Theme combo — all _ts/_nv fields are SHORT NAMES
 *                 { variant, n, fill_ts, fill_nv, border_ts, border_nv, text_fill_ts, text_fill_nv }
 *               ],
 *     sizes:    [                             // one row per Size value — all _ts/_nv fields are SHORT NAMES
 *                 { size, n, vpad_ts, vpad_nv, hpad_ts, hpad_nv, gap_ts, gap_nv, radius_ts, radius_nv, stroke_ts, stroke_nv, typography_ts }
 *               ],
 *     issues:   [                             // detected anomalies
 *                 { code, severity, scope, detail, affectedCount }
 *               ],
 *     fromPriorScan: boolean
 *   }
 *
 * Issue codes:
 *   MISSING_NV_FILL    — TS fill present, no NV fills/fillStyleId
 *   RAW_REF_BORDER     — borderColor NV is a raw ref token (not var.*)
 *   RAW_REF_FILL       — fill NV is a raw ref token
 *   TS_NV_CONFLICT     — TS and NV last path segments differ on same property
 *   MISSING_TS         — NV bound but no TS key on same property
 *   SHARED_RADIUS      — size reuses another size's radius token (may be intentional)
 *   TYPOGRAPHY_SHARED  — size reuses another size's typography token
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const TS_NS = 'tokens';

function getTS(node) {
  const ts = {};
  try {
    const keys = node.getSharedPluginDataKeys(TS_NS);
    for (const k of keys) {
      const raw = node.getSharedPluginData(TS_NS, k);
      if (!raw) continue;
      const cleaned = raw.replace(/^"|"$/g, '');
      ts[k] = cleaned;
    }
  } catch (_) {}
  return Object.keys(ts).length ? ts : null;
}

function getNV(node) {
  const nv = {};
  try {
    const bv = node.boundVariables;
    if (bv) {
      for (const prop of Object.keys(bv)) {
        const b = bv[prop];
        if (!b) continue;
        if (Array.isArray(b)) {
          const ids = b.filter(x => x?.id).map(x => x.id);
          if (ids.length) nv[prop] = ids;
        } else if (b.id) {
          nv[prop] = b.id;
        }
      }
    }
  } catch (_) {}
  try {
    if (node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0) {
      nv.fillStyleId = node.fillStyleId;
    }
  } catch (_) {}
  return Object.keys(nv).length ? nv : null;
}

function lastSeg(path) {
  return path ? path.split(/[./]/).filter(Boolean).pop() : null;
}

function isRawRef(tsPath) {
  if (!tsPath) return false;
  const p = tsPath.toLowerCase();
  return p.startsWith('ref.') || p.startsWith('ref/');
}

function hasFillNV(nv) {
  return !!(nv && (nv.fillStyleId || (nv.fills && nv.fills.length > 0)));
}

// Resolve a variable ID to its short name
const _varCache = {};
async function resolveVar(id) {
  if (_varCache[id]) return _varCache[id];
  try {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) {
      const short = v.name.split('/').pop();
      _varCache[id] = { full: v.name, short, type: v.resolvedType };
      return _varCache[id];
    }
  } catch (_) {}
  return { full: id, short: id, type: '?' };
}

async function resolveFirstVar(nvProp) {
  if (!nvProp) return null;
  const id = Array.isArray(nvProp) ? nvProp[0] : nvProp;
  if (typeof id !== 'string' || !id.startsWith('Variable')) return null;
  return resolveVar(id);
}

// ── Tree walk ────────────────────────────────────────────────────────────────

const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) return JSON.stringify({ error: `Root "${ROOT_ID}" not found` });

const allVarIds = new Set();
const collectedNodes = []; // { id, name, type, depth, variantProps, ts, nv, children: [{name, type, ts, nv}] }
const stats = { total: 0, withTS: 0, withNV: 0, conflicts: 0, instances: 0, unbound: 0, sampled: 0 };

function parseVariant(name) {
  const props = {};
  for (const part of name.split(', ')) {
    const eq = part.indexOf('=');
    if (eq > -1) props[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return props;
}

function collectVarIds(nv) {
  if (!nv) return;
  for (const v of Object.values(nv)) {
    const ids = Array.isArray(v) ? v : [v];
    for (const id of ids) {
      if (typeof id === 'string' && id.startsWith('Variable')) allVarIds.add(id);
    }
  }
}

function walkComp(comp, depth) {
  stats.total++;
  if (comp.type === 'INSTANCE') {
    stats.instances++;
    return null;
  }

  const ts = getTS(comp);
  const nv = getNV(comp);
  collectVarIds(nv);

  if (ts) stats.withTS++;
  if (nv) stats.withNV++;
  if (!ts && !nv) stats.unbound++;

  const variantProps = comp.type === 'COMPONENT' ? parseVariant(comp.name) : {};

  const entry = {
    id: comp.id,
    name: comp.name,
    type: comp.type,
    depth,
    variantProps,
    ts,
    nv,
    children: [],
  };

  if ('children' in comp && depth < MAX_DEPTH) {
    for (const child of comp.children) {
      stats.total++;
      if (child.type === 'INSTANCE') {
        stats.instances++;
        entry.children.push({ name: child.name, type: 'INSTANCE', ts: null, nv: null });
        continue;
      }
      const cTs = getTS(child);
      const cNv = getNV(child);
      collectVarIds(cNv);
      if (cTs) stats.withTS++;
      if (cNv) stats.withNV++;
      if (!cTs && !cNv) stats.unbound++;
      if (cTs || cNv) {
        entry.children.push({ name: child.name, type: child.type, ts: cTs, nv: cNv });
      }
    }
  }

  return entry;
}

// Determine walk targets
const rootTs = getTS(root);
const rootNv = getNV(root);
stats.total++;
if (rootTs) stats.withTS++;
if (rootNv) stats.withNV++;

let targets;
if (typeof PRIOR_SCAN !== 'undefined' && PRIOR_SCAN && PRIOR_SCAN.length > 0) {
  // Fast path — only fetch listed IDs
  const BATCH = 50;
  for (let i = 0; i < PRIOR_SCAN.length; i += BATCH) {
    const batch = await Promise.all(PRIOR_SCAN.slice(i, i + BATCH).map(e => figma.getNodeByIdAsync(e.id)));
    for (const node of batch) {
      if (!node) continue;
      const entry = walkComp(node, 1);
      if (entry) collectedNodes.push(entry);
    }
  }
  stats.sampled = PRIOR_SCAN.length;
} else if (SAMPLE_IDS && SAMPLE_IDS.length > 0) {
  const sampleSet = new Set(SAMPLE_IDS);
  targets = 'children' in root ? root.children.filter(c => sampleSet.has(c.id)) : [];
  stats.sampled = targets.length;
  for (const t of targets) {
    const entry = walkComp(t, 1);
    if (entry) collectedNodes.push(entry);
  }
} else {
  targets = 'children' in root ? Array.from(root.children) : [root];
  stats.sampled = targets.length;
  for (const t of targets) {
    const entry = walkComp(t, 1);
    if (entry) collectedNodes.push(entry);
  }
}

// ── Resolve all collected variable IDs ──────────────────────────────────────

const varIds = Array.from(allVarIds);
await Promise.all(varIds.map(id => resolveVar(id)));

// Build compact varMap: varId → shortName — COLOR vars only (structural FLOAT vars are
// always clean and are not needed for issue triage or bulk-update rule authoring).
const varMap = {};
for (const [id, info] of Object.entries(_varCache)) {
  if (info.type === 'COLOR') varMap[id] = info.short;
}

// ── Build matrix (one row per Colour+Theme combo) ───────────────────────────
// Only valid for COMPONENT_SET roots with variant properties

const matrixMap = {};  // key: "Colour|Theme" → aggregated row

for (const node of collectedNodes) {
  if (node.type !== 'COMPONENT') continue;
  const p = node.variantProps;
  const colour = p['Colour'] ?? '?';
  const theme  = p['Theme']  ?? '?';
  const size   = p['Size']   ?? '?';
  const key    = `${colour}|${theme}`;

  if (!matrixMap[key]) {
    matrixMap[key] = {
      variant: `${colour} / ${theme}`,
      colour, theme,
      n: 0,
      fill_ts: lastSeg(node.ts?.fill) ?? '∅',
      fill_nv: hasFillNV(node.nv) ? '✅' : '⚠️ MISSING',
      border_ts: lastSeg(node.ts?.borderColor) ?? '∅',
      _border_ts_full: node.ts?.borderColor ?? null,  // full path kept for isRawRef check only
      border_nv: null,
      text_fill_ts: '?',
      text_fill_nv: '?',
      _strokeNvId: null,
    };
    // Capture stroke NV for later resolution
    if (node.nv?.strokes) {
      const sid = Array.isArray(node.nv.strokes) ? node.nv.strokes[0] : node.nv.strokes;
      matrixMap[key]._strokeNvId = sid;
    }
    // Capture text fill from first TEXT child
    for (const child of node.children) {
      if (child.type === 'TEXT') {
        matrixMap[key].text_fill_ts = lastSeg(child.ts?.fill) ?? '∅';
        if (child.nv?.fills) {
          const tfid = Array.isArray(child.nv.fills) ? child.nv.fills[0] : child.nv.fills;
          matrixMap[key]._textFillNvId = tfid;
        }
        break;
      }
    }
  }
  matrixMap[key].n++;
}

// Resolve stroke and text fill NV names into matrix rows
for (const row of Object.values(matrixMap)) {
  if (row._strokeNvId) {
    const info = _varCache[row._strokeNvId];
    row.border_nv = info ? info.short : row._strokeNvId;
  } else {
    row.border_nv = '∅';
  }
  if (row._textFillNvId) {
    const info = _varCache[row._textFillNvId];
    row.text_fill_nv = info ? info.short : '?';
  } else {
    row.text_fill_nv = '∅';
  }
  delete row._strokeNvId;
  delete row._textFillNvId;
  delete row.colour;
  delete row.theme;
  // _border_ts_full intentionally NOT deleted here — consumed by RAW_REF_BORDER issue loop below
}

const matrix = Object.values(matrixMap).sort((a, b) => a.variant.localeCompare(b.variant));

// ── Build sizes table ─────────────────────────────────────────────────────────

const sizeMap = {};

for (const node of collectedNodes) {
  if (node.type !== 'COMPONENT') continue;
  const size = node.variantProps['Size'] ?? '?';
  if (sizeMap[size]) { sizeMap[size].n++; continue; }

  const nv = node.nv ?? {};
  const ts = node.ts ?? {};

  const vpadNvId = typeof nv.paddingTop === 'string' ? nv.paddingTop : null;
  const hpadNvId = typeof nv.paddingLeft === 'string' ? nv.paddingLeft : null;
  const gapNvId  = typeof nv.itemSpacing === 'string' ? nv.itemSpacing : null;
  const radNvId  = typeof nv.topLeftRadius === 'string' ? nv.topLeftRadius : null;
  const stkNvId  = typeof nv.strokeTopWeight === 'string' ? nv.strokeTopWeight : null;

  sizeMap[size] = {
    size, n: 1,
    vpad_ts: lastSeg(ts.verticalPadding) ?? '∅',
    vpad_nv: vpadNvId ? (_varCache[vpadNvId]?.short ?? vpadNvId) : '∅',
    hpad_ts: lastSeg(ts.horizontalPadding) ?? '∅',
    hpad_nv: hpadNvId ? (_varCache[hpadNvId]?.short ?? hpadNvId) : '∅',
    gap_ts: lastSeg(ts.itemSpacing) ?? '∅',
    gap_nv: gapNvId ? (_varCache[gapNvId]?.short ?? gapNvId) : '∅',
    radius_ts: lastSeg(ts.borderRadius) ?? '∅',
    radius_nv: radNvId ? (_varCache[radNvId]?.short ?? radNvId) : '∅',
    stroke_ts: lastSeg(ts.borderWidth) ?? '∅',
    stroke_nv: stkNvId ? (_varCache[stkNvId]?.short ?? stkNvId) : '∅',
  };

  // text typography from first TEXT child
  for (const child of node.children) {
    if (child.type === 'TEXT') {
      sizeMap[size].typography_ts = lastSeg(child.ts?.typography) ?? '∅';
      break;
    }
  }
}

const sizeOrder = ['Large', 'Regular', 'Small', 'Tiny'];
const sizes = Object.values(sizeMap).sort((a, b) => {
  const ai = sizeOrder.indexOf(a.size);
  const bi = sizeOrder.indexOf(b.size);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
});

// ── Issue detection ──────────────────────────────────────────────────────────

const issues = [];

// Check fills NV per Colour combo
for (const row of matrix) {
  if (row.fill_ts !== '∅' && row.fill_nv === '⚠️ MISSING') {
    issues.push({
      code: 'MISSING_NV_FILL',
      severity: 'warning',
      scope: `Colour=${row.variant.split(' /')[0].trim()}`,
      detail: `TS fill="${lastSeg(row.fill_ts)}" has no NV fills or fillStyleId binding. Fill is rawValue-only — Figma cannot theme-switch it.`,
      affectedCount: row.n,
    });
  }
}

// Check border colour NV for raw refs — use full TS path, not short name
// (short name alone cannot distinguish raw ref from semantic token)
for (const row of matrix) {
  if (row.border_nv && row.border_nv !== '∅' && isRawRef(row._border_ts_full ?? '')) {
    issues.push({
      code: 'RAW_REF_BORDER',
      severity: 'warning',
      scope: `Colour=${row.variant.split(' /')[0].trim()}`,
      detail: `borderColor uses raw ref "${row.border_ts}". Full TS: "${row._border_ts_full}". Should use a semantic var.fds.* token.`,
      affectedCount: row.n,
    });
  }
}
// Strip internal field from output after use
for (const row of matrix) delete row._border_ts_full;

// Check TS/NV conflict on border (last segments differ)
for (const row of matrix) {
  if (row.border_ts !== '∅' && row.border_nv && row.border_nv !== '∅') {
    const tsLast = lastSeg(row.border_ts);
    const nvLast = lastSeg(row.border_nv);
    if (tsLast && nvLast && tsLast !== nvLast) {
      issues.push({
        code: 'TS_NV_CONFLICT',
        severity: 'conflict',
        scope: `Colour=${row.variant.split(' /')[0].trim()} / borderColor`,
        detail: `TS last segment "${tsLast}" ≠ NV last segment "${nvLast}"`,
        affectedCount: row.n,
      });
    }
  }
}

// Check shared radius across sizes
const radiiSeen = {};
for (const s of sizes) {
  const r = s.radius_nv;
  if (r && r !== '∅') {
    if (radiiSeen[r] && radiiSeen[r] !== s.size) {
      issues.push({
        code: 'SHARED_RADIUS',
        severity: 'info',
        scope: `Size=${s.size}`,
        detail: `Shares radius token "${r}" with Size=${radiiSeen[r]}. May be intentional (no dedicated -${s.size.toLowerCase()} token).`,
        affectedCount: s.n,
      });
    } else {
      radiiSeen[r] = s.size;
    }
  }
}

// Check shared typography across sizes
const typogSeen = {};
for (const s of sizes) {
  const t = s.typography_ts;
  if (t && t !== '∅') {
    if (typogSeen[t] && typogSeen[t] !== s.size) {
      issues.push({
        code: 'TYPOGRAPHY_SHARED',
        severity: 'info',
        scope: `Size=${s.size}`,
        detail: `Shares typography token "${lastSeg(t)}" with Size=${typogSeen[t]}. Confirm with designer.`,
        affectedCount: s.n,
      });
    } else {
      typogSeen[t] = s.size;
    }
  }
}

stats.conflicts = issues.filter(i => i.code === 'TS_NV_CONFLICT').length;

// ── Final output ─────────────────────────────────────────────────────────────

const rootInfo = {
  id: root.id,
  name: root.name,
  type: root.type,
  childCount: ('children' in root) ? root.children.length : 0,
};

const fromPriorScan = typeof PRIOR_SCAN !== 'undefined' && PRIOR_SCAN && PRIOR_SCAN.length > 0;

const summary = `${stats.total} nodes · ${stats.withTS} TS · ${stats.withNV} NV · ${stats.conflicts} conflicts · ${stats.instances} instances · ${issues.length} issues · ${stats.sampled} sampled`;

return JSON.stringify({
  root: rootInfo,
  stats,
  summary,
  varMap,
  matrix,
  sizes,
  issues,
  fromPriorScan,
}, null, 2);
