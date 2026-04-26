// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8373:54941";   // Figma node ID of the root to scan
// const DEPTH   = 5;              // how many levels deep to scan (usually 4–5)
// ─────────────────────────────────────────────────────────────────────────────

function scan(node, depth) {
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

const root = figma.getNodeById(NODE_ID);
if (!root) { return JSON.stringify({ error: `Node not found: ${NODE_ID}` }); }
return JSON.stringify(scan(root, DEPTH), null, 2);
