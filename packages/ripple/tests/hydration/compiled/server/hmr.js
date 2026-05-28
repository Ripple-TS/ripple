// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Layout({ children }) {
	_$_.push_component();

	var __r = false;

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

	__r = true;
	_$_.pop_component();
}

export function Content() {
	_$_.push_component();

	var __r_1 = false;
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

	__r_1 = true;
	_$_.pop_component();
}

export function LayoutWithContent() {
	_$_.push_component();

	var __r_2 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_3 = false;

						{
							const comp = Content;
							const args = [{}];

							comp(...args);
						}

						__r_3 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_2 = true;
	_$_.pop_component();
}