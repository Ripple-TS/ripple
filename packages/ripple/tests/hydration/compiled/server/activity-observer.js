// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Activity, createRenderObserver, effect, track, trackAsync } from 'ripple/server';

export const calls = [];
export let controls;

let load = (version) => Promise.resolve('server:' + version);

export function setLoad(fn) {
	load = fn;
}

function Panel({ version }) {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => load(version.value), 'i6d8b9');

		calls.push('initialize');

		_$_.effect(() => {
			calls.push(`effect:${data.value}`);
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="panel">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(data.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

function Sibling({ count }) {
	return _$_.tsrx_element(() => {
		controls.sibling = createRenderObserver();

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="visible">' + _$_.escape(count.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

function Background() {
	return _$_.tsrx_element(() => {
		calls.push('background');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<aside>background</aside>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', 'mxbfeh');
		const version = _$_.track(0, '1x6c9r5');
		const count = _$_.track(0, '1pfmv0g');
		const exists = _$_.track(true, 'k7fzil');

		controls = {
			mode,
			version,
			count,
			exists,
			observer: createRenderObserver()
		};

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Sibling;
				const args = [{ count }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			if (exists.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = Activity;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							mode,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.try_block(
										() => {
											let __out = '';

											__out += '<!--[-->';

											{
												const comp = Panel;
												const args = [{ version }];

												_$_.output_push(__out);
												__out = '';
												_$_.render_component(comp, ...args);
											}

											__out += '<!--]-->';
											_$_.output_push(__out);
										},
										(error) => {
											let __out = '';

											__out += '<!--[--><strong class="caught">';

											{
												_$_.output_push(__out);
												__out = '';
												_$_.render_expression(error.message);
											}

											__out += '</strong><!--]-->';
											_$_.output_push(__out);
										},
										() => {
											let __out = '';

											__out += '<!--[--><em class="pending">loading</em><!--]-->';
											_$_.output_push(__out);
										}
									);
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

			{
				const comp = Activity;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						mode: "hidden",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Background;
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

			_$_.output_push(__out);
		});
	});
}