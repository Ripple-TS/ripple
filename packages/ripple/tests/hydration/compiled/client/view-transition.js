// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('button', null, 'hello');

function Plain_render(__anchor, __block) {
	var button = root();

	_$_.append(__anchor, button);
}

Plain[_$_.$r] = Plain_render;

var root_1 = _$_.template_el('button', null, 'hello');

function Wrapped_render(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		children: _$_.tsrx_element((__anchor, __block) => {
			var button_1 = root_1();

			_$_.append(__anchor, button_1);
		})
	});
}

Wrapped[_$_.$r] = Wrapped_render;

var root_2 = _$_.template_el('button', ['class', 'counter']);

function render(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function App_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	count = _$_.track(0, __block, 'vsl822');

	_$_.render_component(ViewTransition, __anchor, {
		name: "counter",
		update: "counter-update",
		children: _$_.tsrx_element((__anchor, __block) => {
			var button_2 = root_2();

			button_2.__click = () => count.value++;
			_$_.render(render, { a: '', _a: button_2 });
			_$_.append(__anchor, button_2);
		})
	});
}

App[_$_.$r] = App_render;

var root_3 = _$_.template_el('p', ['class', 'result'], ' ');

function AsyncContent_render(__anchor, __block) {
	const data = _$_.track_async(() => pending.promise, __block, '9h55rr');

	_$_.render_component(ViewTransition, __anchor, {
		name: "result",
		children: _$_.tsrx_element((__anchor, __block) => {
			var p = root_3();

			{
				var expression_1 = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

				_$_.expression(expression_1, () => data.value);
				_$_.hydrating && _$_.pop(p);
			}

			_$_.append(__anchor, p);
		})
	});
}

AsyncContent[_$_.$r] = AsyncContent_render;

var root_6 = _$_.template_el('p', ['class', 'loading'], 'loading');
var root_5 = _$_.template(`<button class=counter></button><!>`, 1, 2);

function render_1(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_4 = _$_.template(`<!>`, 1, 1);

function Stream_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	count = _$_.track(0, __block, 'zmgaxu');

	var fragment = root_4();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_5();
		var button_3 = _$_.first_child_frag(fragment_1);

		button_3.__click = () => count.value++;

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		_$_.try(
			node,
			(__anchor) => {
				_$_.render_component(AsyncContent, __anchor, {});
			},
			null,
			(__anchor) => {
				var p_1 = root_6();

				_$_.append(__anchor, p_1);
			}
		);

		_$_.render(render_1, { a: '', _a: button_3 });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

Stream[_$_.$r] = Stream_render;

function WrappedStream_render(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		name: "stream",
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Stream, __anchor, {});
		})
	});
}

WrappedStream[_$_.$r] = WrappedStream_render;

var root_7 = _$_.template_el('input', ['value', 'server'], '', 1);

function Deferred_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	reveal = _$_.track(false, __block, '1uqpwf6');

	_$_.render_component(Hydrate, __anchor, {
		when: _$_.with_scope(__block, () => condition(() => reveal.value)),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(ViewTransition, __anchor, {
				children: _$_.tsrx_element((__anchor, __block) => {
					var input = root_7();

					_$_.append(__anchor, input);
				})
			});
		})
	});
}

Deferred[_$_.$r] = Deferred_render;

var root_8 = _$_.template(`<input value=draft><button>`, 1, 2);

function render_2(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function WrappedActivity_render(__anchor, __block, { initial = 'visible' }) {
	transition = _$_.with_scope(__block, createViewTransition);
	mode = _$_.track(initial, __block, '1ke0m6y');
	count = _$_.track(0, __block, '10vql9x');

	_$_.render_component(ViewTransition, __anchor, {
		name: "activity",
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Activity, __anchor, {
				mode,
				children: _$_.tsrx_element((__anchor, __block) => {
					var fragment_2 = root_8();
					var input_1 = _$_.first_child_frag(fragment_2);
					var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

					button_4.__click = () => count.value++;
					_$_.render(render_2, { a: '', _a: button_4 });
					_$_.append(__anchor, fragment_2);
				})
			});
		})
	});
}

WrappedActivity[_$_.$r] = WrappedActivity_render;

var root_9 = _$_.template(`<input value=draft><button>`, 1, 2);

function render_3(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function ActivityAroundTransition_render(__anchor, __block, { initial = 'visible' }) {
	transition = _$_.with_scope(__block, createViewTransition);
	mode = _$_.track(initial, __block, '6wtv2t');
	count = _$_.track(0, __block, '1xjynqc');

	_$_.render_component(Activity, __anchor, {
		mode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(ViewTransition, __anchor, {
				name: "activity",
				children: _$_.tsrx_element((__anchor, __block) => {
					var fragment_3 = root_9();
					var input_2 = _$_.first_child_frag(fragment_3);
					var button_5 = _$_.hydrating ? _$_.hydrate_sibling() : input_2.nextSibling;

					button_5.__click = () => count.value++;
					_$_.render(render_3, { a: '', _a: button_5 });
					_$_.append(__anchor, fragment_3);
				})
			});
		})
	});
}

ActivityAroundTransition[_$_.$r] = ActivityAroundTransition_render;

var root_10 = _$_.template_el('button', ['class', 'tsrx-79a67cbe']);

function render_4(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function Scoped_render(__anchor, __block, { value = 'auto' }) {
	transition = _$_.with_scope(__block, createViewTransition);
	count = _$_.track(0, __block, 'bm7o44');

	_$_.render_component(ViewTransition, __anchor, {
		name: "scoped",
		default: value,
		children: _$_.tsrx_element((__anchor, __block) => {
			var button_6 = root_10();

			button_6.__click = () => count.value++;
			_$_.render(render_4, { a: '', _a: button_6 });
			_$_.append(__anchor, button_6);
		}),
		$v: 'tsrx-79a67cbe'
	});
}

Scoped[_$_.$r] = Scoped_render;

import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync,
	Hydrate
} from 'ripple';

import { condition } from 'ripple/hydration';

export let transition;
export let count;
export let reveal;
export let mode;
export let pending = Promise.withResolvers();

export function reset() {
	pending = Promise.withResolvers();
}

export function Plain() {
	return _$_.tsrx_element(Plain_render);
}

export function Wrapped() {
	return _$_.tsrx_element(Wrapped_render);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

function AsyncContent() {
	return _$_.tsrx_element(AsyncContent_render);
}

export function Stream() {
	return _$_.tsrx_element(Stream_render);
}

export function WrappedStream() {
	return _$_.tsrx_element(WrappedStream_render);
}

export function Deferred() {
	return _$_.tsrx_element(Deferred_render);
}

export function WrappedActivity(__props) {
	return _$_.tsrx_element(WrappedActivity_render, __props);
}

export function ActivityAroundTransition(__props) {
	return _$_.tsrx_element(ActivityAroundTransition_render, __props);
}

export function Scoped(__props) {
	return _$_.tsrx_element(Scoped_render, __props);
}

_$_.delegate(['click']);