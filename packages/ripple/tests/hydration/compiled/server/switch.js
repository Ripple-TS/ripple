// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function SwitchStatic() {
	_$_.push_component();

	const status = 'success';

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		switch (status) {
			case 'success':
				_$_.output_push('<div');
				_$_.output_push(' class="status-success"');
				_$_.output_push('>');
				{
					_$_.output_push('Success');
				}
				_$_.output_push('</div>');
				break;

			case 'error':
				_$_.output_push('<div');
				_$_.output_push(' class="status-error"');
				_$_.output_push('>');
				{
					_$_.output_push('Error');
				}
				_$_.output_push('</div>');
				break;

			default:
				_$_.output_push('<div');
				_$_.output_push(' class="status-unknown"');
				_$_.output_push('>');
				{
					_$_.output_push('Unknown');
				}
				_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function SwitchReactive() {
	_$_.push_component();

	let lazy = _$_.track('a', '9b34d955');

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

		switch (_$_.get(lazy)) {
			case 'a':
				_$_.output_push('<div');
				_$_.output_push(' class="case-a"');
				_$_.output_push('>');
				{
					_$_.output_push('Case A');
				}
				_$_.output_push('</div>');
				break;

			case 'b':
				_$_.output_push('<div');
				_$_.output_push(' class="case-b"');
				_$_.output_push('>');
				{
					_$_.output_push('Case B');
				}
				_$_.output_push('</div>');
				break;

			default:
				_$_.output_push('<div');
				_$_.output_push(' class="case-c"');
				_$_.output_push('>');
				{
					_$_.output_push('Case C');
				}
				_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function SwitchFallthrough() {
	_$_.push_component();

	const val = 1;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		switch (val) {
			case 1:

			case 2:
				_$_.output_push('<div');
				_$_.output_push(' class="case-1-2"');
				_$_.output_push('>');
				{
					_$_.output_push('1 or 2');
				}
				_$_.output_push('</div>');
				break;

			default:
				_$_.output_push('<div');
				_$_.output_push(' class="case-other"');
				_$_.output_push('>');
				{
					_$_.output_push('Other');
				}
				_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function SwitchNumericLevels() {
	_$_.push_component();

	let lazy_1 = _$_.track(1, '7581a7ab');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="level-toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle Level');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		switch (_$_.get(lazy_1)) {
			case 1:
				_$_.output_push('<div');
				_$_.output_push(' class="level-1"');
				_$_.output_push('>');
				{
					_$_.output_push('Level 1');
				}
				_$_.output_push('</div>');
				break;

			case 2:
				_$_.output_push('<div');
				_$_.output_push(' class="level-2"');
				_$_.output_push('>');
				{
					_$_.output_push('Level 2');
				}
				_$_.output_push('</div>');
				break;

			case 3:
				_$_.output_push('<div');
				_$_.output_push(' class="level-3"');
				_$_.output_push('>');
				{
					_$_.output_push('Level 3');
				}
				_$_.output_push('</div>');
				break;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function SwitchBlockScoped() {
	_$_.push_component();

	let lazy_2 = _$_.track(1, 'ca9f9852');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="block-toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		switch (_$_.get(lazy_2)) {
			case 1:
				_$_.output_push('<div');
				_$_.output_push(' class="block-1"');
				_$_.output_push('>');
				{
					_$_.output_push('Block 1');
				}
				_$_.output_push('</div>');
				break;

			case 2:
				_$_.output_push('<div');
				_$_.output_push(' class="block-2"');
				_$_.output_push('>');
				{
					_$_.output_push('Block 2');
				}
				_$_.output_push('</div>');
				break;

			case 3:
				_$_.output_push('<div');
				_$_.output_push(' class="block-3"');
				_$_.output_push('>');
				{
					_$_.output_push('Block 3');
				}
				_$_.output_push('</div>');
				break;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function SwitchNoBreak() {
	_$_.push_component();

	let lazy_3 = _$_.track(1, '6b7cb0ea');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="nobreak-toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		switch (_$_.get(lazy_3)) {
			case 1:
				_$_.output_push('<div');
				_$_.output_push(' class="nobreak-1"');
				_$_.output_push('>');
				{
					_$_.output_push('NoBreak 1');
				}
				_$_.output_push('</div>');

			case 2:
				_$_.output_push('<div');
				_$_.output_push(' class="nobreak-2"');
				_$_.output_push('>');
				{
					_$_.output_push('NoBreak 2');
				}
				_$_.output_push('</div>');

			case 3:
				_$_.output_push('<div');
				_$_.output_push(' class="nobreak-3"');
				_$_.output_push('>');
				{
					_$_.output_push('NoBreak 3');
				}
				_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}