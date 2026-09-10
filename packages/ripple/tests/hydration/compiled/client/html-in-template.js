// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<template id="data1"></template>`, 0);

function SimpleTemplateHtml_render(__anchor, __block) {
	const data = 'test data';
	var template = root();

	template.innerHTML = data ?? template.innerHTML;
	_$_.append(__anchor, template);
}

SimpleTemplateHtml.$r = SimpleTemplateHtml_render;

var root_1 = _$_.template(`<template id="data2"></template>`, 0);

function TemplateWithJSON_render(__anchor, __block) {
	const jsonData = _$_.with_scope(__block, () => JSON.stringify({ message: 'hello', count: 42 }));
	var template_1 = root_1();

	template_1.innerHTML = jsonData ?? template_1.innerHTML;
	_$_.append(__anchor, template_1);
}

TemplateWithJSON.$r = TemplateWithJSON_render;

var root_3 = _$_.template(`<span class="inside">inside</span>`, 0);

function consequent(__anchor, show) {
	var span = root_3();

	_$_.append(__anchor, span);
}

function if_1(show) {
	if (show) return consequent;
}

var root_2 = _$_.template(`<div><template id="before"></template><!><template id="after"></template></div>`, 0);

function TemplateAroundIfBlock_render(__anchor, __block) {
	const show = true;
	var div = root_2();

	{
		var template_2 = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		template_2.innerHTML = "before" ?? template_2.innerHTML;

		var node = _$_.hydrating ? _$_.hydrate_sibling() : template_2.nextSibling;

		_$_.if(node, if_1, false, show);

		var template_3 = _$_.hydrating ? _$_.hydrate_sibling() : node.nextSibling;

		template_3.innerHTML = "after" ?? template_3.innerHTML;
		_$_.pop(div);
	}

	_$_.append(__anchor, div);
}

TemplateAroundIfBlock.$r = TemplateAroundIfBlock_render;

export function SimpleTemplateHtml() {
	return _$_.tsrx_element(SimpleTemplateHtml_render);
}

export function TemplateWithJSON() {
	return _$_.tsrx_element(TemplateWithJSON_render);
}

export function TemplateAroundIfBlock() {
	return _$_.tsrx_element(TemplateAroundIfBlock_render);
}