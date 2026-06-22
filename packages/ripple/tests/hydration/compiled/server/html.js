// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Fragment, track } from 'ripple/server';

export function StaticHtml() {
	return _$_.tsrx_element(() => {
		const html = '<p><strong>Bold</strong> text</p>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + String(html ?? '') + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function DynamicHtml() {
	return _$_.tsrx_element(() => {
		const content = '<p>Dynamic <span>HTML</span> content</p>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + String(content ?? '') + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function EmptyHtml() {
	return _$_.tsrx_element(() => {
		const html = '';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + String(html ?? '') + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function ComplexHtml() {
	return _$_.tsrx_element(() => {
		const html = '<div class="nested"><span>Nested <em>content</em></span></div>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>' + String(html ?? '') + '</section>';
			_$_.output_push(__out);
		});
	});
}

export function MultipleHtml() {
	return _$_.tsrx_element(() => {
		const html1 = '<p>First paragraph</p>';
		const html2 = '<p>Second paragraph</p>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				const html_value = String(html1 ?? '');

				__out += '<!--' + _$_.simple_hash(html_value) + '-->' + html_value + '<!---->';

				const html_value_1 = String(html2 ?? '');

				__out += '<!--' + _$_.simple_hash(html_value_1) + '-->' + html_value_1 + '<!---->';
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlWithReactivity() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><!--1tb17hh--><p>Count: 0</p><!----><button>Increment</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><div class="inner">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlInChildren() {
	return _$_.tsrx_element(() => {
		const content = '<p><strong>Bold</strong> text</p>';

		_$_.regular_block(() => {
			{
				const comp = HtmlWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="vp-doc">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlInChildrenWithSiblings() {
	return _$_.tsrx_element(() => {
		const content = '<p>Dynamic content</p>';

		_$_.regular_block(() => {
			{
				const comp = HtmlWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<h1>Title</h1><div class="content">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function MultipleHtmlInChildren() {
	return _$_.tsrx_element(() => {
		const html1 = '<p>First</p>';
		const html2 = '<p>Second</p>';

		_$_.regular_block(() => {
			{
				const comp = HtmlWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc">';

								{
									const html_value_2 = String(html1 ?? '');

									__out += '<!--' + _$_.simple_hash(html_value_2) + '-->' + html_value_2 + '<!---->';

									const html_value_3 = String(html2 ?? '');

									__out += '<!--' + _$_.simple_hash(html_value_3) + '-->' + html_value_3 + '<!---->';
								}

								__out += '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlWithComments() {
	return _$_.tsrx_element(() => {
		const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + String(content ?? '') + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlWithEmptyComment() {
	return _$_.tsrx_element(() => {
		const content = '<p>Before</p><!----><p>After</p>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>' + String(content ?? '') + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlWithCommentsInChildren() {
	return _$_.tsrx_element(() => {
		const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';

		_$_.regular_block(() => {
			{
				const comp = HtmlWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="vp-doc">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function DocFooter() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<footer class="doc-footer">Footer content</footer>';
			_$_.output_push(__out);
		});
	});
}

export function DocLayout(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout"><div class="content-container"><article><div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(__props.children);
			}

			__out += '</div></article><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.editPath, '')) {
				_$_.output_push('<div');
				_$_.output_push(' class="edit-link"');
				_$_.output_push('>');

				{
					_$_.output_push('<a');
					_$_.output_push(_$_.attr('href', `https://github.com/edit/${_$_.fallback(__props.editPath, '')}`, false));
					_$_.output_push('>');

					{
						_$_.output_push('Edit');
					}

					_$_.output_push('</a>');
				}

				_$_.output_push('</div>');
			}

			__out += '<!--]--><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.nextLink, null)) {
				_$_.output_push('<nav');
				_$_.output_push(' class="prev-next"');
				_$_.output_push('>');

				{
					_$_.output_push('<a');
					_$_.output_push(_$_.attr('href', _$_.fallback(__props.nextLink, null).href, false));
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.fallback(__props.nextLink, null).text));
					}

					_$_.output_push('</a>');
				}

				_$_.output_push('</nav>');
			}

			__out += '<!--]-->';

			{
				const comp = DocFooter;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div><aside><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.toc, []).length > 0) {
				_$_.output_push('<div');
				_$_.output_push(' class="toc"');
				_$_.output_push('>');

				{
					_$_.output_push('<ul');
					_$_.output_push('>');

					{
						_$_.output_push('<!--[-->');

						for (const item of _$_.fallback(__props.toc, [])) {
							_$_.output_push('<li');
							_$_.output_push('>');

							{
								_$_.output_push('<a');
								_$_.output_push(_$_.attr('href', item.href, false));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(item.text));
								}

								_$_.output_push('</a>');
							}

							_$_.output_push('</li>');
						}

						_$_.output_push('<!--]-->');
					}

					_$_.output_push('</ul>');
				}

				_$_.output_push('</div>');
			}

			__out += '<!--]--></aside></div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlWithServerData() {
	return _$_.tsrx_element(() => {
		const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';

		_$_.regular_block(() => {
			{
				const comp = DocLayout;

				const args = [
					{
						editPath: "docs/introduction.md",
						nextLink: { href: '/docs/quick-start', text: 'Quick Start' },
						toc: [
							{ href: '#intro', text: 'Introduction' },
							{ href: '#features', text: 'Features' }
						],

						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="vp-doc">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlWithClientDefaults() {
	return _$_.tsrx_element(() => {
		const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';

		_$_.regular_block(() => {
			{
				const comp = DocLayout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="vp-doc">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlWithUndefinedContent() {
	return _$_.tsrx_element(() => {
		const content = undefined;

		_$_.regular_block(() => {
			{
				const comp = DocLayout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="vp-doc">' + String(content ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function DynamicHeading({ level, children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			switch (level) {
				case 1:
					__out += '<h1 class="heading">';
					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(children);
					}
					__out += '</h1>';
					break;

				case 2:
					__out += '<h2 class="heading">';
					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(children);
					}
					__out += '</h2>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

function CodeBlock({ code }) {
	return _$_.tsrx_element(() => {
		const highlighted = `<pre class="shiki"><code>${code}</code></pre>`;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="code-block"><div class="header"><button>Copy</button><span class="lang">js</span></div><div class="content">' + String(highlighted ?? '') + '</div></div>';
			_$_.output_push(__out);
		});
	});
}

function ContentWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><div class="inner">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function HtmlAfterSwitchInChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ContentWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = DynamicHeading;

									_$_.output_push(__out);
									__out = '';

									const args = [
										{
											level: 1,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += 'Title';
													_$_.output_push(__out);
												});
											})
										}
									];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>First paragraph</p><p>Second paragraph</p>';

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>After code</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function IfHeading({ primary, children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (primary) {
				__out += '<h1 class="heading">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(children);
				}

				__out += '</h1>';
			} else {
				__out += '<h2 class="heading">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(children);
				}

				__out += '</h2>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function HtmlAfterIfInChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ContentWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = IfHeading;

									_$_.output_push(__out);
									__out = '';

									const args = [
										{
											primary: true,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += 'Title';
													_$_.output_push(__out);
												});
											})
										}
									];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>First paragraph</p><p>Second paragraph</p>';

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>After code</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function ForList({ items }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const item of items) {
				__out += '<span class="for-item">' + _$_.escape(item) + '</span>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function HtmlAfterForInChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ContentWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = ForList;
									const args = [{ items: ['Title', 'Subtitle'] }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>First paragraph</p>';

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>After code</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function TryBox({ value }) {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="try-box">' + _$_.escape(value) + '</div>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(e) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<span>error</span>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null
		);
	});
}

export function HtmlAfterTryInChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ContentWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = TryBox;
									const args = [{ value: "Title" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>First paragraph</p>';

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>After code</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function Boxed({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="boxed">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</span>';
			_$_.output_push(__out);
		});
	});
}

function IndirectHeading({ text }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Boxed;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += _$_.escape(text);
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlAfterComponentInChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ContentWrapper;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = IndirectHeading;
									const args = [{ text: "Title" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>First paragraph</p>';

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<p>After code</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function NavItem(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div' + _$_.attr('class', `nav-item${_$_.fallback(__props.active, false) ? ' active' : ''}`) + '><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.active, false)) {
				_$_.output_push('<div');
				_$_.output_push(' class="indicator"');
				_$_.output_push('>');
				_$_.output_push('</div>');
			}

			__out += '<!--]--><a' + _$_.attr('href', __props.href, false) + '><span>' + _$_.escape(__props.text) + '</span></a></div>';
			_$_.output_push(__out);
		});
	});
}

function SidebarSection({ title, children }) {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '6ac6906f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="sidebar-section"><div class="section-header"><h2>' + _$_.escape(title) + '</h2><button>Toggle</button></div><!--[-->';

			if (lazy.value) {
				__out += '<div class="section-items">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(children);
				}

				__out += '</div>';
			}

			__out += '<!--]--></section>';
			_$_.output_push(__out);
		});
	});
}

function SideNav({ currentPath }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<aside class="sidebar"><nav><div class="group">';

			{
				{
					const comp = SidebarSection;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							title: "Getting Started",
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = NavItem;

										const args = [
											{
												href: "/intro",
												text: "Introduction",
												active: currentPath === '/intro'
											}
										];

										_$_.render_component(comp, ...args);
									}

									{
										const comp = NavItem;

										const args = [
											{
												href: "/start",
												text: "Quick Start",
												active: currentPath === '/start'
											}
										];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</div><div class="group">';

			{
				{
					const comp = SidebarSection;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							title: "Guide",
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = NavItem;

										const args = [
											{
												href: "/guide/app",
												text: "Application",
												active: currentPath === '/guide/app'
											}
										];

										_$_.render_component(comp, ...args);
									}

									{
										const comp = NavItem;

										const args = [
											{
												href: "/guide/syntax",
												text: "Syntax",
												active: currentPath === '/guide/syntax'
											}
										];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</div></nav></aside>';
			_$_.output_push(__out);
		});
	});
}

function PageHeader() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<header class="page-header"><div class="logo">MyApp</div></header>';
			_$_.output_push(__out);
		});
	});
}

export function LayoutWithSidebarAndMain() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout">';

			{
				const comp = PageHeader;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div class="content-wrapper">';

			{
				const comp = SideNav;
				const args = [{ currentPath: "/intro" }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<main class="main-content"><div class="article"><div><h1>Introduction</h1><p>Welcome to the docs.</p></div></div><!--[-->';

			if (true) {
				__out += '<div class="edit-link"><a href="/edit">Edit</a></div>';
			}

			__out += '<!--]-->';

			{
				const comp = PageHeader;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</main></div></div>';
			_$_.output_push(__out);
		});
	});
}

function ArticleWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<article class="doc-content"><div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</div></article>';
			_$_.output_push(__out);
		});
	});
}

function SimpleFooter() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<footer class="doc-footer">Footer</footer>';
			_$_.output_push(__out);
		});
	});
}

export function ArticleWithChildrenThenSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="content-container">';

			{
				const comp = ArticleWrapper;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<h1>Title</h1><p>Content goes here.</p>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<!--[-->';

			if (true) {
				__out += '<div class="edit-link"><a href="/edit">Edit</a></div>';
			}

			__out += '<!--]--><!--[-->';

			if (true) {
				__out += '<nav class="prev-next"><a href="/prev">Previous</a></nav>';
			}

			__out += '<!--]-->';

			{
				const comp = SimpleFooter;
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

export function ArticleWithHtmlChildThenSibling() {
	return _$_.tsrx_element(() => {
		const htmlContent = '<pre><code>const x = 1;</code></pre>';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="content-container">';

			{
				const comp = ArticleWrapper;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<!--[-->';

			if (true) {
				__out += '<div class="edit-link"><a href="/edit">Edit</a></div>';
			}

			__out += '<!--]-->';

			{
				const comp = SimpleFooter;
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

function InlineArticleLayout({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="content-container"><article class="doc-content"><div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</div></article><!--[-->';

			if (true) {
				__out += '<div class="edit-link"><a href="/edit">Edit</a></div>';
			}

			__out += '<!--]-->';

			{
				const comp = SimpleFooter;
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

export function InlineArticleWithHtmlChild() {
	return _$_.tsrx_element(() => {
		const htmlContent = '<pre><code>const x = 1;</code></pre>';

		_$_.regular_block(() => {
			{
				const comp = InlineArticleLayout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function HeaderStub() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<header class="header">Header</header>';
			_$_.output_push(__out);
		});
	});
}

function SidebarStub() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<aside class="sidebar">Sidebar</aside>';
			_$_.output_push(__out);
		});
	});
}

function FooterStub() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<footer class="footer">Footer</footer>';
			_$_.output_push(__out);
		});
	});
}

function DocsLayoutInner(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout">';

			{
				const comp = HeaderStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div class="docs-wrapper">';

			{
				const comp = SidebarStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<main class="docs-main"><div class="docs-container"><div class="content"><div class="content-container"><article class="doc-content"><div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(__props.children);
			}

			__out += '</div></article><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.editPath, '')) {
				_$_.output_push('<div');
				_$_.output_push(' class="edit-link"');
				_$_.output_push('>');

				{
					_$_.output_push('<a');
					_$_.output_push(' href="/edit"');
					_$_.output_push('>');

					{
						_$_.output_push('Edit on GitHub');
					}

					_$_.output_push('</a>');
				}

				_$_.output_push('</div>');
			}

			__out += '<!--]--><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.nextLink, null)) {
				_$_.output_push('<nav');
				_$_.output_push(' class="prev-next"');
				_$_.output_push('>');

				{
					_$_.output_push('<a');
					_$_.output_push(_$_.attr('href', _$_.fallback(__props.nextLink, null).href, false));
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.fallback(__props.nextLink, null).text));
					}

					_$_.output_push('</a>');
				}

				_$_.output_push('</nav>');
			}

			__out += '<!--]-->';

			{
				const comp = FooterStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div></div></div></main></div></div>';
			_$_.output_push(__out);
		});
	});
}

export function DocsLayoutWithData() {
	return _$_.tsrx_element(() => {
		const htmlContent = '<h1>Title</h1><p>Content</p>';

		_$_.regular_block(() => {
			{
				const comp = DocsLayoutInner;

				const args = [
					{
						editPath: "docs/styling.md",
						nextLink: { href: '/next', text: 'Next' },
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function DocsLayoutWithoutData() {
	return _$_.tsrx_element(() => {
		const htmlContent = undefined;

		_$_.regular_block(() => {
			{
				const comp = DocsLayoutInner;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function DocsLayoutExact(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout">';

			{
				const comp = HeaderStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div class="docs-wrapper">';

			{
				const comp = SidebarStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<main class="docs-main"><div class="docs-container"><div class="content"><div class="content-container"><article class="doc-content"><div>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(__props.children);
			}

			__out += '</div></article><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.editPath, '')) {
				_$_.output_push('<div');
				_$_.output_push(' class="edit-link"');
				_$_.output_push('>');

				{
					_$_.output_push('<a');
					_$_.output_push(_$_.attr('href', `/edit/${_$_.fallback(__props.editPath, '')}`, false));
					_$_.output_push('>');

					{
						_$_.output_push('Edit on GitHub');
					}

					_$_.output_push('</a>');
				}

				_$_.output_push('</div>');
			}

			__out += '<!--]--><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.prevLink, null) || _$_.fallback(__props.nextLink, null)) {
				_$_.output_push('<nav');
				_$_.output_push(' class="prev-next"');
				_$_.output_push('>');

				{
					_$_.output_push('<!--[-->');

					if (_$_.fallback(__props.prevLink, null)) {
						_$_.output_push('<a');
						_$_.output_push(_$_.attr('href', _$_.fallback(__props.prevLink, null).href, false));
						_$_.output_push(' class="pager prev"');
						_$_.output_push('>');

						{
							_$_.output_push('<span');
							_$_.output_push(' class="title"');
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(_$_.fallback(__props.prevLink, null).text));
							}

							_$_.output_push('</span>');
						}

						_$_.output_push('</a>');
					} else {
						_$_.output_push('<span');
						_$_.output_push('>');
						_$_.output_push('</span>');
					}

					_$_.output_push('<!--]-->');
					_$_.output_push('<!--[-->');

					if (_$_.fallback(__props.nextLink, null)) {
						_$_.output_push('<a');
						_$_.output_push(_$_.attr('href', _$_.fallback(__props.nextLink, null).href, false));
						_$_.output_push(' class="pager next"');
						_$_.output_push('>');

						{
							_$_.output_push('<span');
							_$_.output_push(' class="title"');
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(_$_.fallback(__props.nextLink, null).text));
							}

							_$_.output_push('</span>');
						}

						_$_.output_push('</a>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('</nav>');
			}

			__out += '<!--]-->';

			{
				const comp = FooterStub;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</div></div><aside class="aside"><!--[-->';
			_$_.output_push(__out);
			__out = '';

			if (_$_.fallback(__props.toc, []).length > 0) {
				_$_.output_push('<div');
				_$_.output_push(' class="aside-content"');
				_$_.output_push('>');

				{
					_$_.output_push('<nav');
					_$_.output_push(' class="outline"');
					_$_.output_push('>');

					{
						_$_.output_push('<!--[-->');

						for (const item of _$_.fallback(__props.toc, [])) {
							_$_.output_push('<a');
							_$_.output_push(_$_.attr('href', item.href, false));
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(item.text));
							}

							_$_.output_push('</a>');
						}

						_$_.output_push('<!--]-->');
					}

					_$_.output_push('</nav>');
				}

				_$_.output_push('</div>');
			}

			__out += '<!--]--></aside></div></main></div></div>';
			_$_.output_push(__out);
		});
	});
}

export function DocsLayoutExactWithData() {
	return _$_.tsrx_element(() => {
		const htmlContent = '<h1>Styling Guide</h1><p>Content</p>';

		_$_.regular_block(() => {
			{
				const comp = DocsLayoutExact;

				const args = [
					{
						editPath: "docs/guide/styling.md",
						prevLink: { href: '/prev', text: 'Previous' },
						nextLink: { href: '/next', text: 'Next' },
						toc: [
							{ href: '#intro', text: 'Introduction' },
							{ href: '#usage', text: 'Usage' }
						],

						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function DocsLayoutExactWithoutData() {
	return _$_.tsrx_element(() => {
		const htmlContent = undefined;
		const editPath = undefined;
		const prevLink = undefined;
		const nextLink = undefined;
		const toc = undefined;

		_$_.regular_block(() => {
			{
				const comp = DocsLayoutExact;

				const args = [
					{
						editPath,
						prevLink,
						nextLink,
						toc,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(htmlContent ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function TemplateWithHtmlContent() {
	return _$_.tsrx_element(() => {
		const data = { title: 'Test', value: 42 };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><template id="t1">' + String(JSON.stringify(data) ?? '') + '</template><p class="content">Main content</p></div>';
			_$_.output_push(__out);
		});
	});
}

export function TemplateWithHtmlAndSiblings() {
	return _$_.tsrx_element(() => {
		const data = { name: 'Ripple', version: '1.0' };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><h1>Title</h1><template id="data-template">' + String(JSON.stringify(data) ?? '') + '</template><p class="after-template">Content after template</p></div>';
			_$_.output_push(__out);
		});
	});
}

function LayoutWithTemplate({ children, data }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout"><template id="page-data">' + String(JSON.stringify(data) ?? '') + '</template><main>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(children);
			}

			__out += '</main></div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedTemplateInLayout() {
	return _$_.tsrx_element(() => {
		const doc = { title: 'Comparison', html: '<p>Content</p>' };

		_$_.regular_block(() => {
			{
				const comp = LayoutWithTemplate;

				const args = [
					{
						data: doc,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="doc-content">' + String(doc.html ?? '') + '</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function HtmlCodeBlocksWithSiblingChain() {
	return _$_.tsrx_element(() => {
		const html1 = '<span class="kw">const</span> <span class="id">a</span> = 1;';
		const html2 = '<span class="kw">const</span> <span class="id">b</span> = 2;';
		const html3 = '<span class="kw">const</span> <span class="id">c</span> = 3;';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="readable-section"><p>Ergonomics</p><h2>Sibling traversal pattern</h2><p>Before first block</p><p>Before second block</p><pre class="code-block"><code>' + String(html1 ?? '') + '</code></pre><p>Between one and two</p><pre class="code-block"><code>' + String(html2 ?? '') + '</code></pre><p>Between two and three</p><pre class="code-block"><code>' + String(html3 ?? '') + '</code></pre></section>';
			_$_.output_push(__out);
		});
	});
}