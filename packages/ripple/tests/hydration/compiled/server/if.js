// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function IfTruthy() {
	_$_.push_component();

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

	_$_.pop_component();
}

export function IfFalsy() {
	_$_.push_component();

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

	_$_.pop_component();
}

export function IfElse() {
	_$_.push_component();

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

	_$_.pop_component();
}

export function ReactiveIf() {
	_$_.push_component();

	let lazy = _$_.track(true);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy)) {
			_$_.output_push('<div');
			_$_.output_push(' class="content"');
			_$_.output_push('>');

			{
				_$_.output_push('Content visible');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveIfElse() {
	_$_.push_component();

	let lazy_1 = _$_.track(false);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy_1)) {
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
	});

	_$_.pop_component();
}

export function NestedIf() {
	_$_.push_component();

	let lazy_2 = _$_.track(true);
	let lazy_3 = _$_.track(true);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="outer-toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Outer');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="inner-toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Inner');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy_2)) {
			_$_.output_push('<div');
			_$_.output_push(' class="outer-content"');
			_$_.output_push('>');

			{
				_$_.output_push('Outer');
				_$_.output_push('<!--[-->');

				if (_$_.get(lazy_3)) {
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
	});

	_$_.pop_component();
}

export function IfElseIfChain() {
	_$_.push_component();

	let lazy_4 = _$_.track('loading');

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

			if (_$_.get(lazy_4) === 'loading') {
				_$_.output_push('<div');
				_$_.output_push(' class="state"');
				_$_.output_push('>');

				{
					_$_.output_push('Loading...');
				}

				_$_.output_push('</div>');
			} else {
				_$_.output_push('<!--[-->');

				if (_$_.get(lazy_4) === 'success') {
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

	_$_.pop_component();
}