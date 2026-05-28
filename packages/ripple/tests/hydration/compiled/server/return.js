// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function DirectReturn() {
	_$_.push_component();

	var __r = false;
	var __r_1 = false;

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

	__r_1 = true;
	_$_.pop_component();
}

export function ConditionalReturnTrue() {
	_$_.push_component();

	var __r_2 = false;
	var __r_3 = false;
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

	__r_3 = true;
	_$_.pop_component();
}

export function ConditionalReturnFalse() {
	_$_.push_component();

	var __r_4 = false;
	var __r_5 = false;
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
			__r_4 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_4) {
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

	__r_5 = true;
	_$_.pop_component();
}

export function ContentBeforeAfterReturn() {
	_$_.push_component();

	var __r_6 = false;
	var __r_7 = false;
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
			__r_6 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_6) {
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

	__r_7 = true;
	_$_.pop_component();
}

export function MultipleElementsAfterGuard() {
	_$_.push_component();

	var __r_8 = false;
	var __r_9 = false;
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
			__r_8 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_8) {
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

	__r_9 = true;
	_$_.pop_component();
}

export function MultipleReturnsFirstHits() {
	_$_.push_component();

	var __r_10 = false;
	var __r_11 = false;
	var __r_12 = false;
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
			__r_10 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_10) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
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

		if (!__r_10 && !__r_11) {
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

	__r_12 = true;
	_$_.pop_component();
}

export function MultipleReturnsSecondHits() {
	_$_.push_component();

	var __r_13 = false;
	var __r_14 = false;
	var __r_15 = false;
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
			__r_13 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_13) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_14 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_13 && !__r_14) {
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

	__r_15 = true;
	_$_.pop_component();
}

export function MultipleReturnsNoneHit() {
	_$_.push_component();

	var __r_16 = false;
	var __r_17 = false;
	var __r_18 = false;
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
			__r_16 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_16) {
			_$_.output_push('<!--[-->');

			if (b) {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_17 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_16 && !__r_17) {
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

	__r_18 = true;
	_$_.pop_component();
}

export function NestedReturnsAllTrue() {
	_$_.push_component();

	var __r_19 = false;
	var __r_20 = false;
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
				__r_19 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_19) {
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

	__r_20 = true;
	_$_.pop_component();
}

export function NestedReturnsInnerFalse() {
	_$_.push_component();

	var __r_21 = false;
	var __r_22 = false;
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
				__r_21 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_21) {
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

	__r_22 = true;
	_$_.pop_component();
}

export function NestedReturnsOuterFalse() {
	_$_.push_component();

	var __r_23 = false;
	var __r_24 = false;
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
				__r_23 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_23) {
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

	__r_24 = true;
	_$_.pop_component();
}

export function DeeplyNestedReturnsAllTrue() {
	_$_.push_component();

	var __r_25 = false;
	var __r_26 = false;
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
					__r_25 = true;
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_25) {
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

	__r_26 = true;
	_$_.pop_component();
}

export function DeeplyNestedReturnsInnermostFalse() {
	_$_.push_component();

	var __r_27 = false;
	var __r_28 = false;
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
					__r_27 = true;
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_27) {
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

	__r_28 = true;
	_$_.pop_component();
}

export function ElseIfChainFirst() {
	_$_.push_component();

	var __r_29 = false;
	var __r_30 = false;
	var __r_31 = false;
	var __r_32 = false;
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
			__r_29 = true;
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
				__r_30 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
				}

				_$_.output_push('</div>');
				__r_31 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_29 && !__r_30 && !__r_31) {
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

	__r_32 = true;
	_$_.pop_component();
}

export function ElseIfChainSecond() {
	_$_.push_component();

	var __r_33 = false;
	var __r_34 = false;
	var __r_35 = false;
	var __r_36 = false;
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
			__r_33 = true;
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
				__r_34 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
				}

				_$_.output_push('</div>');
				__r_35 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_33 && !__r_34 && !__r_35) {
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

	__r_36 = true;
	_$_.pop_component();
}

export function ElseIfChainElse() {
	_$_.push_component();

	var __r_37 = false;
	var __r_38 = false;
	var __r_39 = false;
	var __r_40 = false;
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
			__r_37 = true;
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
				__r_38 = true;
			} else {
				_$_.output_push('<div');
				_$_.output_push(' class="other"');
				_$_.output_push('>');

				{
					_$_.output_push('other');
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

		if (!__r_37 && !__r_38 && !__r_39) {
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

	__r_40 = true;
	_$_.pop_component();
}

export function ReturnWithElseNoReturn() {
	_$_.push_component();

	var __r_41 = false;
	var __r_42 = false;
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
			__r_41 = true;
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

		if (!__r_41) {
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

	__r_42 = true;
	_$_.pop_component();
}

export function ReturnWithElseBothReturn() {
	_$_.push_component();

	var __r_43 = false;
	var __r_44 = false;
	var __r_45 = false;
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
			__r_43 = true;
		} else {
			_$_.output_push('<div');
			_$_.output_push(' class="false"');
			_$_.output_push('>');

			{
				_$_.output_push('condition false');
			}

			_$_.output_push('</div>');
			__r_44 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_43 && !__r_44) {
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

	__r_45 = true;
	_$_.pop_component();
}

export function ReactiveReturnTrueToFalse() {
	_$_.push_component();

	var __r_46 = false;
	var __r_47 = false;
	let lazy = _$_.track(true, '58730cee');

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

		if (lazy.value) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_46 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_46) {
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

	__r_47 = true;
	_$_.pop_component();
}

export function ReactiveReturnFalseToTrue() {
	_$_.push_component();

	var __r_48 = false;
	var __r_49 = false;
	let lazy_1 = _$_.track(false, '7fc6e96b');

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

		if (lazy_1.value) {
			_$_.output_push('<div');
			_$_.output_push(' class="guard"');
			_$_.output_push('>');

			{
				_$_.output_push('guard hit');
			}

			_$_.output_push('</div>');
			__r_48 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_48) {
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

	__r_49 = true;
	_$_.pop_component();
}

export function ReactiveNestedReturn() {
	_$_.push_component();

	var __r_50 = false;
	var __r_51 = false;
	let a = true;
	let lazy_2 = _$_.track(true, '385f771e');

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

			if (lazy_2.value) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				__r_50 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_50) {
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

	__r_51 = true;
	_$_.pop_component();
}

export function ReturnInNestedElement() {
	_$_.push_component();

	var __r_52 = false;
	var __r_53 = false;
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
				__r_52 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_52) {
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

	__r_53 = true;
	_$_.pop_component();
}

export function ReturnWithMultipleElements() {
	_$_.push_component();

	var __r_54 = false;
	var __r_55 = false;
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
			__r_54 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_54) {
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

	__r_55 = true;
	_$_.pop_component();
}

export function ReturnAtBeginning() {
	_$_.push_component();

	var __r_56 = false;
	var __r_57 = false;

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
			__r_56 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_56) {
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

	__r_57 = true;
	_$_.pop_component();
}

export function ReturnAtEnd() {
	_$_.push_component();

	var __r_58 = false;
	var __r_59 = false;

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
			__r_58 = true;
		}

		_$_.output_push('<!--]-->');
	});

	__r_59 = true;
	_$_.pop_component();
}

export function MultipleSiblingReturns() {
	_$_.push_component();

	var __r_60 = false;
	var __r_61 = false;
	var __r_62 = false;
	var __r_63 = false;
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
			__r_60 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_60) {
			_$_.output_push('<!--[-->');

			if (mode === 'b') {
				_$_.output_push('<div');
				_$_.output_push(' class="mode-b"');
				_$_.output_push('>');

				{
					_$_.output_push('mode B');
				}

				_$_.output_push('</div>');
				__r_61 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_60 && !__r_61) {
			_$_.output_push('<!--[-->');

			if (mode === 'c') {
				_$_.output_push('<div');
				_$_.output_push(' class="mode-c"');
				_$_.output_push('>');

				{
					_$_.output_push('mode C');
				}

				_$_.output_push('</div>');
				__r_62 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_60 && !__r_61 && !__r_62) {
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

	__r_63 = true;
	_$_.pop_component();
}

export function ReactiveSiblingReturns() {
	_$_.push_component();

	var __r_64 = false;
	var __r_65 = false;
	var __r_66 = false;
	let lazy_3 = _$_.track('first', '5aea90b8');

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

		if (lazy_3.value === 'first') {
			_$_.output_push('<div');
			_$_.output_push(' class="first"');
			_$_.output_push('>');

			{
				_$_.output_push('first guard');
			}

			_$_.output_push('</div>');
			__r_64 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_64) {
			_$_.output_push('<!--[-->');

			if (lazy_3.value === 'second') {
				_$_.output_push('<div');
				_$_.output_push(' class="second"');
				_$_.output_push('>');

				{
					_$_.output_push('second guard');
				}

				_$_.output_push('</div>');
				__r_65 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_64 && !__r_65) {
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

	__r_66 = true;
	_$_.pop_component();
}

export function ReactiveOuterInnerReturns() {
	_$_.push_component();

	var __r_67 = false;
	var __r_68 = false;
	let lazy_4 = _$_.track(true, '60b3ed78');
	let lazy_5 = _$_.track(true, '76f23362');

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

		if (lazy_4.value) {
			_$_.output_push('<div');
			_$_.output_push(' class="a"');
			_$_.output_push('>');

			{
				_$_.output_push('a');
			}

			_$_.output_push('</div>');
			_$_.output_push('<!--[-->');

			if (lazy_5.value) {
				_$_.output_push('<div');
				_$_.output_push(' class="b"');
				_$_.output_push('>');

				{
					_$_.output_push('b');
				}

				_$_.output_push('</div>');
				__r_67 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_67) {
			_$_.output_push('<div');
			_$_.output_push(' class="rest"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_4.value ? 'a-on rest' : 'a-off rest'));
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('<!--]-->');
	});

	__r_68 = true;
	_$_.pop_component();
}

export function ReactiveElseIfReturns() {
	_$_.push_component();

	var __r_69 = false;
	var __r_70 = false;
	var __r_71 = false;
	let lazy_6 = _$_.track(0, '820ab671');

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

		if (lazy_6.value === 0) {
			_$_.output_push('<div');
			_$_.output_push(' class="zero"');
			_$_.output_push('>');

			{
				_$_.output_push('zero');
			}

			_$_.output_push('</div>');
			__r_69 = true;
		} else {
			_$_.output_push('<!--[-->');

			if (lazy_6.value === 1) {
				_$_.output_push('<div');
				_$_.output_push(' class="one"');
				_$_.output_push('>');

				{
					_$_.output_push('one');
				}

				_$_.output_push('</div>');
				__r_70 = true;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_69 && !__r_70) {
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

	__r_71 = true;
	_$_.pop_component();
}

export function ReactiveDeepNestedIndependentReturns() {
	_$_.push_component();

	var __r_72 = false;
	var __r_73 = false;
	var __r_74 = false;
	var __r_75 = false;
	var __r_76 = false;
	let lazy_7 = _$_.track(false, '0222c312');
	let lazy_8 = _$_.track(false, '7b13a4fb');
	let lazy_9 = _$_.track(false, '405b5bb5');
	let lazy_10 = _$_.track(false, 'f8de97e9');

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

		if (lazy_7.value) {
			_$_.output_push('<div');
			_$_.output_push(' class="hit-1"');
			_$_.output_push('>');

			{
				_$_.output_push('hit-1');
			}

			_$_.output_push('</div>');
			__r_72 = true;
		}

		_$_.output_push('<!--]-->');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (!__r_72) {
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

				if (lazy_8.value) {
					_$_.output_push('<div');
					_$_.output_push(' class="hit-2"');
					_$_.output_push('>');

					{
						_$_.output_push('hit-2');
					}

					_$_.output_push('</div>');
					__r_73 = true;
				}

				_$_.output_push('<!--]-->');
				_$_.output_push('<!--[-->');

				if (!__r_73) {
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

						if (lazy_9.value) {
							_$_.output_push('<div');
							_$_.output_push(' class="hit-3"');
							_$_.output_push('>');

							{
								_$_.output_push('hit-3');
							}

							_$_.output_push('</div>');
							__r_74 = true;
						}

						_$_.output_push('<!--]-->');
						_$_.output_push('<!--[-->');

						if (!__r_74) {
							_$_.output_push('<div');
							_$_.output_push(' class="nest-2-b"');
							_$_.output_push('>');

							{
								_$_.output_push('nest-2-b');
							}

							_$_.output_push('</div>');
							_$_.output_push('<!--[-->');

							if (lazy_10.value) {
								_$_.output_push('<div');
								_$_.output_push(' class="hit-4"');
								_$_.output_push('>');

								{
									_$_.output_push('hit-4');
								}

								_$_.output_push('</div>');
								__r_75 = true;
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

		if (!__r_72 && !__r_73 && !__r_74 && !__r_75) {
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

	__r_76 = true;
	_$_.pop_component();
}