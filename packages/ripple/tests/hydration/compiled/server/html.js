// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Fragment, track } from 'ripple/server';

export function StaticHtml() {
	return _$_.tsrx_element(() => {
		const html = '<p><strong>Bold</strong> text</p>';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');
			_$_.output_push(String(html ?? ''));
			_$_.output_push('</div>');
		});
	});
}

export function DynamicHtml() {
	return _$_.tsrx_element(() => {
		const content = '<p>Dynamic <span>HTML</span> content</p>';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');
			_$_.output_push(String(content ?? ''));
			_$_.output_push('</div>');
		});
	});
}

export function EmptyHtml() {
	return _$_.tsrx_element(() => {
		const html = '';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');
			_$_.output_push(String(html ?? ''));
			_$_.output_push('</div>');
		});
	});
}

export function ComplexHtml() {
	return _$_.tsrx_element(() => {
		const html = '<div class="nested"><span>Nested <em>content</em></span></div>';

		_$_.regular_block(() => {
			_$_.output_push('<section');
			_$_.output_push('>');
			_$_.output_push(String(html ?? ''));
			_$_.output_push('</section>');
		});
	});
}

export function MultipleHtml() {
	return _$_.tsrx_element(() => {
		const html1 = '<p>First paragraph</p>';
		const html2 = '<p>Second paragraph</p>';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				const html_value = String(html1 ?? '');

				_$_.output_push('<!--' + _$_.simple_hash(html_value) + '-->');
				_$_.output_push(html_value);
				_$_.output_push('<!---->');

				const html_value_1 = String(html2 ?? '');

				_$_.output_push('<!--' + _$_.simple_hash(html_value_1) + '-->');
				_$_.output_push(html_value_1);
				_$_.output_push('<!---->');
			}

			_$_.output_push('</div>');
		});
	});
}

export function HtmlWithReactivity() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<!--1tb17hh-->');
				_$_.output_push('<p>Count: 0</p>');
				_$_.output_push('<!---->');
				_$_.output_push('<button');
				_$_.output_push('>');

				{
					_$_.output_push('Increment');
				}

				_$_.output_push('</button>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function HtmlWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="wrapper"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="inner"');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="vp-doc"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<h1');
								_$_.output_push('>');

								{
									_$_.output_push('Title');
								}

								_$_.output_push('</h1>');
								_$_.output_push('<div');
								_$_.output_push(' class="content"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc"');
								_$_.output_push('>');

								{
									const html_value_2 = String(html1 ?? '');

									_$_.output_push('<!--' + _$_.simple_hash(html_value_2) + '-->');
									_$_.output_push(html_value_2);
									_$_.output_push('<!---->');

									const html_value_3 = String(html2 ?? '');

									_$_.output_push('<!--' + _$_.simple_hash(html_value_3) + '-->');
									_$_.output_push(html_value_3);
									_$_.output_push('<!---->');
								}

								_$_.output_push('</div>');
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
			_$_.output_push('<div');
			_$_.output_push('>');
			_$_.output_push(String(content ?? ''));
			_$_.output_push('</div>');
		});
	});
}

export function HtmlWithEmptyComment() {
	return _$_.tsrx_element(() => {
		const content = '<p>Before</p><!----><p>After</p>';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');
			_$_.output_push(String(content ?? ''));
			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="vp-doc"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
			_$_.output_push('<footer');
			_$_.output_push(' class="doc-footer"');
			_$_.output_push('>');

			{
				_$_.output_push('Footer content');
			}

			_$_.output_push('</footer>');
		});
	});
}

export function DocLayout({ children, editPath = '', nextLink = null, toc = [] }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="content-container"');
				_$_.output_push('>');

				{
					_$_.output_push('<article');
					_$_.output_push('>');

					{
						_$_.output_push('<div');
						_$_.output_push('>');

						{
							_$_.render_expression(children);
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('</article>');
					_$_.output_push('<!--[-->');

					if (editPath) {
						_$_.output_push('<div');
						_$_.output_push(' class="edit-link"');
						_$_.output_push('>');

						{
							_$_.output_push('<a');
							_$_.output_push(_$_.attr('href', `https://github.com/edit/${editPath}`, false));
							_$_.output_push('>');

							{
								_$_.output_push('Edit');
							}

							_$_.output_push('</a>');
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('<!--]-->');
					_$_.output_push('<!--[-->');

					if (nextLink) {
						_$_.output_push('<nav');
						_$_.output_push(' class="prev-next"');
						_$_.output_push('>');

						{
							_$_.output_push('<a');
							_$_.output_push(_$_.attr('href', nextLink.href, false));
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(nextLink.text));
							}

							_$_.output_push('</a>');
						}

						_$_.output_push('</nav>');
					}

					_$_.output_push('<!--]-->');

					{
						const comp = DocFooter;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				}

				_$_.output_push('</div>');
				_$_.output_push('<aside');
				_$_.output_push('>');

				{
					_$_.output_push('<!--[-->');

					if (toc.length > 0) {
						_$_.output_push('<div');
						_$_.output_push(' class="toc"');
						_$_.output_push('>');

						{
							_$_.output_push('<ul');
							_$_.output_push('>');

							{
								_$_.output_push('<!--[-->');

								for (const item of toc) {
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

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('</aside>');
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="vp-doc"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="vp-doc"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="vp-doc"');
								_$_.output_push('>');
								_$_.output_push(String(content ?? ''));
								_$_.output_push('</div>');
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
			_$_.output_push('<!--[-->');

			switch (level) {
				case 1:
					_$_.output_push('<h1');
					_$_.output_push(' class="heading"');
					_$_.output_push('>');
					{
						_$_.render_expression(children);
					}
					_$_.output_push('</h1>');
					break;

				case 2:
					_$_.output_push('<h2');
					_$_.output_push(' class="heading"');
					_$_.output_push('>');
					{
						_$_.render_expression(children);
					}
					_$_.output_push('</h2>');
					break;
			}

			_$_.output_push('<!--]-->');
		});
	});
}

function CodeBlock({ code }) {
	return _$_.tsrx_element(() => {
		const highlighted = `<pre class="shiki"><code>${code}</code></pre>`;

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="code-block"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="header"');
				_$_.output_push('>');

				{
					_$_.output_push('<button');
					_$_.output_push('>');

					{
						_$_.output_push('Copy');
					}

					_$_.output_push('</button>');
					_$_.output_push('<span');
					_$_.output_push(' class="lang"');
					_$_.output_push('>');

					{
						_$_.output_push('js');
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
				_$_.output_push('<div');
				_$_.output_push(' class="content"');
				_$_.output_push('>');
				_$_.output_push(String(highlighted ?? ''));
				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
		});
	});
}

function ContentWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="wrapper"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="inner"');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
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
								{
									const comp = DynamicHeading;

									const args = [
										{
											level: 1,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													_$_.output_push('Title');
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}

								_$_.output_push('<p');
								_$_.output_push('>');

								{
									_$_.output_push('First paragraph');
								}

								_$_.output_push('</p>');
								_$_.output_push('<p');
								_$_.output_push('>');

								{
									_$_.output_push('Second paragraph');
								}

								_$_.output_push('</p>');

								{
									const comp = CodeBlock;
									const args = [{ code: "const x = 1;" }];

									_$_.render_component(comp, ...args);
								}

								_$_.output_push('<p');
								_$_.output_push('>');

								{
									_$_.output_push('After code');
								}

								_$_.output_push('</p>');
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function NavItem({ href, text: label, active = false }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(_$_.attr('class', `nav-item${active ? ' active' : ''}`));
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				if (active) {
					_$_.output_push('<div');
					_$_.output_push(' class="indicator"');
					_$_.output_push('>');
					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
				_$_.output_push('<a');
				_$_.output_push(_$_.attr('href', href, false));
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(label));
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</a>');
			}

			_$_.output_push('</div>');
		});
	});
}

function SidebarSection({ title, children }) {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '6ac6906f');

		_$_.regular_block(() => {
			_$_.output_push('<section');
			_$_.output_push(' class="sidebar-section"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="section-header"');
				_$_.output_push('>');

				{
					_$_.output_push('<h2');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(title));
					}

					_$_.output_push('</h2>');
					_$_.output_push('<button');
					_$_.output_push('>');

					{
						_$_.output_push('Toggle');
					}

					_$_.output_push('</button>');
				}

				_$_.output_push('</div>');
				_$_.output_push('<!--[-->');

				if (lazy.value) {
					_$_.output_push('<div');
					_$_.output_push(' class="section-items"');
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
	});
}

function SideNav({ currentPath }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<aside');
			_$_.output_push(' class="sidebar"');
			_$_.output_push('>');

			{
				_$_.output_push('<nav');
				_$_.output_push('>');

				{
					_$_.output_push('<div');
					_$_.output_push(' class="group"');
					_$_.output_push('>');

					{
						{
							const comp = SidebarSection;

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

							_$_.render_component(comp, ...args);
						}
					}

					_$_.output_push('</div>');
					_$_.output_push('<div');
					_$_.output_push(' class="group"');
					_$_.output_push('>');

					{
						{
							const comp = SidebarSection;

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

							_$_.render_component(comp, ...args);
						}
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('</nav>');
			}

			_$_.output_push('</aside>');
		});
	});
}

function PageHeader() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<header');
			_$_.output_push(' class="page-header"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="logo"');
				_$_.output_push('>');

				{
					_$_.output_push('MyApp');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</header>');
		});
	});
}

export function LayoutWithSidebarAndMain() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				{
					const comp = PageHeader;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<div');
				_$_.output_push(' class="content-wrapper"');
				_$_.output_push('>');

				{
					{
						const comp = SideNav;
						const args = [{ currentPath: "/intro" }];

						_$_.render_component(comp, ...args);
					}

					_$_.output_push('<main');
					_$_.output_push(' class="main-content"');
					_$_.output_push('>');

					{
						_$_.output_push('<div');
						_$_.output_push(' class="article"');
						_$_.output_push('>');

						{
							_$_.output_push('<div');
							_$_.output_push('>');

							{
								_$_.output_push('<h1');
								_$_.output_push('>');

								{
									_$_.output_push('Introduction');
								}

								_$_.output_push('</h1>');
								_$_.output_push('<p');
								_$_.output_push('>');

								{
									_$_.output_push('Welcome to the docs.');
								}

								_$_.output_push('</p>');
							}

							_$_.output_push('</div>');
						}

						_$_.output_push('</div>');
						_$_.output_push('<!--[-->');

						if (true) {
							_$_.output_push('<div');
							_$_.output_push(' class="edit-link"');
							_$_.output_push('>');

							{
								_$_.output_push('<a');
								_$_.output_push(' href="/edit"');
								_$_.output_push('>');

								{
									_$_.output_push('Edit');
								}

								_$_.output_push('</a>');
							}

							_$_.output_push('</div>');
						}

						_$_.output_push('<!--]-->');

						{
							const comp = PageHeader;
							const args = [{}];

							_$_.render_component(comp, ...args);
						}
					}

					_$_.output_push('</main>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
		});
	});
}

function ArticleWrapper({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<article');
			_$_.output_push(' class="doc-content"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</article>');
		});
	});
}

function SimpleFooter() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<footer');
			_$_.output_push(' class="doc-footer"');
			_$_.output_push('>');

			{
				_$_.output_push('Footer');
			}

			_$_.output_push('</footer>');
		});
	});
}

export function ArticleWithChildrenThenSibling() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="content-container"');
			_$_.output_push('>');

			{
				{
					const comp = ArticleWrapper;

					const args = [
						{
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.output_push('<h1');
									_$_.output_push('>');

									{
										_$_.output_push('Title');
									}

									_$_.output_push('</h1>');
									_$_.output_push('<p');
									_$_.output_push('>');

									{
										_$_.output_push('Content goes here.');
									}

									_$_.output_push('</p>');
								});
							})
						}
					];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<!--[-->');

				if (true) {
					_$_.output_push('<div');
					_$_.output_push(' class="edit-link"');
					_$_.output_push('>');

					{
						_$_.output_push('<a');
						_$_.output_push(' href="/edit"');
						_$_.output_push('>');

						{
							_$_.output_push('Edit');
						}

						_$_.output_push('</a>');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
				_$_.output_push('<!--[-->');

				if (true) {
					_$_.output_push('<nav');
					_$_.output_push(' class="prev-next"');
					_$_.output_push('>');

					{
						_$_.output_push('<a');
						_$_.output_push(' href="/prev"');
						_$_.output_push('>');

						{
							_$_.output_push('Previous');
						}

						_$_.output_push('</a>');
					}

					_$_.output_push('</nav>');
				}

				_$_.output_push('<!--]-->');

				{
					const comp = SimpleFooter;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

export function ArticleWithHtmlChildThenSibling() {
	return _$_.tsrx_element(() => {
		const htmlContent = '<pre><code>const x = 1;</code></pre>';

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="content-container"');
			_$_.output_push('>');

			{
				{
					const comp = ArticleWrapper;

					const args = [
						{
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.output_push('<div');
									_$_.output_push(' class="doc-content"');
									_$_.output_push('>');
									_$_.output_push(String(htmlContent ?? ''));
									_$_.output_push('</div>');
								});
							})
						}
					];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<!--[-->');

				if (true) {
					_$_.output_push('<div');
					_$_.output_push(' class="edit-link"');
					_$_.output_push('>');

					{
						_$_.output_push('<a');
						_$_.output_push(' href="/edit"');
						_$_.output_push('>');

						{
							_$_.output_push('Edit');
						}

						_$_.output_push('</a>');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');

				{
					const comp = SimpleFooter;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
		});
	});
}

function InlineArticleLayout({ children }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="content-container"');
			_$_.output_push('>');

			{
				_$_.output_push('<article');
				_$_.output_push(' class="doc-content"');
				_$_.output_push('>');

				{
					_$_.output_push('<div');
					_$_.output_push('>');

					{
						_$_.render_expression(children);
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('</article>');
				_$_.output_push('<!--[-->');

				if (true) {
					_$_.output_push('<div');
					_$_.output_push(' class="edit-link"');
					_$_.output_push('>');

					{
						_$_.output_push('<a');
						_$_.output_push(' href="/edit"');
						_$_.output_push('>');

						{
							_$_.output_push('Edit');
						}

						_$_.output_push('</a>');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');

				{
					const comp = SimpleFooter;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(htmlContent ?? ''));
								_$_.output_push('</div>');
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
			_$_.output_push('<header');
			_$_.output_push(' class="header"');
			_$_.output_push('>');

			{
				_$_.output_push('Header');
			}

			_$_.output_push('</header>');
		});
	});
}

function SidebarStub() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<aside');
			_$_.output_push(' class="sidebar"');
			_$_.output_push('>');

			{
				_$_.output_push('Sidebar');
			}

			_$_.output_push('</aside>');
		});
	});
}

function FooterStub() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<footer');
			_$_.output_push(' class="footer"');
			_$_.output_push('>');

			{
				_$_.output_push('Footer');
			}

			_$_.output_push('</footer>');
		});
	});
}

function DocsLayoutInner({ children, editPath = '', nextLink = null }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				{
					const comp = HeaderStub;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<div');
				_$_.output_push(' class="docs-wrapper"');
				_$_.output_push('>');

				{
					{
						const comp = SidebarStub;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}

					_$_.output_push('<main');
					_$_.output_push(' class="docs-main"');
					_$_.output_push('>');

					{
						_$_.output_push('<div');
						_$_.output_push(' class="docs-container"');
						_$_.output_push('>');

						{
							_$_.output_push('<div');
							_$_.output_push(' class="content"');
							_$_.output_push('>');

							{
								_$_.output_push('<div');
								_$_.output_push(' class="content-container"');
								_$_.output_push('>');

								{
									_$_.output_push('<article');
									_$_.output_push(' class="doc-content"');
									_$_.output_push('>');

									{
										_$_.output_push('<div');
										_$_.output_push('>');

										{
											_$_.render_expression(children);
										}

										_$_.output_push('</div>');
									}

									_$_.output_push('</article>');
									_$_.output_push('<!--[-->');

									if (editPath) {
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

									_$_.output_push('<!--]-->');
									_$_.output_push('<!--[-->');

									if (nextLink) {
										_$_.output_push('<nav');
										_$_.output_push(' class="prev-next"');
										_$_.output_push('>');

										{
											_$_.output_push('<a');
											_$_.output_push(_$_.attr('href', nextLink.href, false));
											_$_.output_push('>');

											{
												_$_.output_push(_$_.escape(nextLink.text));
											}

											_$_.output_push('</a>');
										}

										_$_.output_push('</nav>');
									}

									_$_.output_push('<!--]-->');

									{
										const comp = FooterStub;
										const args = [{}];

										_$_.render_component(comp, ...args);
									}
								}

								_$_.output_push('</div>');
							}

							_$_.output_push('</div>');
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('</main>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(htmlContent ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(htmlContent ?? ''));
								_$_.output_push('</div>');
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function DocsLayoutExact(
	{
		children,
		editPath = '',
		prevLink = null,
		nextLink = null,
		toc = []
	}
) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				{
					const comp = HeaderStub;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<div');
				_$_.output_push(' class="docs-wrapper"');
				_$_.output_push('>');

				{
					{
						const comp = SidebarStub;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}

					_$_.output_push('<main');
					_$_.output_push(' class="docs-main"');
					_$_.output_push('>');

					{
						_$_.output_push('<div');
						_$_.output_push(' class="docs-container"');
						_$_.output_push('>');

						{
							_$_.output_push('<div');
							_$_.output_push(' class="content"');
							_$_.output_push('>');

							{
								_$_.output_push('<div');
								_$_.output_push(' class="content-container"');
								_$_.output_push('>');

								{
									_$_.output_push('<article');
									_$_.output_push(' class="doc-content"');
									_$_.output_push('>');

									{
										_$_.output_push('<div');
										_$_.output_push('>');

										{
											_$_.render_expression(children);
										}

										_$_.output_push('</div>');
									}

									_$_.output_push('</article>');
									_$_.output_push('<!--[-->');

									if (editPath) {
										_$_.output_push('<div');
										_$_.output_push(' class="edit-link"');
										_$_.output_push('>');

										{
											_$_.output_push('<a');
											_$_.output_push(_$_.attr('href', `/edit/${editPath}`, false));
											_$_.output_push('>');

											{
												_$_.output_push('Edit on GitHub');
											}

											_$_.output_push('</a>');
										}

										_$_.output_push('</div>');
									}

									_$_.output_push('<!--]-->');
									_$_.output_push('<!--[-->');

									if (prevLink || nextLink) {
										_$_.output_push('<nav');
										_$_.output_push(' class="prev-next"');
										_$_.output_push('>');

										{
											_$_.output_push('<!--[-->');

											if (prevLink) {
												_$_.output_push('<a');
												_$_.output_push(_$_.attr('href', prevLink.href, false));
												_$_.output_push(' class="pager prev"');
												_$_.output_push('>');

												{
													_$_.output_push('<span');
													_$_.output_push(' class="title"');
													_$_.output_push('>');

													{
														_$_.output_push(_$_.escape(prevLink.text));
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

											if (nextLink) {
												_$_.output_push('<a');
												_$_.output_push(_$_.attr('href', nextLink.href, false));
												_$_.output_push(' class="pager next"');
												_$_.output_push('>');

												{
													_$_.output_push('<span');
													_$_.output_push(' class="title"');
													_$_.output_push('>');

													{
														_$_.output_push(_$_.escape(nextLink.text));
													}

													_$_.output_push('</span>');
												}

												_$_.output_push('</a>');
											}

											_$_.output_push('<!--]-->');
										}

										_$_.output_push('</nav>');
									}

									_$_.output_push('<!--]-->');

									{
										const comp = FooterStub;
										const args = [{}];

										_$_.render_component(comp, ...args);
									}
								}

								_$_.output_push('</div>');
							}

							_$_.output_push('</div>');
							_$_.output_push('<aside');
							_$_.output_push(' class="aside"');
							_$_.output_push('>');

							{
								_$_.output_push('<!--[-->');

								if (toc.length > 0) {
									_$_.output_push('<div');
									_$_.output_push(' class="aside-content"');
									_$_.output_push('>');

									{
										_$_.output_push('<nav');
										_$_.output_push(' class="outline"');
										_$_.output_push('>');

										{
											_$_.output_push('<!--[-->');

											for (const item of toc) {
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

								_$_.output_push('<!--]-->');
							}

							_$_.output_push('</aside>');
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('</main>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(htmlContent ?? ''));
								_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(htmlContent ?? ''));
								_$_.output_push('</div>');
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
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<template');
				_$_.output_push(' id="t1"');
				_$_.output_push('>');
				_$_.output_push(String(JSON.stringify(data) ?? ''));
				_$_.output_push('</template>');
				_$_.output_push('<p');
				_$_.output_push(' class="content"');
				_$_.output_push('>');

				{
					_$_.output_push('Main content');
				}

				_$_.output_push('</p>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function TemplateWithHtmlAndSiblings() {
	return _$_.tsrx_element(() => {
		const data = { name: 'Ripple', version: '1.0' };

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="wrapper"');
			_$_.output_push('>');

			{
				_$_.output_push('<h1');
				_$_.output_push('>');

				{
					_$_.output_push('Title');
				}

				_$_.output_push('</h1>');
				_$_.output_push('<template');
				_$_.output_push(' id="data-template"');
				_$_.output_push('>');
				_$_.output_push(String(JSON.stringify(data) ?? ''));
				_$_.output_push('</template>');
				_$_.output_push('<p');
				_$_.output_push(' class="after-template"');
				_$_.output_push('>');

				{
					_$_.output_push('Content after template');
				}

				_$_.output_push('</p>');
			}

			_$_.output_push('</div>');
		});
	});
}

function LayoutWithTemplate({ children, data }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				_$_.output_push('<template');
				_$_.output_push(' id="page-data"');
				_$_.output_push('>');
				_$_.output_push(String(JSON.stringify(data) ?? ''));
				_$_.output_push('</template>');
				_$_.output_push('<main');
				_$_.output_push('>');

				{
					_$_.render_expression(children);
				}

				_$_.output_push('</main>');
			}

			_$_.output_push('</div>');
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
								_$_.output_push('<div');
								_$_.output_push(' class="doc-content"');
								_$_.output_push('>');
								_$_.output_push(String(doc.html ?? ''));
								_$_.output_push('</div>');
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
			_$_.output_push('<section');
			_$_.output_push(' class="readable-section"');
			_$_.output_push('>');

			{
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Ergonomics');
				}

				_$_.output_push('</p>');
				_$_.output_push('<h2');
				_$_.output_push('>');

				{
					_$_.output_push('Sibling traversal pattern');
				}

				_$_.output_push('</h2>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Before first block');
				}

				_$_.output_push('</p>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Before second block');
				}

				_$_.output_push('</p>');
				_$_.output_push('<pre');
				_$_.output_push(' class="code-block"');
				_$_.output_push('>');

				{
					_$_.output_push('<code');
					_$_.output_push('>');
					_$_.output_push(String(html1 ?? ''));
					_$_.output_push('</code>');
				}

				_$_.output_push('</pre>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Between one and two');
				}

				_$_.output_push('</p>');
				_$_.output_push('<pre');
				_$_.output_push(' class="code-block"');
				_$_.output_push('>');

				{
					_$_.output_push('<code');
					_$_.output_push('>');
					_$_.output_push(String(html2 ?? ''));
					_$_.output_push('</code>');
				}

				_$_.output_push('</pre>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('Between two and three');
				}

				_$_.output_push('</p>');
				_$_.output_push('<pre');
				_$_.output_push(' class="code-block"');
				_$_.output_push('>');

				{
					_$_.output_push('<code');
					_$_.output_push('>');
					_$_.output_push(String(html3 ?? ''));
					_$_.output_push('</code>');
				}

				_$_.output_push('</pre>');
			}

			_$_.output_push('</section>');
		});
	});
}