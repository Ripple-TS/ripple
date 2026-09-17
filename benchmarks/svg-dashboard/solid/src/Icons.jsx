import { Dynamic } from '@solidjs/web';
import { ICONS } from './data.js';

// Lucide-shaped runtime icon: Solid's dynamic-tag path (<Dynamic> over the
// shared [tag, attrs] tuples), the mechanism lucide-solid uses. Every icon
// variant has exactly two shapes, so the positions are unrolled — a same-tag
// variant change patches attributes while a tag change swaps the element,
// matching the sibling fixtures' semantics.
export function Icon(props) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={'lucide i-' + props.name}
		>
			<Dynamic component={ICONS[props.name][0][0]} {...ICONS[props.name][0][1]} />
			<Dynamic component={ICONS[props.name][1][0]} {...ICONS[props.name][1][1]} />
		</svg>
	);
}
