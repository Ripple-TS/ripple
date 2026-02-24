// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticHtml(__output) {
	_$_.push_component();

	const html = '<p><strong>Bold</strong> text</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value) + '-->');
		__output.push(html_value);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function DynamicHtml(__output) {
	_$_.push_component();

	const content = '<p>Dynamic <span>HTML</span> content</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_1 = String(content ?? '');

		__output.push('<!--' + _$_.hash(html_value_1) + '-->');
		__output.push(html_value_1);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function EmptyHtml(__output) {
	_$_.push_component();

	const html = '';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_2 = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value_2) + '-->');
		__output.push(html_value_2);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ComplexHtml(__output) {
	_$_.push_component();

	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';

	__output.push('<section');
	__output.push('>');

	{
		const html_value_3 = String(html ?? '');

		__output.push('<!--' + _$_.hash(html_value_3) + '-->');
		__output.push(html_value_3);
		__output.push('<!---->');
	}

	__output.push('</section>');
	_$_.pop_component();
}

export function MultipleHtml(__output) {
	_$_.push_component();

	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_4 = String(html1 ?? '');

		__output.push('<!--' + _$_.hash(html_value_4) + '-->');
		__output.push(html_value_4);
		__output.push('<!---->');

		const html_value_5 = String(html2 ?? '');

		__output.push('<!--' + _$_.hash(html_value_5) + '-->');
		__output.push(html_value_5);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function HtmlWithReactivity(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('<!--1tb17hh-->');
		__output.push('<p>Count: 0</p>');
		__output.push('<!---->');
		__output.push('<button');
		__output.push('>');

		{
			__output.push('Increment');
		}

		__output.push('</button>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export async function HtmlWrapper(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="wrapper"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="inner"');
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

		__output.push('</div>');
		_$_.pop_component();
	});
}

HtmlWrapper.async = true;

export function HtmlInChildren(__output) {
	_$_.push_component();

	const content = '<p><strong>Bold</strong> text</p>';

	{
		const comp = HtmlWrapper;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="vp-doc"');
					__output.push('>');

					{
						const html_value_6 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_6) + '-->');
						__output.push(html_value_6);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function HtmlInChildrenWithSiblings(__output) {
	_$_.push_component();

	const content = '<p>Dynamic content</p>';

	{
		const comp = HtmlWrapper;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<h1');
					__output.push('>');

					{
						__output.push('Title');
					}

					__output.push('</h1>');
					__output.push('<div');
					__output.push(' class="content"');
					__output.push('>');

					{
						const html_value_7 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_7) + '-->');
						__output.push(html_value_7);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function MultipleHtmlInChildren(__output) {
	_$_.push_component();

	const html1 = '<p>First</p>';
	const html2 = '<p>Second</p>';

	{
		const comp = HtmlWrapper;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc"');
					__output.push('>');

					{
						const html_value_8 = String(html1 ?? '');

						__output.push('<!--' + _$_.hash(html_value_8) + '-->');
						__output.push(html_value_8);
						__output.push('<!---->');

						const html_value_9 = String(html2 ?? '');

						__output.push('<!--' + _$_.hash(html_value_9) + '-->');
						__output.push(html_value_9);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function HtmlWithComments(__output) {
	_$_.push_component();

	const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_10 = String(content ?? '');

		__output.push('<!--' + _$_.hash(html_value_10) + '-->');
		__output.push(html_value_10);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function HtmlWithEmptyComment(__output) {
	_$_.push_component();

	const content = '<p>Before</p><!----><p>After</p>';

	__output.push('<div');
	__output.push('>');

	{
		const html_value_11 = String(content ?? '');

		__output.push('<!--' + _$_.hash(html_value_11) + '-->');
		__output.push(html_value_11);
		__output.push('<!---->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function HtmlWithCommentsInChildren(__output) {
	_$_.push_component();

	const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';

	{
		const comp = HtmlWrapper;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="vp-doc"');
					__output.push('>');

					{
						const html_value_12 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_12) + '-->');
						__output.push(html_value_12);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

function DocFooter(__output) {
	_$_.push_component();
	__output.push('<footer');
	__output.push(' class="doc-footer"');
	__output.push('>');

	{
		__output.push('Footer content');
	}

	__output.push('</footer>');
	_$_.pop_component();
}

export async function DocLayout(
	__output,
	{ children, editPath = '', nextLink = null, toc = [] }
) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="layout"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="content-container"');
			__output.push('>');

			{
				__output.push('<article');
				__output.push('>');

				{
					__output.push('<div');
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

				__output.push('</article>');
				__output.push('<!--[-->');

				if (editPath) {
					__output.push('<div');
					__output.push(' class="edit-link"');
					__output.push('>');

					{
						__output.push('<a');
						__output.push(_$_.attr('href', `https://github.com/edit/${editPath}`, false));
						__output.push('>');

						{
							__output.push('Edit');
						}

						__output.push('</a>');
					}

					__output.push('</div>');
				}

				__output.push('<!--]-->');
				__output.push('<!--[-->');

				if (nextLink) {
					__output.push('<nav');
					__output.push(' class="prev-next"');
					__output.push('>');

					{
						__output.push('<a');
						__output.push(_$_.attr('href', nextLink.href, false));
						__output.push('>');

						{
							__output.push(_$_.escape(nextLink.text));
						}

						__output.push('</a>');
					}

					__output.push('</nav>');
				}

				__output.push('<!--]-->');

				{
					const comp = DocFooter;
					const args = [__output, {}];

					comp(...args);
				}
			}

			__output.push('</div>');
			__output.push('<aside');
			__output.push('>');

			{
				__output.push('<!--[-->');

				if (toc.length > 0) {
					__output.push('<div');
					__output.push(' class="toc"');
					__output.push('>');

					{
						__output.push('<ul');
						__output.push('>');

						{
							__output.push('<!--[-->');

							for (const item of toc) {
								__output.push('<li');
								__output.push('>');

								{
									__output.push('<a');
									__output.push(_$_.attr('href', item.href, false));
									__output.push('>');

									{
										__output.push(_$_.escape(item.text));
									}

									__output.push('</a>');
								}

								__output.push('</li>');
							}

							__output.push('<!--]-->');
						}

						__output.push('</ul>');
					}

					__output.push('</div>');
				}

				__output.push('<!--]-->');
			}

			__output.push('</aside>');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

DocLayout.async = true;

export function HtmlWithServerData(__output) {
	_$_.push_component();

	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';

	{
		const comp = DocLayout;

		const args = [
			__output,

			{
				editPath: "docs/introduction.md",
				nextLink: { href: '/docs/quick-start', text: 'Quick Start' },

				toc: [
					{ href: '#intro', text: 'Introduction' },
					{ href: '#features', text: 'Features' }
				],

				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="vp-doc"');
					__output.push('>');

					{
						const html_value_13 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_13) + '-->');
						__output.push(html_value_13);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function HtmlWithClientDefaults(__output) {
	_$_.push_component();

	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';

	{
		const comp = DocLayout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="vp-doc"');
					__output.push('>');

					{
						const html_value_14 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_14) + '-->');
						__output.push(html_value_14);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function HtmlWithUndefinedContent(__output) {
	_$_.push_component();

	const content = undefined;

	{
		const comp = DocLayout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="vp-doc"');
					__output.push('>');

					{
						const html_value_15 = String(content ?? '');

						__output.push('<!--' + _$_.hash(html_value_15) + '-->');
						__output.push(html_value_15);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

async function DynamicHeading(__output, { level, children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<!--[-->');

		switch (level) {
			case 1:
				__output.push('<h1');
				__output.push(' class="heading"');
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
				__output.push('</h1>');

			case 2:
				__output.push('<h2');
				__output.push(' class="heading"');
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
				__output.push('</h2>');
		}

		__output.push('<!--]-->');
		_$_.pop_component();
	});
}

DynamicHeading.async = true;

function CodeBlock(__output, { code }) {
	_$_.push_component();

	const highlighted = `<pre class="shiki"><code>${code}</code></pre>`;

	__output.push('<div');
	__output.push(' class="code-block"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="header"');
		__output.push('>');

		{
			__output.push('<button');
			__output.push('>');

			{
				__output.push('Copy');
			}

			__output.push('</button>');
			__output.push('<span');
			__output.push(' class="lang"');
			__output.push('>');

			{
				__output.push('js');
			}

			__output.push('</span>');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="content"');
		__output.push('>');

		{
			const html_value_16 = String(highlighted ?? '');

			__output.push('<!--' + _$_.hash(html_value_16) + '-->');
			__output.push(html_value_16);
			__output.push('<!---->');
		}

		__output.push('</div>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function ContentWrapper(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="wrapper"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="inner"');
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

		__output.push('</div>');
		_$_.pop_component();
	});
}

ContentWrapper.async = true;

export function HtmlAfterSwitchInChildren(__output) {
	_$_.push_component();

	{
		const comp = ContentWrapper;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = DynamicHeading;

						const args = [
							__output,

							{
								level: 1,

								children: function children(__output) {
									_$_.push_component();
									__output.push('Title');
									_$_.pop_component();
								}
							}
						];

						comp(...args);
					}

					__output.push('<p');
					__output.push('>');

					{
						__output.push('First paragraph');
					}

					__output.push('</p>');
					__output.push('<p');
					__output.push('>');

					{
						__output.push('Second paragraph');
					}

					__output.push('</p>');

					{
						const comp = CodeBlock;
						const args = [__output, { code: "const x = 1;" }];

						comp(...args);
					}

					__output.push('<p');
					__output.push('>');

					{
						__output.push('After code');
					}

					__output.push('</p>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

function NavItem(__output, { href, text, active = false }) {
	_$_.push_component();
	__output.push('<div');
	__output.push(_$_.attr('class', `nav-item${active ? ' active' : ''}`));
	__output.push('>');

	{
		__output.push('<!--[-->');

		if (active) {
			__output.push('<div');
			__output.push(' class="indicator"');
			__output.push('>');
			__output.push('</div>');
		}

		__output.push('<!--]-->');
		__output.push('<a');
		__output.push(_$_.attr('href', href, false));
		__output.push('>');

		{
			__output.push('<span');
			__output.push('>');

			{
				__output.push(_$_.escape(text));
			}

			__output.push('</span>');
		}

		__output.push('</a>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function SidebarSection(__output, { title, children }) {
	return _$_.async(async () => {
		_$_.push_component();

		let expanded = track(true);

		__output.push('<section');
		__output.push(' class="sidebar-section"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="section-header"');
			__output.push('>');

			{
				__output.push('<h2');
				__output.push('>');

				{
					__output.push(_$_.escape(title));
				}

				__output.push('</h2>');
				__output.push('<button');
				__output.push('>');

				{
					__output.push('Toggle');
				}

				__output.push('</button>');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (_$_.get(expanded)) {
				__output.push('<div');
				__output.push(' class="section-items"');
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

SidebarSection.async = true;

function SideNav(__output, { currentPath }) {
	_$_.push_component();
	__output.push('<aside');
	__output.push(' class="sidebar"');
	__output.push('>');

	{
		__output.push('<nav');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="group"');
			__output.push('>');

			{
				{
					const comp = SidebarSection;

					const args = [
						__output,

						{
							title: "Getting Started",

							children: function children(__output) {
								_$_.push_component();

								{
									const comp = NavItem;

									const args = [
										__output,

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
										__output,

										{
											href: "/start",
											text: "Quick Start",
											active: currentPath === '/start'
										}
									];

									comp(...args);
								}

								_$_.pop_component();
							}
						}
					];

					comp(...args);
				}
			}

			__output.push('</div>');
			__output.push('<div');
			__output.push(' class="group"');
			__output.push('>');

			{
				{
					const comp = SidebarSection;

					const args = [
						__output,

						{
							title: "Guide",

							children: function children(__output) {
								_$_.push_component();

								{
									const comp = NavItem;

									const args = [
										__output,

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
										__output,

										{
											href: "/guide/syntax",
											text: "Syntax",
											active: currentPath === '/guide/syntax'
										}
									];

									comp(...args);
								}

								_$_.pop_component();
							}
						}
					];

					comp(...args);
				}
			}

			__output.push('</div>');
		}

		__output.push('</nav>');
	}

	__output.push('</aside>');
	_$_.pop_component();
}

function PageHeader(__output) {
	_$_.push_component();
	__output.push('<header');
	__output.push(' class="page-header"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="logo"');
		__output.push('>');

		{
			__output.push('MyApp');
		}

		__output.push('</div>');
	}

	__output.push('</header>');
	_$_.pop_component();
}

export function LayoutWithSidebarAndMain(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="layout"');
	__output.push('>');

	{
		{
			const comp = PageHeader;
			const args = [__output, {}];

			comp(...args);
		}

		__output.push('<div');
		__output.push(' class="content-wrapper"');
		__output.push('>');

		{
			{
				const comp = SideNav;
				const args = [__output, { currentPath: "/intro" }];

				comp(...args);
			}

			__output.push('<main');
			__output.push(' class="main-content"');
			__output.push('>');

			{
				__output.push('<div');
				__output.push(' class="article"');
				__output.push('>');

				{
					__output.push('<div');
					__output.push('>');

					{
						__output.push('<h1');
						__output.push('>');

						{
							__output.push('Introduction');
						}

						__output.push('</h1>');
						__output.push('<p');
						__output.push('>');

						{
							__output.push('Welcome to the docs.');
						}

						__output.push('</p>');
					}

					__output.push('</div>');
				}

				__output.push('</div>');
				__output.push('<!--[-->');

				if (true) {
					__output.push('<div');
					__output.push(' class="edit-link"');
					__output.push('>');

					{
						__output.push('<a');
						__output.push(' href="/edit"');
						__output.push('>');

						{
							__output.push('Edit');
						}

						__output.push('</a>');
					}

					__output.push('</div>');
				}

				__output.push('<!--]-->');

				{
					const comp = PageHeader;
					const args = [__output, {}];

					comp(...args);
				}
			}

			__output.push('</main>');
		}

		__output.push('</div>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function ArticleWrapper(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<article');
		__output.push(' class="doc-content"');
		__output.push('>');

		{
			__output.push('<div');
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

		__output.push('</article>');
		_$_.pop_component();
	});
}

ArticleWrapper.async = true;

function SimpleFooter(__output) {
	_$_.push_component();
	__output.push('<footer');
	__output.push(' class="doc-footer"');
	__output.push('>');

	{
		__output.push('Footer');
	}

	__output.push('</footer>');
	_$_.pop_component();
}

export function ArticleWithChildrenThenSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="content-container"');
	__output.push('>');

	{
		{
			const comp = ArticleWrapper;

			const args = [
				__output,

				{
					children: function children(__output) {
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
							__output.push('Content goes here.');
						}

						__output.push('</p>');
						_$_.pop_component();
					}
				}
			];

			comp(...args);
		}

		__output.push('<!--[-->');

		if (true) {
			__output.push('<div');
			__output.push(' class="edit-link"');
			__output.push('>');

			{
				__output.push('<a');
				__output.push(' href="/edit"');
				__output.push('>');

				{
					__output.push('Edit');
				}

				__output.push('</a>');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
		__output.push('<!--[-->');

		if (true) {
			__output.push('<nav');
			__output.push(' class="prev-next"');
			__output.push('>');

			{
				__output.push('<a');
				__output.push(' href="/prev"');
				__output.push('>');

				{
					__output.push('Previous');
				}

				__output.push('</a>');
			}

			__output.push('</nav>');
		}

		__output.push('<!--]-->');

		{
			const comp = SimpleFooter;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ArticleWithHtmlChildThenSibling(__output) {
	_$_.push_component();

	const htmlContent = '<pre><code>const x = 1;</code></pre>';

	__output.push('<div');
	__output.push(' class="content-container"');
	__output.push('>');

	{
		{
			const comp = ArticleWrapper;

			const args = [
				__output,

				{
					children: function children(__output) {
						_$_.push_component();
						__output.push('<div');
						__output.push(' class="doc-content"');
						__output.push('>');

						{
							const html_value_17 = String(htmlContent ?? '');

							__output.push('<!--' + _$_.hash(html_value_17) + '-->');
							__output.push(html_value_17);
							__output.push('<!---->');
						}

						__output.push('</div>');
						_$_.pop_component();
					}
				}
			];

			comp(...args);
		}

		__output.push('<!--[-->');

		if (true) {
			__output.push('<div');
			__output.push(' class="edit-link"');
			__output.push('>');

			{
				__output.push('<a');
				__output.push(' href="/edit"');
				__output.push('>');

				{
					__output.push('Edit');
				}

				__output.push('</a>');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');

		{
			const comp = SimpleFooter;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function InlineArticleLayout(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="content-container"');
		__output.push('>');

		{
			__output.push('<article');
			__output.push(' class="doc-content"');
			__output.push('>');

			{
				__output.push('<div');
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

			__output.push('</article>');
			__output.push('<!--[-->');

			if (true) {
				__output.push('<div');
				__output.push(' class="edit-link"');
				__output.push('>');

				{
					__output.push('<a');
					__output.push(' href="/edit"');
					__output.push('>');

					{
						__output.push('Edit');
					}

					__output.push('</a>');
				}

				__output.push('</div>');
			}

			__output.push('<!--]-->');

			{
				const comp = SimpleFooter;
				const args = [__output, {}];

				comp(...args);
			}
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

InlineArticleLayout.async = true;

export function InlineArticleWithHtmlChild(__output) {
	_$_.push_component();

	const htmlContent = '<pre><code>const x = 1;</code></pre>';

	{
		const comp = InlineArticleLayout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_18 = String(htmlContent ?? '');

						__output.push('<!--' + _$_.hash(html_value_18) + '-->');
						__output.push(html_value_18);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

function HeaderStub(__output) {
	_$_.push_component();
	__output.push('<header');
	__output.push(' class="header"');
	__output.push('>');

	{
		__output.push('Header');
	}

	__output.push('</header>');
	_$_.pop_component();
}

function SidebarStub(__output) {
	_$_.push_component();
	__output.push('<aside');
	__output.push(' class="sidebar"');
	__output.push('>');

	{
		__output.push('Sidebar');
	}

	__output.push('</aside>');
	_$_.pop_component();
}

function FooterStub(__output) {
	_$_.push_component();
	__output.push('<footer');
	__output.push(' class="footer"');
	__output.push('>');

	{
		__output.push('Footer');
	}

	__output.push('</footer>');
	_$_.pop_component();
}

async function DocsLayoutInner(__output, { children, editPath = '', nextLink = null }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="layout"');
		__output.push('>');

		{
			{
				const comp = HeaderStub;
				const args = [__output, {}];

				comp(...args);
			}

			__output.push('<div');
			__output.push(' class="docs-wrapper"');
			__output.push('>');

			{
				{
					const comp = SidebarStub;
					const args = [__output, {}];

					comp(...args);
				}

				__output.push('<main');
				__output.push(' class="docs-main"');
				__output.push('>');

				{
					__output.push('<div');
					__output.push(' class="docs-container"');
					__output.push('>');

					{
						__output.push('<div');
						__output.push(' class="content"');
						__output.push('>');

						{
							__output.push('<div');
							__output.push(' class="content-container"');
							__output.push('>');

							{
								__output.push('<article');
								__output.push(' class="doc-content"');
								__output.push('>');

								{
									__output.push('<div');
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

								__output.push('</article>');
								__output.push('<!--[-->');

								if (editPath) {
									__output.push('<div');
									__output.push(' class="edit-link"');
									__output.push('>');

									{
										__output.push('<a');
										__output.push(' href="/edit"');
										__output.push('>');

										{
											__output.push('Edit on GitHub');
										}

										__output.push('</a>');
									}

									__output.push('</div>');
								}

								__output.push('<!--]-->');
								__output.push('<!--[-->');

								if (nextLink) {
									__output.push('<nav');
									__output.push(' class="prev-next"');
									__output.push('>');

									{
										__output.push('<a');
										__output.push(_$_.attr('href', nextLink.href, false));
										__output.push('>');

										{
											__output.push(_$_.escape(nextLink.text));
										}

										__output.push('</a>');
									}

									__output.push('</nav>');
								}

								__output.push('<!--]-->');

								{
									const comp = FooterStub;
									const args = [__output, {}];

									comp(...args);
								}
							}

							__output.push('</div>');
						}

						__output.push('</div>');
					}

					__output.push('</div>');
				}

				__output.push('</main>');
			}

			__output.push('</div>');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

DocsLayoutInner.async = true;

export function DocsLayoutWithData(__output) {
	_$_.push_component();

	const htmlContent = '<h1>Title</h1><p>Content</p>';

	{
		const comp = DocsLayoutInner;

		const args = [
			__output,

			{
				editPath: "docs/styling.md",
				nextLink: { href: '/next', text: 'Next' },

				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_19 = String(htmlContent ?? '');

						__output.push('<!--' + _$_.hash(html_value_19) + '-->');
						__output.push(html_value_19);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function DocsLayoutWithoutData(__output) {
	_$_.push_component();

	const htmlContent = undefined;

	{
		const comp = DocsLayoutInner;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_20 = String(htmlContent ?? '');

						__output.push('<!--' + _$_.hash(html_value_20) + '-->');
						__output.push(html_value_20);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

async function DocsLayoutExact(
	__output,

	{
		children,
		editPath = '',
		prevLink = null,
		nextLink = null,
		toc = []
	}
) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="layout"');
		__output.push('>');

		{
			{
				const comp = HeaderStub;
				const args = [__output, {}];

				comp(...args);
			}

			__output.push('<div');
			__output.push(' class="docs-wrapper"');
			__output.push('>');

			{
				{
					const comp = SidebarStub;
					const args = [__output, {}];

					comp(...args);
				}

				__output.push('<main');
				__output.push(' class="docs-main"');
				__output.push('>');

				{
					__output.push('<div');
					__output.push(' class="docs-container"');
					__output.push('>');

					{
						__output.push('<div');
						__output.push(' class="content"');
						__output.push('>');

						{
							__output.push('<div');
							__output.push(' class="content-container"');
							__output.push('>');

							{
								__output.push('<article');
								__output.push(' class="doc-content"');
								__output.push('>');

								{
									__output.push('<div');
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

								__output.push('</article>');
								__output.push('<!--[-->');

								if (editPath) {
									__output.push('<div');
									__output.push(' class="edit-link"');
									__output.push('>');

									{
										__output.push('<a');
										__output.push(_$_.attr('href', `/edit/${editPath}`, false));
										__output.push('>');

										{
											__output.push('Edit on GitHub');
										}

										__output.push('</a>');
									}

									__output.push('</div>');
								}

								__output.push('<!--]-->');
								__output.push('<!--[-->');

								if (prevLink || nextLink) {
									__output.push('<nav');
									__output.push(' class="prev-next"');
									__output.push('>');

									{
										__output.push('<!--[-->');

										if (prevLink) {
											__output.push('<a');
											__output.push(_$_.attr('href', prevLink.href, false));
											__output.push(' class="pager prev"');
											__output.push('>');

											{
												__output.push('<span');
												__output.push(' class="title"');
												__output.push('>');

												{
													__output.push(_$_.escape(prevLink.text));
												}

												__output.push('</span>');
											}

											__output.push('</a>');
										} else {
											__output.push('<span');
											__output.push('>');
											__output.push('</span>');
										}

										__output.push('<!--]-->');
										__output.push('<!--[-->');

										if (nextLink) {
											__output.push('<a');
											__output.push(_$_.attr('href', nextLink.href, false));
											__output.push(' class="pager next"');
											__output.push('>');

											{
												__output.push('<span');
												__output.push(' class="title"');
												__output.push('>');

												{
													__output.push(_$_.escape(nextLink.text));
												}

												__output.push('</span>');
											}

											__output.push('</a>');
										}

										__output.push('<!--]-->');
									}

									__output.push('</nav>');
								}

								__output.push('<!--]-->');

								{
									const comp = FooterStub;
									const args = [__output, {}];

									comp(...args);
								}
							}

							__output.push('</div>');
						}

						__output.push('</div>');
						__output.push('<aside');
						__output.push(' class="aside"');
						__output.push('>');

						{
							__output.push('<!--[-->');

							if (toc.length > 0) {
								__output.push('<div');
								__output.push(' class="aside-content"');
								__output.push('>');

								{
									__output.push('<nav');
									__output.push(' class="outline"');
									__output.push('>');

									{
										__output.push('<!--[-->');

										for (const item of toc) {
											__output.push('<a');
											__output.push(_$_.attr('href', item.href, false));
											__output.push('>');

											{
												__output.push(_$_.escape(item.text));
											}

											__output.push('</a>');
										}

										__output.push('<!--]-->');
									}

									__output.push('</nav>');
								}

								__output.push('</div>');
							}

							__output.push('<!--]-->');
						}

						__output.push('</aside>');
					}

					__output.push('</div>');
				}

				__output.push('</main>');
			}

			__output.push('</div>');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

DocsLayoutExact.async = true;

export function DocsLayoutExactWithData(__output) {
	_$_.push_component();

	const htmlContent = '<h1>Styling Guide</h1><p>Content</p>';

	{
		const comp = DocsLayoutExact;

		const args = [
			__output,

			{
				editPath: "docs/guide/styling.md",
				prevLink: { href: '/prev', text: 'Previous' },
				nextLink: { href: '/next', text: 'Next' },

				toc: [
					{ href: '#intro', text: 'Introduction' },
					{ href: '#usage', text: 'Usage' }
				],

				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_21 = String(htmlContent ?? '');

						__output.push('<!--' + _$_.hash(html_value_21) + '-->');
						__output.push(html_value_21);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function DocsLayoutExactWithoutData(__output) {
	_$_.push_component();

	const htmlContent = undefined;
	const editPath = undefined;
	const prevLink = undefined;
	const nextLink = undefined;
	const toc = undefined;

	{
		const comp = DocsLayoutExact;

		const args = [
			__output,

			{
				editPath,
				prevLink,
				nextLink,
				toc,

				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_22 = String(htmlContent ?? '');

						__output.push('<!--' + _$_.hash(html_value_22) + '-->');
						__output.push(html_value_22);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function TemplateWithHtmlContent(__output) {
	_$_.push_component();

	const data = { title: 'Test', value: 42 };

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<template');
		__output.push(' id="t1"');
		__output.push('>');

		{
			const html_value_23 = String(JSON.stringify(data) ?? '');

			__output.push('<!--' + _$_.hash(html_value_23) + '-->');
			__output.push(html_value_23);
			__output.push('<!---->');
		}

		__output.push('</template>');
		__output.push('<p');
		__output.push(' class="content"');
		__output.push('>');

		{
			__output.push('Main content');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function TemplateWithHtmlAndSiblings(__output) {
	_$_.push_component();

	const data = { name: 'Ripple', version: '1.0' };

	__output.push('<div');
	__output.push(' class="wrapper"');
	__output.push('>');

	{
		__output.push('<h1');
		__output.push('>');

		{
			__output.push('Title');
		}

		__output.push('</h1>');
		__output.push('<template');
		__output.push(' id="data-template"');
		__output.push('>');

		{
			const html_value_24 = String(JSON.stringify(data) ?? '');

			__output.push('<!--' + _$_.hash(html_value_24) + '-->');
			__output.push(html_value_24);
			__output.push('<!---->');
		}

		__output.push('</template>');
		__output.push('<p');
		__output.push(' class="after-template"');
		__output.push('>');

		{
			__output.push('Content after template');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

async function LayoutWithTemplate(__output, { children, data }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="layout"');
		__output.push('>');

		{
			__output.push('<template');
			__output.push(' id="page-data"');
			__output.push('>');

			{
				const html_value_25 = String(JSON.stringify(data) ?? '');

				__output.push('<!--' + _$_.hash(html_value_25) + '-->');
				__output.push(html_value_25);
				__output.push('<!---->');
			}

			__output.push('</template>');
			__output.push('<main');
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

			__output.push('</main>');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

LayoutWithTemplate.async = true;

export function NestedTemplateInLayout(__output) {
	_$_.push_component();

	const doc = { title: 'Comparison', html: '<p>Content</p>' };

	{
		const comp = LayoutWithTemplate;

		const args = [
			__output,

			{
				data: doc,

				children: function children(__output) {
					_$_.push_component();
					__output.push('<div');
					__output.push(' class="doc-content"');
					__output.push('>');

					{
						const html_value_26 = String(doc.html ?? '');

						__output.push('<!--' + _$_.hash(html_value_26) + '-->');
						__output.push(html_value_26);
						__output.push('<!---->');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}