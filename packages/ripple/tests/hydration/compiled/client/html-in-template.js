// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<template id="data1"></template>`, 0);
var root_1 = _$_.template(`<template id="data2"></template>`, 0);
var root_3 = _$_.template(`<span class="inside">inside</span>`, 0);
var root_2 = _$_.template(`<div><template id="before"></template><!><template id="after"></template></div>`, 0);

export function SimpleTemplateHtml() {
	return _$_.tsrx_element((__anchor, __block) => {
		const data = 'test data';
		var template_1 = root();

		template_1.innerHTML = data ?? template_1.innerHTML;
		_$_.append(__anchor, template_1);
	});
}

export function TemplateWithJSON() {
	return _$_.tsrx_element((__anchor, __block) => {
		const jsonData = _$_.with_scope(__block, () => JSON.stringify({ message: 'hello', count: 42 }));
		var template_2 = root_1();

		template_2.innerHTML = jsonData ?? template_2.innerHTML;
		_$_.append(__anchor, template_2);
	});
}

export function TemplateAroundIfBlock() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = true;
		var div_1 = root_2();

		{
			var template_3 = _$_.child(div_1);

			template_3.innerHTML = "before" ?? template_3.innerHTML;

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

			template_4.innerHTML = "after" ?? template_4.innerHTML;
			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}