// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

var _$_hoisted_async;

import { track, trackAsync } from 'ripple/server';

export function MixedControlFlowStatic(__output) {
	_$_.push_component();

	const rows = [
		{ id: 1, kind: 'a', enabled: true },
		{ id: 2, kind: 'b', enabled: true },
		{ id: 3, kind: 'a', enabled: false }
	];

	__output.push('<section');
	__output.push(' class="mixed-static"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const row of rows) {
			__output.push('<!--[-->');

			if (row.enabled) {
				__output.push('<!--[-->');

				switch (row.kind) {
					case 'a':
						__output.push('<div');
						__output.push(_$_.attr('class', `row row-${row.id} kind-a`));
						__output.push('>');
						{
							__output.push(_$_.escape(`A-${row.id}`));
						}
						__output.push('</div>');
						break;

					default:
						__output.push('<div');
						__output.push(_$_.attr('class', `row row-${row.id} kind-b`));
						__output.push('>');
						{
							__output.push(_$_.escape(`B-${row.id}`));
						}
						__output.push('</div>');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</section>');
	_$_.pop_component();
}

export function MixedControlFlowReactive(__output) {
	_$_.push_component();

	let lazy = _$_.track(true);
	let lazy_1 = _$_.track('a');
	let lazy_2 = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }]);

	__output.push('<button');
	__output.push(' class="toggle-show"');
	__output.push('>');

	{
		__output.push('Toggle Show');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="toggle-mode"');
	__output.push('>');

	{
		__output.push('Toggle Mode');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="add-item"');
	__output.push('>');

	{
		__output.push('Add Item');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(lazy)) {
		__output.push('<div');
		__output.push(' class="mixed-reactive-list"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of _$_.get(lazy_2)) {
				__output.push('<!--[-->');

				switch (_$_.get(lazy_1)) {
					case 'a':
						__output.push('<p');
						__output.push(_$_.attr('class', `item item-${item.id}`));
						__output.push('>');
						{
							__output.push(_$_.escape(`A:${item.label}`));
						}
						__output.push('</p>');
						break;

					default:
						__output.push('<p');
						__output.push(_$_.attr('class', `item item-${item.id}`));
						__output.push('>');
						{
							__output.push(_$_.escape(`B:${item.label}`));
						}
						__output.push('</p>');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MixedControlFlowAsyncPending(__output) {
	_$_.push_component();

	const rows = [1, 2];
	const state = 'slow';

	__output.push('<div');
	__output.push(' class="before"');
	__output.push('>');

	{
		__output.push('before');
	}

	__output.push('</div>');
	__output.push('<!--[-->');

	for (const row of rows) {
		__output.push('<!--[-->');

		if (row === 1) {
			__output.push('<!--[-->');

			switch (state) {
				case 'slow':
					{
						const comp = AsyncRow;
						const args = [__output, { label: `row-${row}` }];

						comp(...args);
					}
					break;

				default:
					__output.push('<div');
					__output.push(' class="unexpected"');
					__output.push('>');
					{
						__output.push('unexpected');
					}
					__output.push('</div>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

function AsyncRow(__output, { label }) {
	_$_.push_component();

	let value = (_$_hoisted_async = _$_hoisted_async ?? _$_.track_async(() => Promise.resolve(label), void 0, false));

	__output.push('<div');
	__output.push(' class="resolved-row"');
	__output.push('>');

	{
		__output.push(_$_.escape(value));
	}

	__output.push('</div>');
	_$_.pop_component();
}