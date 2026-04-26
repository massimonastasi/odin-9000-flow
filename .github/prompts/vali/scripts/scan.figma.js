// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8373:54941";   // Figma node ID of the root to scan
// const DEPTH   = 5;              // how many levels deep to scan (usually 4–5)
// const SAMPLE  = 0;              // 0 = scan all children; N > 0 = fingerprint mode
// ─────────────────────────────────────────────────────────────────────────────

// ── Structural fingerprint ───────────────────────────────────────────────────
// Produces a string signature from a node's structure (type, layoutMode,
// child count, child types recursively). Two variants with the same fingerprint
// are structurally identical — only one needs full analysis by the agent.

function fingerprint(node, depth) {
  const parts = [node.type];
  if ('layoutMode' in node) parts.push(node.layoutMode || 'NONE');
  if ('children' in node && depth > 0 && node.type !== 'INSTANCE') {
    const childFPs = Array.from(node.children).map(c => fingerprint(c, depth - 1));
    parts.push(`[${childFPs.join(',')}]`);
  } else if ('children' in node) {
    parts.push(`(${node.children.length})`);
  }
  return parts.join(':');
}

// ── Scan with optional SKIP_OK filtering ─────────────────────────────────────
// Nodes already in correct auto-layout with a {direction / role} name are
// emitted as a compact summary instead of full subtree.

const ROLE_PATTERN = /^\{(col|row)\s*\/\s*(section|group|pattern)\}$/;

function isAlreadyOk(node) {
  if (!('layoutMode' in node) || !node.layoutMode || node.layoutMode === 'NONE') return false;
  return ROLE_PATTERN.test(node.name);
}

function scan(node, depth) {
  // Skip-OK: node already has correct AL + naming → compact summary
  if (depth < (typeof DEPTH !== 'undefined' ? DEPTH : 5) && isAlreadyOk(node)) {
    return {
      id: node.id, name: node.name, type: node.type,
      layoutMode: node.layoutMode, ok: true,
      childCount: ('children' in node) ? node.children.length : 0
    };
  }

  const info = {
    id:         node.id,
    name:       node.name,
    type:       node.type,
    layoutMode: ('layoutMode'              in node) ? node.layoutMode              : null,
    sizingH:    ('layoutSizingHorizontal'  in node) ? node.layoutSizingHorizontal  : null,
    sizingV:    ('layoutSizingVertical'    in node) ? node.layoutSizingVertical    : null,
    w:          node.width,
    h:          node.height,
    padT:       ('paddingTop'    in node) ? node.paddingTop    : null,
    padB:       ('paddingBottom' in node) ? node.paddingBottom : null,
    padL:       ('paddingLeft'   in node) ? node.paddingLeft   : null,
    padR:       ('paddingRight'  in node) ? node.paddingRight  : null,
    itemSpacing: ('itemSpacing'  in node) ? node.itemSpacing   : null,
    fillCount:  ('fills'         in node) ? node.fills.length  : 0,
    childCount: ('children'      in node) ? node.children.length : 0
  };
  if ('children' in node && depth > 0 && node.type !== 'INSTANCE') {
    info.children = Array.from(node.children).map(c => scan(c, depth - 1));
  }
  return info;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const root = figma.getNodeById(NODE_ID);
if (!root) { return JSON.stringify({ error: `Node not found: ${NODE_ID}` }); }

// COMPONENT_SET fingerprint mode: scan samples + fingerprint all variants
if (root.type === 'COMPONENT_SET' && 'children' in root && root.children.length > 20) {
  const variants = Array.from(root.children);
  const fpMap = {};  // fingerprint → [variantIds]
  for (const v of variants) {
    const fp = fingerprint(v, DEPTH);
    if (!fpMap[fp]) fpMap[fp] = [];
    fpMap[fp].push(v.id);
  }

  // Determine how many samples to scan (1 per unique fingerprint, or SAMPLE if set)
  const sampleCount = SAMPLE > 0 ? Math.min(SAMPLE, variants.length) : null;
  const sampled = [];

  if (sampleCount) {
    // Explicit sample count: take first N variants
    for (let i = 0; i < sampleCount; i++) sampled.push(scan(variants[i], DEPTH));
  } else {
    // Auto: scan first variant of each unique fingerprint
    const seen = new Set();
    for (const v of variants) {
      const fp = fingerprint(v, DEPTH);
      if (!seen.has(fp)) {
        seen.add(fp);
        sampled.push(scan(v, DEPTH));
      }
    }
  }

  return JSON.stringify({
    id: root.id, name: root.name, type: root.type,
    totalVariants: variants.length,
    uniqueFingerprints: Object.keys(fpMap).length,
    fingerprintGroups: Object.fromEntries(
      Object.entries(fpMap).map(([fp, ids]) => [fp, { count: ids.length, ids }])
    ),
    sampled
  }, null, 2);
}

// Standard mode: full recursive scan
return JSON.stringify(scan(root, DEPTH), null, 2);
