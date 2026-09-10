// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="ready">ready</div>`, 1, 1);

function GuardReturnRenders_render(__anchor, __block) {
	const ready = true;

	if (!ready) {
		return null;
	}

	var fragment = root();

	_$_.append(__anchor, fragment);
}

var root_1 = _$_.template(`<div class="ready">ready</div>`, 1, 1);

function GuardReturnNull_render(__anchor, __block) {
	const ready = false;

	if (!ready) {
		return null;
	}

	var fragment_1 = root_1();

	_$_.append(__anchor, fragment_1);
}

export function GuardReturnRenders() {
	return _$_.tsrx_element(GuardReturnRenders_render);
}

export function GuardReturnNull() {
	return _$_.tsrx_element(GuardReturnNull_render);
}

export function StringReturn() {
	return 'hello';
}