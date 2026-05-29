// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function GuardReturnRenders() {
	_$_.push_component();

	var __r = false;
	var __r_1 = false;
	const ready = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!ready) {
			__r = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r) {
			_$_.output_push('<div');
			_$_.output_push(' class="ready"');
			_$_.output_push('>');

			{
				_$_.output_push('ready');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	__r_1 = true;
	_$_.pop_component();
}

export function GuardReturnNull() {
	_$_.push_component();

	var __r_2 = false;
	var __r_3 = false;
	const ready = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!ready) {
			__r_2 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_2) {
			_$_.output_push('<div');
			_$_.output_push(' class="ready"');
			_$_.output_push('>');

			{
				_$_.output_push('ready');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	__r_3 = true;
	_$_.pop_component();
}

export function StringReturn() {
	_$_.push_component();

	var __r_4 = false;

	_$_.regular_block(() => {
		_$_.output_push('hello');
	});

	__r_4 = true;
	_$_.pop_component();
}