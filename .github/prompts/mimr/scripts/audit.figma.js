/**
 * audit.figma.js — Phase 1 alternative (Plugin API)
 *
 * Runs inside the Figma plugin sandbox to collect token bindings
 * without sending the full tree through the agent's context window.
 * Returns only nodes that have TS or NV bindings — unbound nodes are
 * counted but not emitted.
 *
 * Use this instead of the REST fetch when the target has > 20 variants
 * or when the REST response would exceed practical size limits.
 *
 * ── Injected by agent before execution ──────────────────────────────────────
 *
 *   const ROOT_ID    = "8373:55815";   // COMPONENT_SET or frame to audit
 *   const MAX_DEPTH  = 4;              // max recursion depth (default 4)
 *   const SAMPLE_IDS = null;           // optional: array of variant IDs to audit
 *                                      //   null = audit all children
 *                                      //   ["id1","id2",...] = audit only these
 *   const PRIOR_SCAN = null;           // optional: node list from a prior VALI scan
 *                                      //   [{ id, type }, ...] — skip tree walk,
 *                                      //   only read token data for these nodes
 *
 * ── Output (returned as JSON string) ────────────────────────────────────────
 *
 *   {
 *     root:      { id, name, type, childCount },
 *     variantGroupProperties: { ... } | null,
 *     nodes:     [ { id, name, type, parentName, depth, ts, nv } ],
 *     varIds:    [ "VariableID:..." ],
 *     stats:     { total, withTS, withNV, instances, unbound, sampled },
 *     fromPriorScan: boolean
 *   }
 *
 *   ts = { [key]: { raw, short } }
 *   nv = { [prop]: varId | [varId] }
 */

const TS_NAMESPACE = 'tokens';

const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) return JSON.stringify({ error: `Root node "${ROOT_ID}" not found` });

const varIdSet = new Set();
const nodes    = [];
const stats    = { total: 0, withTS: 0, withNV: 0, instances: 0, unbound: 0, sampled: 0 };

// ── PRIOR_SCAN fast path ─────────────────────────────────────────────────────
// When ODIN forwards node IDs from a prior VALI scan, skip tree discovery
// entirely — just fetch each node by ID and read its token data.

if (typeof PRIOR_SCAN !== 'undefined' && PRIOR_SCAN && PRIOR_SCAN.length > 0) {
  const BATCH = 50;
  for (let i = 0; i < PRIOR_SCAN.length; i += BATCH) {
    const batch = PRIOR_SCAN.slice(i, i + BATCH);
    const fetched = await Promise.all(batch.map(entry => figma.getNodeByIdAsync(entry.id)));

    for (let j = 0; j < fetched.length; j++) {
      const node = fetched[j];
      if (!node) continue;
      stats.total++;

      if (node.type === 'INSTANCE') {
        stats.instances++;
        nodes.push({ id: node.id, name: node.name, type: 'INSTANCE', parentName: node.parent?.name ?? null, depth: 0, ts: null, nv: null, isInstance: true });
        continue;
      }

      const ts = getPluginData(node);
      const nv = getBoundVars(node);

      if (ts) stats.withTS++;
      if (nv) stats.withNV++;
      if (!ts && !nv) stats.unbound++;

      if (ts || nv || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        nodes.push({ id: node.id, name: node.name, type: node.type, parentName: node.parent?.name ?? null, depth: 0, ts, nv });
      }
    }
  }

  let variantGroupProperties = null;
  if (root.type === 'COMPONENT_SET' && 'variantGroupProperties' in root) {
    variantGroupProperties = root.variantGroupProperties;
  }

  stats.sampled = PRIOR_SCAN.length;

  return JSON.stringify({
    root: { id: root.id, name: root.name, type: root.type, childCount: ('children' in root) ? root.children.length : 0 },
    variantGroupProperties,
    nodes,
    varIds: Array.from(varIdSet),
    stats,
    fromPriorScan: true
  }, null, 2);
}

// ── Standard tree walk (no prior scan) ───────────────────────────────────────

// Determine which children to walk
let walkTargets;
if (SAMPLE_IDS && SAMPLE_IDS.length > 0) {
  // Sampled mode: only audit specified variant IDs
  const sampleSet = new Set(SAMPLE_IDS);
  walkTargets = [];
  if ('children' in root) {
    for (const child of root.children) {
      if (sampleSet.has(child.id)) walkTargets.push(child);
    }
  }
  stats.sampled = walkTargets.length;
} else {
  // Full mode: audit entire subtree
  walkTargets = ('children' in root) ? Array.from(root.children) : [root];
  stats.sampled = walkTargets.length;
}

function getPluginData(node) {
  const ts = {};
  try {
    const keys = node.getSharedPluginDataKeys(TS_NAMESPACE);
    for (const key of keys) {
      const raw = node.getSharedPluginData(TS_NAMESPACE, key);
      if (!raw) continue;
      const cleaned = raw.replace(/^"|"$/g, '');
      const segments = cleaned.split('/');
      ts[key] = { raw: cleaned, short: segments[segments.length - 1] };
    }
  } catch (e) { /* node type may not support plugin data */ }
  return Object.keys(ts).length > 0 ? ts : null;
}

function getBoundVars(node) {
  const nv = {};
  try {
    const bv = node.boundVariables;
    if (!bv) return null;
    for (const prop of Object.keys(bv)) {
      const binding = bv[prop];
      if (!binding) continue;
      if (Array.isArray(binding)) {
        const ids = binding.filter(b => b?.id).map(b => { varIdSet.add(b.id); return b.id; });
        if (ids.length) nv[prop] = ids;
      } else if (binding.id) {
        varIdSet.add(binding.id);
        nv[prop] = binding.id;
      }
    }
  } catch (e) { /* some node types don't support boundVariables */ }
  // Detect paint style bindings (gradient fills use fillStyleId, not boundVariables)
  try {
    if (node.fillStyleId && typeof node.fillStyleId === 'string' && node.fillStyleId.length > 0) {
      nv['fillStyleId'] = node.fillStyleId;
    }
  } catch (e) { /* some node types don't support fillStyleId */ }
  return Object.keys(nv).length > 0 ? nv : null;
}

function walk(node, parentName, depth) {
  stats.total++;

  // INSTANCE guard — count but don't recurse
  if (node.type === 'INSTANCE') {
    stats.instances++;
    nodes.push({ id: node.id, name: node.name, type: 'INSTANCE', parentName, depth, ts: null, nv: null, isInstance: true });
    return;
  }

  const ts = getPluginData(node);
  const nv = getBoundVars(node);

  if (ts) stats.withTS++;
  if (nv) stats.withNV++;
  if (!ts && !nv) stats.unbound++;

  // Only emit nodes with bindings (or COMPONENT/COMPONENT_SET for structure)
  if (ts || nv || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    nodes.push({ id: node.id, name: node.name, type: node.type, parentName, depth, ts, nv });
  }

  // Recurse into children (respecting depth limit)
  if ('children' in node && depth < MAX_DEPTH) {
    for (const child of node.children) {
      walk(child, node.name, depth + 1);
    }
  }
}

// Walk the root node itself (for its own bindings)
const rootTs = getPluginData(root);
const rootNv = getBoundVars(root);
if (rootTs || rootNv || root.type === 'COMPONENT_SET') {
  nodes.push({ id: root.id, name: root.name, type: root.type, parentName: null, depth: 0, ts: rootTs, nv: rootNv });
  stats.total++;
  if (rootTs) stats.withTS++;
  if (rootNv) stats.withNV++;
}

// Walk selected children
for (const target of walkTargets) {
  walk(target, root.name, 1);
}

// Extract variantGroupProperties if COMPONENT_SET
let variantGroupProperties = null;
if (root.type === 'COMPONENT_SET' && 'variantGroupProperties' in root) {
  variantGroupProperties = root.variantGroupProperties;
}

return JSON.stringify({
  root: { id: root.id, name: root.name, type: root.type, childCount: ('children' in root) ? root.children.length : 0 },
  variantGroupProperties,
  nodes,
  varIds: Array.from(varIdSet),
  stats,
  fromPriorScan: false
}, null, 2);
