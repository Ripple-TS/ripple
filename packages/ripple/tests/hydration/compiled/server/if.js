// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfTruthy() {
	return _$_.tsrx_element(() => {
		const show = true;

		_$_.regular_block(() => {
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<div');
				_$_.output_push(' class="shown"');
				_$_.output_push('>');

				{
					_$_.output_push('Visible');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		});
	});
}

export function IfFalsy() {
	return _$_.tsrx_element(() => {
		const show = false;

		_$_.regular_block(() => {
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<div');
				_$_.output_push(' class="shown"');
				_$_.output_push('>');

				{
					_$_.output_push('Visible');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		});
	});
}

export function IfElse() {
	return _$_.tsrx_element(() => {
		const isLoggedIn = true;

		_$_.regular_block(() => {
			_$_.output_push('<!--[-->');

			if (isLoggedIn) {
				_$_.output_push('<div');
				_$_.output_push(' class="logged-in"');
				_$_.output_push('>');

				{
					_$_.output_push('Welcome back!');
				}

				_$_.output_push('</div>');
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="logged-out"');
				_$_.output_push('>');

				{
					_$_.output_push('Please log in');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		});
	});
}

export function ReactiveIf() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '19a16ff0');

		_$_.regular_block(() => {
			{
				_$_.output_push('<button');
				_$_.output_push(' class="toggle"');
				_$_.output_push('>');

				{
					_$_.output_push('Toggle');
				}

				_$_.output_push('</button>');
				_$_.output_push('<!--[-->');

				if (lazy.value) {
					_$_.output_push('<div');
					_$_.output_push(' class="content"');
					_$_.output_push('>');

					{
						_$_.output_push('Content visible');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
			}
		});
	});
}

export function ReactiveIfElse() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(false, '41177f39');

		_$_.regular_block(() => {
			{
				_$_.output_push('<button');
				_$_.output_push(' class="toggle"');
				_$_.output_push('>');

				{
					_$_.output_push('Toggle');
				}

				_$_.output_push('</button>');
				_$_.output_push('<!--[-->');

				if (lazy_1.value) {
					_$_.output_push('<div');
					_$_.output_push(' class="on"');
					_$_.output_push('>');

					{
						_$_.output_push('ON');
					}

					_$_.output_push('</div>');
				} else {
					_$_.output_push('<div');
					_$_.output_push(' class="off"');
					_$_.output_push('>');

					{
						_$_.output_push('OFF');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
			}
		});
	});
}

export function NestedIf() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(true, '7894e1df');
		let lazy_3 = _$_.track(true, 'f21b8c26');

		_$_.regular_block(() => {
			{
				_$_.output_push('<button');
				_$_.output_push(' class="outer-toggle"');
				_$_.output_push('>');

				{
					_$_.output_push('Outer');
				}

				_$_.output_push('</button>');
				_$_.output_push('<button');
				_$_.output_push(' class="inner-toggle"');
				_$_.output_push('>');

				{
					_$_.output_push('Inner');
				}

				_$_.output_push('</button>');
				_$_.output_push('<!--[-->');

				if (lazy_2.value) {
					_$_.output_push('<div');
					_$_.output_push(' class="outer-content"');
					_$_.output_push('>');

					{
						_$_.output_push('Outer');
						_$_.output_push('<!--[-->');

						if (lazy_3.value) {
							_$_.output_push('<span');
							_$_.output_push(' class="inner-content"');
							_$_.output_push('>');

							{
								_$_.output_push('Inner');
							}

							_$_.output_push('</span>');
						}

						_$_.output_push('<!--]-->');
					}

					_$_.output_push('</div>');
				}

				_$_.output_push('<!--]-->');
			}
		});
	});
}

export function IfElseIfChain() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track('loading', '4c69c94a');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="success"');
				_$_.output_push('>');

				{
					_$_.output_push('Success');
				}

				_$_.output_push('</button>');
				_$_.output_push('<button');
				_$_.output_push(' class="error"');
				_$_.output_push('>');

				{
					_$_.output_push('Error');
				}

				_$_.output_push('</button>');
				_$_.output_push('<button');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('Loading');
				}

				_$_.output_push('</button>');
				_$_.output_push('<!--[-->');

				if (lazy_4.value === 'loading') {
					_$_.output_push('<div');
					_$_.output_push(' class="state"');
					_$_.output_push('>');

					{
						_$_.output_push('Loading...');
					}

					_$_.output_push('</div>');
				} else {
					_$_.output_push('<!--[-->');

					if (lazy_4.value === 'success') {
						_$_.output_push('<div');
						_$_.output_push(' class="state"');
						_$_.output_push('>');

						{
							_$_.output_push('Success!');
						}

						_$_.output_push('</div>');
					} else {
						_$_.output_push('<div');
						_$_.output_push(' class="state"');
						_$_.output_push('>');

						{
							_$_.output_push('Error occurred');
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</div>');
		});
	});
}