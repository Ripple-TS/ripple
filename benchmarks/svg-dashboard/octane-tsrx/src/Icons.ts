import { createElement } from 'octane';
import type { OctaneNode } from 'octane';
import { ICONS, ICON_SVG_ATTRS, ICON_SVG_CLASS } from './data.js';

// Lucide-shaped runtime icon factory: builds descriptor trees via
// createElement from [tag, attrs] tuples, so Octane takes the de-opt
// reconciler path (createElementNS per element) — the same shape a real icon
// package ships (see packages/lucide/src/Icon.ts). The sibling fixtures build
// the equivalent dynamic tree on their frameworks' dynamic-tag paths.
export function icon(name: string): OctaneNode {
	const shapes = (ICONS as Record<string, [string, Record<string, string>][]>)[name];
	return createElement(
		'svg',
		{ ...ICON_SVG_ATTRS, class: ICON_SVG_CLASS + ' i-' + name },
		shapes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
	);
}
