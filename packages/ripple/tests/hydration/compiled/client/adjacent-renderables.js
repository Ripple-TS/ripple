// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template_el('section', null, [null, null]);

function Pair_render(__anchor, __block, props) {
	var section = root();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : section.firstChild;

		_$_.expression(expression, () => props.first.value);

		var expression_1 = _$_.hydrating ? _$_.hydrate_sibling() : expression.nextSibling;

		_$_.expression(expression_1, () => props.second.value);
		_$_.hydrating && _$_.pop(section);
	}

	_$_.append(__anchor, section);
}

Pair[_$_.$r] = Pair_render;

var root_1 = _$_.template_el('i', null, 'one');
var root_2 = _$_.template_el('b', null, 'two');
var root_4 = _$_.template_el('em', null, 'four');
var root_3 = _$_.template(`<!><button>update`, 1, 2);

function AdjacentRenderableProps_render(__anchor, __block) {
	const first = _$_.track(
		_$_.tsrx_element((__anchor, __block) => {
			var i = root_1();

			_$_.append(__anchor, i);
		}),
		__block,
		'1dcwkoa'
	);

	const second = _$_.track(
		_$_.tsrx_element((__anchor, __block) => {
			var b = root_2();

			_$_.append(__anchor, b);
		}),
		__block,
		'x8qdcf'
	);

	var fragment = root_3();
	var node = _$_.first_child_frag(fragment);

	_$_.render_component(Pair, node, { first, second });

	var button = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;

	button.__click = () => {
		first.value = null;

		second.value = [
			'three',
			_$_.tsrx_element((__anchor, __block) => {
				var em = root_4();

				_$_.append(__anchor, em);
			})
		];
	};

	_$_.append(__anchor, fragment);
}

AdjacentRenderableProps[_$_.$r] = AdjacentRenderableProps_render;

var root_5 = _$_.template_el('i', null, 'one');
var root_6 = _$_.template_el('b', null, 'two');
var root_7 = _$_.template_el('section', null, ['before:', null, null, null, '<after']);

function MixedRenderableValues_render(__anchor, __block) {
	const first = _$_.tsrx_element((__anchor, __block) => {
		var i_1 = root_5();

		_$_.append(__anchor, i_1);
	});

	const second = _$_.tsrx_element((__anchor, __block) => {
		var b_1 = root_6();

		_$_.append(__anchor, b_1);
	});

	const values = [first, null, '&', second, undefined];
	var section_1 = root_7();

	{
		var text = _$_.hydrating ? _$_.hydrate_child() : section_1.firstChild;
		var expression_2 = _$_.hydrating ? _$_.hydrate_sibling() : text.nextSibling;

		_$_.expression(expression_2, () => first);

		var expression_3 = _$_.hydrating ? _$_.hydrate_sibling() : expression_2.nextSibling;

		_$_.expression(expression_3, () => second);

		var expression_4 = _$_.hydrating ? _$_.hydrate_sibling() : expression_3.nextSibling;

		_$_.expression(expression_4, () => values);
		_$_.hydrating && _$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
}

MixedRenderableValues[_$_.$r] = MixedRenderableValues_render;

var root_9 = _$_.template_el('button', null, 'update');
var root_8 = _$_.template(`<!>`, 1, 1);

function AdjacentTitleValues_render(__anchor, __block) {
	const first = _$_.track('one', __block, 'r7v0dk');
	const second = _$_.track(2, __block, '5c8sig');
	var fragment_1 = root_8();
	var node_1 = _$_.first_child_frag(fragment_1);

	_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
		var button_1 = root_9();

		button_1.__click = () => {
			first.value = null;
			second.value = 0;
		};

		_$_.head('85f21194', (__anchor) => {
			_$_.render(() => {
				_$_.document.title = "before:" + (String(first.value ?? '') + (String(second.value ?? '') + ":after"));
			});
		});

		_$_.append(__anchor, button_1);
	}));

	_$_.append(__anchor, fragment_1);
}

AdjacentTitleValues[_$_.$r] = AdjacentTitleValues_render;

import { track } from 'ripple';

function Pair(props) {
	return _$_.tsrx_element(Pair_render, props);
}

export function AdjacentRenderableProps() {
	return _$_.tsrx_element(AdjacentRenderableProps_render);
}

export function MixedRenderableValues() {
	return _$_.tsrx_element(MixedRenderableValues_render);
}

export function AdjacentTitleValues() {
	return _$_.tsrx_element(AdjacentTitleValues_render);
}

_$_.delegate(['click']);