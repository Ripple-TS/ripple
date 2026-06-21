// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Layout({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout"><nav class="nav">Navigation</nav><main class="main">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</main></div>';
			_$_.output_push(__out);
		});
	});
}

export function Content() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '0bdb1500');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="content"><!--[-->';

			if (lazy.value) {
				__out += '<p class="text">Hello world</p>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function LayoutWithContent() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Content;
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