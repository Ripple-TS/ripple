// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticText() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('Hello World');
			}

			_$_.output_push('</div>');
		});
	});
}

export function MultipleElements() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<h1');
				_$_.output_push('>');

				{
					_$_.output_push('Title');
				}

				_$_.output_push('</h1>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Paragraph text');
				}

				_$_.output_push('</p>');
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push('Span text');
				}

				_$_.output_push('</span>');
			}
		});
	});
}

export function NestedElements() {
	return _$_.tsrx_element(() => {
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
	});
}

export function WithAttributes() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<input');
				_$_.output_push(' type="text"');
				_$_.output_push(' placeholder="Enter text"');
				_$_.output_push(' disabled');
				_$_.output_push(' />');
				_$_.output_push('<a');
				_$_.output_push(' href="/link"');
				_$_.output_push(' target="_blank"');
				_$_.output_push('>');

				{
					_$_.output_push('Link');
				}

				_$_.output_push('</a>');
			}
		});
	});
}

export function ChildComponent() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<span');
			_$_.output_push(' class="child"');
			_$_.output_push('>');

			{
				_$_.output_push('Child content');
			}

			_$_.output_push('</span>');
		});
	});
}

export function ParentWithChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="parent"');
			_$_.output_push('>');

			{
				{
					const comp = ChildComponent;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

export function FirstSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('First');
			}

			_$_.output_push('</div>');
		});
	});
}

export function SecondSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="second"');
			_$_.output_push('>');

			{
				_$_.output_push('Second');
			}

			_$_.output_push('</div>');
		});
	});
}

export function SiblingComponents() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = FirstSibling;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = SecondSibling;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function Greeting(props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape('Hello ' + String(props.name)));
			}

			_$_.output_push('</div>');
		});
	});
}

export function WithGreeting() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Greeting;
				const args = [{ name: "World" }];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function ExpressionContent() {
	return _$_.tsrx_element(() => {
		const value = 42;
		const label = 'computed';

		_$_.regular_block(() => {
			{
				_$_.output_push('<div');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(value));
				}

				_$_.output_push('</div>');
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.render_expression(label.toUpperCase());
				}

				_$_.output_push('</span>');
			}
		});
	});
}

function NestedHelperItem({ item }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="helper-item"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(item));
			}

			_$_.output_push('</div>');
		});
	});
}

function NestedTsxTsrxFragment({ label }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<span');
				_$_.output_push(' class="label"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(label));
				}

				_$_.output_push('</span>');
				_$_.output_push('<!--[-->');

				for (const item of [1, 2, 3, 4]) {
					{
						const comp = NestedHelperItem;
						const args = [{ item }];

						_$_.render_component(comp, ...args);
					}
				}

				_$_.output_push('<!--]-->');
			}
		});
	});
}

export function NestedTsxTsrxExpressionValues() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="nested-expression-values"');
			_$_.output_push('>');

			{
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

				{
					const comp = NestedTsxTsrxFragment;
					const args = [{ label: "from helper" }];

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

export function MixedTsrxCollectionText() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.render_expression([
					'alpha ',
					_$_.tsrx_element(() => {
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
						_$_.tsrx_element(() => {
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
	});
}

export function MixedTsrxCollectionSplitServerText() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.render_expression([
					'alpha ',
					_$_.tsrx_element(() => {
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
						_$_.tsrx_element(() => {
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
	});
}

export function MixedTsrxCollectionSplitClientText() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.render_expression([
					'alpha ',
					_$_.tsrx_element(() => {
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
						_$_.tsrx_element(() => {
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
	});
}

export function MixedTsrxCollectionPrimitiveServerText() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.render_expression([
					'count: ',
					1,
					' / ',
					true,
					_$_.tsrx_element(() => {
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
	});
}

export function MixedTsrxCollectionPrimitiveClientText() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.render_expression([
					'count: ',
					2,
					' / ',
					false,
					_$_.tsrx_element(() => {
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
	});
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() {
	return _$_.tsrx_element(() => {
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
	});
}

export function DynamicArrayFromTrack() {
	return _$_.tsrx_element(() => {
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
	});
}

export function DynamicArrayFromConditional() {
	return _$_.tsrx_element(() => {
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
	});
}

export function DynamicArrayFromLogical() {
	return _$_.tsrx_element(() => {
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
	});
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.output_push('<section');
				_$_.output_push(' class="outer"');
				_$_.output_push('>');

				{
					_$_.output_push('<div');
					_$_.output_push(' class="inner"');
					_$_.output_push('>');

					{
						_$_.output_push('from tsrx');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('</section>');
			});
		});

		_$_.regular_block(() => {
			{
				_$_.render_expression(content);
			}
		});
	});
}

export function NestedTsrxElementsInsideTopLevelTsxValue() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="wrapper"');
				_$_.output_push('>');

				{
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
				}

				_$_.output_push('</div>');
			});
		});

		_$_.regular_block(() => {
			{
				_$_.render_expression(content);
			}
		});
	});
}

export function TsxDeclaredBeforeTopLevelTsx() {
	return _$_.tsrx_element(() => {
		const nested = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.output_push('<span');
				_$_.output_push(' class="nested-tsx"');
				_$_.output_push('>');

				{
					_$_.output_push('inside nested tsx');
				}

				_$_.output_push('</span>');
			});
		});

		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="native"');
				_$_.output_push('>');

				{
					_$_.render_expression(nested);
				}

				_$_.output_push('</div>');
			});
		});

		_$_.regular_block(() => {
			{
				_$_.render_expression(content);
			}
		});
	});
}

function TextProp(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="text-prop"');
			_$_.output_push('>');

			{
				_$_.render_expression(__props.children);
			}

			_$_.output_push('</div>');
		});
	});
}

export function TextPropWithToggle() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(false, '1ba81c3b');

		_$_.regular_block(() => {
			{
				{
					const comp = TextProp;

					const args = [
						{
							children: _$_.normalize_children(lazy_1.value ? 'hello' : '')
						}
					];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<button');
				_$_.output_push(' class="show-text"');
				_$_.output_push('>');

				{
					_$_.output_push('Show');
				}

				_$_.output_push('</button>');
			}
		});
	});
}

function StaticHeader() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<h1');
				_$_.output_push(' class="sr-only"');
				_$_.output_push('>');

				{
					_$_.output_push('heading');
				}

				_$_.output_push('</h1>');
				_$_.output_push('<p');
				_$_.output_push(' class="subtitle"');
				_$_.output_push('>');

				{
					_$_.output_push('first paragraph');
				}

				_$_.output_push('</p>');
				_$_.output_push('<p');
				_$_.output_push(' class="subtitle"');
				_$_.output_push('>');

				{
					_$_.output_push('second paragraph');
				}

				_$_.output_push('</p>');
			}
		});
	});
}

export function StaticChildWithSiblings() {
	return _$_.tsrx_element(() => {
		const foo = 'bar';

		_$_.regular_block(() => {
			{
				{
					const comp = StaticHeader;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<span');
				_$_.output_push(' class="sibling1"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(foo));
				}

				_$_.output_push('</span>');
				_$_.output_push('<span');
				_$_.output_push(' class="sibling2"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(foo));
				}

				_$_.output_push('</span>');
			}
		});
	});
}

function Header() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<h1');
				_$_.output_push(' class="sr-only"');
				_$_.output_push('>');

				{
					_$_.output_push('Ripple');
				}

				_$_.output_push('</h1>');
				_$_.output_push('<img');
				_$_.output_push(' src="/images/logo.png"');
				_$_.output_push(' alt="Logo"');
				_$_.output_push(' class="logo"');
				_$_.output_push(' />');
				_$_.output_push('<p');
				_$_.output_push(' class="subtitle"');
				_$_.output_push('>');

				{
					_$_.output_push('the elegant TypeScript UI framework');
				}

				_$_.output_push('</p>');
			}
		});
	});
}

function Actions({ playgroundVisible = false }) {
	return _$_.tsrx_element(() => {
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

				_$_.render_expression(playgroundVisible
					? _$_.tsrx_element(() => {
						_$_.output_push('<a');
						_$_.output_push(' href="/playground"');
						_$_.output_push(' class="playground-link"');
						_$_.output_push('>');

						{
							_$_.output_push('Playground');
						}

						_$_.output_push('</a>');
					})
					: null);
			}

			_$_.output_push('</div>');
		});
	});
}

function Layout({ children }) {
	return _$_.tsrx_element(() => {
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
	});
}

function Content() {
	return _$_.tsrx_element(() => {
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
	});
}

export function WebsiteIndex() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Header;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = Actions;
									const args = [{ playgroundVisible: true }];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = Content;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = Actions;
									const args = [{ playgroundVisible: false }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function LastChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<footer');
			_$_.output_push(' class="last-child"');
			_$_.output_push('>');

			{
				_$_.output_push('I am the last child');
			}

			_$_.output_push('</footer>');
		});
	});
}

export function ComponentAsLastSibling() {
	return _$_.tsrx_element(() => {
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

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

function InnerContent() {
	return _$_.tsrx_element(() => {
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

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

export function NestedComponentAsLastSibling() {
	return _$_.tsrx_element(() => {
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

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</section>');
		});
	});
}