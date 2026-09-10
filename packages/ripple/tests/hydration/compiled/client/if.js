// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="shown">Visible</div>`, 0);

function consequent(__anchor, show) {
	var div = root();

	_$_.append(__anchor, div);
}

function if_1(show) {
	if (show) return consequent;
}

function IfTruthy_render(__anchor, __block) {
	const show = true;

	_$_.if(__anchor, if_1, true, show);
}

IfTruthy[_$_.$r] = IfTruthy_render;

var root_1 = _$_.template(`<div class="shown">Visible</div>`, 0);

function consequent_1(__anchor, show) {
	var div_1 = root_1();

	_$_.append(__anchor, div_1);
}

function if_2(show) {
	if (show) return consequent_1;
}

function IfFalsy_render(__anchor, __block) {
	const show = false;

	_$_.if(__anchor, if_2, true, show);
}

IfFalsy[_$_.$r] = IfFalsy_render;

var root_2 = _$_.template(`<div class="logged-in">Welcome back!</div>`, 0);
var root_3 = _$_.template(`<div class="logged-out">Please log in</div>`, 0);

function consequent_2(__anchor, isLoggedIn) {
	var div_2 = root_2();

	_$_.append(__anchor, div_2);
}

function alternate(__anchor, isLoggedIn) {
	var div_3 = root_3();

	_$_.append(__anchor, div_3);
}

function if_3(isLoggedIn) {
	if (isLoggedIn) return consequent_2; else return alternate;
}

function IfElse_render(__anchor, __block) {
	const isLoggedIn = true;

	_$_.if(__anchor, if_3, true, isLoggedIn);
}

IfElse[_$_.$r] = IfElse_render;

var root_6 = _$_.template(`<div class="content">Content visible</div>`, 0);

function consequent_3(__anchor, lazy) {
	var div_4 = root_6();

	_$_.append(__anchor, div_4);
}

function if_4(lazy) {
	if (lazy.value) return consequent_3;
}

var root_5 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_4 = _$_.template(`<!>`, 1, 1);

function ReactiveIf_render(__anchor, __block) {
	let lazy = _$_.track(true, __block, '19a16ff0');
	var fragment = root_4();
	var node_1 = _$_.first_child_frag(fragment);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_5();
		var button = _$_.first_child_frag(fragment_1);

		button.__click = () => {
			_$_.set(lazy, !lazy.value);
		};

		var node = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.if(node, if_4, false, lazy);
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

ReactiveIf[_$_.$r] = ReactiveIf_render;

var root_9 = _$_.template(`<div class="on">ON</div>`, 0);
var root_10 = _$_.template(`<div class="off">OFF</div>`, 0);

function consequent_4(__anchor, lazy_1) {
	var div_5 = root_9();

	_$_.append(__anchor, div_5);
}

function alternate_1(__anchor, lazy_1) {
	var div_6 = root_10();

	_$_.append(__anchor, div_6);
}

function if_5(lazy_1) {
	if (lazy_1.value) return consequent_4; else return alternate_1;
}

var root_8 = _$_.template(`<button class="toggle">Toggle</button><!>`, 1, 2);
var root_7 = _$_.template(`<!>`, 1, 1);

function ReactiveIfElse_render(__anchor, __block) {
	let lazy_1 = _$_.track(false, __block, '41177f39');
	var fragment_2 = root_7();
	var node_3 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_8();
		var button_1 = _$_.first_child_frag(fragment_3);

		button_1.__click = () => {
			_$_.set(lazy_1, !lazy_1.value);
		};

		var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : button_1.nextSibling;

		_$_.if(node_2, if_5, false, lazy_1);
		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

ReactiveIfElse[_$_.$r] = ReactiveIfElse_render;

var root_14 = _$_.template(`<span class="inner-content">Inner</span>`, 0);

function consequent_5(__anchor, lazy_3) {
	var span = root_14();

	_$_.append(__anchor, span);
}

function if_6(lazy_3) {
	if (lazy_3.value) return consequent_5;
}

var root_13 = _$_.template(`<div class="outer-content">Outer<!></div>`, 0);
var root_12 = _$_.template(`<button class="outer-toggle">Outer</button><button class="inner-toggle">Inner</button><!>`, 1, 3);
var root_11 = _$_.template(`<!>`, 1, 1);

function NestedIf_render(__anchor, __block) {
	let lazy_2 = _$_.track(true, __block, '7894e1df');
	let lazy_3 = _$_.track(true, __block, 'f21b8c26');
	var fragment_4 = root_11();
	var node_6 = _$_.first_child_frag(fragment_4);

	_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_5 = root_12();
		var button_2 = _$_.first_child_frag(fragment_5);

		button_2.__click = () => {
			_$_.set(lazy_2, !lazy_2.value);
		};

		var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : button_2.nextSibling;

		button_3.__click = () => {
			_$_.set(lazy_3, !lazy_3.value);
		};

		var node_4 = _$_.hydrating ? _$_.hydrate_sibling() : button_3.nextSibling;

		{
			var consequent_6 = (__anchor) => {
				var div_7 = root_13();

				{
					var expression = _$_.hydrating ? _$_.hydrate_child() : div_7.firstChild;
					var node_5 = _$_.hydrating ? _$_.hydrate_sibling() : expression.nextSibling;

					_$_.if(node_5, if_6, false, lazy_3);
					_$_.hydrating && _$_.pop(div_7);
				}

				_$_.append(__anchor, div_7);
			};

			_$_.if(node_4, () => {
				if (lazy_2.value) return consequent_6;
			});
		}

		_$_.append(__anchor, fragment_5);
	}));

	_$_.append(__anchor, fragment_4);
}

NestedIf[_$_.$r] = NestedIf_render;

var root_16 = _$_.template(`<div class="state">Loading...</div>`, 0);
var root_17 = _$_.template(`<div class="state">Success!</div>`, 0);
var root_18 = _$_.template(`<div class="state">Error occurred</div>`, 0);

function consequent_7(__anchor, lazy_4) {
	var div_9 = root_16();

	_$_.append(__anchor, div_9);
}

function consequent_8(__anchor, lazy_4) {
	var div_10 = root_17();

	_$_.append(__anchor, div_10);
}

function alternate_2(__anchor, lazy_4) {
	var div_11 = root_18();

	_$_.append(__anchor, div_11);
}

function if_7(lazy_4) {
	if (lazy_4.value === 'loading') return consequent_7; else if (lazy_4.value === 'success') return consequent_8; else return alternate_2;
}

var root_15 = _$_.template(`<div><button class="success">Success</button><button class="error">Error</button><button class="loading">Loading</button><!></div>`, 0);

function IfElseIfChain_render(__anchor, __block) {
	let lazy_4 = _$_.track('loading', __block, '4c69c94a');
	var div_8 = root_15();

	{
		var button_4 = _$_.hydrating ? _$_.hydrate_child() : div_8.firstChild;

		button_4.__click = () => {
			_$_.set(lazy_4, 'success');
		};

		var button_5 = _$_.hydrating ? _$_.hydrate_sibling() : button_4.nextSibling;

		button_5.__click = () => {
			_$_.set(lazy_4, 'error');
		};

		var button_6 = _$_.hydrating ? _$_.hydrate_sibling() : button_5.nextSibling;

		button_6.__click = () => {
			_$_.set(lazy_4, 'loading');
		};

		var node_7 = _$_.hydrating ? _$_.hydrate_sibling() : button_6.nextSibling;

		_$_.if(node_7, if_7, false, lazy_4);
		_$_.hydrating && _$_.pop(div_8);
	}

	_$_.append(__anchor, div_8);
}

IfElseIfChain[_$_.$r] = IfElseIfChain_render;

import { track } from 'ripple';

export function IfTruthy() {
	return _$_.tsrx_element(IfTruthy_render);
}

export function IfFalsy() {
	return _$_.tsrx_element(IfFalsy_render);
}

export function IfElse() {
	return _$_.tsrx_element(IfElse_render);
}

export function ReactiveIf() {
	return _$_.tsrx_element(ReactiveIf_render);
}

export function ReactiveIfElse() {
	return _$_.tsrx_element(ReactiveIfElse_render);
}

export function NestedIf() {
	return _$_.tsrx_element(NestedIf_render);
}

export function IfElseIfChain() {
	return _$_.tsrx_element(IfElseIfChain_render);
}

_$_.delegate(['click']);