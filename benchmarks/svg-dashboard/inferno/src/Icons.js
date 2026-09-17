import { createElement } from 'inferno-create-element';
import { ICONS, ICON_SVG_ATTRS, ICON_SVG_CLASS } from './data.js';

// Lucide-shaped runtime icon factory: createElement over [tag, attrs] tuples.
// The shared attrs carry final, hyphenated DOM attribute names.
export function icon(name) {
	const shapes = ICONS[name];
	return createElement(
		'svg',
		{ ...ICON_SVG_ATTRS, className: ICON_SVG_CLASS + ' i-' + name },
		shapes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
	);
}
