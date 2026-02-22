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