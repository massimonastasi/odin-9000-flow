/**
 * run-build-plan.figma.js — Volundr Phase 3 executor (static, checked into
 * the repo, never regenerated per run).
 *
 * Executes a declarative build-plan (produced offline by scripts/build_plan.py
 * from a Phase 1 analysis JSON + data/page-template.json + data/doc-components.json)
 * against the current Figma file, in a single `use_figma` pass instead of the
 * many incremental, prose-guided calls Volundr used before this refactor.
 *
 * Mirrors mimr/scripts/audit-resolve-digest.figma.js's pattern: an injected
 * constant at the top, a compact digest returned at the end.
 *
 * ── Injected by agent before execution ──────────────────────────────────────
 *
 *   const BUILD_PLAN = { ... };   // parsed contents of build-plan.json (from build_plan.py)
 *
 * ── Behavior preserved from the old prose-driven build (do not regress) ─────
 *
 *   - Resolve the component's page (walk node.parent to PAGE) and
 *     figma.setCurrentPageAsync(page) before appending anything — figma.currentPage
 *     resets to the first page every call.
 *   - Discover the 9 doc-kit atoms via the "❖ volundr-components-doc" page first,
 *     falling back to the rest of the file. Use the cached {atomName: nodeId}
 *     map when cache.valid('volundr-atoms-<fileKey>', <file-version>) hits.
 *   - Never publish a missing atom automatically — return a `needsUserInput`
 *     flag instead ({ type: 'missingAtom', atomName }) so the agent can ask.
 *   - Never instance a name-colliding atom without asking — return
 *     { type: 'atomCollision', atomName, candidateIds } instead of guessing.
 *   - appendChild a node into its auto-layout parent BEFORE setting
 *     layoutSizingHorizontal/Vertical on it (all-or-nothing rollback gotcha).
 *   - Never resize(w,h) an AUTO-height auto-layout frame before appending its
 *     children; relayout after by toggling primaryAxisSizingMode off/on.
 *   - The "anatomy" column (BUILD_PLAN.root's deferToAnatomyRules node) is
 *     intentionally NOT built here — it stays LLM-driven per anatomy-rules.md
 *     in v1; this script only flags it back so the agent builds it separately.
 *   - "section--component" body is MOVED (not copied), never grouped/captioned.
 *
 * ── Output (returned as inline JSON, digest-style) ──────────────────────────
 *
 *   {
 *     pageId, pageName, rootFrameId, rootFrameName,
 *     sectionsBuilt: [{ name, visible }],
 *     needsUserInput: [{ type, atomName, candidateIds? }],
 *     deferredToAnatomyRules: { name },
 *     opsExecuted: number
 *   }
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findPage(node) {
  let n = node;
  while (n && n.type !== 'PAGE') n = n.parent;
  return n;
}

async function discoverAtoms(atomNames) {
  const found = {};
  const missing = [];
  const collisions = [];

  const docKitPage = figma.root.children.find(p => p.name === '\u2756 volundr-components-doc');
  const searchRoots = docKitPage ? [docKitPage] : figma.root.children;

  for (const atomName of atomNames) {
    const matches = [];
    for (const page of searchRoots) {
      const hits = page.findAllWithCriteria
        ? page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).filter(n => n.name === atomName)
        : [];
      matches.push(...hits);
    }
    if (matches.length === 0) {
      missing.push(atomName);
    } else if (matches.length > 1) {
      // Only a real collision if specs differ (different child signatures) —
      // conservative check: different node ids AND different child counts.
      const distinctShapes = new Set(matches.map(m => m.children ? m.children.length : 0));
      if (distinctShapes.size > 1) {
        collisions.push({ atomName, candidateIds: matches.map(m => m.id) });
      } else {
        found[atomName] = matches[0].id;
      }
    } else {
      found[atomName] = matches[0].id;
    }
  }
  return { found, missing, collisions };
}

async function setText(textNode, value) {
  if (!textNode || typeof value !== 'string') return;
  // Canonical text-edit recipe: load the node's CURRENT font(s) before mutating —
  // skipping this throws "Cannot write to node with unloaded font".
  if (textNode.fontName && textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName);
  } else {
    const segments = textNode.getStyledTextSegments(['fontName']);
    for (const seg of segments) await figma.loadFontAsync(seg.fontName);
  }
  textNode.characters = value;
}

async function instanceAtom(atomIdMap, opNode) {
  const compId = atomIdMap[opNode.atom];
  if (!compId) return null; // caller already recorded this as a needsUserInput entry
  const comp = await figma.getNodeByIdAsync(compId);
  if (!comp) return null;
  const instance = comp.createInstance ? comp.createInstance() : comp.mainComponent.createInstance();
  instance.name = opNode.atom;
  return instance;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run(buildPlan) {
  const atomNames = (buildPlan.atoms || []).map(a => a.name);
  const { found: atomIdMap, missing, collisions } = await discoverAtoms(atomNames);

  const needsUserInput = [
    ...missing.map(atomName => ({ type: 'missingAtom', atomName })),
    ...collisions.map(c => ({ type: 'atomCollision', atomName: c.atomName, candidateIds: c.candidateIds }))
  ];

  // Resolve + switch to the component's own page (docs must live there).
  const componentNode = await figma.getNodeByIdAsync(buildPlan.component.nodeId);
  const page = componentNode ? await findPage(componentNode) : null;
  if (page) await figma.setCurrentPageAsync(page);

  let opsExecuted = 0;
  const sectionsBuilt = [];
  const createdNodeIds = [];
  const mutatedNodeIds = [];
  // FILL sizing is deferred (see applyChildSizing) because Header is built
  // before doc-columns in child order, so root/doc-columns don't have their
  // final hug width yet when Header would otherwise apply FILL.
  const deferredFills = [];

  function createFrame(spec) {
    const frame = figma.createFrame();
    frame.name = spec.name;
    if (spec.layoutMode) {
      frame.layoutMode = spec.layoutMode;
      // Gotcha (found live 2026-07-24): a new auto-layout frame's
      // primary/counterAxisSizingMode default to 'FIXED' at 100x100 even
      // after setting layoutMode — they do NOT default to 'AUTO' (hug).
      // Always hug both axes here; FILL/FIXED overrides are applied on the
      // CHILD (via sizingHorizontal/fixedWidth) after it is appended below.
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
    }
    if (spec.itemSpacing !== undefined) frame.itemSpacing = spec.itemSpacing;
    if (spec.padding !== undefined) {
      frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = spec.padding;
    }
    if (spec.cornerRadius !== undefined) frame.cornerRadius = spec.cornerRadius;
    if (spec.background === 'white') {
      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    }
    if (spec.visible === false) frame.visible = false;
    createdNodeIds.push(frame.id);
    opsExecuted++;
    return frame;
  }

  // Apply a child's sizing relative to ITS parent — must run AFTER appendChild
  // (FILL/FIXED require the node to already be inside an auto-layout parent).
  // FIXED-width columns can be sized immediately (they don't depend on a
  // sibling being built later); FILL is deferred to the end of run() instead.
  function applyChildSizing(node, spec) {
    if (spec.sizingHorizontal === 'FIXED' && spec.fixedWidth !== undefined) {
      node.layoutSizingHorizontal = 'FIXED';
      node.resize(spec.fixedWidth, node.height);
    } else if (spec.sizingHorizontal === 'FILL') {
      deferredFills.push({ node, axis: 'horizontal' });
    }
    if (spec.sizingVertical === 'FILL') {
      deferredFills.push({ node, axis: 'vertical' });
    }
  }

  async function buildNode(spec, parent) {
    if (!spec) return;
    if (spec.op === 'deferToAnatomyRules') {
      needsUserInput.push({ type: 'deferredToAnatomyRules', name: spec.name });
      return;
    }
    if (spec.op === 'moveComponent') {
      const node = await figma.getNodeByIdAsync(spec.nodeId);
      if (node && parent) {
        parent.appendChild(node); // appendChild BEFORE layoutSizing* (all-or-nothing gotcha)
        mutatedNodeIds.push(node.id);
      }
      return;
    }
    if (spec.op === 'instanceAtom') {
      const instance = await instanceAtom(atomIdMap, spec);
      if (!instance) return; // already flagged via needsUserInput if it was missing
      if (parent) parent.appendChild(instance);
      createdNodeIds.push(instance.id);
      if (spec.text && typeof spec.text === 'string') {
        const textNode = instance.findOne ? instance.findOne(n => n.type === 'TEXT') : null;
        await setText(textNode, spec.text);
      } else if (spec.text && typeof spec.text === 'object') {
        // { label, suffix } style atoms (section-title--control-props)
        const textNodes = instance.findAll ? instance.findAll(n => n.type === 'TEXT') : [];
        if (textNodes[0]) await setText(textNodes[0], spec.text.label);
        if (textNodes[1]) await setText(textNodes[1], spec.text.suffix);
      } else if (Array.isArray(spec.cells)) {
        const textNodes = instance.findAll ? instance.findAll(n => n.type === 'TEXT') : [];
        for (let i = 0; i < spec.cells.length && i < textNodes.length; i++) {
          await setText(textNodes[i], spec.cells[i]);
        }
      }
      return;
    }
    if (spec.op === 'createFrame') {
      const frame = createFrame(spec);
      if (parent) {
        parent.appendChild(frame);
        applyChildSizing(frame, spec);
      }
      sectionsBuilt.push({ name: spec.name, visible: spec.visible !== false });
      for (const child of spec.children || []) {
        await buildNode(child, frame);
      }
      return;
    }
  }

  const rootSpec = buildPlan.root;
  const rootFrame = createFrame(rootSpec);
  if (page) {
    page.appendChild(rootFrame);
    // Position away from (0,0) — page-level nodes default there; place to the
    // right of the rightmost existing top-level node (figma-use skill rule 13).
    const siblings = page.children.filter(n => n.id !== rootFrame.id);
    const rightmost = siblings.reduce((max, n) => Math.max(max, (n.x || 0) + (n.width || 0)), 0);
    rootFrame.x = rightmost + 200;
    rootFrame.y = 0;
  }
  for (const child of rootSpec.children || []) {
    await buildNode(child, rootFrame);
  }

  // Post-build relayout pass. Root and doc-columns were sized top-down before
  // their children existed, so their hug dimensions are stale — and calling
  // resize(w,h) on an AUTO-height frame can pin it at whatever placeholder
  // height was passed (confirmed live 2026-07-24: doc-columns' own
  // counterAxisSizingMode must be explicitly 'AUTO' too, or it never grows
  // past its 100px default even though its children are correct). Fix both,
  // resize root to the now-final doc-columns width, THEN apply the deferred
  // FILL sizings (Header/section--component etc. need root's width to be
  // determinate first — applying FILL earlier, while root was still at its
  // 100px placeholder, throws "FILL can only be set on children of
  // auto-layout frames" because the available content width is negative).
  const docColumnsFrame = rootFrame.findOne(n => n.name === 'doc-columns');
  if (docColumnsFrame) docColumnsFrame.counterAxisSizingMode = 'AUTO';
  if (page) {
    const targetWidth = (docColumnsFrame ? docColumnsFrame.width : rootFrame.width) + (rootSpec.padding || 0) * 2;
    rootFrame.resize(targetWidth, rootFrame.height);
    rootFrame.primaryAxisSizingMode = 'FIXED';
    rootFrame.primaryAxisSizingMode = 'AUTO';
  }

  for (const { node, axis } of deferredFills) {
    if (axis === 'horizontal') node.layoutSizingHorizontal = 'FILL';
    else node.layoutSizingVertical = 'FILL';
  }

  // Re-relayout once more — applying FILL can change a frame's own hug height
  // (e.g. Header's description wrapping differently at full width), which can
  // in turn change doc-columns'/root's own final height.
  if (page) {
    rootFrame.primaryAxisSizingMode = 'FIXED';
    rootFrame.primaryAxisSizingMode = 'AUTO';
  }

  return {
    pageId: page ? page.id : null,
    pageName: page ? page.name : null,
    rootFrameId: rootFrame.id,
    rootFrameName: rootFrame.name,
    sectionsBuilt,
    needsUserInput,
    opsExecuted,
    createdNodeIds,
    mutatedNodeIds
  };
}

// Entry point — `run(BUILD_PLAN)` is invoked by the agent after injecting
// BUILD_PLAN at the top of this file's content, via use_figma. Must be a
// top-level `return` (not a bare call) so the harness sends the digest back.
return await run(BUILD_PLAN);
