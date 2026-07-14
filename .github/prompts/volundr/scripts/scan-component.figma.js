/**
 * Volundr: scan-component.figma.js
 * Extracts metadata and variant information from a selected Figma component.
 * 
 * Usage: 
 *   1. User selects a component in Figma
 *   2. This script is invoked via Figma Plugin API
 *   3. Returns: component metadata (name, description, variants list)
 * 
 * Output format (JSON):
 * {
 *   nodeId: "123:456",
 *   name: "fds:Button",
 *   description: "Primary action button component",
 *   type: "component",
 *   variantCount: 26,
 *   variants: [
 *     { id: "123:457", name: "State=Filled, Theme=Surface" },
 *     { id: "123:458", name: "State=Focus, Theme=Surface" },
 *     ...
 *   ],
 *   childNodes: [
 *     { id: "...", name: "Label", type: "text" },
 *     { id: "...", name: "Icon", type: "component" },
 *     ...
 *   ]
 * }
 */

(async () => {
  // Verify user selection
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    throw new Error("No node selected. Please select a component to scan.");
  }

  if (selection.length > 1) {
    throw new Error("Multiple nodes selected. Please select a single component.");
  }

  const node = selection[0];

  // Verify it's a component or component set
  if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
    throw new Error(`Selected node is type '${node.type}'. Must be COMPONENT or COMPONENT_SET.`);
  }

  /**
   * Extract variant information from component or component set
   */
  function extractVariants(node) {
    const variants = [];

    if (node.type === "COMPONENT_SET") {
      // Component set: iterate children (they are variants)
      for (const child of node.children) {
        if (child.type === "COMPONENT") {
          variants.push({
            id: child.id,
            name: child.name || "(unnamed variant)"
          });
        }
      }
    } else if (node.type === "COMPONENT") {
      // Single component: check if it's part of a set
      if (node.parent && node.parent.type === "COMPONENT_SET") {
        // Return the entire set
        return extractVariants(node.parent);
      } else {
        // Standalone component: treat as single variant
        variants.push({
          id: node.id,
          name: node.name || "(unnamed)"
        });
      }
    }

    return variants;
  }

  /**
   * Extract immediate child nodes (structure)
   */
  function extractChildNodes(node) {
    const children = [];

    if (node.type === "COMPONENT_SET") {
      // For sets, scan first component's children
      const firstVariant = node.children.find((c) => c.type === "COMPONENT");
      if (firstVariant) {
        for (const child of firstVariant.children) {
          children.push({
            id: child.id,
            name: child.name,
            type: child.type
          });
        }
      }
    } else if (node.type === "COMPONENT") {
      // Direct component: iterate its children
      for (const child of node.children) {
        children.push({
          id: child.id,
          name: child.name,
          type: child.type
        });
      }
    }

    return children;
  }

  // Build result
  const variants = extractVariants(node);
  const childNodes = extractChildNodes(node);

  const result = {
    nodeId: node.id,
    name: node.name,
    description: node.description || "",
    type: node.type,
    variantCount: variants.length,
    variants: variants,
    childNodes: childNodes,
    scannedAt: new Date().toISOString()
  };

  // Return to agent via plugin data
  figma.root.setPluginData("volundr_scan_result", JSON.stringify(result, null, 2));

  console.log("✓ Scan complete:", result.name, `(${result.variantCount} variants)`);
  return result;
})();
