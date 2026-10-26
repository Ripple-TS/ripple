// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template_el('input', ['type', 'checkbox', 'checked', ''], '', 1);
var root_2 = _$_.template_el('input', ['type', 'checkbox'], '', 1);

function consequent(__anchor, { b: ref }) {
	var input = root_1();

	_$_.ref(input, () => ref);
	_$_.append(__anchor, input);
}

function alternate(__anchor, { b: ref }) {
	var input_1 = root_2();

	_$_.ref(input_1, () => ref);
	_$_.append(__anchor, input_1);
}

function if_1({ a: seeded }) {
	if (seeded) return consequent; else return alternate;
}

var root = _$_.template_el('div', null, [['output', null, ' '], ['button', null, 'toggle']]);

function Checkbox_render(
	__anchor,
	__block,
	{ initial = false, seeded = false, accessors = false }
) {
	const value = _$_.track(initial, __block, 'zrc2h5');
	const ref = _$_.with_scope(__block, () => binding(bindChecked, value, accessors));
	var div = root();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		_$_.if(node, if_1, false, { a: seeded, b: ref });

		var output = _$_.hydrating ? _$_.hydrate_sibling() : node;

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : output.firstChild;

			_$_.expression(expression, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output);
		}

		var button = _$_.hydrating ? _$_.hydrate_sibling() : output.nextSibling;

		button.__click = () => value.value = !value.value;
		_$_.hydrating && _$_.pop(div);
	}

	_$_.append(__anchor, div);
}

Checkbox[_$_.$r] = Checkbox_render;

var root_3 = _$_.template_el(
	'div',
	null,
	[
		['input', ['type', 'checkbox']],
		['output', null, ' '],
		['button', null, 'toggle']
	],
	1
);

function MixedCheckbox_render(__anchor, __block, { initial = true, accessors = false }) {
	const checked = _$_.track(false, __block, '1k51omq');
	const indeterminate = _$_.track(initial, __block, '1dddeo5');
	var div_1 = root_3();

	{
		var input_2 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		_$_.ref(input_2, () => _$_.create_ref_prop(() => [
			_$_.create_ref_prop(() => _$_.with_scope(__block, () => binding(bindChecked, checked, accessors))),
			_$_.create_ref_prop(() => _$_.with_scope(__block, () => binding(bindIndeterminate, indeterminate, accessors)))
		]));

		var output_1 = _$_.hydrating ? _$_.hydrate_sibling() : input_2.nextSibling;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : output_1.firstChild;

			_$_.expression(expression_1, () => _$_.with_scope(__block, () => JSON.stringify([checked.value, indeterminate.value])));
			_$_.hydrating && _$_.pop(output_1);
		}

		var button_1 = _$_.hydrating ? _$_.hydrate_sibling() : output_1.nextSibling;

		button_1.__click = () => indeterminate.value = !indeterminate.value;
	}

	_$_.append(__anchor, div_1);
}

MixedCheckbox[_$_.$r] = MixedCheckbox_render;

var root_4 = _$_.template_el('input', ['type', 'checkbox', 'checked', '', 'value', 'c'], '', 1);

var root_5 = _$_.template_el(
	'div',
	null,
	[
		['input', ['type', 'checkbox', 'checked', '', 'value', 'a']],
		['input', ['type', 'checkbox', 'value', 'b']],
		['output', null, ' '],
		['button', null, 'reset']
	],
	1
);

function CheckboxGroup_render(
	__anchor,
	__block,
	{ initial = ['a', 'c'], accessors = false }
) {
	const value = _$_.track(initial, __block, 'mcl3up');
	const ref = _$_.with_scope(__block, () => binding(bindGroup, value, accessors));
	var div_2 = root_5();

	{
		var input_4 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		_$_.ref(input_4, () => ref);

		var input_5 = _$_.hydrating ? _$_.hydrate_sibling() : input_4.nextSibling;

		_$_.ref(input_5, () => ref);

		var node_1 = _$_.hydrating ? _$_.hydrate_sibling() : input_5.nextSibling;

		_$_.render_component(LastCheckbox, node_1, { ref: _$_.create_ref_prop(() => ref) });

		var output_2 = _$_.hydrating ? _$_.hydrate_sibling() : node_1;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : output_2.firstChild;

			_$_.expression(expression_2, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_2);
		}

		var button_2 = _$_.hydrating ? _$_.hydrate_sibling() : output_2.nextSibling;

		button_2.__click = () => value.value = initial;
		_$_.hydrating && _$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

CheckboxGroup[_$_.$r] = CheckboxGroup_render;

var root_6 = _$_.template_el(
	'div',
	null,
	[
		['input', ['type', 'radio', 'name', 'choice', 'value', 'a']],
		[
			'input',
			[
				'type',
				'radio',
				'name',
				'choice',
				'checked',
				'',
				'value',
				'b'
			]
		],
		['input', ['type', 'radio', 'name', 'choice', 'value', 'c']],
		['output', null, ' '],
		['button', null, 'reset']
	],
	1
);

function RadioGroup_render(__anchor, __block, { initial = 'b', accessors = false }) {
	const value = _$_.track(initial, __block, '1owve6m');
	const ref = _$_.with_scope(__block, () => binding(bindGroup, value, accessors));
	var div_3 = root_6();

	{
		var input_6 = _$_.hydrating ? _$_.hydrate_child() : div_3.firstChild;

		_$_.ref(input_6, () => ref);

		var input_7 = _$_.hydrating ? _$_.hydrate_sibling() : input_6.nextSibling;

		_$_.ref(input_7, () => ref);

		var input_8 = _$_.hydrating ? _$_.hydrate_sibling() : input_7.nextSibling;

		_$_.ref(input_8, () => ref);

		var output_3 = _$_.hydrating ? _$_.hydrate_sibling() : input_8.nextSibling;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_child() : output_3.firstChild;

			_$_.expression(expression_3, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_3);
		}

		var button_3 = _$_.hydrating ? _$_.hydrate_sibling() : output_3.nextSibling;

		button_3.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div_3);
}

RadioGroup[_$_.$r] = RadioGroup_render;

var root_7 = _$_.template(`<div><select><option disabled>Disabled</option><optgroup disabled label="Disabled group"><option>Disabled child</option></optgroup><option>One</option><option>Two</option><option>Three</option></select><output> </output><button>reset`);

function Select_render(
	__anchor,
	__block,
	{ initial = 2, size = 0, accessors = false }
) {
	const value = _$_.track(initial, __block, 'fhbif6');
	var div_4 = root_7();

	{
		var select = _$_.hydrating ? _$_.hydrate_child() : div_4.firstChild;

		_$_.set_property_value(select, 'size', size);
		_$_.ref(select, () => _$_.with_scope(__block, () => binding(bindValue, value, accessors)));

		{
			if (!_$_.hydrating || !_$_.content_editable_changed(select)) {
				var option = _$_.hydrating ? _$_.hydrate_child() : select.firstChild;

				_$_.set_value(option, 0);

				var optgroup = _$_.hydrating ? _$_.hydrate_sibling() : option.nextSibling;

				{
					var option_1 = _$_.hydrating ? _$_.hydrate_child() : optgroup.firstChild;

					_$_.set_value(option_1, -1);
				}

				_$_.hydrating && _$_.pop(optgroup);

				var option_2 = _$_.hydrating ? _$_.hydrate_sibling() : optgroup.nextSibling;

				_$_.set_value(option_2, 1);

				var option_3 = _$_.hydrating ? _$_.hydrate_sibling() : option_2.nextSibling;

				_$_.set_value(option_3, 2);

				var option_4 = _$_.hydrating ? _$_.hydrate_sibling() : option_3.nextSibling;

				_$_.set_value(option_4, 3);
			}
		}

		_$_.hydrating && _$_.pop(select);

		var output_4 = _$_.hydrating ? _$_.hydrate_sibling() : select.nextSibling;

		{
			var expression_4 = _$_.hydrating ? _$_.hydrate_child() : output_4.firstChild;

			_$_.expression(expression_4, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_4);
		}

		var button_4 = _$_.hydrating ? _$_.hydrate_sibling() : output_4.nextSibling;

		button_4.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div_4);
}

Select[_$_.$r] = Select_render;

var root_8 = _$_.template(`<div><select><option>A</option><option selected>B</option><option>C</option></select><output> </output><button>reset`);

function SeededSelect_render(__anchor, __block, { initial = 'b', accessors = false }) {
	const value = _$_.track(initial, __block, 'h4hak3');
	var div_5 = root_8();

	{
		var select_1 = _$_.hydrating ? _$_.hydrate_child() : div_5.firstChild;

		_$_.ref(select_1, () => _$_.with_scope(__block, () => binding(bindValue, value, accessors)));

		{
			if (!_$_.hydrating || !_$_.content_editable_changed(select_1)) {
				var option_5 = _$_.hydrating ? _$_.hydrate_child() : select_1.firstChild;

				_$_.set_value(option_5, "a");

				var option_6 = _$_.hydrating ? _$_.hydrate_sibling() : option_5.nextSibling;

				_$_.set_value(option_6, "b");

				var option_7 = _$_.hydrating ? _$_.hydrate_sibling() : option_6.nextSibling;

				_$_.set_value(option_7, "c");
			}
		}

		_$_.hydrating && _$_.pop(select_1);

		var output_5 = _$_.hydrating ? _$_.hydrate_sibling() : select_1.nextSibling;

		{
			var expression_5 = _$_.hydrating ? _$_.hydrate_child() : output_5.firstChild;

			_$_.expression(expression_5, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_5);
		}

		var button_5 = _$_.hydrating ? _$_.hydrate_sibling() : output_5.nextSibling;

		button_5.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div_5);
}

SeededSelect[_$_.$r] = SeededSelect_render;

var root_9 = _$_.template(`<div><select multiple><option selected>A</option><option>B</option><option selected>C</option></select><output> </output><button>reset`);

function MultiSelect_render(
	__anchor,
	__block,
	{ initial = ['a', 'c'], accessors = false }
) {
	const value = _$_.track(initial, __block, '1u2cfy7');
	var div_6 = root_9();

	{
		var select_2 = _$_.hydrating ? _$_.hydrate_child() : div_6.firstChild;

		_$_.ref(select_2, () => _$_.with_scope(__block, () => binding(bindValue, value, accessors)));

		{
			if (!_$_.hydrating || !_$_.content_editable_changed(select_2)) {
				var option_8 = _$_.hydrating ? _$_.hydrate_child() : select_2.firstChild;

				_$_.set_value(option_8, "a");

				var option_9 = _$_.hydrating ? _$_.hydrate_sibling() : option_8.nextSibling;

				_$_.set_value(option_9, "b");

				var option_10 = _$_.hydrating ? _$_.hydrate_sibling() : option_9.nextSibling;

				_$_.set_value(option_10, "c");
			}
		}

		_$_.hydrating && _$_.pop(select_2);

		var output_6 = _$_.hydrating ? _$_.hydrate_sibling() : select_2.nextSibling;

		{
			var expression_6 = _$_.hydrating ? _$_.hydrate_child() : output_6.firstChild;

			_$_.expression(expression_6, () => _$_.with_scope(__block, () => JSON.stringify(value.value)));
			_$_.hydrating && _$_.pop(output_6);
		}

		var button_6 = _$_.hydrating ? _$_.hydrate_sibling() : output_6.nextSibling;

		button_6.__click = () => value.value = initial;
	}

	_$_.append(__anchor, div_6);
}

MultiSelect[_$_.$r] = MultiSelect_render;

var root_10 = _$_.template_el(
	'div',
	null,
	[
		['input', ['type', 'file', 'multiple', '']],
		['output', null, ' '],
		['button', null, 'update']
	],
	1
);

function Files_render(
	__anchor,
	__block,
	{ initial = null, next = null, accessors = false }
) {
	const value = _$_.track(initial, __block, 'kqa7zz');
	var div_7 = root_10();

	{
		var input_9 = _$_.hydrating ? _$_.hydrate_child() : div_7.firstChild;

		_$_.ref(input_9, () => _$_.with_scope(__block, () => binding(bindFiles, value, accessors)));

		var output_7 = _$_.hydrating ? _$_.hydrate_sibling() : input_9.nextSibling;

		{
			var expression_7 = _$_.hydrating ? _$_.hydrate_child() : output_7.firstChild;

			_$_.expression(expression_7, () => value.value
				? _$_.with_scope(__block, () => Array.from(value.value, (file) => file.name).join(','))
				: 'none');

			_$_.hydrating && _$_.pop(output_7);
		}

		var button_7 = _$_.hydrating ? _$_.hydrate_sibling() : output_7.nextSibling;

		button_7.__click = () => value.value = next;
	}

	_$_.append(__anchor, div_7);
}

Files[_$_.$r] = Files_render;

import {
	bindChecked,
	bindFiles,
	bindGroup,
	bindIndeterminate,
	bindValue,
	track
} from 'ripple';

function binding(bind, value, accessors) {
	return accessors
		? bind(() => value.value, (next) => value.value = next)
		: bind(value);
}

export function Checkbox(__props) {
	return _$_.tsrx_element(Checkbox_render, __props);
}

export function MixedCheckbox(__props) {
	return _$_.tsrx_element(MixedCheckbox_render, __props);
}

function LastCheckbox({ ref }) {
	ref = { v: ref };

	return _$_.tsrx_element((__anchor, __block) => {
		var input_3 = root_4();

		_$_.ref(input_3, () => ref.v, (v) => ref.v = v);
		_$_.append(__anchor, input_3);
	});
}

export function CheckboxGroup(__props) {
	return _$_.tsrx_element(CheckboxGroup_render, __props);
}

export function RadioGroup(__props) {
	return _$_.tsrx_element(RadioGroup_render, __props);
}

export function Select(__props) {
	return _$_.tsrx_element(Select_render, __props);
}

export function SeededSelect(__props) {
	return _$_.tsrx_element(SeededSelect_render, __props);
}

export function MultiSelect(__props) {
	return _$_.tsrx_element(MultiSelect_render, __props);
}

export function Files(__props) {
	return _$_.tsrx_element(Files_render, __props);
}

_$_.delegate(['click']);