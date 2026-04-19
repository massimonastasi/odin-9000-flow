// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8373:54941";   // Figma node ID of the root to scan
// const DEPTH   = 5;              // how many levels deep to scan (usually 4–5)
// ─────────────────────────────────────────────────────────────────────────────

function scan(node, depth) {
  var info = {
    id:         node.id,
    name:       node.name,
    type:       node.type,
    layoutMode: ('layoutMode'              in node) ? node.layoutMode              : null,
    sizingH:    ('layoutSizingHorizontal'  in node) ? node.layoutSizingHorizontal  : null,
    sizingV:    ('layoutSizingVertical'    in node) ? node.layoutSizingVertical    : null,
    w:          node.width,
    h:          node.height
  };
  if ('children' in node && depth > 0) {
    info.children = Array.from(node.children).map(function(c) {
      return scan(c, depth - 1);
    });
  }
  return info;
}

var root = figma.getNodeById(NODE_ID);
if (!root) { return JSON.stringify({ error: 'Node not found: ' + NODE_ID }); }
return JSON.stringify(scan(root, DEPTH), null, 2);
