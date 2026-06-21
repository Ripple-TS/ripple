// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function GuardReturnRenders() {
	return _$_.tsrx_element(() => {
		const ready = true;

		if (!ready) {
			return null;
		}

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="ready">ready</div>';
			_$_.output_push(__out);
		});
	});
}

export function GuardReturnNull() {
	return _$_.tsrx_element(() => {
		const ready = false;

		if (!ready) {
			return null;
		}

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="ready">ready</div>';
			_$_.output_push(__out);
		});
	});
}

export function StringReturn() {
	return 'hello';
}