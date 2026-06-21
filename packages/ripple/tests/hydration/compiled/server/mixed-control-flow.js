// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track, trackAsync } from 'ripple/server';

export function MixedControlFlowStatic() {
	return _$_.tsrx_element(() => {
		const rows = [
			{ id: 1, kind: 'a', enabled: true },
			{ id: 2, kind: 'b', enabled: true },
			{ id: 3, kind: 'a', enabled: false }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="mixed-static"><!--[-->';

			for (const row of rows) {
				__out += '<!--[-->';

				if (row.enabled) {
					__out += '<!--[-->';

					switch (row.kind) {
						case 'a':
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><div' + _$_.attr('class', `row row-${row.id} kind-a`) + '>' + _$_.escape(`A-${row.id}`) + '</div><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><div' + _$_.attr('class', `pending pending-${row.id}`) + '>pending a</div><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;

						default:
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><div' + _$_.attr('class', `row row-${row.id} kind-b`) + '>' + _$_.escape(`B-${row.id}`) + '</div><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><div' + _$_.attr('class', `pending pending-${row.id}`) + '>pending b</div><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></section>';
			_$_.output_push(__out);
		});
	});
}

export function MixedControlFlowReactive() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '5ae53d26');
		let lazy_1 = _$_.track('a', '5b53eda2');
		let lazy_2 = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], '7890dad6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle-show">Toggle Show</button><button class="toggle-mode">Toggle Mode</button><button class="add-item">Add Item</button><!--[-->';

			if (lazy.value) {
				__out += '<div class="mixed-reactive-list"><!--[-->';

				for (const item of lazy_2.value) {
					__out += '<!--[-->';

					switch (lazy_1.value) {
						case 'a':
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><p' + _$_.attr('class', `item item-${item.id}`) + '>' + _$_.escape(`A:${item.label}`) + '</p><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><p class="pending">pending a</p><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;

						default:
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><p' + _$_.attr('class', `item item-${item.id}`) + '>' + _$_.escape(`B:${item.label}`) + '</p><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><p class="pending">pending b</p><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]--></div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function MixedControlFlowAsyncPending() {
	return _$_.tsrx_element(() => {
		const rows = [1, 2];
		const state = 'slow';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="before">before</div><!--[-->';

			for (const row of rows) {
				__out += '<!--[-->';

				if (row === 1) {
					__out += '<!--[-->';

					switch (state) {
						case 'slow':
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[-->';

									{
										const comp = AsyncRow;
										const args = [{ label: `row-${row}` }];

										_$_.output_push(__out);
										__out = '';
										_$_.render_component(comp, ...args);
									}

									__out += '<!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><div' + _$_.attr('class', `pending-row pending-row-${row}`) + '>' + _$_.escape(`pending ${row}`) + '</div><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;

						default:
							__out += '<div class="unexpected">unexpected</div>';
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

function AsyncRow({ label }) {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track_async(() => Promise.resolve(label), '10cc79a0');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="resolved-row">' + _$_.escape(lazy_3.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}