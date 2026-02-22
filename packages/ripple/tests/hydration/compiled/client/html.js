// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><!></div>`, 0);
var root_1 = _$_.template(`<div><!></div>`, 0);
var root_2 = _$_.template(`<div><!></div>`, 0);
var root_3 = _$_.template(`<section><!></section>`, 0);
var root_4 = _$_.template(`<div><!><!></div>`, 0);
var root_5 = _$_.template(`<div><!><button>Increment</button></div>`, 0);
var root_6 = _$_.template(`<div class="wrapper"><div class="inner"><!></div></div>`, 0);
var root_8 = _$_.template(`<div class="vp-doc"><!></div>`, 0);
var root_7 = _$_.template(`<!>`, 1);
var root_10 = _$_.template(`<h1>Title</h1><div class="content"><!></div>`, 1);
var root_9 = _$_.template(`<!>`, 1);
var root_12 = _$_.template(`<div class="doc"><!><!></div>`, 0);
var root_11 = _$_.template(`<!>`, 1);
var root_13 = _$_.template(`<div><!></div>`, 0);
var root_14 = _$_.template(`<div><!></div>`, 0);
var root_16 = _$_.template(`<div class="vp-doc"><!></div>`, 0);
var root_15 = _$_.template(`<!>`, 1);
var root_17 = _$_.template(`<footer class="doc-footer">Footer content</footer>`, 0);
var root_19 = _$_.template(`<div class="edit-link"><a>Edit</a></div>`, 0);
var root_20 = _$_.template(`<nav class="prev-next"><a> </a></nav>`, 0);
var root_22 = _$_.template(`<li><a> </a></li>`, 0);
var root_21 = _$_.template(`<div class="toc"><ul></ul></div>`, 0);
var root_18 = _$_.template(`<div class="layout"><div class="content-container"><article><div><!></div></article><!><!><!></div><aside><!></aside></div>`, 0);
var root_24 = _$_.template(`<div class="vp-doc"><!></div>`, 0);
var root_23 = _$_.template(`<!>`, 1);
var root_26 = _$_.template(`<div class="vp-doc"><!></div>`, 0);
var root_25 = _$_.template(`<!>`, 1);
var root_28 = _$_.template(`<div class="vp-doc"><!></div>`, 0);
var root_27 = _$_.template(`<!>`, 1);
var root_30 = _$_.template(`<h1 class="heading"><!></h1>`, 0);
var root_31 = _$_.template(`<h2 class="heading"><!></h2>`, 0);
var root_29 = _$_.template(`<!>`, 1);
var root_32 = _$_.template(`<div class="code-block"><div class="header"><button>Copy</button><span class="lang">js</span></div><div class="content"><!></div></div>`, 0);
var root_33 = _$_.template(`<div class="wrapper"><div class="inner"><!></div></div>`, 0);
var root_35 = _$_.template(`<!><p>First paragraph</p><p>Second paragraph</p><!><p>After code</p>`, 1);
var root_34 = _$_.template(`<!>`, 1);
var root_37 = _$_.template(`<div class="indicator"></div>`, 0);
var root_36 = _$_.template(`<div><!><a><span> </span></a></div>`, 0);
var root_39 = _$_.template(`<div class="section-items"><!></div>`, 0);
var root_38 = _$_.template(`<section class="sidebar-section"><div class="section-header"><h2> </h2><button>Toggle</button></div><!></section>`, 0);
var root_41 = _$_.template(`<!><!>`, 1);
var root_42 = _$_.template(`<!><!>`, 1);
var root_40 = _$_.template(`<aside class="sidebar"><nav><div class="group"><!></div><div class="group"><!></div></nav></aside>`, 0);
var root_43 = _$_.template(`<header class="page-header"><div class="logo">MyApp</div></header>`, 0);
var root_45 = _$_.template(`<div class="edit-link"><a href="/edit">Edit</a></div>`, 0);
var root_44 = _$_.template(`<div class="layout"><!><div class="content-wrapper"><!><main class="main-content"><div class="article"><div><h1>Introduction</h1><p>Welcome to the docs.</p></div></div><!><!></main></div></div>`, 0);

import { track } from 'ripple';

export function StaticHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '<p><strong>Bold</strong> text</p>';
	var div_1 = root();

	{
		var node = _$_.child(div_1);

		_$_.pop(div_1);
	}

	_$_.render(() => {
		_$_.html(node, () => html);
	});

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function DynamicHtml(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p>Dynamic <span>HTML</span> content</p>';
	var div_2 = root_1();

	{
		var node_1 = _$_.child(div_2);

		_$_.pop(div_2);
	}

	_$_.render(() => {
		_$_.html(node_1, () => content);
	});

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function EmptyHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '';
	var div_3 = root_2();

	{
		var node_2 = _$_.child(div_3);

		_$_.pop(div_3);
	}

	_$_.render(() => {
		_$_.html(node_2, () => html);
	});

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function ComplexHtml(__anchor, _, __block) {
	_$_.push_component();

	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';
	var section_1 = root_3();

	{
		var node_3 = _$_.child(section_1);

		_$_.pop(section_1);
	}

	_$_.render(() => {
		_$_.html(node_3, () => html);
	});

	_$_.append(__anchor, section_1);
	_$_.pop_component();
}

export function MultipleHtml(__anchor, _, __block) {
	_$_.push_component();

	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';
	var div_4 = root_4();

	{
		var node_4 = _$_.child(div_4);
		var node_5 = _$_.sibling(node_4);

		_$_.pop(div_4);
	}

	_$_.render(
		(__prev) => {
			_$_.html(node_4, () => html1);
			_$_.html(node_5, () => html2);
		},
		{}
	);

	_$_.append(__anchor, div_4);
	_$_.pop_component();
}

export function HtmlWithReactivity(__anchor, _, __block) {
	_$_.push_component();

	var div_5 = root_5();

	{
		var node_6 = _$_.child(div_5);

		_$_.pop(div_5);
	}

	_$_.render(() => {
		_$_.html(node_6, () => '<p>Count: 0</p>');
	});

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function HtmlWrapper(__anchor, __props, __block) {
	_$_.push_component();

	var div_6 = root_6();

	{
		var div_7 = _$_.child(div_6);

		{
			var node_7 = _$_.child(div_7);

			_$_.composite(() => __props.children, node_7, {});
			_$_.pop(div_7);
		}
	}

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

export function HtmlInChildren(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p><strong>Bold</strong> text</p>';
	var fragment = root_7();
	var node_8 = _$_.first_child_frag(fragment);

	HtmlWrapper(
		node_8,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var div_8 = root_8();

				{
					var node_9 = _$_.child(div_8);

					_$_.pop(div_8);
				}

				_$_.render(() => {
					_$_.html(node_9, () => content);
				});

				_$_.append(__anchor, div_8);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function HtmlInChildrenWithSiblings(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p>Dynamic content</p>';
	var fragment_1 = root_9();
	var node_10 = _$_.first_child_frag(fragment_1);

	HtmlWrapper(
		node_10,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_2 = root_10();
				var h1_1 = _$_.first_child_frag(fragment_2);
				var div_9 = _$_.sibling(h1_1);

				{
					var node_11 = _$_.child(div_9);

					_$_.pop(div_9);
				}

				_$_.next();

				_$_.render(() => {
					_$_.html(node_11, () => content);
				});

				_$_.append(__anchor, fragment_2, true);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function MultipleHtmlInChildren(__anchor, _, __block) {
	_$_.push_component();

	const html1 = '<p>First</p>';
	const html2 = '<p>Second</p>';
	var fragment_3 = root_11();
	var node_12 = _$_.first_child_frag(fragment_3);

	HtmlWrapper(
		node_12,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var div_10 = root_12();

				{
					var node_13 = _$_.child(div_10);
					var node_14 = _$_.sibling(node_13);

					_$_.pop(div_10);
				}

				_$_.render(
					(__prev) => {
						_$_.html(node_13, () => html1);
						_$_.html(node_14, () => html2);
					},
					{}
				);

				_$_.append(__anchor, div_10);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function HtmlWithComments(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';
	var div_11 = root_13();

	{
		var node_15 = _$_.child(div_11);

		_$_.pop(div_11);
	}

	_$_.render(() => {
		_$_.html(node_15, () => content);
	});

	_$_.append(__anchor, div_11);
	_$_.pop_component();
}

export function HtmlWithEmptyComment(__anchor, _, __block) {
	_$_.push_component();

	const content = '<p>Before</p><!----><p>After</p>';
	var div_12 = root_14();

	{
		var node_16 = _$_.child(div_12);

		_$_.pop(div_12);
	}

	_$_.render(() => {
		_$_.html(node_16, () => content);
	});

	_$_.append(__anchor, div_12);
	_$_.pop_component();
}

export function HtmlWithCommentsInChildren(__anchor, _, __block) {
	_$_.push_component();

	const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';
	var fragment_4 = root_15();
	var node_17 = _$_.first_child_frag(fragment_4);

	HtmlWrapper(
		node_17,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var div_13 = root_16();

				{
					var node_18 = _$_.child(div_13);

					_$_.pop(div_13);
				}

				_$_.render(() => {
					_$_.html(node_18, () => content);
				});

				_$_.append(__anchor, div_13);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

function DocFooter(__anchor, _, __block) {
	_$_.push_component();

	var footer_1 = root_17();

	_$_.append(__anchor, footer_1);
	_$_.pop_component();
}

export function DocLayout(__anchor, __props, __block) {
	_$_.push_component();

	var div_14 = root_18();

	{
		var div_16 = _$_.child(div_14);

		{
			var article_1 = _$_.child(div_16);

			{
				var div_15 = _$_.child(article_1);

				{
					var node_19 = _$_.child(div_15);

					_$_.composite(() => __props.children, node_19, {});
					_$_.pop(div_15);
				}
			}

			_$_.pop(article_1);

			var node_20 = _$_.sibling(article_1);

			{
				var consequent = (__anchor) => {
					var div_17 = root_19();

					{
						var a_1 = _$_.child(div_17);
					}

					_$_.render(() => {
						_$_.set_attribute(a_1, 'href', `https://github.com/edit/${_$_.fallback(__props.editPath, '')}`);
					});

					_$_.append(__anchor, div_17);
				};

				_$_.if(node_20, (__render) => {
					if (_$_.fallback(__props.editPath, '')) __render(consequent);
				});
			}

			var node_21 = _$_.sibling(node_20);

			{
				var consequent_1 = (__anchor) => {
					var nav_1 = root_20();

					{
						var a_2 = _$_.child(nav_1);

						{
							var text_1 = _$_.child(a_2, true);

							_$_.pop(a_2);
						}
					}

					_$_.render(
						(__prev) => {
							var __a = _$_.fallback(__props.nextLink, null).text;

							if (__prev.a !== __a) {
								_$_.set_text(text_1, __prev.a = __a);
							}

							var __b = _$_.fallback(__props.nextLink, null).href;

							if (__prev.b !== __b) {
								_$_.set_attribute(a_2, 'href', __prev.b = __b);
							}
						},
						{ a: ' ', b: void 0 }
					);

					_$_.append(__anchor, nav_1);
				};

				_$_.if(node_21, (__render) => {
					if (_$_.fallback(__props.nextLink, null)) __render(consequent_1);
				});
			}

			var node_22 = _$_.sibling(node_21);

			DocFooter(node_22, {}, _$_.active_block);
			_$_.pop(div_16);
		}

		var aside_1 = _$_.sibling(div_16);

		{
			var node_23 = _$_.child(aside_1);

			{
				var consequent_2 = (__anchor) => {
					var div_18 = root_21();

					{
						var ul_1 = _$_.child(div_18);

						{
							_$_.for(
								ul_1,
								() => _$_.fallback(__props.toc, []),
								(__anchor, item) => {
									var li_1 = root_22();

									{
										var a_3 = _$_.child(li_1);

										{
											var text_2 = _$_.child(a_3, true);

											_$_.pop(a_3);
										}
									}

									_$_.render(
										(__prev) => {
											var __a = item.text;

											if (__prev.a !== __a) {
												_$_.set_text(text_2, __prev.a = __a);
											}

											var __b = item.href;

											if (__prev.b !== __b) {
												_$_.set_attribute(a_3, 'href', __prev.b = __b);
											}
										},
										{ a: ' ', b: void 0 }
									);

									_$_.append(__anchor, li_1);
								},
								4
							);

							_$_.pop(ul_1);
						}
					}

					_$_.append(__anchor, div_18);
				};

				_$_.if(node_23, (__render) => {
					if (_$_.fallback(__props.toc, []).length > 0) __render(consequent_2);
				});
			}

			_$_.pop(aside_1);
		}
	}

	_$_.append(__anchor, div_14);
	_$_.pop_component();
}

export function HtmlWithServerData(__anchor, _, __block) {
	_$_.push_component();

	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';
	var fragment_5 = root_23();
	var node_24 = _$_.first_child_frag(fragment_5);

	DocLayout(
		node_24,
		{
			editPath: "docs/introduction.md",
			nextLink: { href: '/docs/quick-start', text: 'Quick Start' },

			toc: [
				{ href: '#intro', text: 'Introduction' },
				{ href: '#features', text: 'Features' }
			],

			children(__anchor, _, __block) {
				_$_.push_component();

				var div_19 = root_24();

				{
					var node_25 = _$_.child(div_19);

					_$_.pop(div_19);
				}

				_$_.render(() => {
					_$_.html(node_25, () => content);
				});

				_$_.append(__anchor, div_19);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function HtmlWithClientDefaults(__anchor, _, __block) {
	_$_.push_component();

	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';
	var fragment_6 = root_25();
	var node_26 = _$_.first_child_frag(fragment_6);

	DocLayout(
		node_26,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var div_20 = root_26();

				{
					var node_27 = _$_.child(div_20);

					_$_.pop(div_20);
				}

				_$_.render(() => {
					_$_.html(node_27, () => content);
				});

				_$_.append(__anchor, div_20);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_6);
	_$_.pop_component();
}

export function HtmlWithUndefinedContent(__anchor, _, __block) {
	_$_.push_component();

	const content = undefined;
	var fragment_7 = root_27();
	var node_28 = _$_.first_child_frag(fragment_7);

	DocLayout(
		node_28,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var div_21 = root_28();

				{
					var node_29 = _$_.child(div_21);

					_$_.pop(div_21);
				}

				_$_.render(() => {
					_$_.html(node_29, () => content);
				});

				_$_.append(__anchor, div_21);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

function DynamicHeading(__anchor, __props, __block) {
	_$_.push_component();

	var fragment_8 = root_29();
	var node_30 = _$_.first_child_frag(fragment_8);

	{
		var switch_case_0 = (__anchor) => {
			var h1_2 = root_30();

			{
				var node_31 = _$_.child(h1_2);

				_$_.composite(() => __props.children, node_31, {});
				_$_.pop(h1_2);
			}

			_$_.append(__anchor, h1_2);
		};

		var switch_case_1 = (__anchor) => {
			var h2_1 = root_31();

			{
				var node_32 = _$_.child(h2_1);

				_$_.composite(() => __props.children, node_32, {});
				_$_.pop(h2_1);
			}

			_$_.append(__anchor, h2_1);
		};

		_$_.switch(node_30, () => {
			var result = [];

			switch (__props.level) {
				case 1:
					result.push(switch_case_0);

				case 2:
					result.push(switch_case_1);
					return result;
			}
		});
	}

	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

function CodeBlock(__anchor, __props, __block) {
	_$_.push_component();

	const highlighted = `<pre class="shiki"><code>${__props.code}</code></pre>`;
	var div_22 = root_32();

	{
		var div_23 = _$_.child(div_22);

		_$_.pop(div_23);

		var div_24 = _$_.sibling(div_23);

		{
			var node_33 = _$_.child(div_24);

			_$_.pop(div_24);
		}
	}

	_$_.render(() => {
		_$_.html(node_33, () => highlighted);
	});

	_$_.append(__anchor, div_22);
	_$_.pop_component();
}

function ContentWrapper(__anchor, __props, __block) {
	_$_.push_component();

	var div_25 = root_33();

	{
		var div_26 = _$_.child(div_25);

		{
			var node_34 = _$_.child(div_26);

			_$_.composite(() => __props.children, node_34, {});
			_$_.pop(div_26);
		}
	}

	_$_.append(__anchor, div_25);
	_$_.pop_component();
}

export function HtmlAfterSwitchInChildren(__anchor, _, __block) {
	_$_.push_component();

	var fragment_9 = root_34();
	var node_35 = _$_.first_child_frag(fragment_9);

	ContentWrapper(
		node_35,
		{
			children(__anchor, _, __block) {
				_$_.push_component();

				var fragment_10 = root_35();
				var node_36 = _$_.first_child_frag(fragment_10);

				DynamicHeading(
					node_36,
					{
						level: 1,

						children(__anchor, _, __block) {
							_$_.push_component();

							var text_3 = _$_.text('Title');

							_$_.append(__anchor, text_3);
							_$_.pop_component();
						}
					},
					_$_.active_block
				);

				var p_2 = _$_.sibling(node_36);
				var p_1 = _$_.sibling(p_2);
				var node_37 = _$_.sibling(p_1);

				CodeBlock(node_37, { code: "const x = 1;" }, _$_.active_block);
				_$_.append(__anchor, fragment_10);
				_$_.pop_component();
			}
		},
		_$_.active_block
	);

	_$_.append(__anchor, fragment_9);
	_$_.pop_component();
}

function NavItem(__anchor, __props, __block) {
	_$_.push_component();

	var div_27 = root_36();

	{
		var node_38 = _$_.child(div_27);

		{
			var consequent_3 = (__anchor) => {
				var div_28 = root_37();

				_$_.append(__anchor, div_28);
			};

			_$_.if(node_38, (__render) => {
				if (_$_.fallback(__props.active, false)) __render(consequent_3);
			});
		}

		var a_4 = _$_.sibling(node_38);

		{
			var span_1 = _$_.child(a_4);

			{
				var text_4 = _$_.child(span_1, true);

				_$_.pop(span_1);
			}
		}

		_$_.pop(div_27);
	}

	_$_.render(
		(__prev) => {
			var __a = __props.text;

			if (__prev.a !== __a) {
				_$_.set_text(text_4, __prev.a = __a);
			}

			var __b = __props.href;

			if (__prev.b !== __b) {
				_$_.set_attribute(a_4, 'href', __prev.b = __b);
			}

			var __c = `nav-item${_$_.fallback(__props.active, false) ? ' active' : ''}`;

			if (__prev.c !== __c) {
				_$_.set_class(div_27, __prev.c = __c, void 0, true);
			}
		},
		{ a: ' ', b: void 0, c: Symbol() }
	);

	_$_.append(__anchor, div_27);
	_$_.pop_component();
}

function SidebarSection(__anchor, __props, __block) {
	_$_.push_component();

	let expanded = track(true, void 0, void 0, __block);
	var section_2 = root_38();

	{
		var div_29 = _$_.child(section_2);

		{
			var h2_2 = _$_.child(div_29);

			{
				var text_5 = _$_.child(h2_2, true);

				_$_.pop(h2_2);
			}

			var button_1 = _$_.sibling(h2_2);

			button_1.__click = () => _$_.set(expanded, !_$_.get(expanded));
		}

		_$_.pop(div_29);

		var node_39 = _$_.sibling(div_29);

		{
			var consequent_4 = (__anchor) => {
				var div_30 = root_39();

				{
					var node_40 = _$_.child(div_30);

					_$_.composite(() => __props.children, node_40, {});
					_$_.pop(div_30);
				}

				_$_.append(__anchor, div_30);
			};

			_$_.if(node_39, (__render) => {
				if (_$_.get(expanded)) __render(consequent_4);
			});
		}

		_$_.pop(section_2);
	}

	_$_.render(() => {
		_$_.set_text(text_5, __props.title);
	});

	_$_.append(__anchor, section_2);
	_$_.pop_component();
}

function SideNav(__anchor, __props, __block) {
	_$_.push_component();

	var aside_2 = root_40();

	{
		var nav_2 = _$_.child(aside_2);

		{
			var div_31 = _$_.child(nav_2);

			{
				var node_41 = _$_.child(div_31);

				SidebarSection(
					node_41,
					{
						title: "Getting Started",

						children(__anchor, _, __block) {
							_$_.push_component();

							var fragment_11 = root_41();
							var node_42 = _$_.first_child_frag(fragment_11);

							NavItem(
								node_42,
								{
									href: "/intro",
									text: "Introduction",

									get active() {
										return __props.currentPath === '/intro';
									}
								},
								_$_.active_block
							);

							var node_43 = _$_.sibling(node_42);

							NavItem(
								node_43,
								{
									href: "/start",
									text: "Quick Start",

									get active() {
										return __props.currentPath === '/start';
									}
								},
								_$_.active_block
							);

							_$_.append(__anchor, fragment_11);
							_$_.pop_component();
						}
					},
					_$_.active_block
				);

				_$_.pop(div_31);
			}

			var div_32 = _$_.sibling(div_31);

			{
				var node_44 = _$_.child(div_32);

				SidebarSection(
					node_44,
					{
						title: "Guide",

						children(__anchor, _, __block) {
							_$_.push_component();

							var fragment_12 = root_42();
							var node_45 = _$_.first_child_frag(fragment_12);

							NavItem(
								node_45,
								{
									href: "/guide/app",
									text: "Application",

									get active() {
										return __props.currentPath === '/guide/app';
									}
								},
								_$_.active_block
							);

							var node_46 = _$_.sibling(node_45);

							NavItem(
								node_46,
								{
									href: "/guide/syntax",
									text: "Syntax",

									get active() {
										return __props.currentPath === '/guide/syntax';
									}
								},
								_$_.active_block
							);

							_$_.append(__anchor, fragment_12);
							_$_.pop_component();
						}
					},
					_$_.active_block
				);

				_$_.pop(div_32);
			}
		}
	}

	_$_.append(__anchor, aside_2);
	_$_.pop_component();
}

function PageHeader(__anchor, _, __block) {
	_$_.push_component();

	var header_1 = root_43();

	_$_.append(__anchor, header_1);
	_$_.pop_component();
}

export function LayoutWithSidebarAndMain(__anchor, _, __block) {
	_$_.push_component();

	var div_33 = root_44();

	{
		var node_47 = _$_.child(div_33);

		PageHeader(node_47, {}, _$_.active_block);

		var div_34 = _$_.sibling(node_47);

		{
			var node_48 = _$_.child(div_34);

			SideNav(node_48, { currentPath: "/intro" }, _$_.active_block);

			var main_1 = _$_.sibling(node_48);

			{
				var div_35 = _$_.child(main_1);

				_$_.pop(div_35);

				var node_49 = _$_.sibling(div_35);

				{
					var consequent_5 = (__anchor) => {
						var div_36 = root_45();

						_$_.append(__anchor, div_36);
					};

					_$_.if(node_49, (__render) => {
						if (true) __render(consequent_5);
					});
				}

				var node_50 = _$_.sibling(node_49);

				PageHeader(node_50, {}, _$_.active_block);
				_$_.pop(main_1);
			}

			_$_.pop(div_34);
		}

		_$_.pop(div_33);
	}

	_$_.append(__anchor, div_33);
	_$_.pop_component();
}

_$_.delegate(['click']);