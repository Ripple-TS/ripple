// Wall B's row factory — a PLAIN .ts module the octane compiler never touches.
// Identical to octane-tsrx's wall-b.ts except it imports the .tsx Row. It hands
// back raw `createElement(Row, props)` descriptors that reach the DOM through
// the wall's `{rows}` children hole — childSlot's keyed de-opt list → the
// childSlot arm of tryMemoBail (the shape every @octanejs binding produces).
import { createElement } from 'octane';

import { Row } from './rows.tsx';
import { selectRow } from './ops.js';

export function buildValueRows(items: any[]): any[] {
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
