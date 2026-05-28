// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<p class="root-pending">root loading...</p>`, 1, 1);
var root_1 = _$_.template(`<section class="root-catch"><p class="root-error"> </p><button class="root-reset">retry</button></section>`, 1, 1);
var root_2 = _$_.template(`<p>should not render</p>`, 1, 1);
var root_3 = _$_.template(`<p class="root-async-value"> </p>`, 1, 1);
var root_4 = _$_.template(`<p class="root-async-value"> </p>`, 1, 1);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_5 = _$_.template(`<!>`, 1, 1);
var root_9 = _$_.template(`<li> </li>`, 0);
var root_8 = _$_.template(`<ul class="items"></ul>`, 1, 1);
var root_11 = _$_.template(`<!>`, 1, 1);
var root_12 = _$_.template(`<div class="loading">loading async content</div>`, 0);
var root_10 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_13 = _$_.template(`<div class="resolved"> </div>`, 1, 1);

import { trackAsync } from 'ripple';

export function RootPending(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();

	__r = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function RootCatch(__anchor, { error, reset }, __block) {
	_$_.push_component();

	var __r_1 = false;
	var fragment_1 = root_1();
	var section_1 = _$_.first_child_frag(fragment_1);

	{
		var p_1 = _$_.child(section_1);

		{
			var expression = _$_.child(p_1);

			_$_.expression(expression, () => error.message);
			_$_.pop(p_1);
		}

		var button_1 = _$_.sibling(p_1);

		_$_.event('Click', button_1, reset);
	}

	_$_.pop(section_1);
	__r_1 = true;
	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function RootThrows(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;

	throw _$_.with_scope(__block, () => new Error('root exploded'));

	var fragment_2 = root_2();

	__r_2 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

export function RootAsyncDirect(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	let lazy = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('root async value')), __block, 'd6bf9e33');
	var fragment_3 = root_3();
	var p_2 = _$_.first_child_frag(fragment_3);

	{
		var expression_1 = _$_.child(p_2);

		_$_.expression(expression_1, () => lazy.value);
		_$_.pop(p_2);
	}

	__r_3 = true;
	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function RootAsyncRejects(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	let lazy_1 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('root async failed'))), __block, 'd2fe7b64');
	var fragment_4 = root_4();
	var p_3 = _$_.first_child_frag(fragment_4);

	{
		var expression_2 = _$_.child(p_3);

		_$_.expression(expression_2, () => lazy_1.value);
		_$_.pop(p_3);
	}

	__r_4 = true;
	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function AsyncListInTryPending(__anchor, _, __block) {
	_$_.push_component();

	var __r_5 = false;
	var fragment_5 = root_5();
	var node = _$_.first_child_frag(fragment_5);

	_$_.try(
		node,
		(__anchor) => {
			var fragment_6 = root_6();
			var node_1 = _$_.first_child_frag(fragment_6);

			AsyncList(node_1, {}, _$_.active_block);
			_$_.append(__anchor, fragment_6);
		},
		null,
		(__anchor) => {
			var p_4 = root_7();

			_$_.append(__anchor, p_4);
		}
	);

	__r_5 = true;
	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

function AsyncList(__anchor, _, __block) {
	_$_.push_component();

	var __r_6 = false;
	let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(['alpha', 'beta', 'gamma'])), __block, 'b3d31627');
	var fragment_7 = root_8();
	var ul_1 = _$_.first_child_frag(fragment_7);

	{
		_$_.for(
			ul_1,
			() => lazy_2.value,
			(__anchor, item) => {
				var li_1 = root_9();

				{
					var expression_3 = _$_.child(li_1);

					_$_.expression(expression_3, () => item);
					_$_.pop(li_1);
				}

				_$_.append(__anchor, li_1);
			},
			4
		);

		_$_.pop(ul_1);
	}

	__r_6 = true;
	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

export function AsyncTryWithLeadingSibling(__anchor, _, __block) {
	_$_.push_component();

	var __r_7 = false;
	var fragment_8 = root_10();
	var div_1 = _$_.first_child_frag(fragment_8);
	var node_2 = _$_.sibling(div_1);

	_$_.try(
		node_2,
		(__anchor) => {
			var fragment_9 = root_11();
			var node_3 = _$_.first_child_frag(fragment_9);

			AsyncContent(node_3, {}, _$_.active_block);
			_$_.append(__anchor, fragment_9);
		},
		null,
		(__anchor) => {
			var div_2 = root_12();

			_$_.append(__anchor, div_2);
		}
	);

	__r_7 = true;
	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

function AsyncContent(__anchor, _, __block) {
	_$_.push_component();

	var __r_8 = false;
	let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('ready')), __block, '15ea8758');
	var fragment_10 = root_13();
	var div_3 = _$_.first_child_frag(fragment_10);

	{
		var expression_4 = _$_.child(div_3);

		_$_.expression(expression_4, () => lazy_3.value);
		_$_.pop(div_3);
	}

	__r_8 = true;
	_$_.append(__anchor, fragment_10);
	_$_.pop_component();
}