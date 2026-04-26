#!/usr/bin/env python3
"""
token-lookup.py — Search ts-core-fabric.json WITHOUT loading into agent context.

Usage (run via terminal, not imported):
  python3 token-lookup.py <query> [--brand Betsson] [--type border] [--decompose]

Examples:
  python3 token-lookup.py "fds-stroke-const-int-rest"
  python3 token-lookup.py "stroke-const" --type border --decompose
  python3 token-lookup.py "btn-accent" --type color
  python3 token-lookup.py "fds-spacing-const" --type spacing
  python3 token-lookup.py "*" --type border --decompose   # all border tokens

The --decompose flag is only meaningful for type:border tokens. It outputs
the atomic width + color references that can be fed directly into
bulk-update.figma.js RULES as a { type: "border" } write.

Output is compact JSON — one object per matching token — designed to be
read by the agent or piped into jq.
"""

import json
import sys
import os
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
FABRIC_PATH = os.path.join(DATA_DIR, 'ts-core-fabric.json')


def flatten_tokens(obj, path='', results=None):
    """Walk the nested JSON and collect leaf tokens (nodes with 'type' + 'value')."""
    if results is None:
        results = []
    if isinstance(obj, dict):
        if 'type' in obj and 'value' in obj:
            results.append({
                'path': path,
                'type': obj['type'],
                'value': obj['value'],
                'description': obj.get('description', ''),
            })
        else:
            for k, v in obj.items():
                flatten_tokens(v, f'{path}.{k}' if path else k, results)
    return results


def decompose_border(token):
    """Extract atomic width + color refs from a border token value."""
    val = token['value']
    if isinstance(val, list):
        val = val[0] if val else {}
    width_ref = val.get('width', '')
    color_ref = val.get('color', '')
    style = val.get('style', 'solid')

    # Strip { } wrappers from references
    if width_ref.startswith('{') and width_ref.endswith('}'):
        width_ref = width_ref[1:-1]
    if color_ref.startswith('{') and color_ref.endswith('}'):
        color_ref = color_ref[1:-1]

    # Convert dot-path to NV slash-name for Figma variable lookup
    width_nv = width_ref.replace('.', '/')
    color_nv = color_ref.replace('.', '/') if color_ref != 'transparent' else 'transparent'

    return {
        'tsPath': token['path'],
        'type': 'border',
        'style': style,
        'width': {
            'tsRef': width_ref,
            'nvName': width_nv,
        },
        'color': {
            'tsRef': color_ref,
            'nvName': color_nv,
        },
        'description': token.get('description', ''),
    }


def main():
    parser = argparse.ArgumentParser(description='Search ts-core-fabric.json tokens')
    parser.add_argument('query', help='Token name substring to search for (* = all)')
    parser.add_argument('--brand', default='Betsson', help='Brand/theme key (default: Betsson)')
    parser.add_argument('--type', dest='token_type', help='Filter by token type (e.g. border, color, spacing)')
    parser.add_argument('--decompose', action='store_true', help='Decompose border tokens into atomic width+color')
    parser.add_argument('--compact', action='store_true', help='Single-line JSON per result')
    args = parser.parse_args()

    if not os.path.exists(FABRIC_PATH):
        print(json.dumps({'error': f'File not found: {FABRIC_PATH}'}))
        sys.exit(1)

    with open(FABRIC_PATH) as f:
        data = json.load(f)

    brand_data = data.get(args.brand)
    if not brand_data:
        print(json.dumps({'error': f'Brand "{args.brand}" not found', 'available': list(data.keys())}))
        sys.exit(1)

    tokens = flatten_tokens(brand_data)

    # Filter by query
    if args.query != '*':
        query_lower = args.query.lower()
        tokens = [t for t in tokens if query_lower in t['path'].lower()]

    # Filter by type
    if args.token_type:
        tokens = [t for t in tokens if t['type'] == args.token_type]

    # Decompose border tokens if requested
    if args.decompose:
        results = [decompose_border(t) for t in tokens if t['type'] == 'border']
    else:
        results = [{
            'path': t['path'],
            'type': t['type'],
            'value': t['value'] if not isinstance(t['value'], (dict, list)) else t['value'],
            'description': t['description'][:80] if t['description'] else '',
        } for t in tokens]

    if args.compact:
        for r in results:
            print(json.dumps(r, ensure_ascii=False))
    else:
        print(json.dumps(results, indent=2, ensure_ascii=False))

    # Print summary to stderr so it doesn't interfere with JSON output
    print(f'\n# {len(results)} results for query="{args.query}"'
          f'{f" type={args.token_type}" if args.token_type else ""}'
          f'{" (decomposed)" if args.decompose else ""}',
          file=sys.stderr)


if __name__ == '__main__':
    main()
