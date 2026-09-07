// Wall B's row factory — the React twin of the octane apps' plain-.ts helper,
// building raw `React.createElement(Row, props)` descriptors passed through a
// children expression. For React the A/B distinction collapses (JSX IS
// createElement — wall A's `.map` produces the same element objects), but both
// walls are kept so the op list and DOM stay identical across all targets.
import { createElement } from 'react';

import { Row } from './rows.jsx';
import { selectRow } from './ops.js';

export function buildValueRows(items) {
	const out = new Array(items.length);
	for (let i = 0; i < items.length; i++) {
		const it = items[i];
		out[i] = createElement(Row, {
			key: it.id,
			id: it.id,
			label: it.label,
			value: it.value,
			wall: 'B',
			onSelect: selectRow,
		});
	}
	return out;
}
