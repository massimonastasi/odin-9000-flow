// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8373:54941";
//   Root node ID (used for error context only — all ops target nodes by id).
//
// const OPS = [
//   // ① ungroup — lift sole child out of a redundant wrapper frame
//   { op: 'ungroup', id: 'WRAPPER_FRAME_ID' },
//
//   // ② wrap — group specific children into a new AL frame
//   { op: 'wrap', parentId: 'PARENT_ID', childIds: ['A','B'], direction: 'VERTICAL', name: '{col / pattern}' },
//
//   // ③ al — convert GROUP or NONE-mode FRAME to auto-layout in-place
//   { op: 'al', id: 'NODE_ID', direction: 'VERTICAL' },
//
//   // ④ rename — set {direction / role} name on a node
//   { op: 'rename', id: 'NODE_ID', to: '{col / group}' },
//
//   // ⑤ token — bind gap variable to itemSpacing
//   //    gap: 'vSection' | 'vGroup' | 'vPattern' | 'hPattern'
//   { op: 'token', id: 'NODE_ID', gap: 'vPattern' },
//
//   // ⑥ annotate — only if user confirmed; attach Dev Mode annotation
//   //    oldName: original layer name before rename
//   //    childSummary: e.g. '3× FDS-Input'
//   { op: 'annotate', id: 'NODE_ID', oldName: 'Inputs', newName: '{col / pattern}', direction: 'col', childSummary: '3× FDS-Input' },
//
//   // ⑦ template — replicate ops across all COMPONENT children of a parent
//   //    Each childOp uses {VARIANT_ID} as placeholder for the variant's id,
//   //    and {CHILD:N:ID} for the Nth child of that variant.
//   //    targetType: only apply to children of this type (default: 'COMPONENT')
//   { op: 'template', parentId: 'COMPONENT_SET_ID', targetType: 'COMPONENT',
//     childOps: [
//       { op: 'al', id: '{CHILD:0:ID}', direction: 'VERTICAL' },
//       { op: 'rename', id: '{CHILD:0:ID}', to: '{col / pattern}' },
//       { op: 'token', id: '{CHILD:0:ID}', gap: 'vPattern' }
//     ]
//   }
// ];
//
// const CHUNK_SIZE = 100;  // optional — ops per execution chunk (default 100)
//
// Run ops in order: ungroups → wraps → al-conversions → renames → tokens → [annotate if confirmed]
// Template ops are expanded inline before execution.
// ─────────────────────────────────────────────────────────────────────────────

const log    = [];
const failed = [];

// Gap variable IDs — hardcoded (file: Ahvbwk0dUHeHazrQX2XtGd, never changes)
const GAP_VAR_IDS = {
  vSection: 'VariableID:8094:59629',   // fds-spacing-const-gap-v-section  32px
  vGroup:   'VariableID:8094:59630',   // fds-spacing-const-gap-v-group    20px
  vPattern: 'VariableID:8094:59631',   // fds-spacing-const-gap-v-pattern  12px
  hPattern: 'VariableID:8094:59632'    // fds-spacing-const-gap-h-pattern  12px
};

// ── helpers ──────────────────────────────────────────────────────────────────

// PERF: build a single ID→node map from the root subtree upfront.
// figma.currentPage.findOne() does a full deep-tree search on every call —
// with 10+ ops this causes the plugin to hang for 30 s+ on large files.
// All ops use nodeCache for O(1) lookup. Newly created nodes are registered
// immediately after creation so subsequent ops can find them.
const nodeCache = {};
(function buildCache(node) {
  nodeCache[node.id] = node;
  if ('children' in node) {
    for (const child of node.children) { buildCache(child); }
  }
})(figma.getNodeById(NODE_ID) || figma.currentPage);

function getNode(id) {
  if (nodeCache[id]) return nodeCache[id];
  // fallback for nodes created mid-run (wraps, al-conversions)
  const n = figma.getNodeById(id);
  if (n) nodeCache[id] = n;
  return n;
}

function captureSizing(node) {
  return {
    h: ('layoutSizingHorizontal' in node) ? node.layoutSizingHorizontal : null,
    v: ('layoutSizingVertical'   in node) ? node.layoutSizingVertical   : null
  };
}

function restoreSizing(node, sizing) {
  if (sizing.h) { try { node.layoutSizingHorizontal = sizing.h; } catch(e) {} }
  if (sizing.v) { try { node.layoutSizingVertical   = sizing.v; } catch(e) {} }
}

function applyFillCounterAxis(parent) {
  Array.from(parent.children).forEach(c => {
    try {
      if (parent.layoutMode === 'VERTICAL')   { c.layoutSizingHorizontal = 'FILL'; }
      if (parent.layoutMode === 'HORIZONTAL') { c.layoutSizingVertical   = 'FILL'; }
    } catch(e) {}
  });
}

function applyALSettings(frame, direction) {
  frame.layoutMode              = direction;
  frame.itemSpacing             = 0;
  frame.primaryAxisSizingMode   = 'AUTO';
  frame.counterAxisSizingMode   = 'AUTO';
  frame.paddingTop              = frame.paddingBottom = 0;
  frame.paddingLeft             = frame.paddingRight  = 0;
  frame.fills                   = [];
  frame.clipsContent            = false;
}

// ── op: ungroup ───────────────────────────────────────────────────────────────
// Lifts the sole child of a redundant wrapper frame to the parent at the same
// slot index and removes the wrapper.
// Precondition: wrapper must have exactly 1 child, no padding, no visible fill.

function opUngroup(op) {
  const wrapper = getNode(op.id);
  if (!wrapper) { failed.push({ op: 'ungroup', id: op.id, reason: 'node not found' }); return; }
  const parent = wrapper.parent;
  if (!parent)  { failed.push({ op: 'ungroup', id: op.id, reason: 'no parent' }); return; }
  if (wrapper.children.length !== 1) {
    failed.push({ op: 'ungroup', id: op.id, reason: `child count != 1: ${wrapper.children.length}` }); return;
  }

  const inner       = wrapper.children[0];
  const wrapperName = wrapper.name; const wrapperId = wrapper.id;
  const innerName   = inner.name;   const innerId   = inner.id;
  const sizing      = captureSizing(wrapper);
  const idx         = Array.from(parent.children).indexOf(wrapper);

  nodeCache[inner.id] = inner;  // register before move
  parent.insertChild(idx, inner);
  try { wrapper.remove(); } catch(e) {}
  restoreSizing(inner, sizing);

  log.push({ op: 'ungroup', removed: `${wrapperName} [${wrapperId}]`,
             lifted: `${innerName} [${innerId}]`, sizingRestored: sizing });
}

// ── op: wrap ──────────────────────────────────────────────────────────────────
// Wraps the listed children into a new AL frame inside their current parent.
// Inherits sizing from first child; applies FILL on counter axis to all children.

function opWrap(op) {
  const parent = getNode(op.parentId);
  if (!parent) { failed.push({ op: 'wrap', parentId: op.parentId, reason: 'parent not found' }); return; }

  const parentChildren = Array.from(parent.children);
  const children = op.childIds.map(cid => parentChildren.find(c => c.id === cid)).filter(Boolean);

  if (children.length === 0) { failed.push({ op: 'wrap', parentId: op.parentId, reason: 'no matching children found' }); return; }

  const firstChild    = children[0];
  const inheritSizing = captureSizing(firstChild);
  if (!inheritSizing.h) inheritSizing.h = 'FILL';
  if (!inheritSizing.v) inheritSizing.v = 'HUG';

  const originalIndex = parentChildren.indexOf(firstChild);
  const direction     = op.direction || 'VERTICAL';
  const wrapperName   = op.name || `{${direction === 'HORIZONTAL' ? 'row' : 'col'} / pattern}`;

  const wrapper = figma.createFrame();
  wrapper.name = wrapperName;
  applyALSettings(wrapper, direction);

  for (const child of children) { wrapper.appendChild(child); }
  parent.insertChild(originalIndex, wrapper);

  try { wrapper.layoutSizingHorizontal = inheritSizing.h; } catch(e) {}
  try { wrapper.layoutSizingVertical   = inheritSizing.v; } catch(e) {}
  applyFillCounterAxis(wrapper);

  nodeCache[wrapper.id] = wrapper;  // register new frame so token op can find it
  log.push({ op: 'wrap', name: wrapper.name, id: wrapper.id,
             childCount: children.length, inheritSizing: inheritSizing });
}

// ── op: al ────────────────────────────────────────────────────────────────────
// Converts a GROUP or NONE-mode FRAME to auto-layout in-place.
// GROUPs are replaced with a new FRAME (Figma does not support AL on GROUP nodes directly).

function opAL(op) {
  const node = getNode(op.id);
  if (!node) { failed.push({ op: 'al', id: op.id, reason: 'node not found' }); return; }

  const dir          = op.direction || 'VERTICAL';
  const sizingBefore = captureSizing(node);

  if (node.type === 'GROUP') {
    const parent   = node.parent;
    const idx      = Array.from(parent.children).indexOf(node);
    const frame    = figma.createFrame();
    frame.name     = node.name;
    applyALSettings(frame, dir);
    const snapshot = Array.from(node.children);
    for (const child of snapshot) { frame.appendChild(child); }
    parent.insertChild(idx, frame);
    try { node.remove(); } catch(e) {}
    applyFillCounterAxis(frame);
    nodeCache[frame.id] = frame;  // register new frame
    log.push({ op: 'al', type: 'group→frame', id: frame.id, name: frame.name, direction: dir });
  } else {
    applyALSettings(node, dir);
    restoreSizing(node, sizingBefore);
    applyFillCounterAxis(node);
    log.push({ op: 'al', type: 'in-place', id: node.id, name: node.name, direction: dir });
  }
}

// ── op: rename ────────────────────────────────────────────────────────────────

function opRename(op) {
  const node = getNode(op.id);
  if (!node) { failed.push({ op: 'rename', id: op.id, reason: 'node not found' }); return; }
  const before = node.name;
  node.name  = op.to;
  log.push({ op: 'rename', id: node.id, before, after: op.to });
}

// ── op: token ─────────────────────────────────────────────────────────────────
// Binds a Figma variable to itemSpacing.
// op.gap must be one of: vSection | vGroup | vPattern | hPattern

function opToken(op) {
  const node = getNode(op.id);
  if (!node) { failed.push({ op: 'token', id: op.id, reason: 'node not found' }); return; }
  const varId = GAP_VAR_IDS[op.gap];
  if (!varId) { failed.push({ op: 'token', id: op.id, reason: `unknown gap key: ${op.gap}` }); return; }
  try {
    const variable = figma.variables.getVariableById(varId);
    if (!variable) { failed.push({ op: 'token', id: op.id, reason: `variable not found: ${varId}` }); return; }
    node.setBoundVariable('itemSpacing', variable);
    log.push({ op: 'token', id: node.id, name: node.name, gap: op.gap, varId });
  } catch(e) {
    failed.push({ op: 'token', id: op.id, reason: e.message || String(e) });
  }
}

// ── op: annotate ─────────────────────────────────────────────────────────────
// Attaches a Dev Mode annotation to a FRAME node (Development panel, itemSpacing pin).
// Only include in OPS if user confirmed annotations. Falls back to a logged skip
// for non-FRAME nodes (GROUP, VECTOR, etc.) — agent should narrate skip to the user.
// Op shape: { op: 'annotate', id, oldName, newName, direction, childSummary }

function opAnnotate(op) {
  const node = getNode(op.id);
  if (!node) { failed.push({ op: 'annotate', id: op.id, reason: 'node not found' }); return; }
  const label = `**\u2705 Flex-O-Nator 9000**\nRenamed: \`${op.oldName || '?'}\` \u2192 \`${op.newName || node.name}\`\n`
            + (op.direction || '') + (op.childSummary ? ` \u00b7 ${op.childSummary}` : '');
  try {
    node.annotations = [{ labelMarkdown: label, properties: [{ type: 'itemSpacing' }] }];
    log.push({ op: 'annotate', id: node.id, name: node.name });
  } catch(e) {
    // annotations not supported on this node type — log skip, narrate to user
    log.push({ op: 'annotate', id: op.id, skipped: true,
               reason: `${node.type} does not support annotations — create sticky manually` });
  }
}

// ── op: template ──────────────────────────────────────────────────────────────
// Expands a set of childOps across all matching children of a parent node.
// Supports placeholders:
//   {VARIANT_ID}  → the variant (child) node's id
//   {CHILD:N:ID}  → id of the Nth child within the variant
// Returns an array of concrete ops to splice into the main queue.

function expandTemplate(tmpl) {
  const parent = getNode(tmpl.parentId);
  if (!parent || !('children' in parent)) {
    failed.push({ op: 'template', parentId: tmpl.parentId, reason: 'parent not found or has no children' });
    return [];
  }

  const targetType = tmpl.targetType || 'COMPONENT';
  const targets = Array.from(parent.children).filter(c => c.type === targetType);
  const expanded = [];

  for (const variant of targets) {
    const variantChildren = ('children' in variant) ? Array.from(variant.children) : [];

    for (const childOp of tmpl.childOps) {
      const concrete = JSON.parse(JSON.stringify(childOp));

      // Replace placeholders in all string values
      for (const key of Object.keys(concrete)) {
        if (typeof concrete[key] === 'string') {
          concrete[key] = concrete[key].replace(/\{VARIANT_ID\}/g, variant.id);
          concrete[key] = concrete[key].replace(/\{CHILD:(\d+):ID\}/g, (_, idx) => {
            const i = parseInt(idx, 10);
            return (variantChildren[i]) ? variantChildren[i].id : `__MISSING_CHILD_${i}__`;
          });
        }
        // Handle childIds arrays (for wrap ops)
        if (Array.isArray(concrete[key])) {
          concrete[key] = concrete[key].map(v => {
            if (typeof v !== 'string') return v;
            return v
              .replace(/\{VARIANT_ID\}/g, variant.id)
              .replace(/\{CHILD:(\d+):ID\}/g, (_, idx) => {
                const i = parseInt(idx, 10);
                return (variantChildren[i]) ? variantChildren[i].id : `__MISSING_CHILD_${i}__`;
              });
          });
        }
      }
      expanded.push(concrete);
    }
  }

  log.push({ op: 'template', parentId: tmpl.parentId, targetType, variantCount: targets.length, expandedOps: expanded.length });
  return expanded;
}

// ── execute (chunked) ─────────────────────────────────────────────────────────

// 1. Expand templates into concrete ops
const expandedOps = [];
for (const op of OPS) {
  if (op.op === 'template') {
    expandedOps.push(...expandTemplate(op));
  } else {
    expandedOps.push(op);
  }
}

// 2. Execute in chunks to prevent plugin timeout on large sets
const chunkSize = (typeof CHUNK_SIZE !== 'undefined') ? CHUNK_SIZE : 100;

for (let i = 0; i < expandedOps.length; i += chunkSize) {
  const chunk = expandedOps.slice(i, i + chunkSize);
  for (const op of chunk) {
    try {
      if (handlers[op.op]) { handlers[op.op](op); }
      else { failed.push({ op: op.op, reason: 'unknown op type' }); }
    } catch(e) {
      failed.push({ op: op.op, id: op.id || op.parentId, reason: e.message || String(e) });
    }
  }
}

return JSON.stringify({ applied: log.length, failed: failed.length, totalOps: expandedOps.length, log, errors: failed }, null, 2);
