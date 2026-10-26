// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	bindInnerHTML,
	bindInnerText,
	bindTextContent,
	track,
	trackAsync
} from 'ripple/server';

const bindings = {
	innerHTML: bindInnerHTML,
	innerText: bindInnerText,
	textContent: bindTextContent
};

function Content({ kind, binding, seed, editable = true }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			switch (kind) {
				case 'empty':
					__out += '<div data-editor="" contenteditable="true" data-ripple-content=""></div>';
					break;

				case 'static':
					__out += '<div data-editor="" contentEditable="" data-ripple-content="server &amp;amp; text">server &amp; text</div>';
					break;

				case 'rich':
					__out += '<div data-editor="" contentEditable=""';
					_$_.output_push(__out);
					__out = '';
					_$_.content_editable(
						() => {
							let __out = '';

							__out += '<b>server</b><i>text</i>';
							_$_.output_push(__out);
						},
						true
					);
					__out += '</div>';
					break;

				case 'html':
					{
						__out += '<div data-editor=""';

						const editable_1 = editable;

						__out += _$_.attr('contentEditable', editable_1) + _$_.content_editable_html(String(seed ?? ''), editable_1) + '</div>';
					}
					break;

				case 'text':
					{
						__out += '<div data-editor=""';

						const editable_2 = editable;

						__out += _$_.attr('contentEditable', editable_2);
						_$_.output_push(__out);
						__out = '';

						_$_.content_editable(
							() => {
								{
									_$_.render_expression(seed);
								}
							},
							editable_2
						);

						__out += '</div>';
					}
					break;

				case 'nested':
					__out += '<div data-editor="" contentEditable=""';
					_$_.output_push(__out);
					__out = '';
					_$_.content_editable(
						() => {
							let __out = '';

							__out += '<b>';

							{
								_$_.output_push(__out);
								__out = '';
								_$_.render_expression(seed);
							}

							__out += '</b><i>tail</i>';
							_$_.output_push(__out);
						},
						true
					);
					__out += '</div>';
					break;

				case 'inherited':
					__out += '<div contentEditable=""';
					_$_.output_push(__out);
					__out = '';
					_$_.content_editable(
						() => {
							{
								{
									const comp = Inherited;
									const args = [{ binding, seed }];

									_$_.render_component(comp, ...args);
								}
							}
						},
						true
					);
					__out += '</div>';
					break;

				case 'dynamic':
					{
						const tag = 'div';

						_$_.output_push(__out);
						__out = '';

						_$_.dynamic_element(tag, {
							'data-editor': true,
							contentEditable: true,
							ref: binding,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.render_expression(seed);
								});
							})
						});
					}
					break;

				case 'spread':
					{
						__out += '<div';

						const spread_attrs = {
							'data-editor': '',
							...{ contentEditable: editable, innerHTML: seed }
						};

						__out += _$_.spread_attrs(spread_attrs);
						_$_.output_push(__out);
						__out = '';

						_$_.content_editable(
							() => {
								let __out = '';

								_$_.output_push(__out);
								__out = '';

								const spread_inner_html = _$_.spread_inner_html(spread_attrs);

								if (spread_inner_html !== void 0) {
									__out += spread_inner_html;
								}

								_$_.output_push(__out);
							},
							spread_attrs.contenteditable ?? spread_attrs.contentEditable
						);

						__out += '</div>';
					}
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function Editor(
	{
		property = 'textContent',
		initial = '',
		next = 'updated',
		accessors = false,
		kind = 'empty',
		seed = '',
		editable = true,
		transform
	}
) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'ldw9fy');
		const bind = bindings[property];

		const binding = accessors
			? bind(() => value.value, (next) => value.value = transform ? transform(next) : next)
			: bind(value);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>';

			{
				const comp = Content;
				const args = [{ kind, binding, seed, editable }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>update</button></section>';
			_$_.output_push(__out);
		});
	});
}

export function PlainSpread() {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<div';

		const spread_attrs_1 = { 'data-editor': '', ...{ id: 'plain' } };

		__out += _$_.spread_attrs(spread_attrs_1) + '>';
		_$_.output_push(__out);
		__out = '';

		const spread_inner_html_1 = _$_.spread_inner_html(spread_attrs_1);

		if (spread_inner_html_1 !== void 0) {
			__out += spread_inner_html_1;
		} else {
			__out += 'unbound';
		}

		__out += '</div>';
		_$_.output_push(__out);
	});
}

export function ReactiveEditor({ property = 'innerHTML' }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track('server', 'o65qvu');
		const binding = bindings[property](value);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><!--[-->';

			if (property === 'innerHTML') {
				__out += '<div data-editor="" contentEditable=""' + _$_.content_editable_html(String(value.value ?? ''), true) + '</div>';
			} else {
				__out += '<div data-editor="" contentEditable=""';
				_$_.output_push(__out);
				__out = '';

				_$_.content_editable(
					() => {
						{
							_$_.render_expression(value.value);
						}
					},
					true
				);

				__out += '</div>';
			}

			__out += '<!--]--><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</output><button>update</button></section>';
			_$_.output_push(__out);
		});
	});
}

function Inherited({ binding, seed }) {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<div data-editor=""';
		_$_.output_push(__out);
		__out = '';

		_$_.content_editable(
			() => {
				{
					_$_.render_expression(seed);
				}
			},
			void 0
		);

		__out += '</div>';
		_$_.output_push(__out);
	});
}

export function AsyncEditor({ promise }) {
	return _$_.tsrx_element(() => {
		const seed = _$_.track_async(() => promise, '1m0fmqg');
		const value = _$_.track('model', '65w90x');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><div data-editor="" contentEditable=""';
			_$_.output_push(__out);
			__out = '';

			_$_.content_editable(
				() => {
					{
						_$_.render_expression(seed.value);
					}
				},
				true
			);

			__out += '</div><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</output></section>';
			_$_.output_push(__out);
		});
	});
}

function StreamContent({ promise }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track_async(() => promise, '2e2vau');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</span>';
			_$_.output_push(__out);
		});
	});
}

export function NestedStreamEditor({ promise, property = 'textContent' }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track('model', '15fvgx0');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><article contentEditable=""';
			_$_.output_push(__out);
			__out = '';

			_$_.content_editable(
				() => {
					let __out = '';

					__out += '<div data-editor="" contentEditable=""';
					_$_.output_push(__out);
					__out = '';

					_$_.content_editable(
						() => {
							let __out = '';

							__out += '<b>before</b>';
							_$_.output_push(__out);
							__out = '';

							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[-->';

									{
										const comp = StreamContent;
										const args = [{ promise }];

										_$_.output_push(__out);
										__out = '';
										_$_.render_component(comp, ...args);
									}

									__out += '<!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><i>loading</i><!--]-->';
									_$_.output_push(__out);
								}
							);

							_$_.output_push(__out);
						},
						true
					);

					__out += '</div>';
					_$_.output_push(__out);
				},
				true
			);

			__out += '</article><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output></section>';
			_$_.output_push(__out);
		});
	});
}