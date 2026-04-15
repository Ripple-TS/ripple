// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Layout(__output, { children }) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="layout"');
	__output.push('>');

	{
		__output.push('<nav');
		__output.push(' class="nav"');
		__output.push('>');

		{
			__output.push('Navigation');
		}

		__output.push('</nav>');
		__output.push('<main');
		__output.push(' class="main"');
		__output.push('>');

		{
			_$_.render_expression(__output, children);
		}

		__output.push('</main>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function Content(__output) {
	_$_.push_component();

	let lazy = _$_.track(true);

	__output.push('<div');
	__output.push(' class="content"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		if (_$_.get(lazy)) {
			__output.push('<p');
			__output.push(' class="text"');
			__output.push('>');

			{
				__output.push('Hello world');
			}

			__output.push('</p>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function LayoutWithContent(__output) {
	_$_.push_component();

	{
		const comp = Layout;

		const args = [
			__output,
			{
				children: _$_.ripple_element(function render_children(__output) {
					_$_.push_component();

					{
						const comp = Content;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				})
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}