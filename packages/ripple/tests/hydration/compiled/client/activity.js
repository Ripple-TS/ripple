// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('div', null, [['input'], ['span', null, ' ']], 1);

function Child_render(__anchor, __block, { name }) {
	const label = context.get();
	const value = _$_.track('server', __block, '1rui9sa');

	_$_.with_scope(__block, () => calls.push(`init:${name}:${label}`));
	_$_.with_scope(__block, () => duringInit?.());

	_$_.effect(() => {
		_$_.with_scope(__block, () => calls.push(`effect:${name}`));

		return () => _$_.with_scope(__block, () => calls.push(`cleanup:${name}`));
	});

	var div = root();

	_$_.set_attribute_value(div, 'data-name', name);

	{
		var input_1 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.ref(input_1, () => _$_.with_scope(__block, () => bindValue(value)));

		var span = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression, () => value.value);
			_$_.hydrating && _$_.pop(span);
		}
	}

	_$_.append(__anchor, div);
}

Child[_$_.$r] = Child_render;

function consequent(__anchor, { b: first }) {
	_$_.render_component(Activity, __anchor, {
		mode: first,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Child, __anchor, { name: "first" });
		})
	});
}

function if_1({ a: exists }) {
	if (exists.value) return consequent;
}

var root_1 = _$_.template_el('main', null, [null, null, null]);

function render(__prev) {
	var __a = if_1({ a: __prev._a, b: __prev._b });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._c, __prev.a = __a);
	}
}

function App_render(__anchor, __block) {
	const first = _$_.track('hidden', __block, '12pscgx');
	const second = _$_.track('hidden', __block, '1d6hl9l');
	const exists = _$_.track(true, __block, '6tdlur');

	context.set('context');
	controls = { first, second, exists };

	var main = root_1();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;
		var ifs = _$_.if_static(node, if_1, 0, { a: exists, b: first });
		var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;

		_$_.render_component(Activity, node_1, {
			mode: second,
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Child, __anchor, { name: "second" });
			})
		});

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;

		_$_.render_component(Child, node_2, { name: "sibling" });
		_$_.hydrating && _$_.pop(main);
	}

	_$_.render(render, { a: _$_.UNINITIALIZED, _a: exists, _b: first, _c: ifs });
	_$_.append(__anchor, main);
}

App[_$_.$r] = App_render;

var root_2 = _$_.template_el('main');

function Visible_render(__anchor, __block) {
	context.set('context');

	var main_1 = root_2();

	{
		var append_anchor = _$_.append_into(main_1);

		_$_.render_component(Activity, append_anchor, {
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Child, __anchor, { name: "visible" });
			})
		});

		_$_.render_component(Child, append_anchor, { name: "sibling" });
		_$_.hydrating && _$_.pop(main_1);
	}

	_$_.append(__anchor, main_1);
}

Visible[_$_.$r] = Visible_render;

var root_3 = _$_.template(`<!><!>`, 1, 2);

function Nested_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'l2yess');

	context.set('context');
	controls = { mode };

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment = root_3();
			var node_3 = _$_.first_child_frag(fragment);

			_$_.render_component(Child, node_3, { name: "parent" });

			var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : node_3.nextSibling;

			_$_.render_component(Activity, node_4, {
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(Child, __anchor, { name: "nested" });
				})
			});

			_$_.append(__anchor, fragment);
		})
	});
}

Nested[_$_.$r] = Nested_render;

var root_4 = _$_.template(`a &lt; b &amp; c<span style=display:grid!important>grid`, 1, 2);

function Text_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'gzd6z1');

	controls = { mode };

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_4();

			_$_.next();
			_$_.append(__anchor, fragment_1);
		})
	});
}

Text[_$_.$r] = Text_render;

var root_5 = _$_.template(` `, 1, 1);

function render_1(__prev) {
	var __a = String(__prev._a.value);

	if (__prev.a !== __a) {
		_$_.set_text(__prev._b, __prev.a = __a);
	}
}

function ClearedText_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'h0vg63');
	const inner = _$_.track('hidden', __block, '18l51gx');
	const value = _$_.track('old', __block, 'yk10ld');

	controls = { mode, inner, value };

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Activity, __anchor, {
				mode: inner,
				children: _$_.tsrx_element((__anchor, __block) => {
					var fragment_2 = root_5();
					var expression_1 = _$_.first_child_frag(fragment_2, true);

					_$_.render(render_1, { a: ' ', _a: value, _b: expression_1 });
					_$_.append(__anchor, fragment_2);
				})
			});
		})
	});
}

ClearedText[_$_.$r] = ClearedText_render;

var root_6 = _$_.template_el('p', null, ' ');

function Async_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'www7if');
	const input = _$_.track(initial, __block, 'c5yrg2');

	controls = { mode, input };

	function AsyncChild() {
		return _$_.tsrx_element((__anchor, __block) => {
			const data = _$_.track_async(
				async () => {
					_$_.with_scope(__block, () => calls.push('fetch'));

					return input.value;
				},
				__block,
				'ddhrr4'
			);

			var p = root_6();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

				_$_.expression(expression_2, () => data.value);
				_$_.hydrating && _$_.pop(p);
			}

			_$_.append(__anchor, p);
		});
	}

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(AsyncChild, __anchor, {});
		})
	});
}

Async[_$_.$r] = Async_render;

var root_8 = _$_.template_el('section', null, 'new');
var root_9 = _$_.template_el('p', null, 'old');

function consequent_1(__anchor) {
	var section = root_8();

	_$_.append(__anchor, section);
}

function alternate(__anchor) {
	var p_1 = root_9();

	_$_.append(__anchor, p_1);
}

alternate.h = 1;

function if_2(changed) {
	if (changed.value) return consequent_1; else return alternate;
}

function render_2(__prev) {
	var __a = if_2(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_7 = _$_.template_el('main', null, [['footer', null, 'untouched']]);

function Recovery_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, '1ow5dng');
	const changed = _$_.track(false, __block, 'w38juv');

	controls = { mode, changed };

	var main_2 = root_7();

	{
		var node_5 = _$_.hydrating ? _$_.hydrate_child() : main_2.firstChild;

		_$_.render_component(Activity, node_5, {
			mode,
			children: _$_.tsrx_element((__anchor, __block) => {
				var ifs_1 = _$_.if_static(__anchor, if_2, 1, changed);

				_$_.render(render_2, { a: _$_.UNINITIALIZED, _a: changed, _b: ifs_1 });
			})
		});

		_$_.hydrating && _$_.pop(main_2);
	}

	_$_.append(__anchor, main_2);
}

Recovery[_$_.$r] = Recovery_render;

var root_10 = _$_.template(`<p>ok`, 1, 1);

function Broken_render(__anchor, __block) {
	if (fail) throw _$_.with_scope(__block, () => new Error('deferred failure'));

	var fragment_3 = root_10();

	_$_.append(__anchor, fragment_3);
}

Broken[_$_.$r] = Broken_render;

var root_13 = _$_.template_el('strong', null, ' ');
var root_12 = _$_.template(`<!><!>`, 1, 2);
var root_11 = _$_.template(`<!>`, 1, 1);

function Errors_render(__anchor, __block) {
	context.set('context');

	var fragment_4 = root_11();
	var node_8 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_12();
		var node_6 = _$_.first_child_frag(fragment_5);

		_$_.try(
			node_6,
			(__anchor) => {
				_$_.render_component(Activity, __anchor, {
					mode: "hidden",
					children: _$_.tsrx_element((__anchor, __block) => {
						_$_.render_component(Broken, __anchor, {});
					})
				});
			},
			(__anchor, error) => {
				var strong = root_13();

				{
					var expression_3 = _$_.hydrating ? _$_.hydrate_child() : strong.firstChild;

					_$_.expression(expression_3, () => error.message);
					_$_.hydrating && _$_.pop(strong);
				}

				_$_.append(__anchor, strong);
			}
		);

		var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : node_6.nextSibling;

		_$_.render_component(Activity, node_7, {
			mode: "hidden",
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Child, __anchor, { name: "after-error" });
			})
		});

		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

Errors[_$_.$r] = Errors_render;

var root_14 = _$_.template(`<p class=stream-value> `, 1, 1);
var root_16 = _$_.template_el('span', ['class', 'stream-pending'], 'waiting');
var root_15 = _$_.template(`<!><button>ordinary sibling`, 1, 2);

function Stream_render(__anchor, __block) {
	const mode = _$_.track('hidden', __block, 'i41ox9');

	controls = {
		mode,
		observer: _$_.with_scope(__block, createRenderObserver)
	};

	function Data() {
		return _$_.tsrx_element((__anchor, __block) => {
			const data = _$_.track_async(() => stream, __block, 'fqa6fw');

			if (streamEffects) _$_.effect(() => {
				_$_.with_scope(__block, () => calls.push('stream effect'));
			});

			var fragment_6 = root_14();
			var p_2 = _$_.first_child_frag(fragment_6);

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_child() : p_2.firstChild;

				_$_.expression(expression_4, () => data.value);
				_$_.hydrating && _$_.pop(p_2);
			}

			_$_.append(__anchor, fragment_6);
		});
	}

	var fragment_7 = root_15();
	var node_9 = _$_.first_child_frag(fragment_7);

	_$_.render_component(Activity, node_9, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					_$_.render_component(Data, __anchor, {});
				},
				null,
				(__anchor) => {
					var span_1 = root_16();

					_$_.append(__anchor, span_1);
				},
				true
			);
		})
	});

	_$_.next();
	_$_.append(__anchor, fragment_7);
}

Stream[_$_.$r] = Stream_render;

import {
	Activity,
	bindValue,
	Context,
	createRenderObserver,
	effect,
	track,
	trackAsync
} from 'ripple';

export const calls = [];
export let controls;
export let initial = 'value';
export let fail = false;

let streamEffects = true;

export function setStreamEffects(value) {
	streamEffects = value;
}

export let duringInit;

export function setDuringInit(fn) {
	duringInit = fn;
}

export let stream = Promise.resolve('streamed');

export function setInitial(value) {
	initial = value;
}

export function setFail(value) {
	fail = value;
}

export function setStream(value) {
	stream = value;
}

const context = _$_.context();

function Child(__props) {
	return _$_.tsrx_element(Child_render, __props);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

export function Visible() {
	return _$_.tsrx_element(Visible_render);
}

export function Nested() {
	return _$_.tsrx_element(Nested_render);
}

export function Text() {
	return _$_.tsrx_element(Text_render);
}

export function ClearedText() {
	return _$_.tsrx_element(ClearedText_render);
}

export function Async() {
	return _$_.tsrx_element(Async_render);
}

export function Recovery() {
	return _$_.tsrx_element(Recovery_render);
}

function Broken() {
	return _$_.tsrx_element(Broken_render);
}

export function Errors() {
	return _$_.tsrx_element(Errors_render);
}

export function Stream() {
	return _$_.tsrx_element(Stream_render);
}