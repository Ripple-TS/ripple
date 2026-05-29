// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Layout({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				_$_.output_push('<nav');
				_$_.output_push(' class="nav"');
				_$_.output_push('>');

				{
					_$_.output_push('Navigation');
				}

				_$_.output_push('</nav>');
				_$_.output_push('<main');
				_$_.output_push(' class="main"');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</main>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function Content() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '0bdb1500');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="content"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				if (lazy.value) {
					_$_.output_push('<p');
					_$_.output_push(' class="text"');
					_$_.output_push('>');

					{
						_$_.output_push('Hello world');
					}

					_$_.output_push('</p>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</div>');
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