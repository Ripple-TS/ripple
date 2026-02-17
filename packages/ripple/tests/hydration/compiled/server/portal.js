import * as _$_ from 'ripple/internal/server';

import { Portal } from 'ripple/server';

export async function SimplePortal(__output) {
	return _$_.async(async () => {
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

				if (comp?.async) {
					await comp(...args);
				} else if (comp) {
					comp(...args);
				}
			}
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

export async function ConditionalPortal(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		let show = _$_.get(true);

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

					if (comp?.async) {
						await comp(...args);
					} else if (comp) {
						comp(...args);
					}
				}
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

export async function PortalWithMainContent(__output) {
	return _$_.async(async () => {
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

				if (comp?.async) {
					await comp(...args);
				} else if (comp) {
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
	});
}

export async function NestedContentWithPortal(__output) {
	return _$_.async(async () => {
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

				if (comp?.async) {
					await comp(...args);
				} else if (comp) {
					comp(...args);
				}
			}
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}