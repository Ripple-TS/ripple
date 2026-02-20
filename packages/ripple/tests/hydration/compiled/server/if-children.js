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

export function ElementWithChildrenThenIf(__output) {
	_$_.push_component();

	let show = track(true);

	__output.push('<div');
	__output.push(' class="wrapper"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="nested-parent"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="nested-child"');
			__output.push('>');

			{
				__output.push('<span');
				__output.push(' class="deep"');
				__output.push('>');

				{
					__output.push('Deep content');
				}

				__output.push('</span>');
			}

			__output.push('</div>');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (_$_.get(show)) {
			__output.push('<div');
			__output.push(' class="conditional"');
			__output.push('>');

			{
				__output.push('Conditional content');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	_$_.pop_component();
}

export function DeepNestingThenIf(__output) {
	_$_.push_component();

	let visible = track(true);

	__output.push('<section');
	__output.push(' class="outer"');
	__output.push('>');

	{
		__output.push('<article');
		__output.push(' class="middle"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="inner"');
			__output.push('>');

			{
				__output.push('<p');
				__output.push(' class="leaf"');
				__output.push('>');

				{
					__output.push('<strong');
					__output.push('>');

					{
						__output.push('Bold');
					}

					__output.push('</strong>');
					__output.push('<em');
					__output.push('>');

					{
						__output.push('Italic');
					}

					__output.push('</em>');
				}

				__output.push('</p>');
			}

			__output.push('</div>');
		}

		__output.push('</article>');
		__output.push('<!--[-->');

		if (_$_.get(visible)) {
			__output.push('<footer');
			__output.push(' class="footer"');
			__output.push('>');

			{
				__output.push('Footer');
			}

			__output.push('</footer>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</section>');
	__output.push('<button');
	__output.push(' class="btn"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	_$_.pop_component();
}

export function DomElementChildrenThenSibling(__output) {
	_$_.push_component();

	let activeTab = track('code');

	__output.push('<div');
	__output.push(' class="tabs"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="tab-list"');
		__output.push('>');

		{
			__output.push('<button');
			__output.push(_$_.attr('aria-selected', _$_.get(activeTab) === 'code' ? 'true' : 'false', false));
			__output.push(' class="tab"');
			__output.push('>');

			{
				__output.push('Code');
			}

			__output.push('</button>');
			__output.push('<button');
			__output.push(_$_.attr('aria-selected', _$_.get(activeTab) === 'preview' ? 'true' : 'false', false));
			__output.push(' class="tab"');
			__output.push('>');

			{
				__output.push('Preview');
			}

			__output.push('</button>');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="panel"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			if (_$_.get(activeTab) === 'code') {
				__output.push('<pre');
				__output.push(' class="code"');
				__output.push('>');

				{
					__output.push('const x = 1;');
				}

				__output.push('</pre>');
			} else {
				__output.push('<div');
				__output.push(' class="preview"');
				__output.push('>');

				{
					__output.push('Preview content');
				}

				__output.push('</div>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function DomChildrenThenStaticSiblings(__output) {
	_$_.push_component();

	let count = track(0);

	__output.push('<div');
	__output.push(' class="container"');
	__output.push('>');

	{
		__output.push('<ul');
		__output.push(' class="list"');
		__output.push('>');

		{
			__output.push('<li');
			__output.push(' class="item"');
			__output.push('>');

			{
				__output.push(_$_.escape('Item count: ' + String(_$_.get(count))));
			}

			__output.push('</li>');
			__output.push('<li');
			__output.push(' class="item"');
			__output.push('>');

			{
				__output.push('Another item');
			}

			__output.push('</li>');
		}

		__output.push('</ul>');
		__output.push('<h2');
		__output.push(' class="heading"');
		__output.push('>');

		{
			__output.push('Static Heading');
		}

		__output.push('</h2>');
		__output.push('<p');
		__output.push(' class="para"');
		__output.push('>');

		{
			__output.push('Static paragraph');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	__output.push('<button');
	__output.push(' class="inc"');
	__output.push('>');

	{
		__output.push('Increment');
	}

	__output.push('</button>');
	_$_.pop_component();
}

export function StaticListThenStaticSiblings(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="wrapper"');
	__output.push('>');

	{
		__output.push('<ul');
		__output.push(' class="features"');
		__output.push('>');

		{
			__output.push('<li');
			__output.push('>');

			{
				__output.push('<strong');
				__output.push('>');

				{
					__output.push('Feature One');
				}

				__output.push('</strong>');
				__output.push(': Description of feature one with ');
				__output.push('<code');
				__output.push('>');

				{
					__output.push('code');
				}

				__output.push('</code>');
				__output.push(' reference');
			}

			__output.push('</li>');
			__output.push('<li');
			__output.push('>');

			{
				__output.push('<strong');
				__output.push('>');

				{
					__output.push('Feature Two');
				}

				__output.push('</strong>');
				__output.push(': Another feature description');
			}

			__output.push('</li>');
			__output.push('<li');
			__output.push('>');

			{
				__output.push('<strong');
				__output.push('>');

				{
					__output.push('Feature Three');
				}

				__output.push('</strong>');
				__output.push(': Third feature');
			}

			__output.push('</li>');
		}

		__output.push('</ul>');
		__output.push('<h2');
		__output.push(' class="section-heading"');
		__output.push('>');

		{
			__output.push('Section Heading');
		}

		__output.push('</h2>');
		__output.push('<p');
		__output.push(' class="section-content"');
		__output.push('>');

		{
			__output.push('Static paragraph with ');
			__output.push('<a');
			__output.push(' href="/link"');
			__output.push('>');

			{
				__output.push('a link');
			}

			__output.push('</a>');
			__output.push(' and more text.');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	_$_.pop_component();
}