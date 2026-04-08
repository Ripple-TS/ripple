// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Portal, track } from 'ripple/server';

export function SimplePortal(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="container"');
	__output.push('>');

	{
		__output.push('<h1');
		__output.push('>');

		{
			__output.push('Main Content');
		}

		__output.push('</h1>');

		{
			const comp = Portal;

			const args = [
				__output,
				{
					target: typeof document !== 'undefined' ? document.body : null,
					children: function children(__output) {
						_$_.push_component();
						__output.push('<div');
						__output.push(' class="portal-content"');
						__output.push('>');

						{
							__output.push('Portal content');
						}

						__output.push('</div>');
						_$_.pop_component();
					}
				}
			];

			if (comp) {
				comp(...args);
			}
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ConditionalPortal(__output) {
	_$_.push_component();

	let show = _$_.track(true);

	__output.push('<div');
	__output.push(' class="container"');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="toggle"');
		__output.push('>');

		{
			__output.push('Toggle');
		}

		__output.push('</button>');
		__output.push('<!--[-->');

		if (_$_.get(show)) {
			{
				const comp = Portal;

				const args = [
					__output,
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: function children(__output) {
							_$_.push_component();
							__output.push('<div');
							__output.push(' class="portal-content"');
							__output.push('>');

							{
								__output.push('Portal is visible');
							}

							__output.push('</div>');
							_$_.pop_component();
						}
					}
				];

				if (comp) {
					comp(...args);
				}
			}
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function PortalWithMainContent(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="main-content"');
		__output.push('>');

		{
			__output.push('Main page content');
		}

		__output.push('</div>');

		{
			const comp = Portal;

			const args = [
				__output,
				{
					target: typeof document !== 'undefined' ? document.body : null,
					children: function children(__output) {
						_$_.push_component();
						__output.push('<div');
						__output.push(' class="portal-content"');
						__output.push('>');

						{
							__output.push('Modal content');
						}

						__output.push('</div>');
						_$_.pop_component();
					}
				}
			];

			if (comp) {
				comp(...args);
			}
		}

		__output.push('<div');
		__output.push(' class="footer"');
		__output.push('>');

		{
			__output.push('Footer');
		}

		__output.push('</div>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function NestedContentWithPortal(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="outer"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="inner"');
		__output.push('>');

		{
			__output.push('<span');
			__output.push('>');

			{
				__output.push('Nested content');
			}

			__output.push('</span>');
		}

		__output.push('</div>');

		{
			const comp = Portal;

			const args = [
				__output,
				{
					target: typeof document !== 'undefined' ? document.body : null,
					children: function children(__output) {
						_$_.push_component();
						__output.push('<div');
						__output.push(' class="portal-content"');
						__output.push('>');

						{
							__output.push('Portal content');
						}

						__output.push('</div>');
						_$_.pop_component();
					}
				}
			];

			if (comp) {
				comp(...args);
			}
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}