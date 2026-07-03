/**
 * Phase 3 — Auto-generated write script
 * Root: 9373:85017 | File: Ahvbwk0dUHeHazrQX2XtGd
 * Bindings: 12 | Nodes: 5
 * Generated: 2026-07-02T11:37:43.549Z
 */

(async () => {
  const report = { applied: 0, failed: 0, log: [] };

  // Resolve all local variables once
  const allVars = await figma.variables.getLocalVariablesAsync();
  const varByName = {};
  for (const v of allVars) varByName[v.name] = v;

  // Resolve all local text styles once
  const allStyles = await figma.getLocalTextStylesAsync();
  const styleByName = {};
  for (const s of allStyles) styleByName[s.name] = s;

  // Helper: find variable by name (exact or suffix match)
  function findVar(name) {
    if (varByName[name]) return varByName[name];
    // Try suffix match (some files prefix with namespace)
    const suffix = '/' + name.split('/').pop();
    for (const [k, v] of Object.entries(varByName)) {
      if (k.endsWith(suffix) && k.includes(name.split('/')[0])) return v;
    }
    return null;
  }

  // Helper: bind fill/stroke paint
  function bindPaint(node, paintType, variable) {
    try {
      const paints = node[paintType];
      if (!paints || paints.length === 0) {
        node[paintType] = [figma.util.solidPaint('#000000')];
      }
      node.setBoundVariable(paintType, 0, variable);
      return true;
    } catch (e) { return false; }
  }

  // ── Node 9373:85017 ──
  {
    const node = await figma.getNodeByIdAsync("9373:85017");
    if (!node) { report.failed += 2; report.log.push({nodeId:"9373:85017",error:"not found"}); }
    else {
      { // paddingH → spacing/fds-spacing-const/container/fds-spacing-const-container-canvas-lg
        const v = findVar("spacing/fds-spacing-const/container/fds-spacing-const-container-canvas-lg");
        if (v) {
          node.setBoundVariable('paddingLeft', v); node.setBoundVariable('paddingRight', v);
          report.applied++; report.log.push({nodeId:"9373:85017",prop:"paddingH",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85017",prop:"paddingH",error:"var not found: spacing/fds-spacing-const/container/fds-spacing-const-container-canvas-lg"}); }
      }
      { // cornerRadius → fds-round/fds-round-150
        const v = findVar("fds-round/fds-round-150");
        if (v) {
          for (const p of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) node.setBoundVariable(p, v);
          report.applied++; report.log.push({nodeId:"9373:85017",prop:"cornerRadius",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85017",prop:"cornerRadius",error:"var not found: fds-round/fds-round-150"}); }
      }
    }
  }

  // ── Node 9373:85018 ──
  {
    const node = await figma.getNodeByIdAsync("9373:85018");
    if (!node) { report.failed += 5; report.log.push({nodeId:"9373:85018",error:"not found"}); }
    else {
      { // fills → var/fds/fds-info
        const v = findVar("var/fds/fds-info");
        if (v) { bindPaint(node, "fills", v); report.applied++; report.log.push({nodeId:"9373:85018",prop:"fills",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85018",prop:"fills",error:"var not found: var/fds/fds-info"}); }
      }
      { // strokes → var/fds/fds-on-surface-ulow
        const v = findVar("var/fds/fds-on-surface-ulow");
        if (v) { bindPaint(node, "strokes", v); report.applied++; report.log.push({nodeId:"9373:85018",prop:"strokes",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85018",prop:"strokes",error:"var not found: var/fds/fds-on-surface-ulow"}); }
      }
      { // strokeWeight → fds-stroke/fds-stroke-100
        const v = findVar("fds-stroke/fds-stroke-100");
        if (v) {
          for (const p of ['strokeTopWeight','strokeBottomWeight','strokeLeftWeight','strokeRightWeight']) node.setBoundVariable(p, v);
          report.applied++; report.log.push({nodeId:"9373:85018",prop:"strokeWeight",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85018",prop:"strokeWeight",error:"var not found: fds-stroke/fds-stroke-100"}); }
      }
      { // padding (all 4) → spacing/fds-spacing/fds-spacing-200
        const v = findVar("spacing/fds-spacing/fds-spacing-200");
        if (v) {
          for (const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft']) node.setBoundVariable(p, v);
          report.applied++; report.log.push({nodeId:"9373:85018",prop:"padding",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85018",prop:"padding",error:"var not found: spacing/fds-spacing/fds-spacing-200"}); }
      }
      { // cornerRadius → fds-round/fds-round-150
        const v = findVar("fds-round/fds-round-150");
        if (v) {
          for (const p of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) node.setBoundVariable(p, v);
          report.applied++; report.log.push({nodeId:"9373:85018",prop:"cornerRadius",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85018",prop:"cornerRadius",error:"var not found: fds-round/fds-round-150"}); }
      }
    }
  }

  // ── Node 9373:85020 ──
  {
    const node = await figma.getNodeByIdAsync("9373:85020");
    if (!node) { report.failed += 1; report.log.push({nodeId:"9373:85020",error:"not found"}); }
    else {
      { // itemSpacing → spacing/fds-spacing/fds-spacing-050
        const v = findVar("spacing/fds-spacing/fds-spacing-050");
        if (v) {
          node.setBoundVariable('itemSpacing', v);
          report.applied++; report.log.push({nodeId:"9373:85020",prop:"itemSpacing",status:"ok"});
        } else { report.failed++; report.log.push({nodeId:"9373:85020",prop:"itemSpacing",error:"var not found: spacing/fds-spacing/fds-spacing-050"}); }
      }
    }
  }

  // ── Node 9373:85021 ──
  {
    const node = await figma.getNodeByIdAsync("9373:85021");
    if (!node) { report.failed += 2; report.log.push({nodeId:"9373:85021",error:"not found"}); }
    else {
      { // fills → var/fds/fds-on-info-alternate
        const v = findVar("var/fds/fds-on-info-alternate");
        if (v) { bindPaint(node, "fills", v); report.applied++; report.log.push({nodeId:"9373:85021",prop:"fills",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85021",prop:"fills",error:"var not found: var/fds/fds-on-info-alternate"}); }
      }
      { // textStyle → Paragraphs/fds/fds-paragraphs-small
        const s = styleByName["Paragraphs/fds/fds-paragraphs-small"];
        if (s) { await node.setTextStyleIdAsync(s.id); report.applied++; report.log.push({nodeId:"9373:85021",prop:"textStyle",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85021",prop:"textStyle",error:"style not found: Paragraphs/fds/fds-paragraphs-small"}); }
      }
    }
  }

  // ── Node 9373:85022 ──
  {
    const node = await figma.getNodeByIdAsync("9373:85022");
    if (!node) { report.failed += 2; report.log.push({nodeId:"9373:85022",error:"not found"}); }
    else {
      { // fills → var/fds/fds-on-info-alternate
        const v = findVar("var/fds/fds-on-info-alternate");
        if (v) { bindPaint(node, "fills", v); report.applied++; report.log.push({nodeId:"9373:85022",prop:"fills",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85022",prop:"fills",error:"var not found: var/fds/fds-on-info-alternate"}); }
      }
      { // textStyle → Paragraphs/fds/fds-paragraphs-regular-bold
        const s = styleByName["Paragraphs/fds/fds-paragraphs-regular-bold"];
        if (s) { await node.setTextStyleIdAsync(s.id); report.applied++; report.log.push({nodeId:"9373:85022",prop:"textStyle",status:"ok"}); }
        else { report.failed++; report.log.push({nodeId:"9373:85022",prop:"textStyle",error:"style not found: Paragraphs/fds/fds-paragraphs-regular-bold"}); }
      }
    }
  }

  // ── Summary ──
  console.log(JSON.stringify(report, null, 2));
  figma.closePlugin(JSON.stringify({ applied: report.applied, failed: report.failed }));
})();