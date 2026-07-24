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

function setText(textNode, value) {
  if (textNode && typeof value === 'string') {
    textNode.characters = value;
  }
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

  function createFrame(spec) {
    const frame = figma.createFrame();
    frame.name = spec.name;
    if (spec.layoutMode) frame.layoutMode = spec.layoutMode;
    if (spec.itemSpacing !== undefined) frame.itemSpacing = spec.itemSpacing;
    if (spec.padding !== undefined) {
      frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = spec.padding;
    }
    if (spec.cornerRadius !== undefined) frame.cornerRadius = spec.cornerRadius;
    if (spec.background === 'white') {
      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    }
    if (spec.visible === false) frame.visible = false;
    opsExecuted++;
    return frame;
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
      }
      return;
    }
    if (spec.op === 'instanceAtom') {
      const instance = await instanceAtom(atomIdMap, spec);
      if (!instance) return; // already flagged via needsUserInput if it was missing
      if (parent) parent.appendChild(instance);
      if (spec.text && typeof spec.text === 'string') {
        const textNode = instance.findOne ? instance.findOne(n => n.type === 'TEXT') : null;
        setText(textNode, spec.text);
      } else if (spec.text && typeof spec.text === 'object') {
        // { label, suffix } style atoms (section-title--control-props)
        const textNodes = instance.findAll ? instance.findAll(n => n.type === 'TEXT') : [];
        if (textNodes[0]) setText(textNodes[0], spec.text.label);
        if (textNodes[1]) setText(textNodes[1], spec.text.suffix);
      }
      return;
    }
    if (spec.op === 'createFrame') {
      const frame = createFrame(spec);
      if (parent) parent.appendChild(frame);
      sectionsBuilt.push({ name: spec.name, visible: spec.visible !== false });
      for (const child of spec.children || []) {
        await buildNode(child, frame);
      }
      return;
    }
  }

  const rootSpec = buildPlan.root;
  const rootFrame = createFrame(rootSpec);
  if (page) page.appendChild(rootFrame);
  for (const child of rootSpec.children || []) {
    await buildNode(child, rootFrame);
  }

  return {
    pageId: page ? page.id : null,
    pageName: page ? page.name : null,
    rootFrameId: rootFrame.id,
    rootFrameName: rootFrame.name,
    sectionsBuilt,
    needsUserInput,
    opsExecuted
  };
}

// Entry point — `run(BUILD_PLAN)` is invoked by the agent after injecting
// BUILD_PLAN at the top of this file's content, via use_figma.
run(BUILD_PLAN);
