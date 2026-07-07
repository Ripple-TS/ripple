// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="resolved"><span class="value"> </span><button class="inc">inc</button></div>`, 0);
var root_4 = _$_.template(`<!><footer class="after-async">after-async</footer>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_5 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_2 = _$_.template(`<span class="before">before</span><!><span class="sibling-after">sibling-after</span>`, 1, 3);
var root_1 = _$_.template(`<!>`, 1, 1);
var root_6 = _$_.template(`<p class="resolved"> </p>`, 0);
var root_9 = _$_.template(`<em class="caught"> </em>`, 0);
var root_8 = _$_.template(`<span class="before">before</span><!>`, 1, 2);
var root_7 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<p class="resolved"> </p>`, 0);
var root_11 = _$_.template(`<em class="caught"> </em>`, 0);
var root_12 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_13 = _$_.template(`<p class="resolved"> </p>`, 0);
var root_14 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_15 = _$_.template(`<section class="root-catch"> </section>`, 0);
var root_16 = _$_.template(`<p class="root-pending">root-loading</p>`, 0);
var root_19 = _$_.template(`<p class="head-content"> </p>`, 0);
var root_18 = _$_.template(`<!>`, 1, 1);
var root_17 = _$_.template(`<!>`, 1, 1);
var root_20 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root_21 = _$_.template(`<p class="root-async"> </p>`, 0);
var root_22 = _$_.template(`<p class="outer"> </p>`, 0);
var root_23 = _$_.template(`<p class="inner"> </p>`, 0);
var root_26 = _$_.template(`<p class="inner-loading">inner-loading</p>`, 0);
var root_25 = _$_.template(`<!><!>`, 1, 2);
var root_24 = _$_.template(`<!>`, 1, 1);
var root_27 = _$_.template(`<p class="outer-loading">outer-loading</p>`, 0);

import { track, trackAsync } from 'ripple';

function make() {
	let resolve = () => {};
	let reject = () => {};

	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

export const controls = {};

export function resetControls() {
	var __block = _$_.scope();

	controls.basic = make();
	controls.catchOnly = make();
	controls.rejects = make();
	controls.noCatch = make();
	controls.outer = make();
	controls.inner = make();
	controls.rootDirect = make();
	controls.head = make();
}

resetControls();

function BasicContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track_async(() => controls.basic.promise, __block, '703e438e');
		let lazy_1 = _$_.track(0, __block, '928bce39');
		var div = root();

		{
			var span = _$_.child(div);

			{
				var expression = _$_.child(span, true);

				_$_.pop(span);
			}

			var button = _$_.sibling(span);

			button.__click = () => _$_.update(lazy_1);
		}

		_$_.render(() => {
			_$_.set_text(expression, lazy.value + ':' + lazy_1.value);
		});

		_$_.append(__anchor, div);
	});
}

export function StreamPending() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment = root_1();
		var node_3 = _$_.first_child_frag(fragment);

		_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_2();
			var span_1 = _$_.first_child_frag(fragment_1);
			var node = _$_.sibling(span_1);

			_$_.try(
				node,
				(__anchor) => {
					var fragment_2 = root_3();
					var node_2 = _$_.first_child_frag(fragment_2);

					_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_3 = root_4();
						var node_1 = _$_.first_child_frag(fragment_3);

						_$_.render_component(BasicContent, node_1, {});
						_$_.append(__anchor, fragment_3);
					}));

					_$_.append(__anchor, fragment_2);
				},
				null,
				(__anchor) => {
					var p = root_5();

					_$_.append(__anchor, p);
				}
			);

			_$_.append(__anchor, fragment_1);
		}));

		_$_.append(__anchor, fragment);
	});
}

function CatchOnlyContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track_async(() => controls.catchOnly.promise, __block, '50f939c6');
		var p_1 = root_6();

		{
			var expression_1 = _$_.child(p_1);

			_$_.expression(expression_1, () => lazy_2.value);
			_$_.pop(p_1);
		}

		_$_.append(__anchor, p_1);
	});
}

export function StreamCatchOnly() {
	return _$_.tsrx_element((__anchor, __block) => {
		var fragment_4 = root_7();
		var node_5 = _$_.first_child_frag(fragment_4);

		_$_.expression(node_5, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_5 = root_8();
			var span_2 = _$_.first_child_frag(fragment_5);
			var node_4 = _$_.sibling(span_2);

			_$_.try(
				node_4,
				(__anchor) => {
					_$_.render_component(CatchOnlyContent, __anchor, {});
				},
				(__anchor, e) => {
					var em = root_9();

					{
						var expression_2 = _$_.child(em);

						_$_.expression(expression_2, () => e.message);
						_$_.pop(em);
					}

					_$_.append(__anchor, em);
				}
			);

			_$_.append(__anchor, fragment_5);
		}));

		_$_.append(__anchor, fragment_4);
	});
}

function RejectContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track_async(() => controls.rejects.promise, __block, '96452a54');
		var p_2 = root_10();

		{
			var expression_3 = _$_.child(p_2);

			_$_.expression(expression_3, () => lazy_3.value);
			_$_.pop(p_2);
		}

		_$_.append(__anchor, p_2);
	});
}

export function StreamRejects() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				_$_.render_component(RejectContent, __anchor, {});
			},
			(__anchor, e) => {
				var em_1 = root_11();

				{
					var expression_4 = _$_.child(em_1);

					_$_.expression(expression_4, () => e.message);
					_$_.pop(em_1);
				}

				_$_.append(__anchor, em_1);
			},
			(__anchor) => {
				var p_3 = root_12();

				_$_.append(__anchor, p_3);
			},
			true
		);
	});
}

function NoCatchContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_4 = _$_.track_async(() => controls.noCatch.promise, __block, '6baa716b');
		var p_4 = root_13();

		{
			var expression_5 = _$_.child(p_4);

			_$_.expression(expression_5, () => lazy_4.value);
			_$_.pop(p_4);
		}

		_$_.append(__anchor, p_4);
	});
}

export function StreamNoCatch() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				_$_.render_component(NoCatchContent, __anchor, {});
			},
			null,
			(__anchor) => {
				var p_5 = root_14();

				_$_.append(__anchor, p_5);
			},
			true
		);
	});
}

export function RootCatch({ error, reset }) {
	return _$_.tsrx_element((__anchor, __block) => {
		var section = root_15();

		_$_.event('Click', section, reset);

		{
			var expression_6 = _$_.child(section);

			_$_.expression(expression_6, () => error.message);
			_$_.pop(section);
		}

		_$_.append(__anchor, section);
	});
}

export function RootPending() {
	return _$_.tsrx_element((__anchor, __block) => {
		var p_6 = root_16();

		_$_.append(__anchor, p_6);
	});
}

function HeadContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_5 = _$_.track_async(() => controls.head.promise, __block, '9cd3c3cd');
		var fragment_6 = root_17();
		var node_7 = _$_.first_child_frag(fragment_6);

		_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
			{
				var consequent = (__anchor) => {
					var fragment_7 = root_18();
					var node_6 = _$_.first_child_frag(fragment_7);

					_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
						var p_7 = root_19();

						{
							var expression_7 = _$_.child(p_7);

							_$_.expression(expression_7, () => lazy_5.value);
							_$_.pop(p_7);
						}

						_$_.head('e957a664', (__anchor) => {
							_$_.render(() => {
								_$_.document.title = 'title:' + lazy_5.value;
							});
						});

						_$_.append(__anchor, p_7);
					}));

					_$_.append(__anchor, fragment_7);
				};

				_$_.if(
					__anchor,
					(__render) => {
						if (lazy_5.value) __render(consequent);
					},
					true
				);
			}
		}));

		_$_.append(__anchor, fragment_6);
	});
}

export function StreamHead() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				_$_.render_component(HeadContent, __anchor, {});
			},
			null,
			(__anchor) => {
				var p_8 = root_20();

				_$_.append(__anchor, p_8);
			},
			true
		);
	});
}

export function StreamRootDirect() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_6 = _$_.track_async(() => controls.rootDirect.promise, __block, 'bc9e61da');
		var p_9 = root_21();

		{
			var expression_8 = _$_.child(p_9);

			_$_.expression(expression_8, () => lazy_6.value);
			_$_.pop(p_9);
		}

		_$_.append(__anchor, p_9);
	});
}

function OuterContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_7 = _$_.track_async(() => controls.outer.promise, __block, '35931cce');
		var p_10 = root_22();

		{
			var expression_9 = _$_.child(p_10);

			_$_.expression(expression_9, () => lazy_7.value);
			_$_.pop(p_10);
		}

		_$_.append(__anchor, p_10);
	});
}

function InnerContent() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_8 = _$_.track_async(() => controls.inner.promise, __block, '6c7d38ed');
		var p_11 = root_23();

		{
			var expression_10 = _$_.child(p_11);

			_$_.expression(expression_10, () => lazy_8.value);
			_$_.pop(p_11);
		}

		_$_.append(__anchor, p_11);
	});
}

export function StreamNested() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.try(
			__anchor,
			(__anchor) => {
				var fragment_8 = root_24();
				var node_10 = _$_.first_child_frag(fragment_8);

				_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
					var fragment_9 = root_25();
					var node_8 = _$_.first_child_frag(fragment_9);

					_$_.render_component(OuterContent, node_8, {});

					var node_9 = _$_.sibling(node_8);

					_$_.try(
						node_9,
						(__anchor) => {
							_$_.render_component(InnerContent, __anchor, {});
						},
						null,
						(__anchor) => {
							var p_12 = root_26();

							_$_.append(__anchor, p_12);
						}
					);

					_$_.append(__anchor, fragment_9);
				}));

				_$_.append(__anchor, fragment_8);
			},
			null,
			(__anchor) => {
				var p_13 = root_27();

				_$_.append(__anchor, p_13);
			},
			true
		);
	});
}

_$_.delegate(['click']);