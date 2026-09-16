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
		const show = _$_.track(true, '740m40');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			if (show.value) {
				__out += '<div class="content">Content visible</div>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveIfElse() {
	return _$_.tsrx_element(() => {
		const isOn = _$_.track(false, 'i26m2h');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle</button><!--[-->';

			if (isOn.value) {
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
		const outer = _$_.track(true, 'xggelb');
		const inner = _$_.track(true, '1v6cfmu');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="outer-toggle">Outer</button><button class="inner-toggle">Inner</button><!--[-->';

			if (outer.value) {
				__out += '<div class="outer-content">Outer<!--[-->';

				if (inner.value) {
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
		const status = _$_.track('loading', 'l79qh6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="success">Success</button><button class="error">Error</button><button class="loading">Loading</button><!--[-->';

			if (status.value === 'loading') {
				__out += '<div class="state">Loading...</div>';
			} else {
				if (status.value === 'success') {
					__out += '<div class="state">Success!</div>';
				} else {
					__out += '<div class="state">Error occurred</div>';
				}
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}