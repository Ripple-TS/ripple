// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TypedText() {
	return _$_.tsrx_element(() => {
		const row = _$_.track({ label: '<first>', count: 2 }, '179p9ai');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="typed-run">' + _$_.escape('value: ' + (row.value.label + String(row.value.count ?? ''))) + '<span>tail</span></div><p class="typed-number">' + _$_.escape((0, row.value.count)) + '</p><button>update</button>';
			_$_.output_push(__out);
		});
	});
}