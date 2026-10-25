// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Card({ id, nonce }) {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, 'rw6ptn');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<article><script type="application/json"' + _$_.attr('id', id, false) + _$_.attr('nonce', nonce, false) + _$_.attr('data-count', count.value, false) + '>\n  {"count":1,"text":"<tag> &amp; > ` ${value} café","escaped":"\\u003c/script>"}\n		</script><button>' + _$_.escape(count.value) + '</button></article>';
			_$_.output_push(__out);
		});
	});
}

export function RootData() {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<script type="application/ld+json" id="root-data">\n		{"count":1}\n	</script>';
		_$_.output_push(__out);
	});
}

export function EmptyData() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<script type="application/json" id="empty-data"></script><script type="application/json" id="whitespace-data"> 	 </script><p>after</p>';
			_$_.output_push(__out);
		});
	});
}

export function InertData() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<script type="text/plain" id="inert-data">\n			window.__ripple_data_script_runs = (window.__ripple_data_script_runs || 0) + 1;\n		</script><p>after</p>';
			_$_.output_push(__out);
		});
	});
}

export function ConditionalData() {
	return _$_.tsrx_element(() => {
		const visible = _$_.track(true, '1dbpg4i');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<article><!--[-->';

			if (visible.value) {
				__out += '<script type="application/json" id="conditional-data">\n				{"visible":true}\n			</script>';
			}

			__out += '<!--]--><button>toggle</button></article>';
			_$_.output_push(__out);
		});
	});
}

export function HeadData() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<p>body</p>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--09cf7ed3--><script type="application/json" id="head-data">\n				{"text":"<tag> &amp;"}\n			</script>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}