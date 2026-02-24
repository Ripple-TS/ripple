// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export async function Layout(__output, { children }) {
	return _$_.async(async () => {
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
				{
					const comp = children;
					const args = [__output, {}];

					if (comp?.async) {
						await comp(...args);
					} else if (comp) {
						comp(...args);
					}
				}
			}

			__output.push('</main>');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

Layout.async = true;

export function Content(__output) {
	_$_.push_component();

	let visible = track(true);

	__output.push('<div');
	__output.push(' class="content"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		if (_$_.get(visible)) {
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
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = Content;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}