// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div><input><span> </span><button>press`, 1, 1);

function Child_render(__anchor, __block, { name }) {
	_$_.with_scope(__block, () => calls.push('init:' + name + ':' + context.get()));
	_$_.with_scope(__block, () => duringInit?.());

	if (fail) throw _$_.with_scope(__block, () => new Error('hydrate failure'));

	const value = _$_.track('server', __block, '1tm5kuu');

	_$_.effect(() => {
		_$_.with_scope(__block, () => calls.push('effect:' + name));

		return () => {
			_$_.with_scope(__block, () => calls.push('cleanup:' + name));
		};
	});

	var fragment = root();
	var div = _$_.first_child_frag(fragment);

	_$_.set_attribute_value(div, 'data-child', name);

	{
		var input_1 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.ref(input_1, () => _$_.with_scope(__block, () => bindValue(value)));

		var span = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression, () => value.value);
			_$_.hydrating && _$_.pop(span);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : span.nextSibling;

		button.__click = () => _$_.with_scope(__block, () => calls.push('click:' + name));
		button.__focusin = () => _$_.with_scope(__block, () => calls.push('focus:' + name));
		_$_.listen('pointerenter', button, () => _$_.with_scope(__block, () => calls.push('enter:' + name)));
	}

	_$_.hydrating && _$_.pop(div);
	_$_.append(__anchor, fragment);
}

Child[_$_.$r] = Child_render;

function consequent(__anchor, { b: strategy, c: __block }) {
	_$_.render_component(Hydrate, __anchor, {
		when: () => {
			const value = strategy.value.value;

			return typeof value === 'function' ? _$_.with_scope(__block, value) : value;
		},
		onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated')),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Child, __anchor, { name: "deferred" });
		})
	});
}

function if_1({ a: exists }) {
	if (exists.value) return consequent;
}

var root_1 = _$_.template_el('main', null, [['footer', null, 'untouched']]);

function render(__prev) {
	var __a = if_1({ a: __prev._a, b: __prev._b, c: __prev._c });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._d, __prev.a = __a);
	}
}

function App_render(__anchor, __block) {
	const strategy = _$_.track({ value: when }, __block, '14brm6e');
	const enabled = _$_.track(false, __block, 'mhty7a');
	const exists = _$_.track(true, __block, '1i2j1mh');

	context.set('context');
	controls = { strategy, enabled, exists };

	var main = root_1();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;
		var ifs = _$_.if_static(node, if_1, 0, { a: exists, b: strategy, c: __block });

		_$_.hydrating && _$_.pop(main);
	}

	_$_.render(render, {
		a: _$_.UNINITIALIZED,
		_a: exists,
		_b: strategy,
		_c: __block,
		_d: ifs
	});

	_$_.append(__anchor, main);
}

App[_$_.$r] = App_render;

function Condition_render(__anchor, __block) {
	const enabled = _$_.track(false, __block, '1j1wrv2');

	context.set('context');
	controls = { enabled };

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => enabled.value)),
		onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated')),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Child, __anchor, { name: "condition" });
		})
	});
}

Condition[_$_.$r] = Condition_render;

var root_2 = _$_.template(`<!><!>`, 1, 2);

function Nested_render(__anchor, __block) {
	context.set('context');

	_$_.render_component(Hydrate, __anchor, {
		when,
		onHydrated: () => _$_.with_scope(__block, () => calls.push('outer hydrated')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_2();
			var node_1 = _$_.first_child_frag(fragment_1);

			_$_.render_component(Child, node_1, { name: "parent" });

			var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1.nextSibling;

			_$_.render_component(Hydrate, node_2, {
				when: nested,
				onHydrated: () => _$_.with_scope(__block, () => calls.push('inner hydrated')),
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(Child, __anchor, { name: "nested" });
				})
			});

			_$_.append(__anchor, fragment_1);
		})
	});
}

Nested[_$_.$r] = Nested_render;

function Hidden_render(__anchor, __block) {
	context.set('context');

	const mode = _$_.track('hidden', __block, '1lfui4w');

	controls = { mode };

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Hydrate, __anchor, {
				when,
				onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated')),
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(Child, __anchor, { name: "hidden" });
				})
			});
		})
	});
}

Hidden[_$_.$r] = Hidden_render;

var root_3 = _$_.template_el('p', null, ' ');

function Async_render(__anchor, __block) {
	const input = _$_.track(initial, __block, '1mwkssf');

	controls = { input };

	function Data() {
		return _$_.tsrx_element((__anchor, __block) => {
			const value = _$_.track_async(
				async () => {
					_$_.with_scope(__block, () => calls.push('fetch'));

					return input.value;
				},
				__block,
				'16xwy8k'
			);

			var p = root_3();

			{
				var expression_1 = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

				_$_.expression(expression_1, () => value.value);
				_$_.hydrating && _$_.pop(p);
			}

			_$_.append(__anchor, p);
		});
	}

	_$_.render_component(Hydrate, __anchor, {
		when,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Data, __anchor, {});
		})
	});
}

Async[_$_.$r] = Async_render;

var root_4 = _$_.template_el('p', ['class', 'stream-value'], ' ');
var root_6 = _$_.template_el('span', ['class', 'stream-pending'], 'waiting');
var root_5 = _$_.template(`<!><footer>untouched`, 1, 2);

function Stream_render(__anchor, __block) {
	function Data() {
		return _$_.tsrx_element((__anchor, __block) => {
			const value = _$_.track_async(() => stream, __block, '1jo36cv');
			var p_1 = root_4();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : p_1.firstChild;

				_$_.expression(expression_2, () => value.value);
				_$_.hydrating && _$_.pop(p_1);
			}

			_$_.append(__anchor, p_1);
		});
	}

	var fragment_2 = root_5();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.render_component(Hydrate, node_3, {
		when,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					_$_.render_component(Data, __anchor, {});
				},
				null,
				(__anchor) => {
					var span_1 = root_6();

					_$_.append(__anchor, span_1);
				},
				true
			);
		})
	});

	_$_.next();
	_$_.append(__anchor, fragment_2);
}

Stream[_$_.$r] = Stream_render;

var root_8 = _$_.template_el('section', null, 'new');
var root_9 = _$_.template_el('p', null, 'old');

function consequent_1(__anchor) {
	var section = root_8();

	_$_.append(__anchor, section);
}

function alternate(__anchor) {
	var p_2 = root_9();

	_$_.append(__anchor, p_2);
}

alternate.h = 1;

function if_2(changed) {
	if (changed.value) return consequent_1; else return alternate;
}

function render_1(__prev) {
	var __a = if_2(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

var root_7 = _$_.template_el('main', null, [['footer', null, 'untouched']]);

function Recovery_render(__anchor, __block) {
	const changed = _$_.track(false, __block, 'uzdiok');

	controls = { changed };

	var main_1 = root_7();

	{
		var node_4 = _$_.hydrating ? _$_.hydrate_child() : main_1.firstChild;

		_$_.render_component(Hydrate, node_4, {
			when,
			children: _$_.tsrx_element((__anchor, __block) => {
				var ifs_1 = _$_.if_static(__anchor, if_2, 1, changed);

				_$_.render(render_1, { a: _$_.UNINITIALIZED, _a: changed, _b: ifs_1 });
			})
		});

		_$_.hydrating && _$_.pop(main_1);
	}

	_$_.append(__anchor, main_1);
}

Recovery[_$_.$r] = Recovery_render;

var root_10 = _$_.template_el('strong', null, ' ');

function Errors_render(__anchor, __block) {
	context.set('context');

	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.render_component(Hydrate, __anchor, {
				when,
				onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated')),
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(Child, __anchor, { name: "broken" });
				})
			});
		},
		(__anchor, error) => {
			var strong = root_10();

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_child() : strong.firstChild;

				_$_.expression(expression_3, () => error.message);
				_$_.hydrating && _$_.pop(strong);
			}

			_$_.append(__anchor, strong);
		},
		null,
		true
	);
}

Errors[_$_.$r] = Errors_render;

var root_12 = _$_.template(`<b>one</b><b>two`, 1, 2);
var root_13 = _$_.template_ns(`<circle r=2></circle>`, 32);
var root_14 = _$_.template(`<tr><td>cell`);
var root_11 = _$_.template(`<!><!><!><svg></svg><table><tbody>`, 1, 5);

function Shapes_render(__anchor, __block) {
	var fragment_3 = root_11();
	var node_5 = _$_.first_child_frag(fragment_3);

	_$_.render_component(Hydrate, node_5, { when });

	var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_5.nextSibling;

	_$_.render_component(Hydrate, node_6, { when, children: _$_.normalize_children("text") });

	var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : node_6.nextSibling;

	_$_.render_component(Hydrate, node_7, {
		when,
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_4 = root_12();

			_$_.next();
			_$_.append(__anchor, fragment_4);
		})
	});

	var svg = _$_.hydrating ? _$_.hydrate_sibling() : node_7.nextSibling;

	{
		var append_anchor = _$_.append_into(svg);

		_$_.render_component_ns('svg', Hydrate, append_anchor, {
			when,
			children: _$_.tsrx_element((__anchor, __block) => {
				var circle = root_13();

				_$_.append(__anchor, circle);
			})
		});

		_$_.hydrating && _$_.pop(svg);
	}

	var table = _$_.hydrating ? _$_.hydrate_sibling() : svg.nextSibling;

	{
		var tbody = _$_.hydrating ? _$_.hydrate_child() : table.firstChild;

		{
			var append_anchor_1 = _$_.append_into(tbody);

			_$_.render_component(Hydrate, append_anchor_1, {
				when,
				children: _$_.tsrx_element((__anchor, __block) => {
					var tr = root_14();

					_$_.append(__anchor, tr);
				})
			});

			_$_.hydrating && _$_.pop(tbody);
		}
	}

	_$_.hydrating && _$_.pop(table);
	_$_.append(__anchor, fragment_3);
}

Shapes[_$_.$r] = Shapes_render;

function Replacement_render(__anchor, __block) {
	const children = _$_.track('old', __block, 'pqdvv9');
	const strategy = _$_.track({ value: when }, __block, '1vudbxq');

	controls = { children, strategy };

	_$_.render_component(Hydrate, __anchor, {
		when: () => {
			const value = strategy.value.value;

			return typeof value === 'function' ? _$_.with_scope(__block, value) : value;
		},
		children: _$_.normalize_children(children),
		onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated'))
	});
}

Replacement[_$_.$r] = Replacement_render;

var root_17 = _$_.template_el('section', null, 'new');
var root_18 = _$_.template_el('p', null, 'old');

function consequent_2(__anchor) {
	var section_1 = root_17();

	_$_.append(__anchor, section_1);
}

function alternate_1(__anchor) {
	var p_3 = root_18();

	_$_.append(__anchor, p_3);
}

alternate_1.h = 1;

function if_3(changed) {
	if (changed.value) return consequent_2; else return alternate_1;
}

var root_16 = _$_.template(`<input><span> </span><b></b><!>`, 1, 4);

function render_2(__prev) {
	var __a = __prev._a.value.title + ':' + __prev._b.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._c, __a, __prev.a);
		__prev.a = __a;
	}

	var __b = if_3(__prev._d);

	if (__prev.b !== __b) {
		_$_.if_update(__prev._e, __prev.b = __b);
	}
}

var root_15 = _$_.template(`<!>`, 1, 1);

function Current_render(__anchor, __block) {
	const store = _$_.track({ title: 'old' }, __block, 'vany8e');
	const provided = _$_.track('old', __block, 'ts8wl9');
	const changed = _$_.track(false, __block, 'rroytf');
	const enabled = _$_.track(false, __block, '1i50l4');
	const input = _$_.track('server', __block, 'f5ruzx');

	storeContext.set(provided);
	controls = { store, provided, changed, enabled, input };

	function Data({ value }) {
		return _$_.tsrx_element((__anchor, __block) => {
			const shared = storeContext.get();

			_$_.with_scope(__block, () => calls.push('current init'));

			var fragment_5 = root_15();
			var node_9 = _$_.first_child_frag(fragment_5);

			_$_.expression(node_9, () => _$_.tsrx_element((__anchor, __block) => {
				var fragment_6 = root_16();
				var input_2 = _$_.first_child_frag(fragment_6);

				_$_.ref(input_2, () => _$_.with_scope(__block, () => bindValue(input)));

				var span_2 = _$_.hydrating ? _$_.hydrate_sibling() : input_2.nextSibling;

				{
					var expression_4 = _$_.hydrating ? _$_.hydrate_child() : span_2.firstChild;

					_$_.expression(expression_4, () => input.value);
					_$_.hydrating && _$_.pop(span_2);
				}

				var b = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;
				var node_8 = _$_.hydrating ? _$_.hydrate_sibling() : b.nextSibling;
				var ifs_2 = _$_.if_static(node_8, if_3, 0, changed);

				_$_.render(render_2, {
					a: '',
					b: _$_.UNINITIALIZED,
					_a: value,
					_b: shared,
					_c: b,
					_d: changed,
					_e: ifs_2
				});

				_$_.append(__anchor, fragment_6);
			}));

			_$_.append(__anchor, fragment_5);
		});
	}

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => enabled.value)),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Data, __anchor, { value: store });
		})
	});
}

Current[_$_.$r] = Current_render;

var root_19 = _$_.template_el('button', null, 'live');

function consequent_3(__anchor, { b: __block }) {
	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, never),
		onHydrated: () => _$_.with_scope(__block, () => calls.push('hydrated')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var button_1 = root_19();

			button_1.__click = () => _$_.with_scope(__block, () => calls.push('click'));
			_$_.append(__anchor, button_1);
		})
	});
}

function if_4({ a: exists }) {
	if (exists.value) return consequent_3;
}

function render_3(__prev) {
	var __a = if_4({ a: __prev._a, b: __prev._b });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._c, __prev.a = __a);
	}
}

function Navigation_render(__anchor, __block) {
	const exists = _$_.track(false, __block, 'gk3542');

	controls = { exists };

	var ifs_3 = _$_.if_static(__anchor, if_4, 1, { a: exists, b: __block });

	_$_.render(render_3, { a: _$_.UNINITIALIZED, _a: exists, _b: __block, _c: ifs_3 });
}

Navigation[_$_.$r] = Navigation_render;

var root_20 = _$_.template(`<!><!>`, 1, 2);

function Priority_render(__anchor, __block) {
	context.set('context');

	var fragment_7 = root_20();
	var node_10 = _$_.first_child_frag(fragment_7);

	_$_.render_component(Activity, node_10, {
		mode: "hidden",
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Child, __anchor, { name: "background" });
		})
	});

	var node_11 = _$_.hydrating ? _$_.hydrate_sibling() : node_10.nextSibling;

	_$_.render_component(Hydrate, node_11, {
		when,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Child, __anchor, { name: "urgent" });
		})
	});

	_$_.append(__anchor, fragment_7);
}

Priority[_$_.$r] = Priority_render;

function DynamicFactory_render(__anchor, __block) {
	context.set('context');

	_$_.render_component(Hydrate, __anchor, {
		when,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Hydrate, __anchor, {
				when: () => nested,
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(Child, __anchor, { name: "dynamic" });
				})
			});
		})
	});
}

DynamicFactory[_$_.$r] = DynamicFactory_render;

var root_21 = _$_.template_el('button', null, 'button');
var root_22 = _$_.template_el('strong', null, ' ');

function CallbackError_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			_$_.render_component(Hydrate, __anchor, {
				when,
				onHydrated: () => {
					throw _$_.with_scope(__block, () => new Error('completion failure'));
				},

				children: _$_.tsrx_element((__anchor, __block) => {
					var button_2 = root_21();

					_$_.append(__anchor, button_2);
				})
			});
		},
		(__anchor, error) => {
			var strong_1 = root_22();

			{
				var expression_6 = _$_.hydrating ? _$_.hydrate_child() : strong_1.firstChild;

				_$_.expression(expression_6, () => error.message);
				_$_.hydrating && _$_.pop(strong_1);
			}

			_$_.append(__anchor, strong_1);
		},
		null,
		true
	);
}

CallbackError[_$_.$r] = CallbackError_render;

var root_24 = _$_.template_el('p', null, 'first');
var root_25 = _$_.template_el('p', null, 'second');
var root_26 = _$_.template_el('p', null, 'third');

function consequent_4(__anchor) {
	var p_4 = root_24();

	_$_.append(__anchor, p_4);
}

function consequent_5(__anchor) {
	var p_5 = root_25();

	_$_.append(__anchor, p_5);
}

consequent_5.h = 1;

function consequent_6(__anchor) {
	var p_6 = root_26();

	_$_.append(__anchor, p_6);
}

consequent_6.h = 2;

function if_5(choice) {
	if (choice.value === 0) return consequent_4; else if (choice.value === 1) return consequent_5; else if (choice.value === 2) return consequent_6;
}

var root_27 = _$_.template_el('p', null, 'first');
var root_28 = _$_.template_el('p', null, 'second');
var root_29 = _$_.template_el('p', null, 'third');

function switch_case_0(__anchor) {
	var p_7 = root_27();

	_$_.append(__anchor, p_7);
}

function switch_case_1(__anchor) {
	var p_8 = root_28();

	_$_.append(__anchor, p_8);
}

switch_case_1.h = 1;

function switch_case_2(__anchor) {
	var p_9 = root_29();

	_$_.append(__anchor, p_9);
}

switch_case_2.h = 2;

function switch_1(choice) {
	switch (choice.value) {
		case 0:
			return switch_case_0;

		case 1:
			return switch_case_1;

		case 2:
			return switch_case_2;
	}
}

var root_23 = _$_.template(`<div id=if-chain><!></div><div id=switch><!>`, 1, 2);

function render_4(__prev) {
	var __a = if_5(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

function Branches_render(__anchor, __block) {
	const choice = _$_.track(Number(initial) || 0, __block, '4du39z');
	const enabled = _$_.track(false, __block, '126n282');

	controls = { choice, enabled };

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => enabled.value)),
		children: _$_.tsrx_element((__anchor, __block) => {
			var fragment_8 = root_23();
			var div_1 = _$_.first_child_frag(fragment_8);

			{
				var node_12 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;
				var ifs_4 = _$_.if_static(node_12, if_5, 0, choice);

				_$_.hydrating && _$_.pop(div_1);
			}

			var div_2 = _$_.hydrating ? _$_.hydrate_sibling() : div_1.nextSibling;

			{
				var node_13 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

				_$_.switch(node_13, switch_1, false, choice);
				_$_.hydrating && _$_.pop(div_2);
			}

			_$_.render(render_4, { a: _$_.UNINITIALIZED, _a: choice, _b: ifs_4 });
			_$_.append(__anchor, fragment_8);
		})
	});
}

Branches[_$_.$r] = Branches_render;

function DerivedChildren_render(__anchor, __block) {
	const enabled = _$_.track(false, __block, '9zhlv3');
	const value = _$_.track('old', __block, 'v2bq16');

	const children = _$_.track(
		() => {
			_$_.with_scope(__block, () => calls.push('children read'));

			return value.value;
		},
		__block,
		'hw1lpe'
	);

	controls = { enabled, value };

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => enabled.value)),
		children: _$_.normalize_children(children)
	});
}

DerivedChildren[_$_.$r] = DerivedChildren_render;

import {
	Hydrate,
	Activity,
	Context,
	bindValue,
	effect,
	track,
	trackAsync
} from 'ripple';

import { condition, interaction, never, load } from 'ripple/hydration';

export const calls = [];
export let controls;
export let initial = 'server';
export let when = condition(false);
export let nested = interaction();
export let fail = false;
export let duringInit;
export let stream = Promise.resolve('streamed');

export function configure(options = {}) {
	when = options.when ?? condition(false);
	nested = options.nested ?? interaction();
	initial = options.initial ?? 'server';
	fail = options.fail ?? false;
	duringInit = options.duringInit;
	stream = options.stream ?? Promise.resolve('streamed');
	calls.length = 0;
}

const context = _$_.context();

function Child(__props) {
	return _$_.tsrx_element(Child_render, __props);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

export function Condition() {
	return _$_.tsrx_element(Condition_render);
}

export function Nested() {
	return _$_.tsrx_element(Nested_render);
}

export function Hidden() {
	return _$_.tsrx_element(Hidden_render);
}

export function Async() {
	return _$_.tsrx_element(Async_render);
}

export function Stream() {
	return _$_.tsrx_element(Stream_render);
}

export function Recovery() {
	return _$_.tsrx_element(Recovery_render);
}

export function Errors() {
	return _$_.tsrx_element(Errors_render);
}

export function Shapes() {
	return _$_.tsrx_element(Shapes_render);
}

export function Replacement() {
	return _$_.tsrx_element(Replacement_render);
}

const storeContext = _$_.context();

export function Current() {
	return _$_.tsrx_element(Current_render);
}

export function Navigation() {
	return _$_.tsrx_element(Navigation_render);
}

export function Priority() {
	return _$_.tsrx_element(Priority_render);
}

export function DynamicFactory() {
	return _$_.tsrx_element(DynamicFactory_render);
}

export function CallbackError() {
	return _$_.tsrx_element(CallbackError_render);
}

export function Branches() {
	return _$_.tsrx_element(Branches_render);
}

export function DerivedChildren() {
	return _$_.tsrx_element(DerivedChildren_render);
}

_$_.delegate(['click', 'focusin']);