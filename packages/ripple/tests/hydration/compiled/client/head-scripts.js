// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_2 = _$_.template(
	`<script id=first-script>
				window.__ripple_script_runs = (window.__ripple_script_runs || 0) + 1;
				window.__ripple_script_nonce = document.currentScript.nonce;
				window.__ripple_script_version = document.currentScript.dataset.version;
			</script><meta name=between-scripts content=preserved><script type=module id=module-script>
				window.__ripple_script_meta = typeof import.meta;
				window.__ripple_module_script_runs = (window.__ripple_module_script_runs || 0) + 1;
			</script><script id=last-script nonce=static-nonce>
				window.__ripple_last_script_runs = (window.__ripple_last_script_runs || 0) + 1;
			</script>`,
	1,
	4
);

function render(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_attribute(__prev._b, 'data-version', __prev.a = __a);
	}
}

var root_1 = _$_.template_el('button');

function render_1(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root = _$_.template(`<!>`, 1, 1);

function Scripts_render(__anchor, __block, { nonce }) {
	const version = _$_.track(0, __block, '1yz2dxy');
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var button = root_1();

		button.__click = () => version.value++;

		_$_.head('c3c1b176', (__anchor) => {
			var fragment_1 = root_2();
			var script = _$_.first_child_frag(fragment_1);

			script = _$_.script(script);
			_$_.set_attribute(script, 'nonce', nonce);

			var meta = _$_.hydrating ? _$_.hydrate_sibling() : script.nextSibling;
			var script_1 = _$_.hydrating ? _$_.hydrate_sibling() : meta.nextSibling;

			script_1 = _$_.script(script_1);
			_$_.set_attribute(script_1, 'nonce', nonce);

			var script_2 = _$_.hydrating ? _$_.hydrate_sibling() : script_1.nextSibling;

			script_2 = _$_.script(script_2);
			_$_.render(render, { a: void 0, _a: version, _b: script });
			_$_.append(__anchor, fragment_1);
		});

		_$_.render(render_1, { a: '', _a: version, _b: button });
		_$_.append(__anchor, button);
	}));

	_$_.append(__anchor, fragment);
}

Scripts[_$_.$r] = Scripts_render;

var root_3 = _$_.template(`<script id=dynamic-script>
			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;
		</script>`);

function DynamicType_render(__anchor, __block, { type, nonce, onRef }) {
	onRef = { v: onRef };

	_$_.head('4ddff2d1', (__anchor) => {
		var script_3 = root_3();

		script_3 = _$_.script(script_3);
		_$_.set_attribute(script_3, 'type', type);
		_$_.set_attribute(script_3, 'nonce', nonce);
		_$_.ref(script_3, () => onRef.v, (v) => onRef.v = v);
		_$_.append(__anchor, script_3);
	});
}

DynamicType[_$_.$r] = DynamicType_render;

var root_4 = _$_.template(`<script>
			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;
		</script>`);

function render_2(__prev) {
	__prev.a = _$_.spread(__prev._a, __prev._b, __prev.a);
}

function SpreadAttributes_render(__anchor, __block, { attrs }) {
	_$_.head('13175592', (__anchor) => {
		var script_4 = root_4();

		script_4 = _$_.script(script_4);
		_$_.render(render_2, { a: void 0, _a: script_4, _b: attrs });
		_$_.append(__anchor, script_4);
	});
}

SpreadAttributes[_$_.$r] = SpreadAttributes_render;

var root_5 = _$_.template(`<script type=application/json id=empty-head-data></script><script type=module src=/example.js id=external-script async nonce=static-nonce></script>`, 1, 2);

function EmptyScripts_render(__anchor, __block) {
	_$_.head('db555c34', (__anchor) => {
		var fragment_2 = root_5();
		var script_6 = _$_.first_child_frag(fragment_2);
		var script_5 = _$_.hydrating ? _$_.hydrate_sibling() : script_6.nextSibling;

		script_5 = _$_.script(script_5);
		_$_.append(__anchor, fragment_2);
	});
}

EmptyScripts[_$_.$r] = EmptyScripts_render;

import { track } from 'ripple';

export function Scripts(__props) {
	return _$_.tsrx_element(Scripts_render, __props);
}

export function DynamicType(__props) {
	return _$_.tsrx_element(DynamicType_render, __props);
}

export function SpreadAttributes(__props) {
	return _$_.tsrx_element(SpreadAttributes_render, __props);
}

export function EmptyScripts() {
	return _$_.tsrx_element(EmptyScripts_render);
}

_$_.delegate(['click']);