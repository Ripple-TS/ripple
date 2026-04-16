// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function DirectReturn() {
	_$_.push_component();

	var __r = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="before"');
		_$_.output_push('>');

		{
			_$_.output_push('before');
		}

		_$_.output_push('</div>');
	});

	__r = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r) {
			_$_.output_push('<div');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('after');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ConditionalReturnTrue() {
	_$_.push_component();

	var __r_1 = false;
	let condition = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (condition) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_1 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_1) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ConditionalReturnFalse() {
	_$_.push_component();

	var __r_2 = false;
	let condition = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (condition) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_2 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_2) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ContentBeforeAfterReturn() {
	_$_.push_component();

	var __r_3 = false;
	let shouldReturn = true;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="before"');
		_$_.output_push('>');

		{
			_$_.output_push('before');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (shouldReturn) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard');
			}

			_$_.output_push('</div>');
			__r_3 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_3) {
			_$_.output_push('<div');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('after');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MultipleElementsAfterGuard() {
	_$_.push_component();

	var __r_4 = false;
	let shouldReturn = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (shouldReturn) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard');
			}

			_$_.output_push('</div>');
			__r_4 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_4) {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="second"');
			_$_.output_push('>');

			{
				_$_.output_push('second');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MultipleReturnsFirstHits() {
	_$_.push_component();

	var __r_5 = false;
	var __r_6 = false;
	let a = true;
	let b = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first guard');
			}

			_$_.output_push('</div>');
			__r_5 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_5) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_6 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_5 && !__r_6) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MultipleReturnsSecondHits() {
	_$_.push_component();

	var __r_7 = false;
	var __r_8 = false;
	let a = false;
	let b = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first guard');
			}

			_$_.output_push('</div>');
			__r_7 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_7) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_8 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_7 && !__r_8) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MultipleReturnsNoneHit() {
	_$_.push_component();

	var __r_9 = false;
	var __r_10 = false;
	let a = false;
	let b = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first guard');
			}

			_$_.output_push('</div>');
			__r_9 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_9) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_10 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_9 && !__r_10) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function NestedReturnsAllTrue() {
	_$_.push_component();

	var __r_11 = false;
	let a = true;
	let b = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a is true');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b is true');
				}

				_$_.output_push('</div>');
				__r_11 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_11) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function NestedReturnsInnerFalse() {
	_$_.push_component();

	var __r_12 = false;
	let a = true;
	let b = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a is true');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b is true');
				}

				_$_.output_push('</div>');
				__r_12 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_12) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function NestedReturnsOuterFalse() {
	_$_.push_component();

	var __r_13 = false;
	let a = false;
	let b = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a is true');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b is true');
				}

				_$_.output_push('</div>');
				__r_13 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_13) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function DeeplyNestedReturnsAllTrue() {
	_$_.push_component();

	var __r_14 = false;
	let a = true;
	let b = true;
	let c = true;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				_$_.output_push('<!--[-->');

				if (c) {
					_$_.output_push('<div');
					_$_.output_push(' class="c"');
					_$_.output_push('>');

					{
						_$_.output_push('c');
					}

					_$_.output_push('</div>');
					__r_14 = true;
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_14) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function DeeplyNestedReturnsInnermostFalse() {
	_$_.push_component();

	var __r_15 = false;
	let a = true;
	let b = true;
	let c = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				_$_.output_push('<!--[-->');

				if (c) {
					_$_.output_push('<div');
					_$_.output_push(' class="c"');
					_$_.output_push('>');

					{
						_$_.output_push('c');
					}

					_$_.output_push('</div>');
					__r_15 = true;
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_15) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ElseIfChainFirst() {
	_$_.push_component();

	var __r_16 = false;
	var __r_17 = false;
	var __r_18 = false;
	let value = 1;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (value === 1) {
			_$_.output_push('<div');
			_$_.output_push(' class="one"');
			_$_.output_push('>');

			{
				_$_.output_push('one');
			}

			_$_.output_push('</div>');
			__r_16 = true;
		} else {
			_$_.output_push('<!--[-->');

			if (value === 2) {
				_$_.output_push('<div');
				_$_.output_push(' class="two"');
				_$_.output_push('>');

				{
					_$_.output_push('two');
				}

				_$_.output_push('</div>');
				__r_17 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
				}

				_$_.output_push('</div>');
				__r_18 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_16 && !__r_17 && !__r_18) {
			_$_.output_push('<div');
			_$_.output_push(' class="never"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ElseIfChainSecond() {
	_$_.push_component();

	var __r_19 = false;
	var __r_20 = false;
	var __r_21 = false;
	let value = 2;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (value === 1) {
			_$_.output_push('<div');
			_$_.output_push(' class="one"');
			_$_.output_push('>');

			{
				_$_.output_push('one');
			}

			_$_.output_push('</div>');
			__r_19 = true;
		} else {
			_$_.output_push('<!--[-->');

			if (value === 2) {
				_$_.output_push('<div');
				_$_.output_push(' class="two"');
				_$_.output_push('>');

				{
					_$_.output_push('two');
				}

				_$_.output_push('</div>');
				__r_20 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
				}

				_$_.output_push('</div>');
				__r_21 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_19 && !__r_20 && !__r_21) {
			_$_.output_push('<div');
			_$_.output_push(' class="never"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ElseIfChainElse() {
	_$_.push_component();

	var __r_22 = false;
	var __r_23 = false;
	var __r_24 = false;
	let value = 3;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (value === 1) {
			_$_.output_push('<div');
			_$_.output_push(' class="one"');
			_$_.output_push('>');

			{
				_$_.output_push('one');
			}

			_$_.output_push('</div>');
			__r_22 = true;
		} else {
			_$_.output_push('<!--[-->');

			if (value === 2) {
				_$_.output_push('<div');
				_$_.output_push(' class="two"');
				_$_.output_push('>');

				{
					_$_.output_push('two');
				}

				_$_.output_push('</div>');
				__r_23 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
				}

				_$_.output_push('</div>');
				__r_24 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_22 && !__r_23 && !__r_24) {
			_$_.output_push('<div');
			_$_.output_push(' class="never"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnWithElseNoReturn() {
	_$_.push_component();

	var __r_25 = false;
	let condition = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (condition) {
			_$_.output_push('<div');
			_$_.output_push(' class="true"');
			_$_.output_push('>');

			{
				_$_.output_push('condition true');
			}

			_$_.output_push('</div>');
			__r_25 = true;
		} else {
			_$_.output_push('<div');
			_$_.output_push(' class="false"');
			_$_.output_push('>');

			{
				_$_.output_push('condition false');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_25) {
			_$_.output_push('<div');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('after if-else');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnWithElseBothReturn() {
	_$_.push_component();

	var __r_26 = false;
	var __r_27 = false;
	let condition = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (condition) {
			_$_.output_push('<div');
			_$_.output_push(' class="true"');
			_$_.output_push('>');

			{
				_$_.output_push('condition true');
			}

			_$_.output_push('</div>');
			__r_26 = true;
		} else {
			_$_.output_push('<div');
			_$_.output_push(' class="false"');
			_$_.output_push('>');

			{
				_$_.output_push('condition false');
			}

			_$_.output_push('</div>');
			__r_27 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_26 && !__r_27) {
			_$_.output_push('<div');
			_$_.output_push(' class="never"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveReturnTrueToFalse() {
	_$_.push_component();

	var __r_28 = false;
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
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_28 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_28) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveReturnFalseToTrue() {
	_$_.push_component();

	var __r_29 = false;
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
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_29 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_29) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveNestedReturn() {
	_$_.push_component();

	var __r_30 = false;
	let a = true;
	let lazy_2 = _$_.track(true);

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

		if (a) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_2)) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				__r_30 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_30) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnInNestedElement() {
	_$_.push_component();

	var __r_31 = false;
	let show = true;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="outer"');
		_$_.output_push('>');

		{
			_$_.output_push('<span');
			_$_.output_push(' class="label"');
			_$_.output_push('>');

			{
				_$_.output_push('outer');
			}

			_$_.output_push('</span>');
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<p');
				_$_.output_push(' class="inner"');
				_$_.output_push('>');

				{
					_$_.output_push('inner');
				}

				_$_.output_push('</p>');
				__r_31 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_31) {
			_$_.output_push('<div');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('after');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnWithMultipleElements() {
	_$_.push_component();

	var __r_32 = false;
	let shouldReturn = true;

	_$_.regular_block(() => {
		_$_.output_push('<h1');
		_$_.output_push(' class="title"');
		_$_.output_push('>');

		{
			_$_.output_push('title');
		}

		_$_.output_push('</h1>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push(' class="desc"');
		_$_.output_push('>');

		{
			_$_.output_push('description');
		}

		_$_.output_push('</p>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (shouldReturn) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard');
			}

			_$_.output_push('</div>');
			_$_.output_push('<span');
			_$_.output_push(' class="guard-span"');
			_$_.output_push('>');

			{
				_$_.output_push('guard span');
			}

			_$_.output_push('</span>');
			__r_32 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_32) {
			_$_.output_push('<footer');
			_$_.output_push(' class="footer"');
			_$_.output_push('>');

			{
				_$_.output_push('footer');
			}

			_$_.output_push('</footer>');
			_$_.output_push('<nav');
			_$_.output_push(' class="nav"');
			_$_.output_push('>');

			{
				_$_.output_push('nav');
			}

			_$_.output_push('</nav>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnAtBeginning() {
	_$_.push_component();

	var __r_33 = false;

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (true) {
			_$_.output_push('<div');
			_$_.output_push(' class="early"');
			_$_.output_push('>');

			{
				_$_.output_push('early exit');
			}

			_$_.output_push('</div>');
			__r_33 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_33) {
			_$_.output_push('<div');
			_$_.output_push(' class="never1"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached 1');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="never2"');
			_$_.output_push('>');

			{
				_$_.output_push('never reached 2');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReturnAtEnd() {
	_$_.push_component();

	var __r_34 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="first"');
		_$_.output_push('>');

		{
			_$_.output_push('first');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="second"');
		_$_.output_push('>');

		{
			_$_.output_push('second');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (true) {
			_$_.output_push('<div');
			_$_.output_push(' class="third"');
			_$_.output_push('>');

			{
				_$_.output_push('third');
			}

			_$_.output_push('</div>');
			__r_34 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function MultipleSiblingReturns() {
	_$_.push_component();

	var __r_35 = false;
	var __r_36 = false;
	var __r_37 = false;
	let mode = 'b';

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (mode === 'a') {
			_$_.output_push('<div');
			_$_.output_push(' class="mode-a"');
			_$_.output_push('>');

			{
				_$_.output_push('mode A');
			}

			_$_.output_push('</div>');
			__r_35 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_35) {
			_$_.output_push('<!--[-->');

			if (mode === 'b') {
				_$_.output_push('<div');
				_$_.output_push(' class="mode-b"');
				_$_.output_push('>');

				{
					_$_.output_push('mode B');
				}

				_$_.output_push('</div>');
				__r_36 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_35 && !__r_36) {
			_$_.output_push('<!--[-->');

			if (mode === 'c') {
				_$_.output_push('<div');
				_$_.output_push(' class="mode-c"');
				_$_.output_push('>');

				{
					_$_.output_push('mode C');
				}

				_$_.output_push('</div>');
				__r_37 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_35 && !__r_36 && !__r_37) {
			_$_.output_push('<div');
			_$_.output_push(' class="default"');
			_$_.output_push('>');

			{
				_$_.output_push('default mode');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveSiblingReturns() {
	_$_.push_component();

	var __r_38 = false;
	var __r_39 = false;
	let lazy_3 = _$_.track('first');

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

		if (_$_.get(lazy_3) === 'first') {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first guard');
			}

			_$_.output_push('</div>');
			__r_38 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_38) {
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_3) === 'second') {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_39 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_38 && !__r_39) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveOuterInnerReturns() {
	_$_.push_component();

	var __r_40 = false;
	let lazy_4 = _$_.track(true);
	let lazy_5 = _$_.track(true);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-a"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle A');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-b"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle B');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy_4)) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_5)) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				__r_40 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_40) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(_$_.get(lazy_4) ? 'a-on rest' : 'a-off rest'));
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveElseIfReturns() {
	_$_.push_component();

	var __r_41 = false;
	var __r_42 = false;
	let lazy_6 = _$_.track(0);

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

		if (_$_.get(lazy_6) === 0) {
			_$_.output_push('<div');
			_$_.output_push(' class="zero"');
			_$_.output_push('>');

			{
				_$_.output_push('zero');
			}

			_$_.output_push('</div>');
			__r_41 = true;
		} else {
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy_6) === 1) {
				_$_.output_push('<div');
				_$_.output_push(' class="one"');
				_$_.output_push('>');

				{
					_$_.output_push('one');
				}

				_$_.output_push('</div>');
				__r_42 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_41 && !__r_42) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push('rest');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="tail"');
			_$_.output_push('>');

			{
				_$_.output_push('tail');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ReactiveDeepNestedIndependentReturns() {
	_$_.push_component();

	var __r_43 = false;
	var __r_44 = false;
	var __r_45 = false;
	var __r_46 = false;
	let lazy_7 = _$_.track(false);
	let lazy_8 = _$_.track(false);
	let lazy_9 = _$_.track(false);
	let lazy_10 = _$_.track(false);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-c1"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle C1');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-c2"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle C2');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-c3"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle C3');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle-c4"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle C4');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="top"');
		_$_.output_push('>');

		{
			_$_.output_push('top');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy_7)) {
			_$_.output_push('<div');
			_$_.output_push(' class="hit-1"');
			_$_.output_push('>');

			{
				_$_.output_push('hit-1');
			}

			_$_.output_push('</div>');
			__r_43 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_43) {
			_$_.output_push('<div');
			_$_.output_push(' class="middle"');
			_$_.output_push('>');

			{
				_$_.output_push('middle');
			}

			_$_.output_push('</div>');
			_$_.output_push('<section');
			_$_.output_push(' class="nest-1"');
			_$_.output_push('>');

			{
				_$_.output_push('<div');
				_$_.output_push(' class="nest-1-a"');
				_$_.output_push('>');

				{
					_$_.output_push('nest-1-a');
				}

				_$_.output_push('</div>');
				_$_.output_push('<!--[-->');

				if (_$_.get(lazy_8)) {
					_$_.output_push('<div');
					_$_.output_push(' class="hit-2"');
					_$_.output_push('>');

					{
						_$_.output_push('hit-2');
					}

					_$_.output_push('</div>');
					__r_44 = true;
				}

				_$_.output_push('<!--]-->');
				_$_.output_push('<!--[-->');

				if (!__r_44) {
					_$_.output_push('<div');
					_$_.output_push(' class="nest-1-b"');
					_$_.output_push('>');

					{
						_$_.output_push('nest-1-b');
					}

					_$_.output_push('</div>');
					_$_.output_push('<section');
					_$_.output_push(' class="nest-2"');
					_$_.output_push('>');

					{
						_$_.output_push('<div');
						_$_.output_push(' class="nest-2-a"');
						_$_.output_push('>');

						{
							_$_.output_push('nest-2-a');
						}

						_$_.output_push('</div>');
						_$_.output_push('<!--[-->');

						if (_$_.get(lazy_9)) {
							_$_.output_push('<div');
							_$_.output_push(' class="hit-3"');
							_$_.output_push('>');

							{
								_$_.output_push('hit-3');
							}

							_$_.output_push('</div>');
							__r_45 = true;
						}

						_$_.output_push('<!--]-->');
						_$_.output_push('<!--[-->');

						if (!__r_45) {
							_$_.output_push('<div');
							_$_.output_push(' class="nest-2-b"');
							_$_.output_push('>');

							{
								_$_.output_push('nest-2-b');
							}

							_$_.output_push('</div>');
							_$_.output_push('<!--[-->');

							if (_$_.get(lazy_10)) {
								_$_.output_push('<div');
								_$_.output_push(' class="hit-4"');
								_$_.output_push('>');

								{
									_$_.output_push('hit-4');
								}

								_$_.output_push('</div>');
								__r_46 = true;
							}

							_$_.output_push('<!--]-->');
						}

						_$_.output_push('<!--]-->');
					}

					_$_.output_push('</section>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</section>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_43 && !__r_44 && !__r_45 && !__r_46) {
			_$_.output_push('<div');
			_$_.output_push(' class="root-1"');
			_$_.output_push('>');

			{
				_$_.output_push('root-1');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="root-2"');
			_$_.output_push('>');

			{
				_$_.output_push('root-2');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="root-3"');
			_$_.output_push('>');

			{
				_$_.output_push('root-3');
			}

			_$_.output_push('</div>');
			_$_.output_push('<div');
			_$_.output_push(' class="root-4"');
			_$_.output_push('>');

			{
				_$_.output_push('root-4');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}