// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfTruthy() {
	return _$_.tsrx_element(() => {
		const show = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (show) {
				__out += '<div class="shown">Visible</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfFalsy() {
	return _$_.tsrx_element(() => {
		const show = false;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (show) {
				__out += '<div class="shown">Visible</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfElse() {
	return _$_.tsrx_element(() => {
		const isLoggedIn = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (isLoggedIn) {
				__out += '<div class="logged-in">Welcome back!</div>';
			} else {
				__out += '<div class="logged-out">Please log in</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveIf() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '19a16ff0');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			if (lazy.value) {
				__out += '<div class="content">Content visible</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveIfElse() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(false, '41177f39');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			if (lazy_1.value) {
				__out += '<div class="on">ON</div>';
			} else {
				__out += '<div class="off">OFF</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function NestedIf() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(true, '7894e1df');
		let lazy_3 = _$_.track(true, 'f21b8c26');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="outer-toggle">Outer</button><button class="inner-toggle">Inner</button><!--[-->';

			if (lazy_2.value) {
				__out += '<div class="outer-content">Outer<!--[-->';

				if (lazy_3.value) {
					__out += '<span class="inner-content">Inner</span>';
				}

				__out += '<!--]--></div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfElseIfChain() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track('loading', '4c69c94a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="success">Success</button><button class="error">Error</button><button class="loading">Loading</button><!--[-->';

			if (lazy_4.value === 'loading') {
				__out += '<div class="state">Loading...</div>';
			} else {
				__out += '<!--[-->';

				if (lazy_4.value === 'success') {
					__out += '<div class="state">Success!</div>';
				} else {
					__out += '<div class="state">Error occurred</div>';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}