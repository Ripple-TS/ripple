// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticText() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>Hello World</div>';
			_$_.output_push(__out);
		});
	});
}

export function MultipleElements() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<h1>Title</h1><p>Paragraph text</p><span>Span text</span>';
			_$_.output_push(__out);
		});
	});
}

export function NestedElements() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><div class="inner"><span>Nested content</span></div></div>';
			_$_.output_push(__out);
		});
	});
}

export function WithAttributes() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<input type="text" placeholder="Enter text" disabled /><a href="/link" target="_blank">Link</a>';
			_$_.output_push(__out);
		});
	});
}

export function ChildComponent() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="child">Child content</span>';
			_$_.output_push(__out);
		});
	});
}

export function ParentWithChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="parent">';

			{
				{
					const comp = ChildComponent;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function FirstSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="first">First</div>';
			_$_.output_push(__out);
		});
	});
}

export function SecondSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="second">Second</div>';
			_$_.output_push(__out);
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
			let __out = '';

			__out += '<div>' + _$_.escape('Hello ' + String(props.name ?? '')) + '</div>';
			_$_.output_push(__out);
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
			let __out = '';

			__out += '<div>' + _$_.escape(value) + '</div><span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(label.toUpperCase());
			}

			__out += '</span>';
			_$_.output_push(__out);
		});
	});
}

function NestedHelperItem({ item }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="helper-item">' + _$_.escape(item) + '</div>';
			_$_.output_push(__out);
		});
	});
}

function NestedTsxTsrxFragment({ label }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="label">' + _$_.escape(label) + '</span><!--[-->';

			for (const item of [1, 2, 3, 4]) {
				{
					const comp = NestedHelperItem;
					const args = [{ item }];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function NestedTsxTsrxExpressionValues() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="nested-expression-values"><!--[-->';

			for (const item of [1, 2, 3]) {
				__out += '<div class="app-item">' + _$_.escape(item) + '</div>';
			}

			__out += '<!--]-->';

			{
				const comp = NestedTsxTsrxFragment;
				const args = [{ label: "from helper" }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
						let __out = '';

						__out += '<strong class="middle">beta</strong>';
						_$_.output_push(__out);
					}),
					' gamma ',
					[
						'delta ',
						_$_.tsrx_element(() => {
							let __out = '';

							__out += '<em class="tail">epsilon</em>';
							_$_.output_push(__out);
						}),
						' zeta'
					]
				]);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="mixed-collection">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(content);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
						let __out = '';

						__out += '<strong class="middle">beta</strong>';
						_$_.output_push(__out);
					}),
					' gamma ',
					[
						'delta ',
						_$_.tsrx_element(() => {
							let __out = '';

							__out += '<em class="tail">epsilon</em>';
							_$_.output_push(__out);
						}),
						' zeta'
					]
				]);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="mixed-collection-split">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(content);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
						let __out = '';

						__out += '<strong class="middle">beta</strong>';
						_$_.output_push(__out);
					}),
					' gamma ',
					[
						'changed ',
						_$_.tsrx_element(() => {
							let __out = '';

							__out += '<em class="tail">epsilon</em>';
							_$_.output_push(__out);
						}),
						' zeta'
					]
				]);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="mixed-collection-split">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(content);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
						let __out = '';

						__out += '<span class="primitive-tail"> ok</span>';
						_$_.output_push(__out);
					})
				]);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="mixed-collection-primitive">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(content);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
						let __out = '';

						__out += '<span class="primitive-tail"> ok</span>';
						_$_.output_push(__out);
					})
				]);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="mixed-collection-primitive">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(content);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
			let __out = '';

			__out += '<div class="dynamic-array-call">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(items);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function DynamicArrayFromTrack() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(['start:', ['one', 2], true, null, false, ':end'], 'b5de6402');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="dynamic-array-track">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(lazy.value);
			}

			__out += '</div>';
			_$_.output_push(__out);
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
			let __out = '';

			__out += '<div class="dynamic-array-conditional">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(items);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function DynamicArrayFromLogical() {
	return _$_.tsrx_element(() => {
		const condition = true;
		const items = condition && ['start:', ['one', 2], true, null, false, ':end'];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="dynamic-array-logical">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(items);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	return _$_.tsrx_element(() => {
		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				let __out = '';

				__out += '<section class="outer"><div class="inner">from tsrx</div></section>';
				_$_.output_push(__out);
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
				let __out = '';

				__out += '<div class="wrapper"><section class="native"><span class="nested-tsrx">inside nested tsrx</span></section></div>';
				_$_.output_push(__out);
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
				let __out = '';

				__out += '<span class="nested-tsx">inside nested tsx</span>';
				_$_.output_push(__out);
			});
		});

		const content = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				let __out = '';

				__out += '<div class="native">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(nested);
				}

				__out += '</div>';
				_$_.output_push(__out);
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
			let __out = '';

			__out += '<div class="text-prop">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(__props.children);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function TextPropWithToggle() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(false, '1ba81c3b');

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = TextProp;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						children: _$_.normalize_children(lazy_1.value ? 'hello' : '')
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<button class="show-text">Show</button>';
			_$_.output_push(__out);
		});
	});
}

function StaticHeader() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<h1 class="sr-only">heading</h1><p class="subtitle">first paragraph</p><p class="subtitle">second paragraph</p>';
			_$_.output_push(__out);
		});
	});
}

export function StaticChildWithSiblings() {
	return _$_.tsrx_element(() => {
		const foo = 'bar';

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = StaticHeader;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="sibling1">' + _$_.escape(foo) + '</span><span class="sibling2">' + _$_.escape(foo) + '</span>';
			_$_.output_push(__out);
		});
	});
}

function Header() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<h1 class="sr-only">Ripple</h1><img src="/images/logo.png" alt="Logo" class="logo" /><p class="subtitle">the elegant TypeScript UI framework</p>';
			_$_.output_push(__out);
		});
	});
}

function Actions({ playgroundVisible = false }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="social-links"><a href="https://github.com" class="github-link">GitHub</a><a href="https://discord.com" class="discord-link">Discord</a>';
			_$_.output_push(__out);
			__out = '';

			_$_.render_expression(playgroundVisible
				? _$_.tsrx_element(() => {
					let __out = '';

					__out += '<a href="/playground" class="playground-link">Playground</a>';
					_$_.output_push(__out);
				})
				: null);

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

function Layout({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<main><div class="container">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</div></main>';
			_$_.output_push(__out);
		});
	});
}

function Content() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="content"><p>Some content here</p></div>';
			_$_.output_push(__out);
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
			let __out = '';

			__out += '<footer class="last-child">I am the last child</footer>';
			_$_.output_push(__out);
		});
	});
}

export function ComponentAsLastSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><h1>Header</h1><p>Some content</p>';

			{
				const comp = LastChild;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

function InnerContent() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="inner"><span>Inner text</span>';

			{
				const comp = LastChild;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedComponentAsLastSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="outer"><h2>Section title</h2>';

			{
				const comp = InnerContent;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</section>';
			_$_.output_push(__out);
		});
	});
}