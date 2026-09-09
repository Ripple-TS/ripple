// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TypedText() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track({ label: '<first>', count: 2 }, '9bf2304a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="typed-run">' + _$_.escape('value: ' + (lazy.value.label + String(lazy.value.count ?? ''))) + '<span>tail</span></div><p class="typed-number">' + _$_.escape((0, lazy.value.count)) + '</p><button>update</button>';
			_$_.output_push(__out);
		});
	});
}