// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Hydrate, bindValue, getTrackedStatus, track, trackAsync } from 'ripple/server';
import { condition, never } from 'ripple/hydration';

export const calls = [];
export let complete = false;
export let release;
export let selection;
export let source;

export function reset(done = false) {
	calls.length = 0;
	complete = done;
	release = undefined;
}

function makeSource() {
	return _$_.track_async(
		(previous) => {
			const query = selection.value;

			calls.push(previous?.cursor);

			return (async function* () {
				if (previous === undefined || query !== 0) yield { cursor: query || 100 }; else if (!complete) {
					await new Promise((resolve) => {
						release = resolve;
					});

					yield { cursor: 300 };
				}
			})();
		},
		'rs391u'
	);
}

function StatusSummary({ value }) {
	return _$_.tsrx_element(() => {
		const status = _$_.track_async(() => Promise.resolve(_$_.get_tracked_status(value).complete ? 'done' : 'open'), 'eadcju');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<em>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(status.value);
			}

			__out += '</em>';
			_$_.output_push(__out);
		});
	});
}

function View({ value }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (_$_.get_tracked_status(value).complete) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);
				__out += '<b>done</b>';
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(1);
				__out += '<i>open</i>';
			}

			__out += '<!--]--><input defaultValue="server" /><p>' + _$_.escape(value.value.cursor) + '</p>';

			{
				const comp = StatusSummary;
				const args = [{ value }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

function Owned() {
	return _$_.tsrx_element(() => {
		source = makeSource();

		_$_.regular_block(() => {
			{
				const comp = View;
				const args = [{ value: source }];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Deferred() {
	return _$_.tsrx_element(() => {
		selection = _$_.track(0, '188fmqx');

		const enabled = _$_.track(false, '1u0dgw');
		const show = _$_.track(true, '1kgpbmv');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="activate">activate</button><button class="remove">remove</button><button class="query">query</button>';

			if (show.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = Hydrate;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							when: condition(() => enabled.value),
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Owned;
										const args = [{}];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(-1);
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function Shared() {
	return _$_.tsrx_element(() => {
		selection = _$_.track(0, '1u0kar');
		source = makeSource();

		const enabled = _$_.track(false, 'dy5u4e');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="active">' + _$_.escape(source.value.cursor) + '</p><button class="activate">activate</button>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = View;
									const args = [{ value: source }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			_$_.output_push(__out);
		});
	});
}

export function Never() {
	return _$_.tsrx_element(() => {
		selection = _$_.track(0, 'ud61f0');

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: never(),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Owned;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Immediate() {
	return _$_.tsrx_element(() => {
		selection = _$_.track(0, '1wzerhc');

		_$_.regular_block(() => {
			{
				const comp = Owned;
				const args = [{}];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function BoundShared() {
	return _$_.tsrx_element(() => {
		selection = _$_.track(0, 'pna4yj');
		source = makeSource();

		const enabled = _$_.track(false, '1bdt1sk');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="active">' + _$_.escape(source.value.cursor) + '</p><button class="activate">activate</button>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<input value="100" /><p class="bound">' + _$_.escape(source.value.cursor) + '</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			_$_.output_push(__out);
		});
	});
}