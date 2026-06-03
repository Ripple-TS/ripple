// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root = _$_.template(`<div class="ready">ready</div>`, 1, 1);
var root_1 = _$_.template(`<div class="ready">ready</div>`, 1, 1);

export function GuardReturnRenders() {
	return _$_.tsrx_element((__anchor, __block) => {
		var return_guard = false;
		const ready = true;

		if (!ready) {
			return null;
		}

		var fragment = root();

		_$_.append(__anchor, fragment);
	});
}

export function GuardReturnNull() {
	return _$_.tsrx_element((__anchor, __block) => {
		var return_guard = false;
		const ready = false;

		if (!ready) {
			return null;
		}

		var fragment_1 = root_1();

		_$_.append(__anchor, fragment_1);
	});
}

export function StringReturn() {
	return 'hello';
}