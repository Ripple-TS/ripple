// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function SwitchStatic() {
	return _$_.tsrx_element(() => {
		const status = 'success';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			switch (status) {
				case 'success':
					__out += '<div class="status-success">Success</div>';
					break;

				case 'error':
					__out += '<div class="status-error">Error</div>';
					break;

				default:
					__out += '<div class="status-unknown">Unknown</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchReactive() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track('a', '9b34d955');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			switch (lazy.value) {
				case 'a':
					__out += '<div class="case-a">Case A</div>';
					break;

				case 'b':
					__out += '<div class="case-b">Case B</div>';
					break;

				default:
					__out += '<div class="case-c">Case C</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchFallthrough() {
	return _$_.tsrx_element(() => {
		const val = 1;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			switch (val) {
				case 1:
					break;

				case 2:
					__out += '<div class="case-1-2">1 or 2</div>';
					break;

				default:
					__out += '<div class="case-other">Other</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchNumericLevels() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(1, '7581a7ab');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="level-toggle">Toggle Level</button><!--[-->';

			switch (lazy_1.value) {
				case 1:
					__out += '<div class="level-1">Level 1</div>';
					break;

				case 2:
					__out += '<div class="level-2">Level 2</div>';
					break;

				case 3:
					__out += '<div class="level-3">Level 3</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchBlockScoped() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(1, 'ca9f9852');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="block-toggle">Toggle</button><!--[-->';

			switch (lazy_2.value) {
				case 1:
					__out += '<div class="block-1">Block 1</div>';
					break;

				case 2:
					__out += '<div class="block-2">Block 2</div>';
					break;

				case 3:
					__out += '<div class="block-3">Block 3</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchNoBreak() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(1, '6b7cb0ea');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="nobreak-toggle">Toggle</button><!--[-->';

			switch (lazy_3.value) {
				case 1:
					__out += '<div class="nobreak-1">NoBreak 1</div>';
					break;

				case 2:
					__out += '<div class="nobreak-2">NoBreak 2</div>';
					break;

				case 3:
					__out += '<div class="nobreak-3">NoBreak 3</div>';
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}