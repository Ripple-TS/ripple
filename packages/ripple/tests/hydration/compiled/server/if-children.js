// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfWithChildren({ children }) {
	_$_.push_component();

	let lazy = _$_.track(true, 'c64714b1');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' role="button"');
			_$_.output_push(' class="header"');
			_$_.output_push('>');

			{
				_$_.output_push('Toggle');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy)) {
				_$_.output_push('<div');
				_$_.output_push(' class="content"');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ChildItem({ text: label }) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="item"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(label));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function TestIfWithChildren() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = IfWithChildren;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						{
							const comp = ChildItem;
							const args = [{ text: "Item 1" }];

							comp(...args);
						}

						{
							const comp = ChildItem;
							const args = [{ text: "Item 2" }];

							comp(...args);
						}

						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function IfWithStaticChildren() {
	_$_.push_component();

	let lazy_1 = _$_.track(true, '3bba8f77');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' role="button"');
			_$_.output_push(' class="header"');
			_$_.output_push('>');

			{
				_$_.output_push('Toggle');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_1)) {
				_$_.output_push('<div');
				_$_.output_push(' class="content"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push('>');

					{
						_$_.output_push('Static child 1');
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push('>');

					{
						_$_.output_push('Static child 2');
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function IfWithSiblingsAndChildren({ children }) {
	_$_.push_component();

	let lazy_2 = _$_.track(true, 'a1b8fb4c');

	_$_.regular_block(() => {
		_$_.output_push('<section');
		_$_.output_push(' class="group"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' role="button"');
			_$_.output_push(' class="item"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="indicator"');
				_$_.output_push('>');
				_$_.output_push('</div>');
				_$_.output_push('<h2');
				_$_.output_push(' class="text"');
				_$_.output_push('>');

				{
					_$_.output_push('Title');
				}

				_$_.output_push('</h2>');
				_$_.output_push('<div');
				_$_.output_push(' class="caret"');
				_$_.output_push('>');

				{
					_$_.output_push('<svg');
					_$_.output_push(' xmlns="http://www.w3.org/2000/svg"');
					_$_.output_push(' width="18"');
					_$_.output_push(' height="18"');
					_$_.output_push(' viewBox="0 0 24 24"');
					_$_.output_push('>');

					{
						_$_.output_push('<path');
						_$_.output_push(' d="m9 18 6-6-6-6"');
						_$_.output_push('>');
						_$_.output_push('</path>');
					}

					_$_.output_push('</svg>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_2)) {
				_$_.output_push('<div');
				_$_.output_push(' class="items"');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</section>');
	});

	_$_.pop_component();
}

export function TestIfWithSiblingsAndChildren() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = IfWithSiblingsAndChildren;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						{
							const comp = ChildItem;
							const args = [{ text: "Item A" }];

							comp(...args);
						}

						{
							const comp = ChildItem;
							const args = [{ text: "Item B" }];

							comp(...args);
						}

						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function ElementWithChildrenThenIf() {
	_$_.push_component();

	let lazy_3 = _$_.track(true, '7cd4817b');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="wrapper"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="nested-parent"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="nested-child"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="deep"');
					_$_.output_push('>');

					{
						_$_.output_push('Deep content');
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_3)) {
				_$_.output_push('<div');
				_$_.output_push(' class="conditional"');
				_$_.output_push('>');

				{
					_$_.output_push('Conditional content');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.pop_component();
}

export function DeepNestingThenIf() {
	_$_.push_component();

	let lazy_4 = _$_.track(true, '923116be');

	_$_.regular_block(() => {
		_$_.output_push('<section');
		_$_.output_push(' class="outer"');
		_$_.output_push('>');

		{
			_$_.output_push('<article');
			_$_.output_push(' class="middle"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="inner"');
				_$_.output_push('>');

				{
					_$_.output_push('<p');
					_$_.output_push(' class="leaf"');
					_$_.output_push('>');

					{
						_$_.output_push('<strong');
						_$_.output_push('>');

						{
							_$_.output_push('Bold');
						}

						_$_.output_push('</strong>');
						_$_.output_push('<em');
						_$_.output_push('>');

						{
							_$_.output_push('Italic');
						}

						_$_.output_push('</em>');
					}

					_$_.output_push('</p>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</article>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_4)) {
				_$_.output_push('<footer');
				_$_.output_push(' class="footer"');
				_$_.output_push('>');

				{
					_$_.output_push('Footer');
				}

				_$_.output_push('</footer>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</section>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="btn"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.pop_component();
}

export function DomElementChildrenThenSibling() {
	_$_.push_component();

	let lazy_5 = _$_.track('code', '33a1e97f');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="tabs"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="tab-list"');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(_$_.attr('aria-selected', _$_.get(lazy_5) === 'code' ? 'true' : 'false', false));
				_$_.output_push(' class="tab"');
				_$_.output_push('>');

				{
					_$_.output_push('Code');
				}

				_$_.output_push('</button>');
				_$_.output_push('<button');
				_$_.output_push(_$_.attr('aria-selected', _$_.get(lazy_5) === 'preview' ? 'true' : 'false', false));
				_$_.output_push(' class="tab"');
				_$_.output_push('>');

				{
					_$_.output_push('Preview');
				}

				_$_.output_push('</button>');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="panel"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				if (_$_.get(lazy_5) === 'code') {
					_$_.output_push('<pre');
					_$_.output_push(' class="code"');
					_$_.output_push('>');

					{
						_$_.output_push('const x = 1;');
					}

					_$_.output_push('</pre>');
				} else {
					_$_.output_push('<div');
					_$_.output_push(' class="preview"');
					_$_.output_push('>');

					{
						_$_.output_push('Preview content');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function DomChildrenThenStaticSiblings() {
	_$_.push_component();

	let lazy_6 = _$_.track(0, '0ea64305');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<ul');
			_$_.output_push(' class="list"');
			_$_.output_push('>');

			{
				_$_.output_push('<li');
				_$_.output_push(' class="item"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape('Item count: ' + String(_$_.get(lazy_6))));
				}

				_$_.output_push('</li>');
				_$_.output_push('<li');
				_$_.output_push(' class="item"');
				_$_.output_push('>');

				{
					_$_.output_push('Another item');
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('</ul>');
			_$_.output_push('<h2');
			_$_.output_push(' class="heading"');
			_$_.output_push('>');

			{
				_$_.output_push('Static Heading');
			}

			_$_.output_push('</h2>');
			_$_.output_push('<p');
			_$_.output_push(' class="para"');
			_$_.output_push('>');

			{
				_$_.output_push('Static paragraph');
			}

			_$_.output_push('</p>');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="inc"');
		_$_.output_push('>');

		{
			_$_.output_push('Increment');
		}

		_$_.output_push('</button>');
	});

	_$_.pop_component();
}

export function StaticListThenStaticSiblings() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="wrapper"');
		_$_.output_push('>');

		{
			_$_.output_push('<ul');
			_$_.output_push(' class="features"');
			_$_.output_push('>');

			{
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push('<strong');
					_$_.output_push('>');

					{
						_$_.output_push('Feature One');
					}

					_$_.output_push('</strong>');
					_$_.output_push(': Description of feature one with ');
					_$_.output_push('<code');
					_$_.output_push('>');

					{
						_$_.output_push('code');
					}

					_$_.output_push('</code>');
					_$_.output_push(' reference');
				}

				_$_.output_push('</li>');
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push('<strong');
					_$_.output_push('>');

					{
						_$_.output_push('Feature Two');
					}

					_$_.output_push('</strong>');
					_$_.output_push(': Another feature description');
				}

				_$_.output_push('</li>');
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push('<strong');
					_$_.output_push('>');

					{
						_$_.output_push('Feature Three');
					}

					_$_.output_push('</strong>');
					_$_.output_push(': Third feature');
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('</ul>');
			_$_.output_push('<h2');
			_$_.output_push(' class="section-heading"');
			_$_.output_push('>');

			{
				_$_.output_push('Section Heading');
			}

			_$_.output_push('</h2>');
			_$_.output_push('<p');
			_$_.output_push(' class="section-content"');
			_$_.output_push('>');

			{
				_$_.output_push('Static paragraph with ');
				_$_.output_push('<a');
				_$_.output_push(' href="/link"');
				_$_.output_push('>');

				{
					_$_.output_push('a link');
				}

				_$_.output_push('</a>');
				_$_.output_push(' and more text.');
			}

			_$_.output_push('</p>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}