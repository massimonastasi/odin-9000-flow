/**
 * Volundr: generate-docs.figma.js
 * 
 * FDS Documentation Wireframe Generator
 * Creates 4-section component documentation following Fabric Design System template:
 * 1. Component Overview (visual + description)
 * 2. Control Props Table (Name | Control columns)
 * 3. Variants Organization (grouped by primary property)
 * 4. Component Instances Grid (all variants)
 * 
 * Structure matches: https://figma.com/design/Dli7JA3N6vuTTYi4lD9qMF?node-id=41890-21119
 */

(async () => {
  // Data from volundr_documentation_data plugin data
  const docData = figma.root.getPluginData("volundr_documentation_data");
  if (!docData) {
    throw new Error("No documentation data found");
  }

  let data;
  try {
    data = JSON.parse(docData);
  } catch (e) {
    throw new Error("Invalid documentation data: " + e.message);
  }

  const {
    componentName,
    description,
    controlProps,    // { "Theme": ["on-surface", "on-alternate-surface"], ... }
    variantGroups,   // [{ groupKey: "Theme", groupValue: "on-surface", variants: [...] }, ...]
    componentPage    // page where documentation should be added
  } = data;

  // Helper: Background color mapping for theme keywords
  const bgTokenMap = {
    "on-surface": { r: 0.95, g: 0.95, b: 0.95 },           // light
    "on-alternate-surface": { r: 0.9, g: 0.9, b: 0.9 },   // light variant
    "on-header": { r: 0.85, g: 0.85, b: 0.85 },            // light header
    "surface": { r: 0.95, g: 0.95, b: 0.95 },
    "alternate-surface": { r: 0.9, g: 0.9, b: 0.9 }
  };

  function getBackgroundColor(text) {
    for (const [keyword, color] of Object.entries(bgTokenMap)) {
      if (text.toLowerCase().includes(keyword)) {
        return color;
      }
    }
    return null;
  }

  /**
  /**
   * SECTION 1: Component Overview Frame
   * Visual example + description + "Control Props" label
   */
  function createComponentOverviewFrame(page, yPosition) {
    const frame = figma.createFrame();
    frame.name = componentName;
    frame.resize(541, 383);
    frame.x = 128;
    frame.y = yPosition;
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(frame);

    // Description text
    const desc = figma.createText();
    desc.characters = description;
    desc.fontSize = 14;
    desc.y = 202;
    desc.x = 0;
    desc.resize(541, 100);
    desc.fills = [{ type: "SOLID", color: { r: 0.3, g: 0.3, b: 0.3 } }];
    frame.appendChild(desc);

    // "Control Props" label
    const label = figma.createText();
    label.characters = "Control Props";
    label.fontSize = 16;
    label.fontWeight = 600;
    label.y = 350;
    label.x = 0;
    frame.appendChild(label);

    return frame;
  }

  /**
   * SECTION 2: Control Props Table Frame
   * 2-column table: Name | Control (values)
   */
  function createControlPropsFrame(page, yPosition) {
    const propCount = Object.keys(controlProps).length;
    const frameHeight = 48 + (propCount * 60);
    
    const frame = figma.createFrame();
    frame.name = "Control";
    frame.resize(550, frameHeight);
    frame.x = 128;
    frame.y = yPosition;
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(frame);

    // Header row frame
    const headerRow = figma.createFrame();
    headerRow.name = "Frame 2";
    headerRow.resize(550, 48);
    headerRow.x = 0;
    headerRow.y = 0;
    frame.appendChild(headerRow);

    const headerName = figma.createText();
    headerName.characters = "Name";
    headerName.fontSize = 12;
    headerName.fontWeight = 600;
    headerName.x = 8;
    headerName.y = 14;
    headerRow.appendChild(headerName);

    const headerControl = figma.createText();
    headerControl.characters = "Control";
    headerControl.fontSize = 12;
    headerControl.fontWeight = 600;
    headerControl.x = 275;
    headerControl.y = 14;
    headerRow.appendChild(headerControl);

    // Data rows
    let rowY = 48;
    for (const [propName, values] of Object.entries(controlProps)) {
      const dataRow = figma.createFrame();
      dataRow.name = `Frame_${propName}`;
      dataRow.resize(550, 60);
      dataRow.x = 0;
      dataRow.y = rowY;
      frame.appendChild(dataRow);

      const nameCell = figma.createText();
      nameCell.characters = propName;
      nameCell.fontSize = 12;
      nameCell.x = 8;
      nameCell.y = 19;
      dataRow.appendChild(nameCell);

      const controlCell = figma.createText();
      controlCell.characters = values.join(", ");
      controlCell.fontSize = 12;
      controlCell.x = 275;
      controlCell.y = 8;
      controlCell.resize(267, 44);
      dataRow.appendChild(controlCell);

      rowY += 60;
    }

    return frame;
  }

  /**
   * SECTION 3: Variants Organization Frame
   * Groups of variants organized by primary property
   */
  function createVariantsFrame(page, yPosition) {
    const frame = figma.createFrame();
    frame.name = "Variants";
    frame.resize(1013, 2229);
    frame.x = 128;
    frame.y = yPosition;
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(frame);

    // Content header
    const contentFrame = figma.createFrame();
    contentFrame.name = "Content";
    contentFrame.resize(702, 60);
    contentFrame.x = 0;
    contentFrame.y = 0;
    frame.appendChild(contentFrame);

    const variantsTitle = figma.createText();
    variantsTitle.characters = "Variants";
    variantsTitle.fontSize = 18;
    variantsTitle.fontWeight = 600;
    variantsTitle.x = 0;
    variantsTitle.y = 0;
    contentFrame.appendChild(variantsTitle);

    // Divider line
    const divider = figma.createLine();
    divider.name = "Divider";
    divider.resize(1013, 1);
    divider.x = 0;
    divider.y = 84;
    divider.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
    frame.appendChild(divider);

    // Variant groups
    let groupY = 108;
    for (const group of variantGroups) {
      const groupLabel = `${group.groupKey}=${group.groupValue}`;
      const variantCount = group.variants ? group.variants.length : 0;
      
      // Group frame
      const groupFrame = figma.createFrame();
      groupFrame.name = group.groupKey;
      groupFrame.resize(1013, 276);
      groupFrame.x = 0;
      groupFrame.y = groupY;
      frame.appendChild(groupFrame);

      // Type label
      const typeLabel = figma.createText();
      typeLabel.characters = `Type: ${groupLabel}`;
      typeLabel.fontSize = 14;
      typeLabel.fontWeight = 600;
      typeLabel.x = 0;
      typeLabel.y = 0;
      groupFrame.appendChild(typeLabel);

      // Body frame (placeholder for variant instances)
      const bodyFrame = figma.createFrame();
      bodyFrame.name = "Body";
      bodyFrame.resize(1013, 116);
      bodyFrame.x = 0;
      bodyFrame.y = 160;
      
      // Apply background color based on theme keyword
      const bgColor = getBackgroundColor(groupLabel);
      if (bgColor) {
        bodyFrame.fills = [{ type: "SOLID", color: bgColor }];
      } else {
        bodyFrame.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 0.97 } }];
      }
      
      groupFrame.appendChild(bodyFrame);

      // Placeholder text
      const placeholder = figma.createText();
      placeholder.characters = `${variantCount} variant instances`;
      placeholder.fontSize = 12;
      placeholder.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
      placeholder.x = 16;
      placeholder.y = 52;
      bodyFrame.appendChild(placeholder);

      groupY += 300;
    }

    return frame;
  }

  /**
   * SECTION 4: Component Instances Grid Frame
   * All variant symbol instances arranged in grid
   */
  function createComponentInstancesFrame(page, yPosition) {
    const frame = figma.createFrame();
    frame.name = componentName;
    frame.resize(1013, 1956);
    frame.x = 128;
    frame.y = yPosition;
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(frame);

    // Note: Actual component instances would be placed here
    // This frame serves as the container for all variants in grid layout
    const note = figma.createText();
    note.characters = "Component variant instances grid";
    note.fontSize = 12;
    note.x = 16;
    note.y = 16;
    note.fills = [{ type: "SOLID", color: { r: 0.7, g: 0.7, b: 0.7 } }];
    frame.appendChild(note);

    return frame;
  }

  /**
   * Main execution
   */
  // Set current page
  await figma.setCurrentPageAsync(componentPage);

  // Clear existing documentation frames
  for (const child of componentPage.children.slice()) {
    if (["Control", "Variants", componentName].includes(child.name)) {
      child.remove();
    }
  }

  // Generate documentation structure
  let yPos = 600;
  const spacing = 24;

  createComponentOverviewFrame(componentPage, yPos);
  yPos += 383 + spacing;

  createControlPropsFrame(componentPage, yPos);
  yPos += (48 + (Object.keys(controlProps).length * 60)) + spacing;

  createVariantsFrame(componentPage, yPos);
  yPos += 2229 + spacing;

  createComponentInstancesFrame(componentPage, yPos);

  return {
    status: "success",
    page: componentPage.name,
    framesCreated: 4,
    variantGroupsCount: variantGroups.length,
    message: "Documentation created with proper FDS wireframe structure"
  };
})();
    }

    return varFrame;
  }

  // Main execution
  try {
    const docPage = getOrCreateDocPage(componentName);

    // Set current page so frames are created on the correct page
    await figma.setCurrentPageAsync(docPage);

    // Generate frames
    const headerFrame = generateHeaderFrame(docPage, componentName, description);
    const cpFrame = generateControlPropsFrame(docPage, controlProps);
    const varFrame = generateVariantsFrame(docPage, variantGroups);

    // Count backgrounds applied
    let backgroundsApplied = 0;
    for (const group of variantGroups) {
      if (getBackgroundColor(`${group.key}=${group.value}`)) {
        backgroundsApplied++;
      }
    }

    const result = {
      pageId: docPage.id,
      pageName: docPage.name,
      framesCreated: ["Header", "ControlProps", "Variants"],
      variantGroupsGenerated: variantGroups.length,
      backgroundsApplied: backgroundsApplied,
      status: "success",
      generatedAt: new Date().toISOString()
    };

    figma.root.setPluginData("volundr_generation_result", JSON.stringify(result, null, 2));

    console.log("✓ Documentation generated:", docPage.name);
    return result;
  } catch (error) {
    const errorResult = {
      status: "error",
      message: error.message,
      generatedAt: new Date().toISOString()
    };

    figma.root.setPluginData("volundr_generation_error", JSON.stringify(errorResult, null, 2));

    throw error;
  }
})();
