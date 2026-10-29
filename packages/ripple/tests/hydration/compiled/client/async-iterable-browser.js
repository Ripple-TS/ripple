// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_2 = _$_.template_el('li', null, ' ');
var root_1 = _$_.template(`<input id=draft defaultValue=server><p id=cursor> </p><p id=status></p><ul>`, 1, 4);

function render(__prev) {
	var __a = _$_.get_tracked_status(__prev._a).complete ? 'done' : 'open';

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root = _$_.template(`<!>`, 1, 1);

function Rows_render(__anchor, __block) {
	const result = _$_.track_async(accumulate, __block, 'rto02u');
	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_1();
		var input = _$_.first_child_frag(fragment_1);
		var p = _$_.hydrating ? _$_.hydrate_sibling() : input.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

			_$_.expression(expression, () => result.value.cursor);
			_$_.hydrating && _$_.pop(p);
		}

		var p_1 = _$_.hydrating ? _$_.hydrate_sibling() : p.nextSibling;
		var ul = _$_.hydrating ? _$_.hydrate_sibling() : p_1.nextSibling;

		{
			_$_.for_keyed(
				ul,
				() => result.value.rows,
				(__anchor, pattern) => {
					var li = root_2();

					{
						var expression_2 = _$_.hydrating ? _$_.hydrate_child() : li.firstChild;

						_$_.expression(expression_2, () => _$_.get(pattern).id);
						_$_.hydrating && _$_.pop(li);
					}

					_$_.append(__anchor, li);
				},
				4,
				(pattern) => pattern.id
			);

			_$_.hydrating && _$_.pop(ul);
		}

		_$_.render(render, { a: '', _a: result, _b: p_1 });
		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

Rows[_$_.$r] = Rows_render;

var root_4 = _$_.template(`<button>activate</button><!>`, 1, 2);
var root_3 = _$_.template(`<!>`, 1, 1);

function App_render(__anchor, __block) {
	const enabled = _$_.track(false, __block, 'l665hp');
	var fragment_2 = root_3();
	var node_2 = _$_.first_child_frag(fragment_2);

	_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_3 = root_4();
		var button = _$_.first_child_frag(fragment_3);

		button.__click = () => enabled.value = true;

		var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : button.nextSibling;

		_$_.render_component(Hydrate, node_1, {
			when: _$_.with_scope(__block, () => condition(() => enabled.value)),
			children: _$_.tsrx_element((__anchor, __block) => {
				_$_.render_component(Rows, __anchor, {});
			})
		});

		_$_.append(__anchor, fragment_3);
	}));

	_$_.append(__anchor, fragment_2);
}

App[_$_.$r] = App_render;

import { Hydrate, getTrackedStatus, track, trackAsync } from 'ripple';
import { condition } from 'ripple/hydration';

const rows = function (...args) {
	return _$_.rpc('b2009f9a', args);
};

async function* accumulate(previous) {
	const owner = _$_.get_async_owner();
	let snapshot = previous ?? { cursor: 0, rows: [] };

	await Promise.resolve();

	const batches = await _$_.rpc('b2009f9a', [snapshot.cursor], owner);

	for await (const batch of batches) {
		snapshot = {
			cursor: batch.cursor,
			rows: [...snapshot.rows, ...batch.rows]
		};

		yield snapshot;
	}
}

function Rows() {
	return _$_.tsrx_element(Rows_render);
}

export function App() {
	return _$_.tsrx_element(App_render);
}

_$_.delegate(['click']);