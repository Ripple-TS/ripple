import { createElement } from 'react';
import { ICONS, ICON_SVG_ATTRS, ICON_SVG_CLASS } from './data.js';

// Lucide-shaped runtime icon factory — the literal mechanism lucide-react
// ships (createElement over [tag, attrs] tuples). For React this is its one
// and only rendering path; the shared attrs carry final DOM attribute names
// (hyphenated), which React passes through verbatim in production.
export function icon(name) {
	const shapes = ICONS[name];
	return createElement(
		'svg',
		{ ...ICON_SVG_ATTRS, className: ICON_SVG_CLASS + ' i-' + name },
		shapes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
	);
}
