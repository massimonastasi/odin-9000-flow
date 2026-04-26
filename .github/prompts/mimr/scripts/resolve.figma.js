/**
 * resolve.figma.js — Phase 1b
 *
 * Resolves native Figma variable IDs → human-readable names via the Plugin API.
 * Agent reads this file and executes its content via mcp_figma_use_figma,
 * injecting VAR_IDS and NODE_IDS collected in Phase 1 before execution.
 *
 * ── Injected by agent ───────────────────────────────────────────────────────
 *
 *   const VAR_IDS  = [ "VariableID:abc/123", ... ];   // unique IDs from Phase 1
 *   const NODE_IDS = [ "21774:64113", ... ];           // nodes with boundVariables
 *
 * ── Output (returned as JSON string) ────────────────────────────────────────
 *
 *   {
 *     varMap:       { [varId]: { name, collection, type, remote } },
 *     nodeBindings: [ { id, name, type, resolved: { [prop]: [{ varId, name, collection, type }] } } ]
 *   }
 */

// ─── 1. Resolve variable IDs → metadata ─────────────────────────────────────

const varMap = {};

for (const vid of VAR_IDS) {
  try {
    const v = await figma.variables.getVariableByIdAsync(vid);
    if (v) {
      const coll = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      varMap[vid] = {
        name:       v.name,
        collection: coll?.name ?? '(unknown)',
        type:       v.resolvedType,
        remote:     v.remote ?? false,
      };
    } else {
      varMap[vid] = { name: '(not found)', collection: '—', type: '—', remote: null };
    }
  } catch (e) {
    varMap[vid] = { name: `(error: ${e.message})`, collection: '—', type: '—', remote: null };
  }
}

// ─── 2. Collect bound variable bindings per node (batched for performance) ───

const PROPS = [
  'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
  'itemSpacing', 'counterAxisSpacing',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'fills', 'strokes', 'effects', 'opacity',
  'cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
  'rectangleCornerRadii',
  'fontFamily', 'fontStyle', 'fontSize', 'fontWeight',
];

const BATCH_SIZE = 50;
const nodeBindings = [];

for (let i = 0; i < NODE_IDS.length; i += BATCH_SIZE) {
  const batch = NODE_IDS.slice(i, i + BATCH_SIZE);
  const fetched = await Promise.all(batch.map(id => figma.getNodeByIdAsync(id)));

  for (const node of fetched) {
    if (!node) continue;

    const resolved = {};
    for (const prop of PROPS) {
      const binding = node.boundVariables?.[prop];
      if (!binding) continue;

      const entries = Array.isArray(binding) ? binding : [binding];
      const mapped  = entries
        .filter(b => b?.id)
        .map(b => ({ varId: b.id, ...(varMap[b.id] ?? { name: '(unknown)', collection: '—' }) }));

      if (mapped.length) resolved[prop] = mapped;
    }

    if (Object.keys(resolved).length) {
      nodeBindings.push({ id: node.id, name: node.name, type: node.type, resolved });
    }
  }
}

// ─── 3. Return ───────────────────────────────────────────────────────────────

return JSON.stringify({ varMap, nodeBindings }, null, 2);
