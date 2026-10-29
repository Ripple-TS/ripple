// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<p> </p><b>`, 1, 2);

function render(__prev) {
	var __a = _$_.get_tracked_status(__prev._a).complete ? 'done' : 'open';

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_1 = _$_.template_el('em', null, ' ');
var root_2 = _$_.template_el('i', null, 'pending');

function Direct_render(__anchor, __block) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const result = _$_.track_async(
				(previous) => {
					const owner = _$_.get_async_owner();

					return _$_.rpc('7b39895b', [previous?.cursor ?? 0], owner);
				},
				__block,
				'15w8o7g'
			);

			var fragment = root();
			var p = _$_.first_child_frag(fragment);

			{
				var expression = _$_.hydrating ? _$_.hydrate_child() : p.firstChild;

				_$_.expression(expression, () => result.value.cursor);
				_$_.hydrating && _$_.pop(p);
			}

			var b = _$_.hydrating ? _$_.hydrate_sibling() : p.nextSibling;

			_$_.render(render, { a: '', _a: result, _b: b });
			_$_.append(__anchor, fragment);
		},
		(__anchor, error) => {
			var em = root_1();

			{
				var expression_2 = _$_.hydrating ? _$_.hydrate_child() : em.firstChild;

				_$_.expression(expression_2, () => error.message);
				_$_.hydrating && _$_.pop(em);
			}

			_$_.append(__anchor, em);
		},
		(__anchor) => {
			var i = root_2();

			_$_.append(__anchor, i);
		},
		true
	);
}

Direct[_$_.$r] = Direct_render;

var root_3 = _$_.template(`<p> </p><b>`, 1, 2);

function render_1(__prev) {
	var __a = _$_.get_tracked_status(__prev._a).complete ? 'done' : 'open';

	if (__prev.a !== __a) {
		_$_.set_text_content(__prev._b, __a, __prev.a);
		__prev.a = __a;
	}
}

var root_4 = _$_.template_el('em', null, ' ');
var root_5 = _$_.template_el('i', null, 'pending');

function Wrapped_render(__anchor, __block, { mutate = false }) {
	_$_.try(
		__anchor,
		(__anchor) => {
			const result = _$_.track_async(
				(previous) => {
					const owner_1 = _$_.get_async_owner();

					return _$_.with_scope(__block, () => (async function* () {
						await _$_.with_scope(__block, () => Promise.resolve());

						if (mutate) await _$_.rpc('6cec4350', [], owner_1);

						const stream = await _$_.rpc('49767275', [previous?.cursor ?? 0], owner_1);

						for await (const value of stream) yield value;
					})());
				},
				__block,
				'13q2xcq'
			);

			var fragment_1 = root_3();
			var p_1 = _$_.first_child_frag(fragment_1);

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_child() : p_1.firstChild;

				_$_.expression(expression_3, () => result.value.cursor);
				_$_.hydrating && _$_.pop(p_1);
			}

			var b_1 = _$_.hydrating ? _$_.hydrate_sibling() : p_1.nextSibling;

			_$_.render(render_1, { a: '', _a: result, _b: b_1 });
			_$_.append(__anchor, fragment_1);
		},
		(__anchor, error) => {
			var em_1 = root_4();

			{
				var expression_5 = _$_.hydrating ? _$_.hydrate_child() : em_1.firstChild;

				_$_.expression(expression_5, () => error.message);
				_$_.hydrating && _$_.pop(em_1);
			}

			_$_.append(__anchor, em_1);
		},
		(__anchor) => {
			var i_1 = root_5();

			_$_.append(__anchor, i_1);
		},
		true
	);
}

Wrapped[_$_.$r] = Wrapped_render;

import { getTrackedStatus, trackAsync } from 'ripple';

const rows = function (...args) {
	return _$_.rpc('7b39895b', args);
};

const promisedRows = function (...args) {
	return _$_.rpc('49767275', args);
};

const mutation = function (...args) {
	return _$_.rpc('6cec4350', args);
};

export function Direct() {
	return _$_.tsrx_element(Direct_render);
}

export function Wrapped(__props) {
	return _$_.tsrx_element(Wrapped_render, __props);
}

export function Mutation() {
	return _$_.tsrx_element((__anchor, __block) => {
		_$_.render_component(Wrapped, __anchor, { mutate: true });
	});
}