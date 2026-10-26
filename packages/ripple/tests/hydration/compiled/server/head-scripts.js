// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Scripts({ nonce }) {
	return _$_.tsrx_element(() => {
		const version = _$_.track(0, '1yz2dxy');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>' + _$_.escape(version.value) + '</button>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target('head');
			__out += '<!--c3c1b176--><script id="first-script"' + _$_.attr('nonce', nonce, false) + _$_.attr('data-version', version.value, false) + '>\n				window.__ripple_script_runs = (window.__ripple_script_runs || 0) + 1;\n				window.__ripple_script_nonce = document.currentScript.nonce;\n				window.__ripple_script_version = document.currentScript.dataset.version;\n			</script><meta name="between-scripts" content="preserved" /><script type="module" id="module-script"' + _$_.attr('nonce', nonce, false) + '>\n				window.__ripple_script_meta = typeof import.meta;\n				window.__ripple_module_script_runs = (window.__ripple_module_script_runs || 0) + 1;\n			</script><script id="last-script" nonce="static-nonce">\n				window.__ripple_last_script_runs = (window.__ripple_last_script_runs || 0) + 1;\n			</script>';
			_$_.output_push(__out);
			__out = '';
			_$_.set_output_target(null);
			_$_.output_push(__out);
		});
	});
}

export function DynamicType({ type, nonce, onRef }) {
	return _$_.tsrx_element(() => {
		let __out = '';

		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target('head');
		__out += '<!--4ddff2d1--><script' + _$_.attr('type', type, false) + ' id="dynamic-script"' + _$_.attr('nonce', nonce, false) + _$_.content_editable_html('\n			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;\n		', void 0) + '</script>';
		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target(null);
		_$_.output_push(__out);
	});
}

export function SpreadAttributes({ attrs }) {
	return _$_.tsrx_element(() => {
		let __out = '';

		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target('head');
		__out += '<!--13175592--><script';

		const spread_attrs = { ...attrs };

		__out += _$_.spread_attrs(spread_attrs);
		_$_.output_push(__out);
		__out = '';

		_$_.content_editable(
			() => {
				let __out = '';

				__out += '\n			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;\n		';
				_$_.output_push(__out);
				__out = '';

				const spread_inner_html = _$_.spread_inner_html(spread_attrs);

				if (spread_inner_html !== void 0) {
					__out += spread_inner_html;
				}

				_$_.output_push(__out);
			},
			spread_attrs.contenteditable ?? spread_attrs.contentEditable
		);

		__out += '</script>';
		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target(null);
		_$_.output_push(__out);
	});
}

export function EmptyScripts() {
	return _$_.tsrx_element(() => {
		let __out = '';

		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target('head');
		__out += '<!--db555c34--><script type="application/json" id="empty-head-data"></script><script type="module" src="/example.js" id="external-script" async nonce="static-nonce"></script>';
		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target(null);
		_$_.output_push(__out);
	});
}

export function OrderedExternalScripts() {
	return _$_.tsrx_element(() => {
		let __out = '';

		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target('head');
		__out += '<!--91dd818a--><script src="/slow-first.js" id="first-external-script"></script><script src="/fast-second.js" id="second-external-script"></script>';
		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target(null);
		_$_.output_push(__out);
	});
}

export function AsyncExternalScripts() {
	return _$_.tsrx_element(() => {
		let __out = '';

		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target('head');
		__out += '<!--99a50d6c--><script src="/slow-first.js" id="first-external-script" async></script><script src="/fast-second.js" id="second-external-script" async></script>';
		_$_.output_push(__out);
		__out = '';
		_$_.set_output_target(null);
		_$_.output_push(__out);
	});
}