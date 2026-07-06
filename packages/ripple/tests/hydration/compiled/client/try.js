// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<p class="root-pending">root loading...</p>`, 0);
var root_1 = _$_.template(`<section class="root-catch"><p class="root-error"> </p><button class="root-reset">retry</button></section>`, 0);
var root_2 = _$_.template(`<p>should not render</p>`, 1, 1);
var root_3 = _$_.template(`<p class="root-async-value"> </p>`, 0);
var root_4 = _$_.template(`<p class="root-async-value"> </p>`, 0);
var root_5 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_7 = _$_.template(`<li> </li>`, 0);
var root_6 = _$_.template(`<ul class="items"></ul>`, 0);
var root_10 = _$_.template(`<div class="loading">loading async content</div>`, 0);
var root_9 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_8 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<div class="resolved"> </div>`, 0);

import { trackAsync } from 'ripple';

export function RootPending() {
	return _$_.tsrx_element((__anchor, __block) => {
		var p = root();

		_$_.append(__anchor, p);
	});
}

export function RootCatch({ error, reset }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var section = root_1();

		{
			var p_1 = _$_.child(section);

			{
				var expression = _$_.child(p_1);

				_$_.expression(expression, () => error.message);
				_$_.pop(p_1);
			}

			var button = _$_.sibling(p_1);

			_$_.event('Click', button, reset);
		}

		_$_.append(__anchor, section);
	});
}

export function RootThrows() {
	return _$_.tsrx_element((__anchor, __block) => {
		throw _$_.with_scope(__block, () => new Error('root exploded'));

		var fragment = root_2();

		_$_.append(__anchor, fragment);
	});
}

export function RootAsyncDirect() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('root async value')), __block, 'd6bf9e33');
		var p_2 = root_3();

		{
			var expression_1 = _$_.child(p_2);

			_$_.expression(expression_1, () => lazy.value);
			_$_.pop(p_2);
		}

		_$_.append(__anchor, p_2);
	});
}

export function RootAsyncRejects() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.reject(new Error('root async failed'))), __block, 'd2fe7b64');
		var p_3 = root_4();

		{
			var expression_2 = _$_.child(p_3);

			_$_.expression(expression_2, () => lazy_1.value);
			_$_.pop(p_3);
		}

		_$_.append(__anchor, p_3);
	});
}

export function AsyncListInTryPending() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				_$_.render_component(AsyncList, __anchor, {});
			},
			null,
			(__anchor) => {
				var p_4 = root_5();

				_$_.append(__anchor, p_4);
			},
			true
		);
	});
}

function AsyncList() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(['alpha', 'beta', 'gamma'])), __block, 'b3d31627');
		var ul = root_6();

		{
			_$_.for(
				ul,
				() => lazy_2.value,
				(__anchor, item) => {
					var li = root_7();

					{
						var expression_3 = _$_.child(li);

						_$_.expression(expression_3, () => item);
						_$_.pop(li);
					}

					_$_.append(__anchor, li);
				},
				4
			);

			_$_.pop(ul);
		}

		_$_.append(__anchor, ul);
	});
}

export function AsyncTryWithLeadingSibling() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_8();
		var node_1 = _$_.first_child_frag(fragment_1);

		_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_2 = root_9();
			var div = _$_.first_child_frag(fragment_2);
			var node = _$_.sibling(div);

			_$_.try(
				node,
				(__anchor) => {
					_$_.render_component(AsyncContent, __anchor, {});
				},
				null,
				(__anchor) => {
					var div_1 = root_10();

					_$_.append(__anchor, div_1);
				}
			);

			_$_.append(__anchor, fragment_2);
		}));

		_$_.append(__anchor, fragment_1);
	});
}

function AsyncContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve('ready')), __block, '15ea8758');
		var div_2 = root_11();

		{
			var expression_4 = _$_.child(div_2);

			_$_.expression(expression_4, () => lazy_3.value);
			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}