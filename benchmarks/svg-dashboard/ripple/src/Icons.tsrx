import { type Derived } from 'ripple';
import { ICONS, ICON_SVG_CLASS } from './data.js';

type Shape = [tag: 'circle' | 'path' | 'line', attrs: Record<string, string>];
// The shared JavaScript literals are tuples, but JavaScript inference widens
// them to arrays. The harness verifies this same data in every fixture.
const iconShapes = ICONS as unknown as Record<string, Shape[]>;

// The outer <svg> carries the shared ICON_SVG_ATTRS values as static markup,
// as the Svelte and Solid fixtures do; the harness checks the rendered
// attributes. Every icon variant has exactly two shapes, so the positions are
// unrolled (as in Solid): each is a native dynamic tag over the shared
// [tag, attrs] tuple, so a same-tag variant change patches attributes while a
// tag change swaps the element.
export function Icon({ name }: { name: Derived<string> }) @{
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={ICON_SVG_CLASS + ' i-' + name.value}
	>
		<{iconShapes[name.value][0][0]} {...iconShapes[name.value][0][1]} />
		<{iconShapes[name.value][1][0]} {...iconShapes[name.value][1][1]} />
	</svg>
}
