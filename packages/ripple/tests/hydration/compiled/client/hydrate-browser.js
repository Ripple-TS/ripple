// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('p');

function Widget_render(__anchor, __block, { name }) {
	_$_.with_scope(__block, () => record('init', name));

	_$_.effect(() => {
		_$_.with_scope(__block, () => record('effect', name));
	});

	var p = root();

	_$_.set_attribute_value(p, 'data-widget', name);

	{
		p.textContent = name;
	}

	_$_.append(__anchor, p);
}

Widget[_$_.$r] = Widget_render;

var root_1 = _$_.template(`<div><input id=checkbox type=checkbox><output id=checked></output><input id=draft><output id=draft-value> </output><button id=button>button</button><button id=stop>stop</button><a id=link href=#destination>navigate</a><a id=cancel-link href=#cancelled>cancel</a><form><button id=submit>submit`);

function render(__prev) {
	var __a = String(__prev._a.value);

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function Actions_render(__anchor, __block) {
	_$_.with_scope(__block, () => record('init', 'actions'));

	const checked = _$_.track(false, __block, '1y0nxn7');
	const value = _$_.track('server', __block, 'ckuxtp');
	var div = root_1();

	div.__click = () => _$_.with_scope(__block, () => record('event', 'parent'));
	_$_.listen('click', div, () => _$_.with_scope(__block, () => record('event', 'capture')), true);

	{
		var input = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.ref(input, () => _$_.with_scope(__block, () => bindChecked(checked)));
		input.__change = () => _$_.with_scope(__block, () => record('event', 'change'));

		var output = _$_.hydrating ? _$_.hydrate_sibling() : input.nextSibling;
		var input_1 = _$_.hydrating ? _$_.hydrate_sibling() : output.nextSibling;

		_$_.ref(input_1, () => _$_.with_scope(__block, () => bindValue(value)));

		var output_1 = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : output_1.firstChild;

			_$_.expression(expression_2, () => value.value);
			_$_.hydrating && _$_.pop(output_1);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : output_1.nextSibling;

		button.__click = () => _$_.with_scope(__block, () => record('event', 'click'));

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		button_1.__click = (event) => {
			_$_.with_scope(__block, () => record('event', 'stop'));
			_$_.with_scope(__block, () => event.stopPropagation());
		};

		var a = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		a.__click = () => _$_.with_scope(__block, () => record('event', 'link'));

		var a_1 = _$_.hydrating ? _$_.hydrate_sibling() : a.nextSibling;

		a_1.__click = (event) => {
			_$_.with_scope(__block, () => record('event', 'cancel'));
			_$_.with_scope(__block, () => event.preventDefault());
		};

		var form = _$_.hydrating ? _$_.hydrate_sibling() : a_1.nextSibling;

		form.__submit = (event) => {
			_$_.with_scope(__block, () => event.preventDefault());
			_$_.with_scope(__block, () => record('event', 'submit'));
		};
	}

	_$_.render(render, { a: '', _a: checked, _b: output });
	_$_.append(__anchor, div);
}

Actions[_$_.$r] = Actions_render;

var root_2 = _$_.template_el('input', ['id', 'key'], '', 1);

function Key_render(__anchor, __block) {
	_$_.with_scope(__block, () => record('init', 'key'));

	var input_2 = root_2();

	input_2.__keydown = (event) => _$_.with_scope(__block, () => record('key', event.key));
	_$_.append(__anchor, input_2);
}

Key[_$_.$r] = Key_render;

var root_3 = _$_.template_el('input', ['id', 'focus'], '', 1);

function Focus_render(__anchor, __block) {
	_$_.with_scope(__block, () => record('init', 'focus'));

	var input_3 = root_3();

	input_3.__focusin = () => _$_.with_scope(__block, () => record('event', 'focus'));
	_$_.append(__anchor, input_3);
}

Focus[_$_.$r] = Focus_render;

var root_4 = _$_.template_el('button', ['id', 'enter'], 'hover');

function Enter_render(__anchor, __block) {
	_$_.with_scope(__block, () => record('init', 'enter'));

	var button_2 = root_4();

	_$_.listen('pointerenter', button_2, () => _$_.with_scope(__block, () => record('event', 'enter')));
	_$_.append(__anchor, button_2);
}

Enter[_$_.$r] = Enter_render;

var root_6 = _$_.template_el('p', ['id', 'static', 'class', 'tsrx-e90d79db'], 'styled before hydration');
var root_5 = _$_.template(`<!>`, 1, 1);

function Static_render(__anchor, __block) {
	_$_.with_scope(__block, () => record('init', 'never'));

	var fragment = root_5();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var p_1 = root_6();

		_$_.append(__anchor, p_1);
	}));

	_$_.append(__anchor, fragment);
}

Static[_$_.$r] = Static_render;

var root_7 = _$_.template_el('li');

function render_1(__prev) {
	var __a = String(__prev._a);

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function Row_render(__anchor, __block, { index }) {
	_$_.with_scope(__block, () => record('row', String(index)));

	var li = root_7();

	_$_.render(render_1, { a: '', _a: index, _b: li });
	_$_.append(__anchor, li);
}

Row[_$_.$r] = Row_render;

var root_9 = _$_.template(`<!><span id=visible-tail>tail`, 1, 2);
var root_10 = _$_.template_el('ul', ['id', 'large']);
var root_8 = _$_.template(`<main><div style=height:3000px></div><div id=destination>destination`, 1, 1);

function App_render(__anchor, __block) {
	const enabled = _$_.track(false, __block, 'h2n1qn');

	if (typeof window !== 'undefined') window.openLarge = () => enabled.value = true;

	var fragment_1 = root_8();
	var main = _$_.first_child_frag(fragment_1);

	{
		var node_1 = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;

		_$_.render_component(Hydrate, node_1, {
			when: _$_.with_scope(__block, () => idle({ timeout: 30 })),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Widget, __anchor, { name: "idle" });
			})
		});

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1;

		_$_.render_component(Hydrate, node_2, {
			when: _$_.with_scope(__block, () => media('(min-width: 1200px)')),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Widget, __anchor, { name: "media" });
			})
		});

		var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : node_2;

		_$_.render_component(Hydrate, node_3, {
			when: _$_.with_scope(__block, () => interaction({ events: 'click' })),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Actions, __anchor, {});
			})
		});

		var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : node_3;

		_$_.render_component(Hydrate, node_4, {
			when: _$_.with_scope(__block, () => condition(false)),
			onHydrated: () => _$_.with_scope(__block, () => record('hydrated', 'key-parent')),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Hydrate, __anchor, {
					when: _$_.with_scope(__block, () => interaction({ events: 'keydown' })),
					children: _$_.tsrx_element((__anchor, __block) => {
						_$_.render_component(Key, __anchor, {});
					})
				});
			})
		});

		var node_5 = _$_.hydrating ? _$_.hydrate_sibling() : node_4;

		_$_.render_component(Hydrate, node_5, {
			when: _$_.with_scope(__block, () => interaction({ events: 'focusin' })),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Focus, __anchor, {});
			})
		});

		var node_6 = _$_.hydrating ? _$_.hydrate_sibling() : node_5;

		_$_.render_component(Hydrate, node_6, {
			when: _$_.with_scope(__block, () => interaction({ events: 'pointerenter' })),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Enter, __anchor, {});
			})
		});

		var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : node_6;

		_$_.render_component(Hydrate, node_7, {
			when: _$_.with_scope(__block, never),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Static, __anchor, {});
			})
		});

		var div_1 = _$_.hydrating ? _$_.hydrate_sibling() : node_7;
		var node_8 = _$_.hydrating ? _$_.hydrate_sibling() : div_1.nextSibling;

		_$_.render_component(Hydrate, node_8, {
			when: _$_.with_scope(__block, () => visible({ rootMargin: '0px', threshold: [0, 0.5] })),
			children: _$_.tsrx_element((__anchor, __block) => {
				var fragment_2 = root_9();
				var node_9 = _$_.first_child_frag(fragment_2);

				_$_.render_component(Widget, node_9, { name: "visible" });
				_$_.next();
				_$_.append(__anchor, fragment_2);
			})
		});

		var node_10 = _$_.hydrating ? _$_.hydrate_sibling() : node_8;

		_$_.render_component(Hydrate, node_10, {
			when: () => _$_.with_scope(__block, () => location.search.includes('eager'))
				? _$_.with_scope(__block, load)
				: _$_.with_scope(__block, () => condition(() => enabled.value)),

			children: _$_.tsrx_element((__anchor, __block) => {
				var ul = root_10();

				{
					_$_.for(
						ul,
						() => _$_.with_scope(__block, () => Array.from({ length: 2500 }, (_, index) => index)),
						(__anchor, index) => {
							_$_.render_component(Row, __anchor, { index });
						},
						4
					);

					_$_.hydrating && _$_.pop(ul);
				}

				_$_.append(__anchor, ul);
			})
		});

		_$_.hydrating && _$_.pop(main);
	}

	_$_.append(__anchor, fragment_1);
}

App[_$_.$r] = App_render;

import { Hydrate, track, effect, bindChecked, bindValue } from 'ripple';
import { idle, visible, interaction, media, condition, never, load } from 'ripple/hydration';

function record(kind, name) {
	if (typeof window !== 'undefined') window.hydrateTrace.push({ kind, name, time: performance.now() });
}

function Widget(__props) {
	return _$_.tsrx_element(Widget_render, __props);
}

function Actions() {
	return _$_.tsrx_element(Actions_render);
}

function Key() {
	return _$_.tsrx_element(Key_render);
}

function Focus() {
	return _$_.tsrx_element(Focus_render);
}

function Enter() {
	return _$_.tsrx_element(Enter_render);
}

function Static() {
	return _$_.tsrx_element(Static_render);
}

function Row(__props) {
	return _$_.tsrx_element(Row_render, __props);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

_$_.delegate(['click', 'change', 'submit', 'keydown', 'focusin']);