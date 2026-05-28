// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<template id="data1"></template>`, 1, 1);
var root_1 = _$_.template(`<template id="data2"></template>`, 1, 1);
var root_3 = _$_.template(`<span class="inside">inside</span>`, 0);
var root_2 = _$_.template(`<div><template id="before"></template><!><template id="after"></template></div>`, 1, 1);

export function SimpleTemplateHtml(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	const data = 'test data';
	var fragment = root();
	var template_1 = _$_.first_child_frag(fragment);

	template_1.innerHTML = data;
	__r = true;
	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function TemplateWithJSON(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	const jsonData = _$_.with_scope(__block, () => JSON.stringify({ message: 'hello', count: 42 }));
	var fragment_1 = root_1();
	var template_2 = _$_.first_child_frag(fragment_1);

	template_2.innerHTML = jsonData;
	__r_1 = true;
	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function TemplateAroundIfBlock(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	const show = true;
	var fragment_2 = root_2();
	var div_1 = _$_.first_child_frag(fragment_2);

	{
		var template_3 = _$_.child(div_1);

		template_3.innerHTML = 'before';

		var node = _$_.sibling(template_3);

		{
			var consequent = (__anchor) => {
				var span_1 = root_3();

				_$_.append(__anchor, span_1);
			};

			_$_.if(node, (__render) => {
				if (show) __render(consequent);
			});
		}

		var template_4 = _$_.sibling(node);

		template_4.innerHTML = 'after';
		_$_.pop(div_1);
	}

	__r_2 = true;
	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}