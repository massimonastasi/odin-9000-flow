// ─── Injected by agent before execution ───────────────────────────────────────
// const NODE_ID = "8914:78154";     // Root frame to scan
// const MODE = "parse";             // "parse" | "swap"
// const SOURCE_KEY = null;          // swap mode only: componentKey of source component set
// ─────────────────────────────────────────────────────────────────────────────

const root = figma.getNodeById(NODE_ID);
if (!root) { return JSON.stringify({ error: `Node not found: ${NODE_ID}` }); }

const placeholders = [];
const instances    = [];
let   otherCount   = 0;

// ── Placeholder detection ────────────────────────────────────────────────────
// A placeholder is a shape node (RECTANGLE, ELLIPSE, LINE, POLYGON, STAR) or
// a childless FRAME with a meaningful name — i.e. the designer drew a box and
// typed a component name on it.

const SHAPE_TYPES = new Set(['RECTANGLE', 'ELLIPSE', 'LINE', 'POLYGON', 'STAR']);

function isPlaceholder(node) {
  if (SHAPE_TYPES.has(node.type)) return true;
  // Childless FRAME with a non-default name (Figma default is "Frame N")
  if (node.type === 'FRAME' && (!('children' in node) || node.children.length === 0)) {
    return !/^Frame\s+\d+$/i.test(node.name);
  }
  return false;
}

// ── Sizing capture ───────────────────────────────────────────────────────────

function captureSizing(node) {
  return {
    h: ('layoutSizingHorizontal' in node) ? node.layoutSizingHorizontal : null,
    v: ('layoutSizingVertical'   in node) ? node.layoutSizingVertical   : null
  };
}

// ── Scan tree ────────────────────────────────────────────────────────────────

function scan(node, depth) {
  if (depth <= 0) return;

  if (node.type === 'INSTANCE') {
    const entry = {
      id:        node.id,
      name:      node.name,
      type:      'INSTANCE',
      w:         Math.round(node.width),
      h:         Math.round(node.height),
      parentId:  node.parent ? node.parent.id : null,
      index:     node.parent ? Array.from(node.parent.children).indexOf(node) : 0,
      sizing:    captureSizing(node)
    };

    // Extract mainComponent info
    try {
      const main = node.mainComponent;
      if (main) {
        entry.componentName = main.name;
        entry.componentKey  = main.key;
        // Get the component set (parent of variant)
        if (main.parent && main.parent.type === 'COMPONENT_SET') {
          entry.componentSetName = main.parent.name;
          entry.componentSetKey  = main.parent.key;
        }
        // Read variant properties
        const props = node.variantProperties;
        if (props) entry.variantProps = props;
      }
    } catch (e) {
      entry.componentError = e.message || String(e);
    }

    // In swap mode, filter to only source component instances
    if (MODE === 'swap' && SOURCE_KEY) {
      if (entry.componentSetKey === SOURCE_KEY || entry.componentKey === SOURCE_KEY) {
        instances.push(entry);
      }
      // In swap mode, still count non-matching instances as 'other'
      else { otherCount++; }
    } else {
      instances.push(entry);
    }

    // Do NOT recurse into INSTANCE children — they are read-only
    return;
  }

  if (isPlaceholder(node)) {
    placeholders.push({
      id:       node.id,
      name:     node.name,
      type:     node.type,
      w:        Math.round(node.width),
      h:        Math.round(node.height),
      parentId: node.parent ? node.parent.id : null,
      index:    node.parent ? Array.from(node.parent.children).indexOf(node) : 0,
      sizing:   captureSizing(node)
    });
    return;
  }

  // Non-placeholder, non-instance: recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      scan(child, depth - 1);
    }
  } else {
    otherCount++;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

scan(root, 10);

return JSON.stringify({
  mode: MODE,
  root: { id: root.id, name: root.name, type: root.type },
  placeholders: placeholders,
  instances: instances,
  stats: {
    total: placeholders.length + instances.length + otherCount,
    placeholders: placeholders.length,
    instances: instances.length,
    other: otherCount
  }
}, null, 2);
