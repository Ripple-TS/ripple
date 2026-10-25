// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<article><script type=application/json>
  {"count":1,"text":"<tag> &amp; > \` \${value} café","escaped":"\\u003c/script>"}
		</script><button>`);

function render(__prev) {
	var __count_value = __prev._a.value;
	var __a = __count_value;

	if (__prev.a !== __a) {
		_$_.set_attribute(__prev._b, 'data-count', __prev.a = __a);
	}

	var __b = __count_value;

	if (__prev.b !== __b) {
		_$_.set_text_content(__prev._c, __b, __prev.b);
		__prev.b = __b;
	}
}

function Card_render(__anchor, __block, { id, nonce }) {
	const count = _$_.track(0, __block, 'rw6ptn');
	var article = root();

	{
		var script = _$_.hydrating ? _$_.hydrate_child() : article.firstChild;

		_$_.set_attribute(script, 'id', id);
		_$_.set_attribute(script, 'nonce', nonce);

		var button = _$_.hydrating ? _$_.hydrate_sibling() : script.nextSibling;

		button.__click = () => count.value++;
	}

	_$_.render(render, { a: void 0, b: '', _a: count, _b: script, _c: button });
	_$_.append(__anchor, article);
}

Card[_$_.$r] = Card_render;

var root_1 = _$_.template(`<script type=application/ld+json id=root-data>
		{"count":1}
	</script>`);

var root_3 = _$_.template(`<script type=application/json id=empty-data></script><script type=application/json id=whitespace-data> 	 </script><p>after`, 1, 3);
var root_2 = _$_.template(`<!>`, 1, 1);

function EmptyData_render(__anchor, __block) {
	var fragment = root_2();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_3();

		_$_.next(2);
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

EmptyData[_$_.$r] = EmptyData_render;

var root_5 = _$_.template(
	`<script type=text/plain id=inert-data>
			window.__ripple_data_script_runs = (window.__ripple_data_script_runs || 0) + 1;
		</script><p>after`,
	1,
	2
);

var root_4 = _$_.template(`<!>`, 1, 1);

function InertData_render(__anchor, __block) {
	var fragment_2 = root_4();
	var node_1 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_5();

		_$_.next();
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

InertData[_$_.$r] = InertData_render;

var root_7 = _$_.template(`<script type=application/json id=conditional-data>
				{"visible":true}
			</script>`);

function consequent(__anchor) {
	var script_2 = root_7();

	_$_.append(__anchor, script_2);
}

function if_1(visible) {
	if (visible.value) return consequent;
}

var root_6 = _$_.template_el('article', null, [['button', null, 'toggle']]);

function render_1(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}
}

function ConditionalData_render(__anchor, __block) {
	const visible = _$_.track(true, __block, '1dbpg4i');
	var article_1 = root_6();

	{
		var node_2 = _$_.hydrating ? _$_.hydrate_child() : article_1.firstChild;
		var ifs = _$_.if_static(node_2, if_1, 0, visible);
		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : node_2;

		button_1.__click = () => visible.value = !visible.value;
		_$_.hydrating && _$_.pop(article_1);
	}

	_$_.render(render_1, { a: _$_.UNINITIALIZED, _a: visible, _b: ifs });
	_$_.append(__anchor, article_1);
}

ConditionalData[_$_.$r] = ConditionalData_render;

var root_10 = _$_.template(`<script type=application/json id=head-data>
				{"text":"<tag> &amp;"}
			</script>`);

var root_9 = _$_.template_el('p', null, 'body');
var root_8 = _$_.template(`<!>`, 1, 1);

function HeadData_render(__anchor, __block) {
	var fragment_4 = root_8();
	var node_3 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var p = root_9();

		_$_.head('09cf7ed3', (__anchor) => {
			var script_3 = root_10();

			_$_.append(__anchor, script_3);
		});

		_$_.append(__anchor, p);
	}));

	_$_.append(__anchor, fragment_4);
}

HeadData[_$_.$r] = HeadData_render;

import { track } from 'ripple';

export function Card(__props) {
	return _$_.tsrx_element(Card_render, __props);
}

export function RootData() {
	return _$_.tsrx_element((__anchor, __block) => {
		var script_1 = root_1();

		_$_.append(__anchor, script_1);
	});
}

export function EmptyData() {
	return _$_.tsrx_element(EmptyData_render);
}

export function InertData() {
	return _$_.tsrx_element(InertData_render);
}

export function ConditionalData() {
	return _$_.tsrx_element(ConditionalData_render);
}

export function HeadData() {
	return _$_.tsrx_element(HeadData_render);
}

_$_.delegate(['click']);