// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<template id="data1"></template>`, 0);
var root_1 = _$_.template(`<template id="data2"></template>`, 0);

export function SimpleTemplateHtml(__anchor, _, __block) {
	_$_.push_component();

	const data = 'test data';
	var template_1 = root();

	template_1.innerHTML = data;
	_$_.append(__anchor, template_1);
	_$_.pop_component();
}

export function TemplateWithJSON(__anchor, _, __block) {
	_$_.push_component();

	const jsonData = _$_.with_scope(__block, () => JSON.stringify({ message: 'hello', count: 42 }));
	var template_2 = root_1();

	template_2.innerHTML = jsonData;
	_$_.append(__anchor, template_2);
	_$_.pop_component();
}