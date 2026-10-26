// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('div', null, [['input'], ['output', null, ' '], ['button', null, 'reset']], 1);

function Input_render(
	__anchor,
	__block,
	{ initial = '', type = 'text', transform }
) {
	const value = _$_.track(initial, __block, 'cn7f3u');

	const binding = transform
		? _$_.with_scope(__block, () => bindValue(() => value.value, (next) => value.value = _$_.with_scope(__block, () => transform(next))))
		: _$_.with_scope(__block, () => bindValue(value));

	var div = root();

	{
		var input = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.set_property_value(input, 'type', type);
		_$_.ref(input, () => binding);

		var output = _$_.hydrating ? _$_.hydrate_sibling() : input.nextSibling;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : output.firstChild;

			_$_.expression(expression, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : output.nextSibling;

		button.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div);
}

Input[_$_.$r] = Input_render;

var root_1 = _$_.template(`<div><textarea>
</textarea><output> </output><button>reset`);

function Textarea_render(__anchor, __block, { initial = '', transform }) {
	const value = _$_.track(initial, __block, 'wlukqx');

	const binding = transform
		? _$_.with_scope(__block, () => bindValue(() => value.value, (next) => value.value = _$_.with_scope(__block, () => transform(next))))
		: _$_.with_scope(__block, () => bindValue(value));

	var div_1 = root_1();

	{
		var textarea = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		_$_.ref(textarea, () => binding);

		var output_1 = _$_.hydrating ? _$_.hydrate_sibling() : textarea.nextSibling;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : output_1.firstChild;

			_$_.expression(expression_1, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_1);
		}

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : output_1.nextSibling;

		button_1.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div_1);
}

Textarea[_$_.$r] = Textarea_render;

var root_2 = _$_.template_el('div', null, [['input', ['value', 'server']], ['output', null, ' ']], 1);

function SeededInput_render(__anchor, __block) {
	const value = _$_.track('server', __block, '1o05jei');
	var div_2 = root_2();

	{
		var input_1 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.ref(input_1, () => _$_.with_scope(__block, () => bindValue(value)));

		var output_2 = _$_.hydrating ? _$_.hydrate_sibling() : input_1.nextSibling;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : output_2.firstChild;

			_$_.expression(expression_2, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_2);
		}
	}

	_$_.append(__anchor, div_2);
}

SeededInput[_$_.$r] = SeededInput_render;

var root_3 = _$_.template_el('input', ['value', 'server'], '', 1);

import { bindValue, track } from 'ripple';

export function Input(__props) {
	return _$_.tsrx_element(Input_render, __props);
}

export function Textarea(__props) {
	return _$_.tsrx_element(Textarea_render, __props);
}

export function SeededInput() {
	return _$_.tsrx_element(SeededInput_render);
}

export function ExternalBinding({ binding }) {
	binding = { v: binding };

	return _$_.tsrx_element((__anchor, __block) => {
		var input_2 = root_3();

		_$_.ref(input_2, () => binding.v, (v) => binding.v = v);
		_$_.append(__anchor, input_2);
	});
}

_$_.delegate(['click']);