import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export async function IfWithChildren(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();

		let expanded = track(true);

		__output.push('<div');
		__output.push(' class="container"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' role="button"');
			__output.push(' class="header"');
			__output.push('>');

			{
				__output.push('Toggle');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (_$_.get(expanded)) {
				__output.push('<div');
				__output.push(' class="content"');
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

				__output.push('</div>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

export function ChildItem(__output, { text }) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="item"');
	__output.push('>');

	{
		__output.push(_$_.escape(text));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function TestIfWithChildren(__output) {
	_$_.push_component();

	{
		const comp = IfWithChildren;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = ChildItem;
						const args = [__output, { text: "Item 1" }];

						comp(...args);
					}

					{
						const comp = ChildItem;
						const args = [__output, { text: "Item 2" }];

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

export function IfWithStaticChildren(__output) {
	_$_.push_component();

	let expanded = track(true);

	__output.push('<div');
	__output.push(' class="container"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' role="button"');
		__output.push(' class="header"');
		__output.push('>');

		{
			__output.push('Toggle');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (_$_.get(expanded)) {
			__output.push('<div');
			__output.push(' class="content"');
			__output.push('>');

			{
				__output.push('<span');
				__output.push('>');

				{
					__output.push('Static child 1');
				}

				__output.push('</span>');
				__output.push('<span');
				__output.push('>');

				{
					__output.push('Static child 2');
				}

				__output.push('</span>');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export async function IfWithSiblingsAndChildren(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();

		let expanded = track(true);

		__output.push('<section');
		__output.push(' class="group"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' role="button"');
			__output.push(' class="item"');
			__output.push('>');

			{
				__output.push('<div');
				__output.push(' class="indicator"');
				__output.push('>');
				__output.push('</div>');
				__output.push('<h2');
				__output.push(' class="text"');
				__output.push('>');

				{
					__output.push('Title');
				}

				__output.push('</h2>');
				__output.push('<div');
				__output.push(' class="caret"');
				__output.push('>');

				{
					__output.push('<svg');
					__output.push(' xmlns="http://www.w3.org/2000/svg"');
					__output.push(' width="18"');
					__output.push(' height="18"');
					__output.push(' viewBox="0 0 24 24"');
					__output.push('>');

					{
						__output.push('<path');
						__output.push(' d="m9 18 6-6-6-6"');
						__output.push('>');
						__output.push('</path>');
					}

					__output.push('</svg>');
				}

				__output.push('</div>');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (_$_.get(expanded)) {
				__output.push('<div');
				__output.push(' class="items"');
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

				__output.push('</div>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</section>');
		_$_.pop_component();
	});
}

export function TestIfWithSiblingsAndChildren(__output) {
	_$_.push_component();

	{
		const comp = IfWithSiblingsAndChildren;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = ChildItem;
						const args = [__output, { text: "Item A" }];

						comp(...args);
					}

					{
						const comp = ChildItem;
						const args = [__output, { text: "Item B" }];

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