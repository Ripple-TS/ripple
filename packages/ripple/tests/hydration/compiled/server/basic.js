import * as _$_ from 'ripple/internal/server';

export function StaticText(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Hello World');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultipleElements(__output) {
	_$_.push_component();
	__output.push('<h1');
	__output.push('>');

	{
		__output.push('Title');
	}

	__output.push('</h1>');
	__output.push('<p');
	__output.push('>');

	{
		__output.push('Paragraph text');
	}

	__output.push('</p>');
	__output.push('<span');
	__output.push('>');

	{
		__output.push('Span text');
	}

	__output.push('</span>');
	_$_.pop_component();
}

export function NestedElements(__output) {
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
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function WithAttributes(__output) {
	_$_.push_component();
	__output.push('<input');
	__output.push(' type="text"');
	__output.push(' placeholder="Enter text"');
	__output.push(' disabled');
	__output.push(' />');
	__output.push('<a');
	__output.push(' href="/link"');
	__output.push(' target="_blank"');
	__output.push('>');

	{
		__output.push('Link');
	}

	__output.push('</a>');
	_$_.pop_component();
}

export function ChildComponent(__output) {
	_$_.push_component();
	__output.push('<span');
	__output.push(' class="child"');
	__output.push('>');

	{
		__output.push('Child content');
	}

	__output.push('</span>');
	_$_.pop_component();
}

export function ParentWithChild(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="parent"');
	__output.push('>');

	{
		{
			const comp = ChildComponent;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function FirstSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="first"');
	__output.push('>');

	{
		__output.push('First');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function SecondSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="second"');
	__output.push('>');

	{
		__output.push('Second');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function SiblingComponents(__output) {
	_$_.push_component();

	{
		const comp = FirstSibling;
		const args = [__output, {}];

		comp(...args);
	}

	{
		const comp = SecondSibling;
		const args = [__output, {}];

		comp(...args);
	}

	_$_.pop_component();
}

export function Greeting(__output, props) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape('Hello ' + String(props.name)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function WithGreeting(__output) {
	_$_.push_component();

	{
		const comp = Greeting;
		const args = [__output, { name: "World" }];

		comp(...args);
	}

	_$_.pop_component();
}

export function ExpressionContent(__output) {
	_$_.push_component();

	const value = 42;
	const text = 'computed';

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(value));
	}

	__output.push('</div>');
	__output.push('<span');
	__output.push('>');

	{
		__output.push(_$_.escape(text.toUpperCase()));
	}

	__output.push('</span>');
	_$_.pop_component();
}

function StaticHeader(__output) {
	_$_.push_component();
	__output.push('<h1');
	__output.push(' class="sr-only"');
	__output.push('>');

	{
		__output.push('heading');
	}

	__output.push('</h1>');
	__output.push('<p');
	__output.push(' class="subtitle"');
	__output.push('>');

	{
		__output.push('first paragraph');
	}

	__output.push('</p>');
	__output.push('<p');
	__output.push(' class="subtitle"');
	__output.push('>');

	{
		__output.push('second paragraph');
	}

	__output.push('</p>');
	_$_.pop_component();
}

export function StaticChildWithSiblings(__output) {
	_$_.push_component();

	const foo = 'bar';

	{
		const comp = StaticHeader;
		const args = [__output, {}];

		comp(...args);
	}

	__output.push('<span');
	__output.push(' class="sibling1"');
	__output.push('>');

	{
		__output.push(_$_.escape(foo));
	}

	__output.push('</span>');
	__output.push('<span');
	__output.push(' class="sibling2"');
	__output.push('>');

	{
		__output.push(_$_.escape(foo));
	}

	__output.push('</span>');
	_$_.pop_component();
}

function Header(__output) {
	_$_.push_component();
	__output.push('<h1');
	__output.push(' class="sr-only"');
	__output.push('>');

	{
		__output.push('Ripple');
	}

	__output.push('</h1>');
	__output.push('<img');
	__output.push(' src="/images/logo.png"');
	__output.push(' alt="Logo"');
	__output.push(' class="logo"');
	__output.push(' />');
	__output.push('<p');
	__output.push(' class="subtitle"');
	__output.push('>');

	{
		__output.push('the elegant TypeScript UI framework');
	}

	__output.push('</p>');
	_$_.pop_component();
}

function Actions(__output, { playgroundVisible = false }) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="social-links"');
	__output.push('>');

	{
		__output.push('<a');
		__output.push(' href="https://github.com"');
		__output.push(' class="github-link"');
		__output.push('>');

		{
			__output.push('GitHub');
		}

		__output.push('</a>');
		__output.push('<a');
		__output.push(' href="https://discord.com"');
		__output.push(' class="discord-link"');
		__output.push('>');

		{
			__output.push('Discord');
		}

		__output.push('</a>');
		__output.push('<!--[-->');

		if (_$_.get(playgroundVisible)) {
			__output.push('<a');
			__output.push(' href="/playground"');
			__output.push(' class="playground-link"');
			__output.push('>');

			{
				__output.push('Playground');
			}

			__output.push('</a>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function Layout(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<main');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="container"');
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

		__output.push('</main>');
		_$_.pop_component();
	});
}

Layout.async = true;

function Content(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="content"');
	__output.push('>');

	{
		__output.push('<p');
		__output.push('>');

		{
			__output.push('Some content here');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function WebsiteIndex(__output) {
	_$_.push_component();

	{
		const comp = Layout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = Header;
						const args = [__output, {}];

						comp(...args);
					}

					{
						const comp = Actions;
						const args = [__output, { playgroundVisible: true }];

						comp(...args);
					}

					{
						const comp = Content;
						const args = [__output, {}];

						comp(...args);
					}

					{
						const comp = Actions;
						const args = [__output, { playgroundVisible: false }];

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

function LastChild(__output) {
	_$_.push_component();
	__output.push('<footer');
	__output.push(' class="last-child"');
	__output.push('>');

	{
		__output.push('I am the last child');
	}

	__output.push('</footer>');
	_$_.pop_component();
}

export function ComponentAsLastSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="wrapper"');
	__output.push('>');

	{
		__output.push('<h1');
		__output.push('>');

		{
			__output.push('Header');
		}

		__output.push('</h1>');
		__output.push('<p');
		__output.push('>');

		{
			__output.push('Some content');
		}

		__output.push('</p>');

		{
			const comp = LastChild;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

function InnerContent(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="inner"');
	__output.push('>');

	{
		__output.push('<span');
		__output.push('>');

		{
			__output.push('Inner text');
		}

		__output.push('</span>');

		{
			const comp = LastChild;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function NestedComponentAsLastSibling(__output) {
	_$_.push_component();
	__output.push('<section');
	__output.push(' class="outer"');
	__output.push('>');

	{
		__output.push('<h2');
		__output.push('>');

		{
			__output.push('Section title');
		}

		__output.push('</h2>');

		{
			const comp = InnerContent;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</section>');
	_$_.pop_component();
}