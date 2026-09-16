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
		const status = _$_.track('a', '172bas5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			switch (status.value) {
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
		const level = _$_.track(1, 'wlqm5n');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="level-toggle">Toggle Level</button><!--[-->';

			switch (level.value) {
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
		const level = _$_.track(1, '1k7y5oy');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="block-toggle">Toggle</button><!--[-->';

			switch (level.value) {
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
		const level = _$_.track(1, 'ttnpbe');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="nobreak-toggle">Toggle</button><!--[-->';

			switch (level.value) {
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