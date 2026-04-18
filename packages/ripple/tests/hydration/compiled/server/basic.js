// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticText() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Hello World');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function MultipleElements() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<h1');
		_$_.output_push('>');

		{
			_$_.output_push('Title');
		}

		_$_.output_push('</h1>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push('>');

		{
			_$_.output_push('Paragraph text');
		}

		_$_.output_push('</p>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push('>');

		{
			_$_.output_push('Span text');
		}

		_$_.output_push('</span>');
	});

	_$_.pop_component();
}

export function NestedElements() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="outer"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="inner"');
			_$_.output_push('>');

			{
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push('Nested content');
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function WithAttributes() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<input');
		_$_.output_push(' type="text"');
		_$_.output_push(' placeholder="Enter text"');
		_$_.output_push(' disabled');
		_$_.output_push(' />');
	});

	_$_.regular_block(() => {
		_$_.output_push('<a');
		_$_.output_push(' href="/link"');
		_$_.output_push(' target="_blank"');
		_$_.output_push('>');

		{
			_$_.output_push('Link');
		}

		_$_.output_push('</a>');
	});

	_$_.pop_component();
}

export function ChildComponent() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push(' class="child"');
		_$_.output_push('>');

		{
			_$_.output_push('Child content');
		}

		_$_.output_push('</span>');
	});

	_$_.pop_component();
}

export function ParentWithChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="parent"');
		_$_.output_push('>');

		{
			{
				const comp = ChildComponent;
				const args = [{}];

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function FirstSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="first"');
		_$_.output_push('>');

		{
			_$_.output_push('First');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function SecondSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="second"');
		_$_.output_push('>');

		{
			_$_.output_push('Second');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function SiblingComponents() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = FirstSibling;
			const args = [{}];

			comp(...args);
		}
	});

	_$_.regular_block(() => {
		{
			const comp = SecondSibling;
			const args = [{}];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function Greeting(props) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape('Hello ' + String(props.name)));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function WithGreeting() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Greeting;
			const args = [{ name: "World" }];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function ExpressionContent() {
	_$_.push_component();

	const value = 42;
	const label = 'computed';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(value));
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(label.toUpperCase()));
		}

		_$_.output_push('</span>');
	});

	_$_.pop_component();
}

function TextProp(__props) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="text-prop"');
		_$_.output_push('>');

		{
			_$_.render_expression(__props.children);
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function TextPropWithToggle() {
	_$_.push_component();

	let lazy = _$_.track(false);

	_$_.regular_block(() => {
		{
			const comp = TextProp;

			const args = [
				{
					children: _$_.normalize_children(_$_.get(lazy) ? 'hello' : '')
				}
			];

			comp(...args);
		}
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="show-text"');
		_$_.output_push('>');

		{
			_$_.output_push('Show');
		}

		_$_.output_push('</button>');
	});

	_$_.pop_component();
}

function StaticHeader() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<h1');
		_$_.output_push(' class="sr-only"');
		_$_.output_push('>');

		{
			_$_.output_push('heading');
		}

		_$_.output_push('</h1>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push(' class="subtitle"');
		_$_.output_push('>');

		{
			_$_.output_push('first paragraph');
		}

		_$_.output_push('</p>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push(' class="subtitle"');
		_$_.output_push('>');

		{
			_$_.output_push('second paragraph');
		}

		_$_.output_push('</p>');
	});

	_$_.pop_component();
}

export function StaticChildWithSiblings() {
	_$_.push_component();

	const foo = 'bar';

	_$_.regular_block(() => {
		{
			const comp = StaticHeader;
			const args = [{}];

			comp(...args);
		}
	});

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push(' class="sibling1"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(foo));
		}

		_$_.output_push('</span>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push(' class="sibling2"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(foo));
		}

		_$_.output_push('</span>');
	});

	_$_.pop_component();
}

function Header() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<h1');
		_$_.output_push(' class="sr-only"');
		_$_.output_push('>');

		{
			_$_.output_push('Ripple');
		}

		_$_.output_push('</h1>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<img');
		_$_.output_push(' src="/images/logo.png"');
		_$_.output_push(' alt="Logo"');
		_$_.output_push(' class="logo"');
		_$_.output_push(' />');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push(' class="subtitle"');
		_$_.output_push('>');

		{
			_$_.output_push('the elegant TypeScript UI framework');
		}

		_$_.output_push('</p>');
	});

	_$_.pop_component();
}

function Actions({ playgroundVisible = false }) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="social-links"');
		_$_.output_push('>');

		{
			_$_.output_push('<a');
			_$_.output_push(' href="https://github.com"');
			_$_.output_push(' class="github-link"');
			_$_.output_push('>');

			{
				_$_.output_push('GitHub');
			}

			_$_.output_push('</a>');
			_$_.output_push('<a');
			_$_.output_push(' href="https://discord.com"');
			_$_.output_push(' class="discord-link"');
			_$_.output_push('>');

			{
				_$_.output_push('Discord');
			}

			_$_.output_push('</a>');
			_$_.output_push('<!--[-->');

			if (playgroundVisible) {
				_$_.output_push('<a');
				_$_.output_push(' href="/playground"');
				_$_.output_push(' class="playground-link"');
				_$_.output_push('>');

				{
					_$_.output_push('Playground');
				}

				_$_.output_push('</a>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function Layout({ children }) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<main');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="container"');
			_$_.output_push('>');

			{
				_$_.render_expression(children);
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</main>');
	});

	_$_.pop_component();
}

function Content() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="content"');
		_$_.output_push('>');

		{
			_$_.output_push('<p');
			_$_.output_push('>');

			{
				_$_.output_push('Some content here');
			}

			_$_.output_push('</p>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function WebsiteIndex() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						{
							const comp = Header;
							const args = [{}];

							comp(...args);
						}

						{
							const comp = Actions;
							const args = [{ playgroundVisible: true }];

							comp(...args);
						}

						{
							const comp = Content;
							const args = [{}];

							comp(...args);
						}

						{
							const comp = Actions;
							const args = [{ playgroundVisible: false }];

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

function LastChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<footer');
		_$_.output_push(' class="last-child"');
		_$_.output_push('>');

		{
			_$_.output_push('I am the last child');
		}

		_$_.output_push('</footer>');
	});

	_$_.pop_component();
}

export function ComponentAsLastSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="wrapper"');
		_$_.output_push('>');

		{
			_$_.output_push('<h1');
			_$_.output_push('>');

			{
				_$_.output_push('Header');
			}

			_$_.output_push('</h1>');
			_$_.output_push('<p');
			_$_.output_push('>');

			{
				_$_.output_push('Some content');
			}

			_$_.output_push('</p>');

			{
				const comp = LastChild;
				const args = [{}];

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function InnerContent() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="inner"');
		_$_.output_push('>');

		{
			_$_.output_push('<span');
			_$_.output_push('>');

			{
				_$_.output_push('Inner text');
			}

			_$_.output_push('</span>');

			{
				const comp = LastChild;
				const args = [{}];

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function NestedComponentAsLastSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<section');
		_$_.output_push(' class="outer"');
		_$_.output_push('>');

		{
			_$_.output_push('<h2');
			_$_.output_push('>');

			{
				_$_.output_push('Section title');
			}

			_$_.output_push('</h2>');

			{
				const comp = InnerContent;
				const args = [{}];

				comp(...args);
			}
		}

		_$_.output_push('</section>');
	});

	_$_.pop_component();
}