import { createElement } from 'preact';
import { Row } from './rows.jsx';
import { selectRow } from './ops.js';

export function buildValueRows(items) {
	return items.map((item) =>
		createElement(Row, {
			key: item.id,
			id: item.id,
			label: item.label,
			value: item.value,
			wall: 'B',
			onSelect: selectRow,
		}),
	);
}
