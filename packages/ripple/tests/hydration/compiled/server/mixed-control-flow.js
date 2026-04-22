// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track, trackAsync } from 'ripple/server';

export function MixedControlFlowStatic() {
	_$_.push_component();

	const rows = [
		{ id: 1, kind: 'a', enabled: true },
		{ id: 2, kind: 'b', enabled: true },
		{ id: 3, kind: 'a', enabled: false }
	];

	_$_.regular_block(() => {
		_$_.output_push('<section');
		_$_.output_push(' class="mixed-static"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const row of rows) {
				_$_.output_push('<!--[-->');

				if (row.enabled) {
					_$_.output_push('<!--[-->');

					switch (row.kind) {
						case 'a':
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<div');
									_$_.output_push(_$_.attr('class', `row row-${row.id} kind-a`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`A-${row.id}`));
									}

									_$_.output_push('</div>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<div');
									_$_.output_push(_$_.attr('class', `pending pending-${row.id}`));
									_$_.output_push('>');

									{
										_$_.output_push('pending a');
									}

									_$_.output_push('</div>');
									_$_.output_push('<!--]-->');
								}
							);
							break;

						default:
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<div');
									_$_.output_push(_$_.attr('class', `row row-${row.id} kind-b`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`B-${row.id}`));
									}

									_$_.output_push('</div>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<div');
									_$_.output_push(_$_.attr('class', `pending pending-${row.id}`));
									_$_.output_push('>');

									{
										_$_.output_push('pending b');
									}

									_$_.output_push('</div>');
									_$_.output_push('<!--]-->');
								}
							);
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</section>');
	});

	_$_.pop_component();
}

export function MixedControlFlowReactive() {
	_$_.push_component();

	let lazy = _$_.track(true, '5ae53d26');
	let lazy_1 = _$_.track('a', '5b53eda2');
	let lazy_2 = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], '7890dad6');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-show"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle Show');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-mode"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle Mode');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="add-item"');
		_$_.output_push('>');

		{
			_$_.output_push('Add Item');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy)) {
			_$_.output_push('<div');
			_$_.output_push(' class="mixed-reactive-list"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				for (const item of _$_.get(lazy_2)) {
					_$_.output_push('<!--[-->');

					switch (_$_.get(lazy_1)) {
						case 'a':
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<p');
									_$_.output_push(_$_.attr('class', `item item-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`A:${item.label}`));
									}

									_$_.output_push('</p>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<p');
									_$_.output_push(' class="pending"');
									_$_.output_push('>');

									{
										_$_.output_push('pending a');
									}

									_$_.output_push('</p>');
									_$_.output_push('<!--]-->');
								}
							);
							break;

						default:
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<p');
									_$_.output_push(_$_.attr('class', `item item-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`B:${item.label}`));
									}

									_$_.output_push('</p>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<p');
									_$_.output_push(' class="pending"');
									_$_.output_push('>');

									{
										_$_.output_push('pending b');
									}

									_$_.output_push('</p>');
									_$_.output_push('<!--]-->');
								}
							);
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MixedControlFlowAsyncPending() {
	_$_.push_component();

	const rows = [1, 2];
	const state = 'slow';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="before"');
		_$_.output_push('>');

		{
			_$_.output_push('before');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		for (const row of rows) {
			_$_.output_push('<!--[-->');

			if (row === 1) {
				_$_.output_push('<!--[-->');

				switch (state) {
					case 'slow':
						_$_.try_block(
							() => {
								_$_.output_push('<!--[-->');

								{
									const comp = AsyncRow;
									const args = [{ label: `row-${row}` }];

									comp(...args);
								}

								_$_.output_push('<!--]-->');
							},
							null,
							() => {
								_$_.output_push('<!--[-->');
								_$_.output_push('<div');
								_$_.output_push(_$_.attr('class', `pending-row pending-row-${row}`));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(`pending ${row}`));
								}

								_$_.output_push('</div>');
								_$_.output_push('<!--]-->');
							}
						);
						break;

					default:
						_$_.output_push('<div');
						_$_.output_push(' class="unexpected"');
						_$_.output_push('>');
						{
							_$_.output_push('unexpected');
						}
						_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

function AsyncRow({ label }) {
	_$_.push_component();

	let lazy_3 = _$_.track_async(() => Promise.resolve(label), '10cc79a0');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="resolved-row"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_3)));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}