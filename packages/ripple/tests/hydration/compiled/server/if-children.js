// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfWithChildren({ children }) {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, 'c64714b1');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><div role="button" class="header">Toggle</div><!--[-->';

			if (lazy.value) {
				__out += '<div class="content">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(children);
				}

				__out += '</div>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function ChildItem({ text: label }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="item">' + _$_.escape(label) + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function TestIfWithChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = IfWithChildren;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = ChildItem;
									const args = [{ text: "Item 1" }];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = ChildItem;
									const args = [{ text: "Item 2" }];

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

export function IfWithStaticChildren() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(true, '3bba8f77');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><div role="button" class="header">Toggle</div><!--[-->';

			if (lazy_1.value) {
				__out += '<div class="content"><span>Static child 1</span><span>Static child 2</span></div>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfWithSiblingsAndChildren({ children }) {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(true, 'a1b8fb4c');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="group"><div role="button" class="item"><div class="indicator"></div><h2 class="text">Title</h2><div class="caret"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg></div></div><!--[-->';

			if (lazy_2.value) {
				__out += '<div class="items">';

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

export function TestIfWithSiblingsAndChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = IfWithSiblingsAndChildren;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = ChildItem;
									const args = [{ text: "Item A" }];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = ChildItem;
									const args = [{ text: "Item B" }];

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

export function ElementWithChildrenThenIf() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(true, '7cd4817b');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><div class="nested-parent"><div class="nested-child"><span class="deep">Deep content</span></div></div><!--[-->';

			if (lazy_3.value) {
				__out += '<div class="conditional">Conditional content</div>';
			}

			__out += '<!--]--></div><button class="toggle">Toggle</button>';
			_$_.output_push(__out);
		});
	});
}

export function DeepNestingThenIf() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track(true, '923116be');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="outer"><article class="middle"><div class="inner"><p class="leaf"><strong>Bold</strong><em>Italic</em></p></div></article><!--[-->';

			if (lazy_4.value) {
				__out += '<footer class="footer">Footer</footer>';
			}

			__out += '<!--]--></section><button class="btn">Toggle</button>';
			_$_.output_push(__out);
		});
	});
}

export function DomElementChildrenThenSibling() {
	return _$_.tsrx_element(() => {
		let lazy_5 = _$_.track('code', '33a1e97f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="tabs"><div class="tab-list"><button' + _$_.attr('aria-selected', lazy_5.value === 'code' ? 'true' : 'false', false) + ' class="tab">Code</button><button' + _$_.attr('aria-selected', lazy_5.value === 'preview' ? 'true' : 'false', false) + ' class="tab">Preview</button></div><div class="panel"><!--[-->';

			if (lazy_5.value === 'code') {
				__out += '<pre class="code">const x = 1;</pre>';
			} else {
				__out += '<div class="preview">Preview content</div>';
			}

			__out += '<!--]--></div></div>';
			_$_.output_push(__out);
		});
	});
}

export function DomChildrenThenStaticSiblings() {
	return _$_.tsrx_element(() => {
		let lazy_6 = _$_.track(0, '0ea64305');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><ul class="list"><li class="item">' + _$_.escape('Item count: ' + String(lazy_6.value ?? '')) + '</li><li class="item">Another item</li></ul><h2 class="heading">Static Heading</h2><p class="para">Static paragraph</p></div><button class="inc">Increment</button>';
			_$_.output_push(__out);
		});
	});
}

export function StaticListThenStaticSiblings() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><ul class="features"><li><strong>Feature One</strong>: Description of feature one with <code>code</code> reference</li><li><strong>Feature Two</strong>: Another feature description</li><li><strong>Feature Three</strong>: Third feature</li></ul><h2 class="section-heading">Section Heading</h2><p class="section-content">Static paragraph with <a href="/link">a link</a> and more text.</p></div>';
			_$_.output_push(__out);
		});
	});
}