// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { bindValue, track } from 'ripple/server';

export function Input({ initial = '', type = 'text', transform }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'cn7f3u');

		const binding = transform
			? bindValue(() => value.value, (next) => value.value = transform(next))
			: bindValue(value);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input' + _$_.attr('type', type, false) + ' /><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function Textarea({ initial = '', transform }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'wlukqx');

		const binding = transform
			? bindValue(() => value.value, (next) => value.value = transform(next))
			: bindValue(value);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><textarea>\n</textarea><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function SeededInput() {
	return _$_.tsrx_element(() => {
		const value = _$_.track('server', '1o05jei');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input value="server" /><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output></div>';
			_$_.output_push(__out);
		});
	});
}

export function ExternalBinding({ binding }) {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<input value="server" />';
		_$_.output_push(__out);
	});
}