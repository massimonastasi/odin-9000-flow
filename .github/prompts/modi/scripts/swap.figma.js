// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8914:78154";     // Root frame (used for error context + node cache)
//
// const SWAP_OPS = [
//   // ① create — replace placeholder shape with a new component instance
//   { op: "create", targetId: "8914:78156", componentKey: "519c...",
//     variantProps: { "Size": "Medium", "State": "Default" },
//     sizing: { h: "FILL", v: "HUG" } },
//
//   // ② swap — swap an existing INSTANCE to a different component variant
//   { op: "swap", targetId: "8914:78160", componentKey: "b47d...",
//     variantProps: { "Size": "Large", "Type": "Primary" },
//     sizing: { h: "FILL", v: "HUG" } }
// ];
//
// const CHUNK_SIZE = 50;  // ops per execution chunk (default 50)
// ─────────────────────────────────────────────────────────────────────────────

const log    = [];
const failed = [];

// ── Node cache ───────────────────────────────────────────────────────────────
// Build once from root subtree for O(1) lookup — same pattern as VALI.

const nodeCache = {};
(function buildCache(node) {
  nodeCache[node.id] = node;
  if ('children' in node) {
    for (const child of node.children) { buildCache(child); }
  }
})(figma.getNodeById(NODE_ID) || figma.currentPage);

function getNode(id) {
  if (nodeCache[id]) return nodeCache[id];
  const n = figma.getNodeById(id);
  if (n) nodeCache[id] = n;
  return n;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function captureSizing(node) {
  return {
    h: ('layoutSizingHorizontal' in node) ? node.layoutSizingHorizontal : null,
    v: ('layoutSizingVertical'   in node) ? node.layoutSizingVertical   : null
  };
}

function restoreSizing(node, sizing) {
  if (sizing && sizing.h) { try { node.layoutSizingHorizontal = sizing.h; } catch(e) {} }
  if (sizing && sizing.v) { try { node.layoutSizingVertical   = sizing.v; } catch(e) {} }
}

// ── Find variant by properties ───────────────────────────────────────────────
// Given a component key and desired variant props, finds the matching variant
// node from the imported component set.

async function findVariant(componentKey, variantProps) {
  // Helper: search a COMPONENT_SET's children for matching variant props
  function findInSet(compSet, props) {
    if (!props || Object.keys(props).length === 0) return compSet.children[0] || null;
    for (const variant of compSet.children) {
      if (variant.type !== 'COMPONENT') continue;
      const vProps = variant.variantProperties || {};
      let match = true;
      for (const [key, val] of Object.entries(props)) {
        if (vProps[key] !== val) { match = false; break; }
      }
      if (match) return variant;
    }
    return null;
  }

  // ── 1. Try local node first (componentKey may be a node ID) ──
  let imported = figma.getNodeById(componentKey);
  if (imported) {
    // Handle COMPONENT_SET — find matching variant child
    if (imported.type === 'COMPONENT_SET') {
      const found = findInSet(imported, variantProps);
      if (found) return found;
      log.push({ warning: `No exact local variant match for ${JSON.stringify(variantProps)}, using first child` });
      return imported.children[0] || null;
    }
    // Handle COMPONENT — search siblings if variant props requested
    if (imported.type === 'COMPONENT') {
      if (!variantProps || Object.keys(variantProps).length === 0) return imported;
      const componentSet = imported.parent;
      if (componentSet && componentSet.type === 'COMPONENT_SET') {
        const found = findInSet(componentSet, variantProps);
        if (found) return found;
      }
      log.push({ warning: `No exact variant match for ${JSON.stringify(variantProps)}, using provided node` });
      return imported;
    }
  }

  // ── 2. Try importing as a component set (handles library set keys) ──
  try {
    const compSet = await figma.importComponentSetByKeyAsync(componentKey);
    if (compSet && compSet.type === 'COMPONENT_SET') {
      const found = findInSet(compSet, variantProps);
      if (found) return found;
      log.push({ warning: `No exact variant match in imported set for ${JSON.stringify(variantProps)}, using first child` });
      return compSet.children[0] || null;
    }
  } catch(e) { /* not a valid set key — fall through */ }

  // ── 3. Try importing as a single component key ──
  imported = await figma.importComponentByKeyAsync(componentKey);
  if (!imported) return null;

  if (!variantProps || Object.keys(variantProps).length === 0) return imported;

  // Check if this component belongs to a set
  const componentSet = imported.parent;
  if (componentSet && componentSet.type === 'COMPONENT_SET') {
    const found = findInSet(componentSet, variantProps);
    if (found) return found;
  }

  log.push({ warning: `No exact variant match for ${JSON.stringify(variantProps)}, using default` });
  return imported;
}

// ── Op: create ───────────────────────────────────────────────────────────────
// Replaces a placeholder node (RECTANGLE, ELLIPSE, FRAME) with a component
// instance. Preserves parent index and sizing.

async function opCreate(op) {
  const placeholder = getNode(op.targetId);
  if (!placeholder) {
    failed.push({ op: 'create', targetId: op.targetId, reason: 'placeholder not found' });
    return;
  }

  const parent = placeholder.parent;
  if (!parent) {
    failed.push({ op: 'create', targetId: op.targetId, reason: 'no parent' });
    return;
  }

  // Find the target variant
  const variant = await findVariant(op.componentKey, op.variantProps);
  if (!variant) {
    failed.push({ op: 'create', targetId: op.targetId, reason: `component not found: ${op.componentKey}` });
    return;
  }

  // Capture position info before removing placeholder
  const placeholderName = placeholder.name;
  const placeholderId   = placeholder.id;
  const idx             = Array.from(parent.children).indexOf(placeholder);
  const sizing          = op.sizing || captureSizing(placeholder);

  // Create instance
  const instance = variant.createInstance();

  // Insert at same position and remove placeholder
  parent.insertChild(idx, instance);
  try { placeholder.remove(); } catch(e) {}

  // Restore sizing
  restoreSizing(instance, sizing);

  // Register in cache
  nodeCache[instance.id] = instance;

  log.push({
    op: 'create',
    id: instance.id,
    replaced: `${placeholderName} [${placeholderId}]`,
    component: variant.name,
    variant: op.variantProps ? Object.entries(op.variantProps).map(([k,v]) => `${k}=${v}`).join(', ') : 'default'
  });
}

// ── Op: swap ─────────────────────────────────────────────────────────────────
// Swaps an existing INSTANCE node to a different component variant.
// Uses Figma's swapComponent() which preserves compatible overrides.

async function opSwap(op) {
  const instance = getNode(op.targetId);
  if (!instance) {
    failed.push({ op: 'swap', targetId: op.targetId, reason: 'instance not found' });
    return;
  }
  if (instance.type !== 'INSTANCE') {
    failed.push({ op: 'swap', targetId: op.targetId, reason: `expected INSTANCE, got ${instance.type}` });
    return;
  }

  // Capture current state
  const beforeName  = instance.name;
  const beforeMain  = instance.mainComponent ? instance.mainComponent.name : '?';
  const sizingBefore = op.sizing || captureSizing(instance);

  // Find the target variant
  const variant = await findVariant(op.componentKey, op.variantProps);
  if (!variant) {
    failed.push({ op: 'swap', targetId: op.targetId, reason: `component not found: ${op.componentKey}` });
    return;
  }

  // Perform the swap
  try {
    instance.swapComponent(variant);
  } catch(e) {
    failed.push({ op: 'swap', targetId: op.targetId, reason: `swapComponent failed: ${e.message || String(e)}` });
    return;
  }

  // Restore sizing (swap may reset it)
  restoreSizing(instance, sizingBefore);

  log.push({
    op: 'swap',
    id: instance.id,
    from: beforeMain,
    to: variant.name,
    variant: op.variantProps ? Object.entries(op.variantProps).map(([k,v]) => `${k}=${v}`).join(', ') : 'default'
  });
}

// ── Op handlers map ──────────────────────────────────────────────────────────

const handlers = {
  create: opCreate,
  swap:   opSwap
};

// ── Execute (chunked + async) ────────────────────────────────────────────────

const chunkSize = (typeof CHUNK_SIZE !== 'undefined') ? CHUNK_SIZE : 50;

for (let i = 0; i < SWAP_OPS.length; i += chunkSize) {
  const chunk = SWAP_OPS.slice(i, i + chunkSize);
  for (const op of chunk) {
    try {
      if (handlers[op.op]) {
        await handlers[op.op](op);
      } else {
        failed.push({ op: op.op, reason: 'unknown op type' });
      }
    } catch(e) {
      failed.push({ op: op.op, targetId: op.targetId, reason: e.message || String(e) });
    }
  }
}

return JSON.stringify({
  applied: log.length,
  failed: failed.length,
  totalOps: SWAP_OPS.length,
  log,
  errors: failed
}, null, 2);
