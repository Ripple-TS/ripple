// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export async function MixedControlFlowStatic(__output) {
	return _$_.async(async () => {
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
							__output.push('<!--[-->');
							var __pending_pos = __output.body.length;
							__output.push('<div');
							__output.push(_$_.attr('class', `pending pending-${row.id}`));
							__output.push('>');
							{
								__output.push('pending a');
							}
							__output.push('</div>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos);
								__output.push('<div');
								__output.push(_$_.attr('class', `row row-${row.id} kind-a`));
								__output.push('>');

								{
									__output.push(_$_.escape(`A-${row.id}`));
								}

								__output.push('</div>');
							});
							__output.push('<!--]-->');
							break;

						default:
							__output.push('<!--[-->');
							var __pending_pos_1 = __output.body.length;
							__output.push('<div');
							__output.push(_$_.attr('class', `pending pending-${row.id}`));
							__output.push('>');
							{
								__output.push('pending b');
							}
							__output.push('</div>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_1);
								__output.push('<div');
								__output.push(_$_.attr('class', `row row-${row.id} kind-b`));
								__output.push('>');

								{
									__output.push(_$_.escape(`B-${row.id}`));
								}

								__output.push('</div>');
							});
							__output.push('<!--]-->');
					}

					__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</section>');
		_$_.pop_component();
	});
}

MixedControlFlowStatic.async = true;

export async function MixedControlFlowReactive(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		let show = track(true);
		let mode = track('a');
		let items = track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }]);

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

		if (_$_.get(show)) {
			__output.push('<div');
			__output.push(' class="mixed-reactive-list"');
			__output.push('>');

			{
				__output.push('<!--[-->');

				for (const item of _$_.get(items)) {
					__output.push('<!--[-->');

					switch (_$_.get(mode)) {
						case 'a':
							__output.push('<!--[-->');
							var __pending_pos_2 = __output.body.length;
							__output.push('<p');
							__output.push(' class="pending"');
							__output.push('>');
							{
								__output.push('pending a');
							}
							__output.push('</p>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_2);
								__output.push('<p');
								__output.push(_$_.attr('class', `item item-${item.id}`));
								__output.push('>');

								{
									__output.push(_$_.escape(`A:${item.label}`));
								}

								__output.push('</p>');
							});
							__output.push('<!--]-->');
							break;

						default:
							__output.push('<!--[-->');
							var __pending_pos_3 = __output.body.length;
							__output.push('<p');
							__output.push(' class="pending"');
							__output.push('>');
							{
								__output.push('pending b');
							}
							__output.push('</p>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_3);
								__output.push('<p');
								__output.push(_$_.attr('class', `item item-${item.id}`));
								__output.push('>');

								{
									__output.push(_$_.escape(`B:${item.label}`));
								}

								__output.push('</p>');
							});
							__output.push('<!--]-->');
					}

					__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
		_$_.pop_component();
	});
}

MixedControlFlowReactive.async = true;

export async function MixedControlFlowAsyncPending(__output) {
	return _$_.async(async () => {
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
						__output.push('<!--[-->');
						var __pending_pos_4 = __output.body.length;
						__output.push('<div');
						__output.push(_$_.attr('class', `pending-row pending-row-${row}`));
						__output.push('>');
						{
							__output.push(_$_.escape(`pending ${row}`));
						}
						__output.push('</div>');
						await _$_.async(async () => {
							__output.body = __output.body.slice(0, __pending_pos_4);

							{
								const comp = AsyncRow;
								const args = [__output, { label: `row-${row}` }];

								await comp(...args);
							}
						});
						__output.push('<!--]-->');
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
	});
}

MixedControlFlowAsyncPending.async = true;

async function AsyncRow(__output, { label }) {
	return _$_.async(async () => {
		_$_.push_component();

		let value = await Promise.resolve(label);

		if (_$_.aborted()) return;

		__output.push('<div');
		__output.push(' class="resolved-row"');
		__output.push('>');

		{
			__output.push(_$_.escape(value));
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

AsyncRow.async = true;