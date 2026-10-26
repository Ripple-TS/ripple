// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

function Leaf() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="child">Child</button>';
			_$_.output_push(__out);
		});
	});
}

function Child() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const key of ['a']) {
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(Leaf());
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ComponentCallCleanup({ native, initialShown }) {
	return _$_.tsrx_element(() => {
		const shown = _$_.track(initialShown, '18fvrp1');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><button id="toggle">Toggle</button><!--[-->';

			if (shown.value) {
				_$_.output_push(__out);
				__out = '';

				_$_.try_block(
					() => {
						let __out = '';

						__out += '<!--[--><!--[-->';

						if (native) {
							{
								const comp = Child;
								const args = [{}];

								_$_.output_push(__out);
								__out = '';
								_$_.render_component(comp, ...args);
							}
						} else {
							_$_.output_push(__out);
							__out = '';
							_$_.render_expression(Child());
						}

						__out += '<!--]--><!--]-->';
						_$_.output_push(__out);
					},
					(error) => {
						let __out = '';

						__out += '<!--[--><button>Error</button><!--]-->';
						_$_.output_push(__out);
					},
					null
				);
			}

			__out += '<!--]--></section>';
			_$_.output_push(__out);
		});
	});
}