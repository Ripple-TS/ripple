// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticText() {
	_$_.push_component();

	var __r = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('Hello World');
		}

		_$_.output_push('</div>');
	});

	__r = true;
	_$_.pop_component();
}

export function MultipleElements() {
	_$_.push_component();

	var __r_1 = false;

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

	__r_1 = true;
	_$_.pop_component();
}

export function NestedElements() {
	_$_.push_component();

	var __r_2 = false;

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

	__r_2 = true;
	_$_.pop_component();
}

export function WithAttributes() {
	_$_.push_component();

	var __r_3 = false;

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

	__r_3 = true;
	_$_.pop_component();
}

export function ChildComponent() {
	_$_.push_component();

	var __r_4 = false;

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push(' class="child"');
		_$_.output_push('>');

		{
			_$_.output_push('Child content');
		}

		_$_.output_push('</span>');
	});

	__r_4 = true;
	_$_.pop_component();
}

export function ParentWithChild() {
	_$_.push_component();

	var __r_5 = false;

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

	__r_5 = true;
	_$_.pop_component();
}

export function FirstSibling() {
	_$_.push_component();

	var __r_6 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="first"');
		_$_.output_push('>');

		{
			_$_.output_push('First');
		}

		_$_.output_push('</div>');
	});

	__r_6 = true;
	_$_.pop_component();
}

export function SecondSibling() {
	_$_.push_component();

	var __r_7 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="second"');
		_$_.output_push('>');

		{
			_$_.output_push('Second');
		}

		_$_.output_push('</div>');
	});

	__r_7 = true;
	_$_.pop_component();
}

export function SiblingComponents() {
	_$_.push_component();

	var __r_8 = false;

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

	__r_8 = true;
	_$_.pop_component();
}

export function Greeting(props) {
	_$_.push_component();

	var __r_9 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape('Hello ' + String(props.name)));
		}

		_$_.output_push('</div>');
	});

	__r_9 = true;
	_$_.pop_component();
}

export function WithGreeting() {
	_$_.push_component();

	var __r_10 = false;

	_$_.regular_block(() => {
		{
			const comp = Greeting;
			const args = [{ name: "World" }];

			comp(...args);
		}
	});

	__r_10 = true;
	_$_.pop_component();
}

export function ExpressionContent() {
	_$_.push_component();

	var __r_11 = false;
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

	__r_11 = true;
	_$_.pop_component();
}

function NestedHelperItem({ item }) {
	_$_.push_component();

	var __r_12 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="helper-item"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(item));
		}

		_$_.output_push('</div>');
	});

	__r_12 = true;
	_$_.pop_component();
}

function NestedTsxTsrxFragment({ label }) {
	_$_.push_component();

	var __r_13 = false;

	_$_.regular_block(() => {
		_$_.output_push('<span');
		_$_.output_push(' class="label"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(label));
		}

		_$_.output_push('</span>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		for (const item of [1, 2, 3, 4]) {
			{
				const comp = NestedHelperItem;
				const args = [{ item }];

				comp(...args);
			}
		}

		_$_.output_push('<!--]-->');
	});

	__r_13 = true;
	_$_.pop_component();
}

export function NestedTsxTsrxExpressionValues() {
	_$_.push_component();

	var __r_14 = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		for (const item of [1, 2, 3]) {
			_$_.output_push('<div');
			_$_.output_push(' class="app-item"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(item));
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		{
			const comp = NestedTsxTsrxFragment;
			const args = [{ label: "from helper" }];

			comp(...args);
		}
	});

	__r_14 = true;
	_$_.pop_component();
}

export function MixedTsrxCollectionText() {
	_$_.push_component();

	var __r_15 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression([
				'alpha ',
				_$_.tsrx_element(function render_children() {
					_$_.output_push('<strong');
					_$_.output_push(' class="middle"');
					_$_.output_push('>');

					{
						_$_.output_push('beta');
					}

					_$_.output_push('</strong>');
				}),
				' gamma ',
				[
					'delta ',
					_$_.tsrx_element(function render_children() {
						_$_.output_push('<em');
						_$_.output_push(' class="tail"');
						_$_.output_push('>');

						{
							_$_.output_push('epsilon');
						}

						_$_.output_push('</em>');
					}),
					' zeta'
				]
			]);
		});
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="mixed-collection"');
		_$_.output_push('>');

		{
			_$_.render_expression(content);
		}

		_$_.output_push('</div>');
	});

	__r_15 = true;
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitServerText() {
	_$_.push_component();

	var __r_16 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression([
				'alpha ',
				_$_.tsrx_element(function render_children() {
					_$_.output_push('<strong');
					_$_.output_push(' class="middle"');
					_$_.output_push('>');

					{
						_$_.output_push('beta');
					}

					_$_.output_push('</strong>');
				}),
				' gamma ',
				[
					'delta ',
					_$_.tsrx_element(function render_children() {
						_$_.output_push('<em');
						_$_.output_push(' class="tail"');
						_$_.output_push('>');

						{
							_$_.output_push('epsilon');
						}

						_$_.output_push('</em>');
					}),
					' zeta'
				]
			]);
		});
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="mixed-collection-split"');
		_$_.output_push('>');

		{
			_$_.render_expression(content);
		}

		_$_.output_push('</div>');
	});

	__r_16 = true;
	_$_.pop_component();
}

export function MixedTsrxCollectionSplitClientText() {
	_$_.push_component();

	var __r_17 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression([
				'alpha ',
				_$_.tsrx_element(function render_children() {
					_$_.output_push('<strong');
					_$_.output_push(' class="middle"');
					_$_.output_push('>');

					{
						_$_.output_push('beta');
					}

					_$_.output_push('</strong>');
				}),
				' gamma ',
				[
					'changed ',
					_$_.tsrx_element(function render_children() {
						_$_.output_push('<em');
						_$_.output_push(' class="tail"');
						_$_.output_push('>');

						{
							_$_.output_push('epsilon');
						}

						_$_.output_push('</em>');
					}),
					' zeta'
				]
			]);
		});
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="mixed-collection-split"');
		_$_.output_push('>');

		{
			_$_.render_expression(content);
		}

		_$_.output_push('</div>');
	});

	__r_17 = true;
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveServerText() {
	_$_.push_component();

	var __r_18 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression([
				'count: ',
				1,
				' / ',
				true,
				_$_.tsrx_element(function render_children() {
					_$_.output_push('<span');
					_$_.output_push(' class="primitive-tail"');
					_$_.output_push('>');

					{
						_$_.output_push(' ok');
					}

					_$_.output_push('</span>');
				})
			]);
		});
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="mixed-collection-primitive"');
		_$_.output_push('>');

		{
			_$_.render_expression(content);
		}

		_$_.output_push('</div>');
	});

	__r_18 = true;
	_$_.pop_component();
}

export function MixedTsrxCollectionPrimitiveClientText() {
	_$_.push_component();

	var __r_19 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression([
				'count: ',
				2,
				' / ',
				false,
				_$_.tsrx_element(function render_children() {
					_$_.output_push('<span');
					_$_.output_push(' class="primitive-tail"');
					_$_.output_push('>');

					{
						_$_.output_push(' ok');
					}

					_$_.output_push('</span>');
				})
			]);
		});
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="mixed-collection-primitive"');
		_$_.output_push('>');

		{
			_$_.render_expression(content);
		}

		_$_.output_push('</div>');
	});

	__r_19 = true;
	_$_.pop_component();
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() {
	_$_.push_component();

	var __r_20 = false;
	const items = createPrimitiveItems();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="dynamic-array-call"');
		_$_.output_push('>');

		{
			_$_.render_expression(items);
		}

		_$_.output_push('</div>');
	});

	__r_20 = true;
	_$_.pop_component();
}

export function DynamicArrayFromTrack() {
	_$_.push_component();

	var __r_21 = false;
	let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], 'b5de6402');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="dynamic-array-track"');
		_$_.output_push('>');

		{
			_$_.render_expression(lazy.value);
		}

		_$_.output_push('</div>');
	});

	__r_21 = true;
	_$_.pop_component();
}

export function DynamicArrayFromConditional() {
	_$_.push_component();

	var __r_22 = false;
	const condition = true;

	const items = condition
		? ['start:', ['one', 2], true, null, false, ':end']
		: ['fallback'];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="dynamic-array-conditional"');
		_$_.output_push('>');

		{
			_$_.render_expression(items);
		}

		_$_.output_push('</div>');
	});

	__r_22 = true;
	_$_.pop_component();
}

export function DynamicArrayFromLogical() {
	_$_.push_component();

	var __r_23 = false;
	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="dynamic-array-logical"');
		_$_.output_push('>');

		{
			_$_.render_expression(items);
		}

		_$_.output_push('</div>');
	});

	__r_23 = true;
	_$_.pop_component();
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	_$_.push_component();

	var __r_24 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.output_push('<section');
			_$_.output_push(' class="outer"');
			_$_.output_push('>');

			{
				_$_.render_expression(_$_.tsrx_element(function render_children() {
					_$_.output_push('<div');
					_$_.output_push(' class="inner"');
					_$_.output_push('>');

					{
						_$_.output_push('from tsrx');
					}

					_$_.output_push('</div>');
				}));
			}

			_$_.output_push('</section>');
		});
	});

	_$_.regular_block(() => {
		_$_.render_expression(content);
	});

	__r_24 = true;
	_$_.pop_component();
}

export function NestedTsrxElementsInsideTopLevelTsxValue() {
	_$_.push_component();

	var __r_25 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="wrapper"');
			_$_.output_push('>');

			{
				_$_.render_expression(_$_.tsrx_element(function render_children() {
					_$_.output_push('<section');
					_$_.output_push(' class="native"');
					_$_.output_push('>');

					{
						_$_.output_push('<span');
						_$_.output_push(' class="nested-tsrx"');
						_$_.output_push('>');

						{
							_$_.output_push('inside nested tsrx');
						}

						_$_.output_push('</span>');
					}

					_$_.output_push('</section>');
				}));
			}

			_$_.output_push('</div>');
		});
	});

	_$_.regular_block(() => {
		_$_.render_expression(content);
	});

	__r_25 = true;
	_$_.pop_component();
}

export function TsxDeclaredInsideNestedTsrxFromTopLevelTsx() {
	_$_.push_component();

	var __r_26 = false;

	const content = _$_.tsrx_element(function render_children() {
		_$_.regular_block(() => {
			_$_.render_expression(_$_.tsrx_element(function render_children() {
				const nested = _$_.tsrx_element(function render_children() {
					_$_.output_push('<span');
					_$_.output_push(' class="nested-tsx"');
					_$_.output_push('>');

					{
						_$_.output_push('inside nested tsx');
					}

					_$_.output_push('</span>');
				});

				_$_.output_push('<div');
				_$_.output_push(' class="native"');
				_$_.output_push('>');

				{
					_$_.render_expression(nested);
				}

				_$_.output_push('</div>');
			}));
		});
	});

	_$_.regular_block(() => {
		_$_.render_expression(content);
	});

	__r_26 = true;
	_$_.pop_component();
}

function TextProp(__props) {
	_$_.push_component();

	var __r_27 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="text-prop"');
		_$_.output_push('>');

		{
			_$_.render_expression(__props.children);
		}

		_$_.output_push('</div>');
	});

	__r_27 = true;
	_$_.pop_component();
}

export function TextPropWithToggle() {
	_$_.push_component();

	var __r_28 = false;
	let lazy_1 = _$_.track(false, '1ba81c3b');

	_$_.regular_block(() => {
		{
			const comp = TextProp;

			const args = [
				{
					children: _$_.normalize_children(lazy_1.value ? 'hello' : '')
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

	__r_28 = true;
	_$_.pop_component();
}

function StaticHeader() {
	_$_.push_component();

	var __r_29 = false;

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

	__r_29 = true;
	_$_.pop_component();
}

export function StaticChildWithSiblings() {
	_$_.push_component();

	var __r_30 = false;
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

	__r_30 = true;
	_$_.pop_component();
}

function Header() {
	_$_.push_component();

	var __r_31 = false;

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

	__r_31 = true;
	_$_.pop_component();
}

function Actions({ playgroundVisible = false }) {
	_$_.push_component();

	var __r_32 = false;

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

	__r_32 = true;
	_$_.pop_component();
}

function Layout({ children }) {
	_$_.push_component();

	var __r_33 = false;

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

	__r_33 = true;
	_$_.pop_component();
}

function Content() {
	_$_.push_component();

	var __r_34 = false;

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

	__r_34 = true;
	_$_.pop_component();
}

export function WebsiteIndex() {
	_$_.push_component();

	var __r_35 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_36 = false;

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

						__r_36 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_35 = true;
	_$_.pop_component();
}

function LastChild() {
	_$_.push_component();

	var __r_37 = false;

	_$_.regular_block(() => {
		_$_.output_push('<footer');
		_$_.output_push(' class="last-child"');
		_$_.output_push('>');

		{
			_$_.output_push('I am the last child');
		}

		_$_.output_push('</footer>');
	});

	__r_37 = true;
	_$_.pop_component();
}

export function ComponentAsLastSibling() {
	_$_.push_component();

	var __r_38 = false;

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

	__r_38 = true;
	_$_.pop_component();
}

function InnerContent() {
	_$_.push_component();

	var __r_39 = false;

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

	__r_39 = true;
	_$_.pop_component();
}

export function NestedComponentAsLastSibling() {
	_$_.push_component();

	var __r_40 = false;

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

	__r_40 = true;
	_$_.pop_component();
}