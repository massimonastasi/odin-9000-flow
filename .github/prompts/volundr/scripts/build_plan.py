#!/usr/bin/env python3
"""
build_plan.py — Compile a Volundr Phase 1 analysis JSON into a deterministic
build-plan (an ordered, declarative frame/atom tree) WITHOUT touching Figma.

This is the offline half of Volundr's token-optimization split (mirrors
mimr/scripts/token-lookup.py's standalone-CLI, zero-Figma-access style):
  analysis.json (LLM-produced, small)
    -> build_plan.py (pure, deterministic, no Figma/network access)
    -> build-plan.json (declarative tree)
    -> scripts/run-build-plan.figma.js (static executor, injected BUILD_PLAN
       constant, run once via use_figma)

Replaces the previous approach of the LLM reasoning through page-template.md +
doc-components.md prose for every section/atom/row during Phase 3 — the
layout math (column composition, hide-empty-section rule, one control-props
row per detected value) is computed here instead.

Usage:
  python3 build_plan.py <analysis.json> [-o build-plan.json]
  python3 build_plan.py <analysis.json>          # prints build-plan.json to stdout

Out of scope (left prose/LLM-driven, per plan decision — see volundr.prompt.md):
  - section--anatomy content (anatomy-rules.md stays authoritative, needs
    visual judgment for pin placement / diagram selection)
  - Phase 1 variant-name parsing itself (variant-parsing-rules.md)
"""

import json
import sys
import os
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
PAGE_TEMPLATE_PATH = os.path.join(DATA_DIR, 'page-template.json')
DOC_COMPONENTS_PATH = os.path.join(DATA_DIR, 'doc-components.json')


def load_json(path):
    # utf-8-sig tolerates a leading BOM (e.g. files saved by PowerShell's
    # Set-Content -Encoding utf8) while still reading plain utf-8 correctly.
    with open(path, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def title_from_prefix(name, prefix):
    """{prefix:component-name} title format, e.g. fds-sb-odds-button -> {fds-sb:odds-button}."""
    if name.startswith(prefix + '-'):
        rest = name[len(prefix) + 1:]
    else:
        rest = name
    return '{%s:%s}' % (prefix, rest)


def build_control_props_rows(control_props):
    """One row per Control Prop, preserving insertion order (variant axes first,
    exposed BOOLEAN/TEXT properties appended after — caller is responsible for
    that ordering when building the `analysis` controlProps dict)."""
    rows = []
    for key, values in control_props.items():
        rows.append({
            'op': 'instanceAtom',
            'atom': 'control-props--row',
            'cells': [key, ', '.join(values)]
        })
    return rows


def build_control_props_section(name_suffix, control_props, page_template):
    cfg = page_template['controlPropsTable']
    children = [
        {
            'op': 'instanceAtom',
            'atom': cfg['titleAtom'],
            'text': {'label': cfg['titleFixedLabel'], 'suffix': name_suffix}
        },
        {'op': 'instanceAtom', 'atom': cfg['headerAtom'], 'static': True}
    ]
    children.extend(build_control_props_rows(control_props))
    return {
        'op': 'createFrame',
        'name': cfg['sectionName'],
        'visible': True,
        'layoutMode': 'VERTICAL',
        'itemSpacing': 24,
        'sizingHorizontal': 'HUG',
        'sizingVertical': 'HUG',
        'children': children
    }


def build_bullet_section(section_name, title, items):
    if not items:
        return None
    return {
        'op': 'createFrame',
        'name': section_name,
        'visible': True,
        'layoutMode': 'VERTICAL',
        'itemSpacing': 24,
        'sizingHorizontal': 'HUG',
        'sizingVertical': 'HUG',
        'children': [
            {'op': 'instanceAtom', 'atom': 'section-title', 'text': title},
            {
                'op': 'createFrame',
                'name': 'content--bullet-point',
                'layoutMode': 'VERTICAL',
                'itemSpacing': 8,
                'sizingHorizontal': 'HUG',
                'sizingVertical': 'HUG',
                'children': [
                    {'op': 'instanceAtom', 'atom': 'description--bullet-points', 'text': item}
                    for item in items
                ]
            }
        ]
    }


def build_generic_section(title, description):
    visible = bool(description and description.strip())
    return {
        'op': 'createFrame',
        'name': title,
        'visible': visible,
        'layoutMode': 'VERTICAL',
        'itemSpacing': 8,
        'sizingHorizontal': 'FILL',
        'sizingVertical': 'HUG',
        'children': [
            {'op': 'instanceAtom', 'atom': 'section-title', 'text': title},
            {'op': 'instanceAtom', 'atom': 'description', 'text': description or ''}
        ]
    }


def build_header(analysis, page_template):
    component = analysis['component']
    description = component.get('description') or ''
    desc_node = {'op': 'instanceAtom', 'atom': 'description', 'text': description}
    if not description.strip():
        desc_node['flag'] = '\u2691 TODO \u2014 component has no description in Figma'
    return {
        'op': 'createFrame',
        'name': page_template['header']['name'],
        'visible': True,        'layoutMode': page_template['header'].get('layoutMode', 'VERTICAL'),
        'itemSpacing': page_template['header'].get('itemSpacing', 24),
        'sizingHorizontal': 'FILL',
        'sizingVertical': 'HUG',        'children': [
            {'op': 'instanceAtom', 'atom': 'design-system-label'},
            {'op': 'instanceAtom', 'atom': 'component-title',
             'text': title_from_prefix(component['name'], component['prefix'])},
            desc_node
        ]
    }


def build_doc_column_1(analysis, page_template):
    component = analysis['component']
    description = component.get('description') or ''
    dependencies = analysis.get('dependencies', [])
    icons = analysis.get('icons', [])

    children = [
        build_generic_section('Purpose', description),
        build_generic_section('Behavior', description),
    ]
    dep_section = build_bullet_section('section--dependencies', 'Dependencies',
                                        [d['name'] for d in dependencies])
    if dep_section:
        children.append(dep_section)
    icon_section = build_bullet_section('section--icons', 'Icons', icons)
    if icon_section:
        children.append(icon_section)

    children.append(build_control_props_section(component['name'], analysis['controlProps'], page_template))
    for sub in analysis.get('subComponents', []):
        children.append(build_control_props_section(sub['name'], sub['controlProps'], page_template))

    return {
        'op': 'createFrame',
        'name': page_template['docColumn1']['name'],
        'visible': True,
        'layoutMode': 'VERTICAL',
        'itemSpacing': page_template['docColumn1'].get('itemSpacing', 96),
        'sizingHorizontal': 'FIXED',
        'fixedWidth': page_template['docColumn1']['sizing'].get('referenceWidth', 851),
        'sizingVertical': 'HUG',
        'children': children
    }


def build_doc_column_2(analysis, page_template):
    component = analysis['component']
    description = component.get('description') or ''
    sections = [
        build_generic_section('Composition', description),
        build_generic_section('Usage', description),
        build_generic_section('Animation', description),
    ]
    all_hidden = all(not s['visible'] for s in sections)
    return {
        'op': 'createFrame',
        'name': page_template['docColumn2']['name'],
        'visible': not all_hidden,
        'layoutMode': 'VERTICAL',
        'itemSpacing': page_template['docColumn2'].get('itemSpacing', 96),
        'sizingHorizontal': 'FIXED',
        'fixedWidth': page_template['docColumn2']['sizing'].get('referenceWidth', 851) if not all_hidden else 0.01,
        'sizingVertical': 'HUG',
        'children': sections
    }


def build_section_component(analysis, page_template):
    cfg = page_template['sectionComponent']
    classification = analysis.get('classification')
    label = 'Widget' if classification == 'widget' else 'Component'
    return {
        'op': 'createFrame',
        'name': cfg['name'],
        'visible': True,
        'layoutMode': 'VERTICAL',
        'itemSpacing': cfg.get('itemSpacing', 24),
        'sizingHorizontal': 'FILL',
        'sizingVertical': 'HUG',
        'children': [
            {
                'op': 'instanceAtom',
                'atom': cfg['titleAtom'],
                'text': {'label': label, 'suffix': analysis['component']['name']}
            },
            {'op': 'moveComponent', 'nodeId': analysis['component']['nodeId']}
        ]
    }


def compile_build_plan(analysis, page_template, doc_components):
    component = analysis['component']
    root = {
        'op': 'createFrame',
        'name': page_template['root']['namePattern'].replace('{component-name}', component['name']),
        'background': page_template['root']['background'],
        'cornerRadius': page_template['root']['cornerRadius'],
        'padding': page_template['root']['padding'],
        'layoutMode': page_template['root']['layoutMode'],
        'itemSpacing': page_template['root']['itemSpacing'],
        'pageName': component['pageName'],
        'children': [
            build_header(analysis, page_template),
            {
                'op': 'createFrame',
                'name': page_template['docColumns']['name'],
                'layoutMode': page_template['docColumns']['layoutMode'],
                'itemSpacing': page_template['docColumns']['itemSpacing'],
                'children': [
                    build_doc_column_1(analysis, page_template),
                    build_doc_column_2(analysis, page_template),
                    {
                        'op': 'deferToAnatomyRules',
                        'name': page_template['docColumn3']['name'],
                        'note': 'Not computed by build_plan.py \u2014 anatomy-rules.md stays authoritative/LLM-driven in v1.'
                    }
                ]
            },
            build_section_component(analysis, page_template)
        ]
    }
    return {
        'schemaVersion': page_template.get('version'),
        'component': component,
        'classification': analysis.get('classification'),
        'patterns': analysis.get('patterns', []),
        'constraints': page_template.get('constraints', {}),
        'atoms': doc_components.get('atoms', []),
        'root': root
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('analysis', help='Path to a Phase 1 analysis JSON file (see data/analysis.schema.json)')
    parser.add_argument('-o', '--output', help='Write build-plan.json here instead of stdout')
    args = parser.parse_args()

    analysis = load_json(args.analysis)
    page_template = load_json(PAGE_TEMPLATE_PATH)
    doc_components = load_json(DOC_COMPONENTS_PATH)

    plan = compile_build_plan(analysis, page_template, doc_components)
    output = json.dumps(plan, indent=2)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
    else:
        print(output)


if __name__ == '__main__':
    main()
