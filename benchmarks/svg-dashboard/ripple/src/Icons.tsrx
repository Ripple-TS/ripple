import { track, type Derived } from 'ripple';
import { ICONS, ICON_SVG_ATTRS, ICON_SVG_CLASS } from './data.js';

type Shape = [tag: 'circle' | 'path' | 'line', attrs: Record<string, string>];
// The shared JavaScript literals are tuples, but JavaScript inference widens
// them to arrays. The harness verifies this same data in every fixture.
const iconShapes = ICONS as unknown as Record<string, Shape[]>;

// Use Ripple's dynamic tags for the same runtime [tag, attrs] icon tuples.
export function Icon({ name }: { name: Derived<string> }) @{
	const shapes = track(() => iconShapes[name.value]);
	<svg {...ICON_SVG_ATTRS} class={ICON_SVG_CLASS + ' i-' + name.value}>
		@for (const i of shapes.value.keys(); key i) {
			<{shapes.value[i][0]} {...shapes.value[i][1]} />
		}
	</svg>
}
