#!/usr/bin/env node
/**
 * generate-phase3.mjs — Stamp a write plan into a ready-to-run Phase 3 script.
 *
 * Eliminates the 39-call iterative script-building loop by generating the
 * complete bulk-update script from a JSON write plan in one shot.
 *
 * Usage:
 *   echo '<write-plan-json>' | node generate-phase3.mjs --root <nodeId> --file <fileKey> [--out <path>]
 *   node generate-phase3.mjs --root 9371:85244 --file Ahvbwk0dUHeHazrQX2XtGd --plan plan.json
 *
 * Write plan shape (array):
 *   [
 *     { "nodeId": "9371:85245", "prop": "fills", "token": "var/fds/fds-info", "rawValue": "#608DF2" },
 *     { "nodeId": "9371:85245", "prop": "cornerRadius", "token": "fds-round/fds-round-150", "rawValue": "12" },
 *     { "nodeId": "9371:85245", "prop": "padding", "token": "spacing/fds-spacing/fds-spacing-200", "rawValue": "16" },
 *     { "nodeId": "9371:85248", "prop": "fills", "token": "var/fds/fds-on-info-alternate", "rawValue": "#ffffff" },
 *     { "nodeId": "9371:85248", "prop": "textStyle", "styleName": "Paragraphs/fds/fds-paragraphs-small" },
 *     ...
 *   ]
 *
 * Supported prop types:
 *   fills        → setBoundVariableForPaint on fills[0]
 *   strokes      → setBoundVariableForPaint on strokes[0]
 *   cornerRadius → setBoundVariable on all 4 corner props
 *   padding      → setBoundVariable on all 4 padding props
 *   paddingH     → setBoundVariable on paddingLeft + paddingRight
 *   paddingV     → setBoundVariable on paddingTop + paddingBottom
 *   strokeWeight → setBoundVariable on all 4 stroke weight props
 *   itemSpacing  → setBoundVariable on itemSpacing
 *   textStyle    → setTextStyleIdAsync (matches by name)
 *
 * Output: a complete .figma.js script ready to paste into the Figma Plugin Console.
 */

import { readFileSync, writeFileSync } from "fs";
import { argv } from "process";

// ── Parse args ──
const args = {};
for (let i = 2; i < argv.length; i++) {
  if (argv[i] === "--root") args.root = argv[++i];
  else if (argv[i] === "--file") args.file = argv[++i];
  else if (argv[i] === "--out") args.out = argv[++i];
  else if (argv[i] === "--plan") args.planFile = argv[++i];
}

if (!args.root || !args.file) {
  console.error(
    "Usage: echo <plan> | node generate-phase3.mjs --root <nodeId> --file <fileKey> [--out path]",
  );
  process.exit(1);
}

// ── Read plan ──
let planJson;
if (args.planFile) {
  planJson = readFileSync(args.planFile, "utf8");
} else {
  planJson = readFileSync("/dev/stdin", "utf8");
}
const plan = JSON.parse(planJson);

// ── Group writes by nodeId ──
const byNode = {};
for (const entry of plan) {
  if (!byNode[entry.nodeId]) byNode[entry.nodeId] = [];
  byNode[entry.nodeId].push(entry);
}

// ── Generate script ──
const lines = [];

lines.push(`/**`);
lines.push(` * Phase 3 — Auto-generated write script`);
lines.push(` * Root: ${args.root} | File: ${args.file}`);
lines.push(
  ` * Bindings: ${plan.length} | Nodes: ${Object.keys(byNode).length}`,
);
lines.push(` * Generated: ${new Date().toISOString()}`);
lines.push(` */`);
lines.push(``);
lines.push(`(async () => {`);
lines.push(`  const report = { applied: 0, failed: 0, log: [] };`);
lines.push(``);
lines.push(`  // Resolve all local variables once`);
lines.push(`  const allVars = await figma.variables.getLocalVariablesAsync();`);
lines.push(`  const varByName = {};`);
lines.push(`  for (const v of allVars) varByName[v.name] = v;`);
lines.push(``);
lines.push(`  // Resolve all local text styles once`);
lines.push(`  const allStyles = await figma.getLocalTextStylesAsync();`);
lines.push(`  const styleByName = {};`);
lines.push(`  for (const s of allStyles) styleByName[s.name] = s;`);
lines.push(``);
lines.push(`  // Helper: find variable by name (exact or suffix match)`);
lines.push(`  function findVar(name) {`);
lines.push(`    if (varByName[name]) return varByName[name];`);
lines.push(`    // Try suffix match (some files prefix with namespace)`);
lines.push(`    const suffix = '/' + name.split('/').pop();`);
lines.push(`    for (const [k, v] of Object.entries(varByName)) {`);
lines.push(
  `      if (k.endsWith(suffix) && k.includes(name.split('/')[0])) return v;`,
);
lines.push(`    }`);
lines.push(`    return null;`);
lines.push(`  }`);
lines.push(``);
lines.push(`  // Helper: bind fill/stroke paint`);
lines.push(`  function bindPaint(node, paintType, variable) {`);
lines.push(`    try {`);
lines.push(`      const paints = node[paintType];`);
lines.push(`      if (!paints || paints.length === 0) {`);
lines.push(`        node[paintType] = [figma.util.solidPaint('#000000')];`);
lines.push(`      }`);
lines.push(`      node.setBoundVariable(paintType, 0, variable);`);
lines.push(`      return true;`);
lines.push(`    } catch (e) { return false; }`);
lines.push(`  }`);
lines.push(``);

// Generate per-node blocks
for (const [nodeId, writes] of Object.entries(byNode)) {
  lines.push(`  // ── Node ${nodeId} ──`);
  lines.push(`  {`);
  lines.push(`    const node = await figma.getNodeByIdAsync("${nodeId}");`);
  lines.push(
    `    if (!node) { report.failed += ${writes.length}; report.log.push({nodeId:"${nodeId}",error:"not found"}); }`,
  );
  lines.push(`    else {`);

  for (const w of writes) {
    const tokenName = w.token || "";
    const rawValue = w.rawValue || "";

    if (w.prop === "fills" || w.prop === "strokes") {
      lines.push(`      { // ${w.prop} → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(
        `        if (v) { bindPaint(node, "${w.prop}", v); report.applied++; report.log.push({nodeId:"${nodeId}",prop:"${w.prop}",status:"ok"}); }`,
      );
      lines.push(
        `        else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"${w.prop}",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "cornerRadius") {
      lines.push(`      { // cornerRadius → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(
        `          for (const p of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) node.setBoundVariable(p, v);`,
      );
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"cornerRadius",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"cornerRadius",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "padding") {
      lines.push(`      { // padding (all 4) → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(
        `          for (const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft']) node.setBoundVariable(p, v);`,
      );
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"padding",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"padding",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "paddingH") {
      lines.push(`      { // paddingH → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(
        `          node.setBoundVariable('paddingLeft', v); node.setBoundVariable('paddingRight', v);`,
      );
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"paddingH",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"paddingH",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "paddingV") {
      lines.push(`      { // paddingV → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(
        `          node.setBoundVariable('paddingTop', v); node.setBoundVariable('paddingBottom', v);`,
      );
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"paddingV",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"paddingV",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "strokeWeight") {
      lines.push(`      { // strokeWeight → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(
        `          for (const p of ['strokeTopWeight','strokeBottomWeight','strokeLeftWeight','strokeRightWeight']) node.setBoundVariable(p, v);`,
      );
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"strokeWeight",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"strokeWeight",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "itemSpacing") {
      lines.push(`      { // itemSpacing → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(`        if (v) {`);
      lines.push(`          node.setBoundVariable('itemSpacing', v);`);
      lines.push(
        `          report.applied++; report.log.push({nodeId:"${nodeId}",prop:"itemSpacing",status:"ok"});`,
      );
      lines.push(
        `        } else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"itemSpacing",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    } else if (w.prop === "textStyle") {
      const styleName = w.styleName || "";
      lines.push(`      { // textStyle → ${styleName}`);
      lines.push(`        const s = styleByName["${styleName}"];`);
      lines.push(
        `        if (s) { await node.setTextStyleIdAsync(s.id); report.applied++; report.log.push({nodeId:"${nodeId}",prop:"textStyle",status:"ok"}); }`,
      );
      lines.push(
        `        else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"textStyle",error:"style not found: ${styleName}"}); }`,
      );
      lines.push(`      }`);
    } else {
      // Generic scalar prop
      lines.push(`      { // ${w.prop} → ${tokenName}`);
      lines.push(`        const v = findVar("${tokenName}");`);
      lines.push(
        `        if (v) { node.setBoundVariable("${w.prop}", v); report.applied++; report.log.push({nodeId:"${nodeId}",prop:"${w.prop}",status:"ok"}); }`,
      );
      lines.push(
        `        else { report.failed++; report.log.push({nodeId:"${nodeId}",prop:"${w.prop}",error:"var not found: ${tokenName}"}); }`,
      );
      lines.push(`      }`);
    }
  }

  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(``);
}

lines.push(`  // ── Summary ──`);
lines.push(`  console.log(JSON.stringify(report, null, 2));`);
lines.push(
  `  figma.closePlugin(JSON.stringify({ applied: report.applied, failed: report.failed }));`,
);
lines.push(`})();`);

const script = lines.join("\n");

if (args.out) {
  writeFileSync(args.out, script, "utf8");
  console.log(
    JSON.stringify({
      ok: true,
      path: args.out,
      bindings: plan.length,
      nodes: Object.keys(byNode).length,
    }),
  );
} else {
  console.log(script);
}
