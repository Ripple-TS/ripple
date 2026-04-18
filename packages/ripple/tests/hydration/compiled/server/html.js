// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticHtml() {
	_$_.push_component();

	const html = '<p><strong>Bold</strong> text</p>';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value = String(html ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value) + '-->');
			_$_.output_push(html_value);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function DynamicHtml() {
	_$_.push_component();

	const content = '<p>Dynamic <span>HTML</span> content</p>';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value_1 = String(content ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_1) + '-->');
			_$_.output_push(html_value_1);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function EmptyHtml() {
	_$_.push_component();

	const html = '';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value_2 = String(html ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_2) + '-->');
			_$_.output_push(html_value_2);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ComplexHtml() {
	_$_.push_component();

	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';

	_$_.regular_block(() => {
		_$_.output_push('<section');
		_$_.output_push('>');

		{
			const html_value_3 = String(html ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_3) + '-->');
			_$_.output_push(html_value_3);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</section>');
	});

	_$_.pop_component();
}

export function MultipleHtml() {
	_$_.push_component();

	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value_4 = String(html1 ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_4) + '-->');
			_$_.output_push(html_value_4);
			_$_.output_push('<!---->');

			const html_value_5 = String(html2 ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_5) + '-->');
			_$_.output_push(html_value_5);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function HtmlWithReactivity() {
	_$_.push_component();

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

	_$_.pop_component();
}

export function HtmlWrapper({ children }) {
	_$_.push_component();

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

	_$_.pop_component();
}

export function HtmlInChildren() {
	_$_.push_component();

	const content = '<p><strong>Bold</strong> text</p>';

	_$_.regular_block(() => {
		{
			const comp = HtmlWrapper;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="vp-doc"');
						_$_.output_push('>');

						{
							const html_value_6 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_6) + '-->');
							_$_.output_push(html_value_6);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function HtmlInChildrenWithSiblings() {
	_$_.push_component();

	const content = '<p>Dynamic content</p>';

	_$_.regular_block(() => {
		{
			const comp = HtmlWrapper;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<h1');
						_$_.output_push('>');

						{
							_$_.output_push('Title');
						}

						_$_.output_push('</h1>');
						_$_.output_push('<div');
						_$_.output_push(' class="content"');
						_$_.output_push('>');

						{
							const html_value_7 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_7) + '-->');
							_$_.output_push(html_value_7);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function MultipleHtmlInChildren() {
	_$_.push_component();

	const html1 = '<p>First</p>';
	const html2 = '<p>Second</p>';

	_$_.regular_block(() => {
		{
			const comp = HtmlWrapper;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc"');
						_$_.output_push('>');

						{
							const html_value_8 = String(html1 ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_8) + '-->');
							_$_.output_push(html_value_8);
							_$_.output_push('<!---->');

							const html_value_9 = String(html2 ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_9) + '-->');
							_$_.output_push(html_value_9);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function HtmlWithComments() {
	_$_.push_component();

	const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value_10 = String(content ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_10) + '-->');
			_$_.output_push(html_value_10);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function HtmlWithEmptyComment() {
	_$_.push_component();

	const content = '<p>Before</p><!----><p>After</p>';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			const html_value_11 = String(content ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_11) + '-->');
			_$_.output_push(html_value_11);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function HtmlWithCommentsInChildren() {
	_$_.push_component();

	const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';

	_$_.regular_block(() => {
		{
			const comp = HtmlWrapper;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="vp-doc"');
						_$_.output_push('>');

						{
							const html_value_12 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_12) + '-->');
							_$_.output_push(html_value_12);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

function DocFooter() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<footer');
		_$_.output_push(' class="doc-footer"');
		_$_.output_push('>');

		{
			_$_.output_push('Footer content');
		}

		_$_.output_push('</footer>');
	});

	_$_.pop_component();
}

export function DocLayout({ children, editPath = '', nextLink = null, toc = [] }) {
	_$_.push_component();

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

					comp(...args);
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

	_$_.pop_component();
}

export function HtmlWithServerData() {
	_$_.push_component();

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

					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="vp-doc"');
						_$_.output_push('>');

						{
							const html_value_13 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_13) + '-->');
							_$_.output_push(html_value_13);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function HtmlWithClientDefaults() {
	_$_.push_component();

	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';

	_$_.regular_block(() => {
		{
			const comp = DocLayout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="vp-doc"');
						_$_.output_push('>');

						{
							const html_value_14 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_14) + '-->');
							_$_.output_push(html_value_14);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function HtmlWithUndefinedContent() {
	_$_.push_component();

	const content = undefined;

	_$_.regular_block(() => {
		{
			const comp = DocLayout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="vp-doc"');
						_$_.output_push('>');

						{
							const html_value_15 = String(content ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_15) + '-->');
							_$_.output_push(html_value_15);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

function DynamicHeading({ level, children }) {
	_$_.push_component();

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

			case 2:
				_$_.output_push('<h2');
				_$_.output_push(' class="heading"');
				_$_.output_push('>');
				{
					_$_.render_expression(children);
				}
				_$_.output_push('</h2>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

function CodeBlock({ code }) {
	_$_.push_component();

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

			{
				const html_value_16 = String(highlighted ?? '');

				_$_.output_push('<!--' + _$_.hash(html_value_16) + '-->');
				_$_.output_push(html_value_16);
				_$_.output_push('<!---->');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function ContentWrapper({ children }) {
	_$_.push_component();

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

	_$_.pop_component();
}

export function HtmlAfterSwitchInChildren() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = ContentWrapper;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();

						{
							const comp = DynamicHeading;

							const args = [
								{
									level: 1,
									children: _$_.ripple_element(function render_children() {
										_$_.push_component();
										_$_.output_push('Title');
										_$_.pop_component();
									})
								}
							];

							comp(...args);
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

							comp(...args);
						}

						_$_.output_push('<p');
						_$_.output_push('>');

						{
							_$_.output_push('After code');
						}

						_$_.output_push('</p>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

function NavItem({ href, text: label, active = false }) {
	_$_.push_component();

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

	_$_.pop_component();
}

function SidebarSection({ title, children }) {
	_$_.push_component();

	let lazy = _$_.track(true);

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

			if (_$_.get(lazy)) {
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

	_$_.pop_component();
}

function SideNav({ currentPath }) {
	_$_.push_component();

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
								children: _$_.ripple_element(function render_children() {
									_$_.push_component();

									{
										const comp = NavItem;

										const args = [
											{
												href: "/intro",
												text: "Introduction",
												active: currentPath === '/intro'
											}
										];

										comp(...args);
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

										comp(...args);
									}

									_$_.pop_component();
								})
							}
						];

						comp(...args);
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
								children: _$_.ripple_element(function render_children() {
									_$_.push_component();

									{
										const comp = NavItem;

										const args = [
											{
												href: "/guide/app",
												text: "Application",
												active: currentPath === '/guide/app'
											}
										];

										comp(...args);
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

										comp(...args);
									}

									_$_.pop_component();
								})
							}
						];

						comp(...args);
					}
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('</nav>');
		}

		_$_.output_push('</aside>');
	});

	_$_.pop_component();
}

function PageHeader() {
	_$_.push_component();

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

	_$_.pop_component();
}

export function LayoutWithSidebarAndMain() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			{
				const comp = PageHeader;
				const args = [{}];

				comp(...args);
			}

			_$_.output_push('<div');
			_$_.output_push(' class="content-wrapper"');
			_$_.output_push('>');

			{
				{
					const comp = SideNav;
					const args = [{ currentPath: "/intro" }];

					comp(...args);
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

						comp(...args);
					}
				}

				_$_.output_push('</main>');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function ArticleWrapper({ children }) {
	_$_.push_component();

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

	_$_.pop_component();
}

function SimpleFooter() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<footer');
		_$_.output_push(' class="doc-footer"');
		_$_.output_push('>');

		{
			_$_.output_push('Footer');
		}

		_$_.output_push('</footer>');
	});

	_$_.pop_component();
}

export function ArticleWithChildrenThenSibling() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="content-container"');
		_$_.output_push('>');

		{
			{
				const comp = ArticleWrapper;

				const args = [
					{
						children: _$_.ripple_element(function render_children() {
							_$_.push_component();
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
							_$_.pop_component();
						})
					}
				];

				comp(...args);
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

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ArticleWithHtmlChildThenSibling() {
	_$_.push_component();

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
						children: _$_.ripple_element(function render_children() {
							_$_.push_component();
							_$_.output_push('<div');
							_$_.output_push(' class="doc-content"');
							_$_.output_push('>');

							{
								const html_value_17 = String(htmlContent ?? '');

								_$_.output_push('<!--' + _$_.hash(html_value_17) + '-->');
								_$_.output_push(html_value_17);
								_$_.output_push('<!---->');
							}

							_$_.output_push('</div>');
							_$_.pop_component();
						})
					}
				];

				comp(...args);
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

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function InlineArticleLayout({ children }) {
	_$_.push_component();

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

				comp(...args);
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function InlineArticleWithHtmlChild() {
	_$_.push_component();

	const htmlContent = '<pre><code>const x = 1;</code></pre>';

	_$_.regular_block(() => {
		{
			const comp = InlineArticleLayout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_18 = String(htmlContent ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_18) + '-->');
							_$_.output_push(html_value_18);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

function HeaderStub() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<header');
		_$_.output_push(' class="header"');
		_$_.output_push('>');

		{
			_$_.output_push('Header');
		}

		_$_.output_push('</header>');
	});

	_$_.pop_component();
}

function SidebarStub() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<aside');
		_$_.output_push(' class="sidebar"');
		_$_.output_push('>');

		{
			_$_.output_push('Sidebar');
		}

		_$_.output_push('</aside>');
	});

	_$_.pop_component();
}

function FooterStub() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<footer');
		_$_.output_push(' class="footer"');
		_$_.output_push('>');

		{
			_$_.output_push('Footer');
		}

		_$_.output_push('</footer>');
	});

	_$_.pop_component();
}

function DocsLayoutInner({ children, editPath = '', nextLink = null }) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			{
				const comp = HeaderStub;
				const args = [{}];

				comp(...args);
			}

			_$_.output_push('<div');
			_$_.output_push(' class="docs-wrapper"');
			_$_.output_push('>');

			{
				{
					const comp = SidebarStub;
					const args = [{}];

					comp(...args);
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

									comp(...args);
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

	_$_.pop_component();
}

export function DocsLayoutWithData() {
	_$_.push_component();

	const htmlContent = '<h1>Title</h1><p>Content</p>';

	_$_.regular_block(() => {
		{
			const comp = DocsLayoutInner;

			const args = [
				{
					editPath: "docs/styling.md",
					nextLink: { href: '/next', text: 'Next' },
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_19 = String(htmlContent ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_19) + '-->');
							_$_.output_push(html_value_19);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function DocsLayoutWithoutData() {
	_$_.push_component();

	const htmlContent = undefined;

	_$_.regular_block(() => {
		{
			const comp = DocsLayoutInner;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_20 = String(htmlContent ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_20) + '-->');
							_$_.output_push(html_value_20);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
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
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			{
				const comp = HeaderStub;
				const args = [{}];

				comp(...args);
			}

			_$_.output_push('<div');
			_$_.output_push(' class="docs-wrapper"');
			_$_.output_push('>');

			{
				{
					const comp = SidebarStub;
					const args = [{}];

					comp(...args);
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

									comp(...args);
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

	_$_.pop_component();
}

export function DocsLayoutExactWithData() {
	_$_.push_component();

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

					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_21 = String(htmlContent ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_21) + '-->');
							_$_.output_push(html_value_21);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function DocsLayoutExactWithoutData() {
	_$_.push_component();

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
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_22 = String(htmlContent ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_22) + '-->');
							_$_.output_push(html_value_22);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function TemplateWithHtmlContent() {
	_$_.push_component();

	const data = { title: 'Test', value: 42 };

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<template');
			_$_.output_push(' id="t1"');
			_$_.output_push('>');

			{
				const html_value_23 = String(JSON.stringify(data) ?? '');

				_$_.output_push('<!--' + _$_.hash(html_value_23) + '-->');
				_$_.output_push(html_value_23);
				_$_.output_push('<!---->');
			}

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

	_$_.pop_component();
}

export function TemplateWithHtmlAndSiblings() {
	_$_.push_component();

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

			{
				const html_value_24 = String(JSON.stringify(data) ?? '');

				_$_.output_push('<!--' + _$_.hash(html_value_24) + '-->');
				_$_.output_push(html_value_24);
				_$_.output_push('<!---->');
			}

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

	_$_.pop_component();
}

function LayoutWithTemplate({ children, data }) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			_$_.output_push('<template');
			_$_.output_push(' id="page-data"');
			_$_.output_push('>');

			{
				const html_value_25 = String(JSON.stringify(data) ?? '');

				_$_.output_push('<!--' + _$_.hash(html_value_25) + '-->');
				_$_.output_push(html_value_25);
				_$_.output_push('<!---->');
			}

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

	_$_.pop_component();
}

export function NestedTemplateInLayout() {
	_$_.push_component();

	const doc = { title: 'Comparison', html: '<p>Content</p>' };

	_$_.regular_block(() => {
		{
			const comp = LayoutWithTemplate;

			const args = [
				{
					data: doc,
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();
						_$_.output_push('<div');
						_$_.output_push(' class="doc-content"');
						_$_.output_push('>');

						{
							const html_value_26 = String(doc.html ?? '');

							_$_.output_push('<!--' + _$_.hash(html_value_26) + '-->');
							_$_.output_push(html_value_26);
							_$_.output_push('<!---->');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}