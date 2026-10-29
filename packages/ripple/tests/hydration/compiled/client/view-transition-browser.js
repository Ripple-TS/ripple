// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_2 = _$_.template_el(
	'section',
	['class', 'tsrx-430cbf0c'],
	[
		[
			'input',
			['id', 'focus', 'value', 'editable', 'class', 'tsrx-430cbf0c']
		],
		['output', ['class', 'tsrx-430cbf0c']]
	],
	1
);

function render(__prev) {
	var __a = count.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_3 = _$_.template_el('p', ['id', 'notice', 'class', 'tsrx-430cbf0c'], 'Saved');

function consequent(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		name: "notice",
		enter: "notice-in",
		exit: "notice-out",
		onEnter: _$_.with_scope(__block, () => record('enter')),
		onExit: _$_.with_scope(__block, () => record('exit')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var p = root_3();

			_$_.append(__anchor, p);
		})
	});
}

function if_1() {
	if (shown.value) return consequent;
}

var root_5 = _$_.template_el('h2', ['id', 'photo', 'class', 'tsrx-430cbf0c'], 'detail');
var root_4 = _$_.template_el('article', ['class', 'tsrx-430cbf0c']);
var root_7 = _$_.template_el('h3', ['id', 'photo', 'class', 'tsrx-430cbf0c'], 'thumbnail');
var root_6 = _$_.template_el('aside', ['class', 'tsrx-430cbf0c']);

function consequent_1(__anchor, __block) {
	var article = root_4();

	{
		var append_anchor = _$_.append_into(article);

		_$_.render_component(ViewTransition, append_anchor, {
			name: "photo",
			share: "share",
			onShare: _$_.with_scope(__block, () => record('share')),
			children: _$_.tsrx_element((__anchor, __block) => {
				var h2 = root_5();

				_$_.append(__anchor, h2);
			})
		});

		_$_.hydrating && _$_.pop(article);
	}

	_$_.append(__anchor, article);
}

function alternate(__anchor, __block) {
	var aside = root_6();

	{
		var append_anchor_1 = _$_.append_into(aside);

		_$_.render_component(ViewTransition, append_anchor_1, {
			name: "photo",
			share: "share",
			onShare: _$_.with_scope(__block, () => record('share')),
			children: _$_.tsrx_element((__anchor, __block) => {
				var h3 = root_7();

				_$_.append(__anchor, h3);
			})
		});

		_$_.hydrating && _$_.pop(aside);
	}

	_$_.append(__anchor, aside);
}

alternate.h = 1;

function if_2() {
	if (detail.value) return consequent_1; else return alternate;
}

var root_8 = _$_.template_el('p', ['class', 'row tsrx-430cbf0c']);

function render_1(__prev) {
	var __a = _$_.get(__prev._a);

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_1 = _$_.template_el('main', ['class', 'tsrx-430cbf0c'], [
	[
		'button',
		['id', 'increment', 'class', 'tsrx-430cbf0c'],
		'increment'
	]
]);

function render_2(__prev) {
	var __a = if_1(__prev._a);

	if (__prev.a !== __a) {
		_$_.if_update(__prev._b, __prev.a = __a);
	}

	var __b = if_2(__prev._a);

	if (__prev.b !== __b) {
		_$_.if_update(__prev._c, __prev.b = __b);
	}
}

var root = _$_.template(`<!>`, 1, 1);

function App_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	count = _$_.track(0, __block, '19w3y5g');
	detail = _$_.track(false, __block, '1lbcaqw');
	shown = _$_.track(true, __block, 'v5prji');
	rows = _$_.track([1, 2, 3], __block, '1droy1q');

	var fragment = root();
	var node_4 = _$_.first_child_frag(fragment);

	_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
		var main = root_1();

		{
			var button = _$_.hydrating ? _$_.hydrate_child() : main.firstChild;

			button.__click = () => count.value++;

			var node = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(main);

			_$_.render_component(ViewTransition, node, {
				name: "counter",
				update: "change",
				onUpdate: _$_.with_scope(__block, () => record('update')),
				children: _$_.tsrx_element((__anchor, __block) => {
					var section = root_2();

					{
						var input = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;
						var output = _$_.hydrating ? _$_.hydrate_sibling() : input.nextSibling;
					}

					_$_.render(render, { a: '', _a: output });
					_$_.append(__anchor, section);
				})
			});

			var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(main);
			var ifs = _$_.if_static(node_1, if_1, 0, __block);
			var node_2 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(main);
			var ifs_1 = _$_.if_static(node_2, if_2, 0, __block);
			var node_3 = _$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(main);

			_$_.for_keyed(
				node_3,
				() => rows.value,
				(__anchor, pattern) => {
					_$_.render_component(ViewTransition, __anchor, {
						name: 'row-' + _$_.get(pattern),
						onUpdate: _$_.with_scope(__block, () => record('reorder')),
						children: _$_.tsrx_element((__anchor, __block) => {
							var p_1 = root_8();

							_$_.render(render_1, { a: '', _a: pattern, _b: p_1 });
							_$_.append(__anchor, p_1);
						})
					});
				},
				0
			);

			_$_.hydrating && _$_.pop(main);
		}

		_$_.render(render_2, {
			a: _$_.UNINITIALIZED,
			b: _$_.UNINITIALIZED,
			_a: __block,
			_b: ifs,
			_c: ifs_1
		});

		_$_.append(__anchor, main);
	}));

	_$_.append(__anchor, fragment);
}

App[_$_.$r] = App_render;

var root_9 = _$_.template_el('p', null, ' ');

function ManyPlain_render(__anchor, __block) {
	_$_.for(
		__anchor,
		() => samples,
		(__anchor, row) => {
			var p_2 = root_9();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : p_2.firstChild;

				_$_.expression(expression_2, () => row);
				_$_.hydrating && _$_.pop(p_2);
			}

			_$_.append(__anchor, p_2);
		},
		16
	);
}

ManyPlain[_$_.$r] = ManyPlain_render;

var root_10 = _$_.template_el('p', null, ' ');

function ManyWrapped_render(__anchor, __block) {
	_$_.for(
		__anchor,
		() => samples,
		(__anchor, row) => {
			_$_.render_component(ViewTransition, __anchor, {
				children: _$_.tsrx_element((__anchor, __block) => {
					var p_3 = root_10();

					{
						var expression_3 = _$_.hydrating ? _$_.hydrate_child() : p_3.firstChild;

						_$_.expression(expression_3, () => row);
						_$_.hydrating && _$_.pop(p_3);
					}

					_$_.append(__anchor, p_3);
				})
			});
		},
		16
	);
}

ManyWrapped[_$_.$r] = ManyWrapped_render;

var root_11 = _$_.template_el('p', ['id', 'async-result'], ' ');

function AsyncContent_render(__anchor, __block) {
	const data = _$_.track_async(() => pending.promise, __block, '1v5cfcv');
	var p_4 = root_11();

	{
		var expression_4 = _$_.hydrating ? _$_.hydrate_child() : p_4.firstChild;

		_$_.expression(expression_4, () => data.value);
		_$_.hydrating && _$_.pop(p_4);
	}

	_$_.append(__anchor, p_4);
}

AsyncContent[_$_.$r] = AsyncContent_render;

var root_12 = _$_.template_el('p', ['id', 'skeleton'], 'loading');

function AsyncApp_render(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		name: "async-content",
		update: "change",
		onUpdate: _$_.with_scope(__block, () => record('reveal')),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					_$_.render_component(AsyncContent, __anchor, {});
				},
				null,
				(__anchor) => {
					var p_5 = root_12();

					_$_.append(__anchor, p_5);
				},
				true
			);
		})
	});
}

AsyncApp[_$_.$r] = AsyncApp_render;

var root_14 = _$_.template_el('div', ['id', 'photo'], 'thumbnail');
var root_13 = _$_.template(`<!><a id=next href=/document-b>Open photo`, 1, 2);

function Gallery_render(__anchor, __block) {
	var fragment_1 = root_13();
	var node_5 = _$_.first_child_frag(fragment_1);

	_$_.render_component(ViewTransition, node_5, {
		name: "photo",
		share: "share",
		children: _$_.tsrx_element((__anchor, __block) => {
			var div = root_14();

			_$_.append(__anchor, div);
		})
	});

	_$_.next();
	_$_.append(__anchor, fragment_1);
}

Gallery[_$_.$r] = Gallery_render;

var root_16 = _$_.template_el('div', ['id', 'photo', 'class', 'tsrx-53cebc47'], 'large photo');
var root_15 = _$_.template(`<!><a id=next href=/document-a class=tsrx-53cebc47>Back to gallery`, 1, 2);

function Detail_render(__anchor, __block) {
	var fragment_2 = root_15();
	var node_6 = _$_.first_child_frag(fragment_2);

	_$_.render_component(ViewTransition, node_6, {
		name: "photo",
		share: "local-photo",
		children: _$_.tsrx_element((__anchor, __block) => {
			var div_1 = root_16();

			_$_.append(__anchor, div_1);
		}),
		$v: 'tsrx-53cebc47'
	});

	_$_.next();
	_$_.append(__anchor, fragment_2);
}

Detail[_$_.$r] = Detail_render;

var root_17 = _$_.template_el(
	'section',
	null,
	[
		['input', ['id', 'activity-input', 'value', 'draft']],
		['button', ['id', 'activity-count']]
	],
	1
);

function render_3(__prev) {
	var __a = __prev._a.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

function ActivityPanel_render(__anchor, __block) {
	const value = _$_.track(0, __block, '1v0qx1h');
	var section_1 = root_17();

	{
		var input_1 = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;
		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

		button_1.__click = () => value.value++;
	}

	_$_.render(render_3, { a: '', _a: value, _b: button_1 });
	_$_.append(__anchor, section_1);
}

ActivityPanel[_$_.$r] = ActivityPanel_render;

function ActivityApp_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	activityMode = _$_.track('visible', __block, 'lmdfag');

	_$_.render_component(ViewTransition, __anchor, {
		name: "activity",
		enter: "notice-in",
		exit: "notice-out",
		onEnter: _$_.with_scope(__block, () => record('enter')),
		onExit: _$_.with_scope(__block, () => record('exit')),
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(Activity, __anchor, {
				mode: activityMode,
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(ActivityPanel, __anchor, {});
				})
			});
		})
	});
}

ActivityApp[_$_.$r] = ActivityApp_render;

function InnerActivityApp_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	activityMode = _$_.track('visible', __block, '1fmrgqv');

	_$_.render_component(Activity, __anchor, {
		mode: activityMode,
		children: _$_.tsrx_element((__anchor, __block) => {
			_$_.render_component(ViewTransition, __anchor, {
				name: "activity",
				enter: "notice-in",
				exit: "notice-out",
				onEnter: _$_.with_scope(__block, () => record('enter')),
				onExit: _$_.with_scope(__block, () => record('exit')),
				children: _$_.tsrx_element((__anchor, __block) => {
					_$_.render_component(ActivityPanel, __anchor, {});
				})
			});
		})
	});
}

InnerActivityApp[_$_.$r] = InnerActivityApp_render;

var root_18 = _$_.template_el('p', ['id', 'scoped-a', 'class', 'tsrx-7a97b36f']);

function render_4(__prev) {
	var __a = scopedCount.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function ScopedA_render(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		name: "scoped-a",
		update: scopedMode,
		onUpdate: _$_.with_scope(__block, () => record('scoped-a')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var p_6 = root_18();

			_$_.render(render_4, { a: '', _a: p_6 });
			_$_.append(__anchor, p_6);
		}),
		$v: 'tsrx-7a97b36f'
	});
}

ScopedA[_$_.$r] = ScopedA_render;

var root_19 = _$_.template_el('p', ['class', 'tsrx-c2268f10']);

function render_5(__prev) {
	var __a = scopedCount.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function ScopedB_render(__anchor, __block) {
	let styles = { v: void 0 };

	styles.v = { '$class': 'tsrx-c2268f10', 'notice': 'tsrx-c2268f10 notice' };

	_$_.render_component(ViewTransition, __anchor, {
		name: "scoped-b",
		update: styles.v.notice,
		onUpdate: _$_.with_scope(__block, () => record('scoped-b')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var p_7 = root_19();

			_$_.render(render_5, { a: '', _a: p_7 });
			_$_.append(__anchor, p_7);
		}),
		$v: 'tsrx-c2268f10'
	});
}

ScopedB[_$_.$r] = ScopedB_render;

var root_20 = _$_.template_el('p', ['class', 'tsrx-074c3239']);

function render_6(__prev) {
	var __a = scopedCount.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

function ScopedWildcard_render(__anchor, __block) {
	_$_.render_component(ViewTransition, __anchor, {
		name: "scoped-wildcard",
		update: "auto",
		onUpdate: _$_.with_scope(__block, () => record('scoped-wildcard')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var p_8 = root_20();

			_$_.render(render_6, { a: '', _a: p_8 });
			_$_.append(__anchor, p_8);
		}),
		$v: 'tsrx-074c3239'
	});
}

ScopedWildcard[_$_.$r] = ScopedWildcard_render;

var root_22 = _$_.template_el('p');

function render_7(__prev) {
	var __a = scopedCount.value;

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._a, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_21 = _$_.template(`<!><!><!><!>`, 1, 4);

function ScopedApp_render(__anchor, __block) {
	transition = _$_.with_scope(__block, createViewTransition);
	scopedCount = _$_.track(0, __block, 'ia4wuv');
	scopedMode = _$_.track('notice', __block, '1pn0k11');

	var fragment_3 = root_21();
	var node_7 = _$_.first_child_frag(fragment_3);

	_$_.render_component(ScopedA, node_7, {});

	var node_8 = _$_.hydrating ? _$_.hydrate_sibling() : node_7.nextSibling;

	_$_.render_component(ScopedB, node_8, {});

	var node_9 = _$_.hydrating ? _$_.hydrate_sibling() : node_8.nextSibling;

	_$_.render_component(ScopedWildcard, node_9, {});

	var node_10 = _$_.hydrating ? _$_.hydrate_sibling() : node_9.nextSibling;

	_$_.render_component(ViewTransition, node_10, {
		name: "scoped-global",
		update: "shared-recipe",
		onUpdate: _$_.with_scope(__block, () => record('scoped-global')),
		children: _$_.tsrx_element((__anchor, __block) => {
			var p_9 = root_22();

			_$_.render(render_7, { a: '', _a: p_9 });
			_$_.append(__anchor, p_9);
		})
	});

	_$_.append(__anchor, fragment_3);
}

ScopedApp[_$_.$r] = ScopedApp_render;

import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync
} from 'ripple';

let transition;
let count;
let detail;
let shown;
let rows;

export let last;
export const events = [];
export const cleanups = [];

const record = (kind) => (instance, types) => {
	events.push({
		kind,
		name: instance.name,
		names: instance.names,
		types,
		duration: getComputedStyle(document.documentElement, `::view-transition-${kind === 'exit' ? 'old' : 'new'}(${instance.name})`).animationDuration
	});

	if (kind === 'update') {
		const animations = instance.new.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 80 });

		return () => {
			cleanups.push(kind);
			animations.forEach((animation) => animation.cancel());
		};
	}

	return () => {
		cleanups.push(kind);
	};
};

export function run(action, skip = false) {
	last = transition.run(
		() => {
			if (action === 'share') detail.value = !detail.value; else if (action === 'exit') shown.value = false; else if (action === 'enter') shown.value = true; else if (action === 'reorder') rows.value = [...rows.value].reverse(); else count.value++;
		},
		{ types: ['forward'] }
	);

	if (skip) last.skipTransition();

	return last;
}

export function App() {
	return _$_.tsrx_element(App_render);
}

const samples = Array.from({ length: 500 }, (_, index) => index);

export function ManyPlain() {
	return _$_.tsrx_element(ManyPlain_render);
}

export function ManyWrapped() {
	return _$_.tsrx_element(ManyWrapped_render);
}

const pending = Promise.withResolvers();

export function resolveAsync() {
	pending.resolve('loaded content');
}

function AsyncContent() {
	return _$_.tsrx_element(AsyncContent_render);
}

export function AsyncApp() {
	return _$_.tsrx_element(AsyncApp_render);
}

export function Gallery() {
	return _$_.tsrx_element(Gallery_render);
}

export function Detail() {
	return _$_.tsrx_element(Detail_render);
}

let activityMode;

export function runActivity(mode) {
	return transition.run(() => {
		activityMode.value = mode;
	});
}

function ActivityPanel() {
	return _$_.tsrx_element(ActivityPanel_render);
}

export function ActivityApp() {
	return _$_.tsrx_element(ActivityApp_render);
}

export function InnerActivityApp() {
	return _$_.tsrx_element(InnerActivityApp_render);
}

let scopedCount;
let scopedMode;

export function runScoped(mode) {
	scopedMode.value = mode;

	return transition.run(() => {
		scopedCount.value++;
	});
}

function ScopedA() {
	return _$_.tsrx_element(ScopedA_render);
}

function ScopedB() {
	return _$_.tsrx_element(ScopedB_render);
}

function ScopedWildcard() {
	return _$_.tsrx_element(ScopedWildcard_render);
}

export function ScopedApp() {
	return _$_.tsrx_element(ScopedApp_render);
}

_$_.delegate(['click']);