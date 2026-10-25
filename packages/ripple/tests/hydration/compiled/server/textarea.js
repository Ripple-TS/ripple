// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticValue() {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<textarea>\nhello &amp; &lt;world></textarea>';
		_$_.output_push(__out);
	});
}

export function Value({ initial, next }) {
	return _$_.tsrx_element(() => {
		const text = _$_.track(initial, 'a52697');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<form><textarea>\n' + _$_.escape(text.value) + '</textarea><button type="button">update</button></form>';
			_$_.output_push(__out);
		});
	});
}

export function Child({ initial, next }) {
	return _$_.tsrx_element(() => {
		const text = _$_.track(initial, 'blawr5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<form><textarea>\n' + _$_.escape(text.value) + '</textarea><button type="button">update</button></form>';
			_$_.output_push(__out);
		});
	});
}

export function MixedChildren({ initial, next }) {
	return _$_.tsrx_element(() => {
		const text = _$_.track(initial, 'qrqvhj');
		const read = () => text.value;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<form><textarea>\n' + _$_.escape("before:" + (String(read() ?? '') + (String(text.value ?? '') + ":after"))) + '</textarea><button type="button">update</button></form>';
			_$_.output_push(__out);
		});
	});
}

export function StaticChild() {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<textarea>\nhello &amp; &lt;world></textarea>';
		_$_.output_push(__out);
	});
}

export function SpreadValue({ initial, next }) {
	return _$_.tsrx_element(() => {
		const text = _$_.track(initial, '1ypyugy');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<form>';

			{
				__out += '<textarea';

				const spread_attrs = { ...{ value: text.value } };

				__out += _$_.spread_attrs(spread_attrs, void 0, true) + '>\n';
				_$_.output_push(__out);
				__out = '';

				const spread_inner_html = _$_.spread_inner_html(spread_attrs, true);

				if (spread_inner_html !== void 0) {
					__out += spread_inner_html;
				}

				__out += '</textarea><button type="button">update</button>';
			}

			__out += '</form>';
			_$_.output_push(__out);
		});
	});
}