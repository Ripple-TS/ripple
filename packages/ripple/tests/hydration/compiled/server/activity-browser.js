// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Activity, effect } from 'ripple/server';

function Panel({ index }) {
	return _$_.tsrx_element(() => {
		if (typeof window !== 'undefined') {
			window.recordActivity('initialize', index);

			const until = performance.now() + 8;

			while (performance.now() < until) {}

			setTimeout(
				() => {
					window.recordActivity('timer', index);
					document.querySelector('button')?.click();
				},
				0
			);
		}

		_$_.effect(() => {
			if (typeof window !== 'undefined') window.recordActivity('effect', index);
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><input' + _$_.attr('value', 'panel ' + index, false) + ' /></section>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>Input remains available</button><!--[-->';

			for (const index of Array.from({ length: 12 }, (_, index) => index)) {
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
										const comp = Panel;
										const args = [{ index }];

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
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}