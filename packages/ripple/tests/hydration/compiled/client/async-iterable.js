// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('em', null, ' ');

function StatusSummary_render(__anchor, __block, { value }) {
	const status = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(_$_.get_tracked_status(value).complete ? 'done' : 'open')), __block, 'eadcju');
	var em = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : em.firstChild;

		_$_.expression(expression, () => status.value);
		_$_.hydrating && _$_.pop(em);
	}

	_$_.append(__anchor, em);
}

StatusSummary[_$_.$r] = StatusSummary_render;

var root_3 = _$_.template_el('b', null, 'done');
var root_4 = _$_.template_el('i', null, 'open');

function consequent(__anchor) {
	var b = root_3();

	_$_.append(__anchor, b);
}

function alternate(__anchor) {
	var i = root_4();

	_$_.append(__anchor, i);
}

alternate.h = 1;

function if_1(value) {
	if (_$_.get_tracked_status(value).complete) return consequent; else return alternate;
}

var root_2 = _$_.template(`<!><input defaultValue=server><p></p><!>`, 1, 4);

function render(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}

	var __b = __prev._a.value.cursor;

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._c, __b, __prev.b);
		__prev.b = __b;
	}
}

var root_1 = _$_.template(`<!>`, 1, 1);

function View_render(__anchor, __block, { value }) {
	var fragment = root_1();
	var node_2 = _$_.first_child_frag(fragment);

	_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_2();
		var node = _$_.first_child_frag(fragment_1);
		var ifs = _$_.if_static(node, if_1, 0, value);
		var input = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;
		var p = _$_.hydrating ? _$_.hydrate_sibling() : input.nextSibling;
		var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : p.nextSibling;

		_$_.render_component(StatusSummary, node_1, { value });
		_$_.render(render, { a: _$_.UNINITIALIZED, b: '', _a: value, _b: ifs, _c: p });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

View[_$_.$r] = View_render;

function Owned_render(__anchor, __block) {
	source = _$_.with_scope(__block, makeSource);
	_$_.render_component(View, __anchor, { value: source });
}

Owned[_$_.$r] = Owned_render;

function consequent_1(__anchor, { b: __block, c: enabled }) {
	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => enabled.value)),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Owned, __anchor, {});
		})
	});
}

function if_2({ a: show }) {
	if (show.value) return consequent_1;
}

var root_6 = _$_.template(`<button class=activate>activate</button><button class=remove>remove</button><button class=query>query</button><!>`, 1, 4);

function render_1(__prev) {
	var __a = if_2({ a: __prev._a, b: __prev._b, c: __prev._c });

	if (__prev.a !== __a) {
		_$_.if_update(__prev._d, __prev.a = __a);
	}
}

var root_5 = _$_.template(`<!>`, 1, 1);

function Deferred_render(__anchor, __block) {
	selection = _$_.track(0, __block, '188fmqx');

	const enabled = _$_.track(false, __block, '1u0dgw');
	const show = _$_.track(true, __block, '1kgpbmv');
	var fragment_2 = root_5();
	var node_4 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_6();
		var button = _$_.first_child_frag(fragment_3);

		button.__click = () => enabled.value = true;

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = () => show.value = false;

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		button_2.__click = () => selection.value = 200;

		var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;
		var ifs_1 = _$_.if_static(node_3, if_2, 0, { a: show, b: __block, c: enabled });

		_$_.render(render_1, {
			a: _$_.UNINITIALIZED,
			_a: show,
			_b: __block,
			_c: enabled,
			_d: ifs_1
		});

		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

Deferred[_$_.$r] = Deferred_render;

var root_8 = _$_.template(`<p class=active></p><button class=activate>activate</button><!>`, 1, 3);

function render_2(__prev) {
	var __a = source.value.cursor;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_7 = _$_.template(`<!>`, 1, 1);

function Shared_render(__anchor, __block) {
	selection = _$_.track(0, __block, '1u0kar');
	source = _$_.with_scope(__block, makeSource);

	const enabled = _$_.track(false, __block, 'dy5u4e');
	var fragment_4 = root_7();
	var node_6 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_8();
		var p_1 = _$_.first_child_frag(fragment_5);
		var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : p_1.nextSibling;

		button_3.__click = () => enabled.value = true;

		var node_5 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		_$_.render_component(Hydrate, node_5, {
			when: _$_.with_scope(__block, () => condition(() => enabled.value)),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(View, __anchor, { value: source });
			})
		});

		_$_.render(render_2, { a: '', _a: p_1 });
		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

Shared[_$_.$r] = Shared_render;

function Never_render(__anchor, __block) {
	selection = _$_.track(0, __block, 'ud61f0');

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, never),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Owned, __anchor, {});
		})
	});
}

Never[_$_.$r] = Never_render;

function Immediate_render(__anchor, __block) {
	selection = _$_.track(0, __block, '1wzerhc');
	_$_.render_component(Owned, __anchor, {});
}

Immediate[_$_.$r] = Immediate_render;

var root_11 = _$_.template(`<input value=100><p class=bound>`, 1, 2);

function render_3(__prev) {
	var __a = source.value.cursor;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_10 = _$_.template(`<p class=active></p><button class=activate>activate</button><!>`, 1, 3);

function render_4(__prev) {
	var __a = source.value.cursor;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_9 = _$_.template(`<!>`, 1, 1);

function BoundShared_render(__anchor, __block) {
	selection = _$_.track(0, __block, 'pna4yj');
	source = _$_.with_scope(__block, makeSource);

	const enabled = _$_.track(false, __block, '1bdt1sk');
	var fragment_6 = root_9();
	var node_8 = _$_.first_child_frag(fragment_6);

	_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_7 = root_10();
		var p_2 = _$_.first_child_frag(fragment_7);
		var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : p_2.nextSibling;

		button_4.__click = () => enabled.value = true;

		var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : button_4.nextSibling;

		_$_.render_component(Hydrate, node_7, {
			when: _$_.with_scope(__block, () => condition(() => enabled.value)),
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_8 = root_11();
				var input_1 = _$_.first_child_frag(fragment_8);

				_$_.ref(input_1, () => _$_.with_scope(__block, () => bindValue(() => String(source.value.cursor), (value) => source.value = { cursor: Number(value) })));

				var p_3 = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

				_$_.render(render_3, { a: '', _a: p_3 });
				_$_.append(__anchor, fragment_8);
			})
		});

		_$_.render(render_4, { a: '', _a: p_2 });
		_$_.append(__anchor, fragment_7);
	}));

	_$_.append(__anchor, fragment_6);
}

BoundShared[_$_.$r] = BoundShared_render;

import { Hydrate, bindValue, getTrackedStatus, track, trackAsync } from 'ripple';
import { condition, never } from 'ripple/hydration';

export const calls = [];
export let complete = false;
export let release;
export let selection;
export let source;

export function reset(done = false) {
	calls.length = 0;
	complete = done;
	release = undefined;
}

function makeSource() {
	var __block = _$_.scope();

	return _$_.track_async(
		(previous) => {
			const query = selection.value;

			calls.push(previous?.cursor);

			return (async function* () {
				if (previous === undefined || query !== 0) yield { cursor: query || 100 }; else if (!complete) {
					await new Promise((resolve) => {
						release = resolve;
					});

					yield { cursor: 300 };
				}
			})();
		},
		__block,
		'rs391u'
	);
}

function StatusSummary(__props) {
	return _$_.tsrx_element(StatusSummary_render, __props);
}

function View(__props) {
	return _$_.tsrx_element(View_render, __props);
}

function Owned() {
	return _$_.tsrx_element(Owned_render);
}

export function Deferred() {
	return _$_.tsrx_element(Deferred_render);
}

export function Shared() {
	return _$_.tsrx_element(Shared_render);
}

export function Never() {
	return _$_.tsrx_element(Never_render);
}

export function Immediate() {
	return _$_.tsrx_element(Immediate_render);
}

export function BoundShared() {
	return _$_.tsrx_element(BoundShared_render);
}

_$_.delegate(['click']);