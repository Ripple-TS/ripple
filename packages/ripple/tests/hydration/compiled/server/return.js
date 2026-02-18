import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function DirectReturn(__output) {
	_$_.push_component();

	var __r = false;

	__output.push('<div');
	__output.push(' class="before"');
	__output.push('>');

	{
		__output.push('before');
	}

	__output.push('</div>');
	__r = true;
	__output.push('<!--[-->');

	if (!__r) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('after');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ConditionalReturnTrue(__output) {
	_$_.push_component();

	var __r_1 = false;
	let condition = true;

	__output.push('<!--[-->');

	if (condition) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard hit');
		}

		__output.push('</div>');
		__r_1 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_1) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ConditionalReturnFalse(__output) {
	_$_.push_component();

	var __r_2 = false;
	let condition = false;

	__output.push('<!--[-->');

	if (condition) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard hit');
		}

		__output.push('</div>');
		__r_2 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_2) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ContentBeforeAfterReturn(__output) {
	_$_.push_component();

	var __r_3 = false;
	let shouldReturn = true;

	__output.push('<div');
	__output.push(' class="before"');
	__output.push('>');

	{
		__output.push('before');
	}

	__output.push('</div>');
	__output.push('<!--[-->');

	if (shouldReturn) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard');
		}

		__output.push('</div>');
		__r_3 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_3) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('after');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MultipleElementsAfterGuard(__output) {
	_$_.push_component();

	var __r_4 = false;
	let shouldReturn = false;

	__output.push('<!--[-->');

	if (shouldReturn) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard');
		}

		__output.push('</div>');
		__r_4 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_4) {
		__output.push('<div');
		__output.push(' class="first"');
		__output.push('>');

		{
			__output.push('first');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="second"');
		__output.push('>');

		{
			__output.push('second');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MultipleReturnsFirstHits(__output) {
	_$_.push_component();

	var __r_5 = false;
	var __r_6 = false;
	let a = true;
	let b = true;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="first"');
		__output.push('>');

		{
			__output.push('first guard');
		}

		__output.push('</div>');
		__r_5 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_5) {
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="second"');
			__output.push('>');

			{
				__output.push('second guard');
			}

			__output.push('</div>');
			__r_6 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_5 && !__r_6) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MultipleReturnsSecondHits(__output) {
	_$_.push_component();

	var __r_7 = false;
	var __r_8 = false;
	let a = false;
	let b = true;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="first"');
		__output.push('>');

		{
			__output.push('first guard');
		}

		__output.push('</div>');
		__r_7 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_7) {
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="second"');
			__output.push('>');

			{
				__output.push('second guard');
			}

			__output.push('</div>');
			__r_8 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_7 && !__r_8) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MultipleReturnsNoneHit(__output) {
	_$_.push_component();

	var __r_9 = false;
	var __r_10 = false;
	let a = false;
	let b = false;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="first"');
		__output.push('>');

		{
			__output.push('first guard');
		}

		__output.push('</div>');
		__r_9 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_9) {
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="second"');
			__output.push('>');

			{
				__output.push('second guard');
			}

			__output.push('</div>');
			__r_10 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_9 && !__r_10) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function NestedReturnsAllTrue(__output) {
	_$_.push_component();

	var __r_11 = false;
	let a = true;
	let b = true;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a is true');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b is true');
			}

			__output.push('</div>');
			__r_11 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_11) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function NestedReturnsInnerFalse(__output) {
	_$_.push_component();

	var __r_12 = false;
	let a = true;
	let b = false;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a is true');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b is true');
			}

			__output.push('</div>');
			__r_12 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_12) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function NestedReturnsOuterFalse(__output) {
	_$_.push_component();

	var __r_13 = false;
	let a = false;
	let b = true;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a is true');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b is true');
			}

			__output.push('</div>');
			__r_13 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_13) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function DeeplyNestedReturnsAllTrue(__output) {
	_$_.push_component();

	var __r_14 = false;
	let a = true;
	let b = true;
	let c = true;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (c) {
				__output.push('<div');
				__output.push(' class="c"');
				__output.push('>');

				{
					__output.push('c');
				}

				__output.push('</div>');
				__r_14 = true;
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_14) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function DeeplyNestedReturnsInnermostFalse(__output) {
	_$_.push_component();

	var __r_15 = false;
	let a = true;
	let b = true;
	let c = false;

	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (b) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (c) {
				__output.push('<div');
				__output.push(' class="c"');
				__output.push('>');

				{
					__output.push('c');
				}

				__output.push('</div>');
				__r_15 = true;
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_15) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ElseIfChainFirst(__output) {
	_$_.push_component();

	var __r_16 = false;
	var __r_17 = false;
	var __r_18 = false;
	let value = 1;

	__output.push('<!--[-->');

	if (value === 1) {
		__output.push('<div');
		__output.push(' class="one"');
		__output.push('>');

		{
			__output.push('one');
		}

		__output.push('</div>');
		__r_16 = true;
	} else {
		__output.push('<!--[-->');

		if (value === 2) {
			__output.push('<div');
			__output.push(' class="two"');
			__output.push('>');

			{
				__output.push('two');
			}

			__output.push('</div>');
			__r_17 = true;
		} else {
			__output.push('<div');
			__output.push(' class="other"');
			__output.push('>');

			{
				__output.push('other');
			}

			__output.push('</div>');
			__r_18 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_16 && !__r_17 && !__r_18) {
		__output.push('<div');
		__output.push(' class="never"');
		__output.push('>');

		{
			__output.push('never reached');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ElseIfChainSecond(__output) {
	_$_.push_component();

	var __r_19 = false;
	var __r_20 = false;
	var __r_21 = false;
	let value = 2;

	__output.push('<!--[-->');

	if (value === 1) {
		__output.push('<div');
		__output.push(' class="one"');
		__output.push('>');

		{
			__output.push('one');
		}

		__output.push('</div>');
		__r_19 = true;
	} else {
		__output.push('<!--[-->');

		if (value === 2) {
			__output.push('<div');
			__output.push(' class="two"');
			__output.push('>');

			{
				__output.push('two');
			}

			__output.push('</div>');
			__r_20 = true;
		} else {
			__output.push('<div');
			__output.push(' class="other"');
			__output.push('>');

			{
				__output.push('other');
			}

			__output.push('</div>');
			__r_21 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_19 && !__r_20 && !__r_21) {
		__output.push('<div');
		__output.push(' class="never"');
		__output.push('>');

		{
			__output.push('never reached');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ElseIfChainElse(__output) {
	_$_.push_component();

	var __r_22 = false;
	var __r_23 = false;
	var __r_24 = false;
	let value = 3;

	__output.push('<!--[-->');

	if (value === 1) {
		__output.push('<div');
		__output.push(' class="one"');
		__output.push('>');

		{
			__output.push('one');
		}

		__output.push('</div>');
		__r_22 = true;
	} else {
		__output.push('<!--[-->');

		if (value === 2) {
			__output.push('<div');
			__output.push(' class="two"');
			__output.push('>');

			{
				__output.push('two');
			}

			__output.push('</div>');
			__r_23 = true;
		} else {
			__output.push('<div');
			__output.push(' class="other"');
			__output.push('>');

			{
				__output.push('other');
			}

			__output.push('</div>');
			__r_24 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_22 && !__r_23 && !__r_24) {
		__output.push('<div');
		__output.push(' class="never"');
		__output.push('>');

		{
			__output.push('never reached');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnWithElseNoReturn(__output) {
	_$_.push_component();

	var __r_25 = false;
	let condition = false;

	__output.push('<!--[-->');

	if (condition) {
		__output.push('<div');
		__output.push(' class="true"');
		__output.push('>');

		{
			__output.push('condition true');
		}

		__output.push('</div>');
		__r_25 = true;
	} else {
		__output.push('<div');
		__output.push(' class="false"');
		__output.push('>');

		{
			__output.push('condition false');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_25) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('after if-else');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnWithElseBothReturn(__output) {
	_$_.push_component();

	var __r_26 = false;
	var __r_27 = false;
	let condition = false;

	__output.push('<!--[-->');

	if (condition) {
		__output.push('<div');
		__output.push(' class="true"');
		__output.push('>');

		{
			__output.push('condition true');
		}

		__output.push('</div>');
		__r_26 = true;
	} else {
		__output.push('<div');
		__output.push(' class="false"');
		__output.push('>');

		{
			__output.push('condition false');
		}

		__output.push('</div>');
		__r_27 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_26 && !__r_27) {
		__output.push('<div');
		__output.push(' class="never"');
		__output.push('>');

		{
			__output.push('never reached');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveReturnTrueToFalse(__output) {
	_$_.push_component();

	var __r_28 = false;
	let condition = track(true);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(condition)) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard hit');
		}

		__output.push('</div>');
		__r_28 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_28) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveReturnFalseToTrue(__output) {
	_$_.push_component();

	var __r_29 = false;
	let condition = track(false);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(condition)) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard hit');
		}

		__output.push('</div>');
		__r_29 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_29) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveNestedReturn(__output) {
	_$_.push_component();

	var __r_30 = false;
	let a = true;
	let b = track(true);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (a) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (_$_.get(b)) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b');
			}

			__output.push('</div>');
			__r_30 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_30) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnInNestedElement(__output) {
	_$_.push_component();

	var __r_31 = false;
	let show = true;

	__output.push('<div');
	__output.push(' class="outer"');
	__output.push('>');

	{
		__output.push('<span');
		__output.push(' class="label"');
		__output.push('>');

		{
			__output.push('outer');
		}

		__output.push('</span>');
		__output.push('<!--[-->');

		if (show) {
			__output.push('<p');
			__output.push(' class="inner"');
			__output.push('>');

			{
				__output.push('inner');
			}

			__output.push('</p>');
			__r_31 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	__output.push('<!--[-->');

	if (!__r_31) {
		__output.push('<div');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('after');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnWithMultipleElements(__output) {
	_$_.push_component();

	var __r_32 = false;
	let shouldReturn = true;

	__output.push('<h1');
	__output.push(' class="title"');
	__output.push('>');

	{
		__output.push('title');
	}

	__output.push('</h1>');
	__output.push('<p');
	__output.push(' class="desc"');
	__output.push('>');

	{
		__output.push('description');
	}

	__output.push('</p>');
	__output.push('<!--[-->');

	if (shouldReturn) {
		__output.push('<div');
		__output.push(' class="guard"');
		__output.push('>');

		{
			__output.push('guard');
		}

		__output.push('</div>');
		__output.push('<span');
		__output.push(' class="guard-span"');
		__output.push('>');

		{
			__output.push('guard span');
		}

		__output.push('</span>');
		__r_32 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_32) {
		__output.push('<footer');
		__output.push(' class="footer"');
		__output.push('>');

		{
			__output.push('footer');
		}

		__output.push('</footer>');
		__output.push('<nav');
		__output.push(' class="nav"');
		__output.push('>');

		{
			__output.push('nav');
		}

		__output.push('</nav>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnAtBeginning(__output) {
	_$_.push_component();

	var __r_33 = false;

	__output.push('<!--[-->');

	if (true) {
		__output.push('<div');
		__output.push(' class="early"');
		__output.push('>');

		{
			__output.push('early exit');
		}

		__output.push('</div>');
		__r_33 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_33) {
		__output.push('<div');
		__output.push(' class="never1"');
		__output.push('>');

		{
			__output.push('never reached 1');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="never2"');
		__output.push('>');

		{
			__output.push('never reached 2');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReturnAtEnd(__output) {
	_$_.push_component();

	var __r_34 = false;

	__output.push('<div');
	__output.push(' class="first"');
	__output.push('>');

	{
		__output.push('first');
	}

	__output.push('</div>');
	__output.push('<div');
	__output.push(' class="second"');
	__output.push('>');

	{
		__output.push('second');
	}

	__output.push('</div>');
	__output.push('<!--[-->');

	if (true) {
		__output.push('<div');
		__output.push(' class="third"');
		__output.push('>');

		{
			__output.push('third');
		}

		__output.push('</div>');
		__r_34 = true;
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function MultipleSiblingReturns(__output) {
	_$_.push_component();

	var __r_35 = false;
	var __r_36 = false;
	var __r_37 = false;
	let mode = 'b';

	__output.push('<!--[-->');

	if (mode === 'a') {
		__output.push('<div');
		__output.push(' class="mode-a"');
		__output.push('>');

		{
			__output.push('mode A');
		}

		__output.push('</div>');
		__r_35 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_35) {
		__output.push('<!--[-->');

		if (mode === 'b') {
			__output.push('<div');
			__output.push(' class="mode-b"');
			__output.push('>');

			{
				__output.push('mode B');
			}

			__output.push('</div>');
			__r_36 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_35 && !__r_36) {
		__output.push('<!--[-->');

		if (mode === 'c') {
			__output.push('<div');
			__output.push(' class="mode-c"');
			__output.push('>');

			{
				__output.push('mode C');
			}

			__output.push('</div>');
			__r_37 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_35 && !__r_36 && !__r_37) {
		__output.push('<div');
		__output.push(' class="default"');
		__output.push('>');

		{
			__output.push('default mode');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveSiblingReturns(__output) {
	_$_.push_component();

	var __r_38 = false;
	var __r_39 = false;
	let mode = track('first');

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(mode) === 'first') {
		__output.push('<div');
		__output.push(' class="first"');
		__output.push('>');

		{
			__output.push('first guard');
		}

		__output.push('</div>');
		__r_38 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_38) {
		__output.push('<!--[-->');

		if (_$_.get(mode) === 'second') {
			__output.push('<div');
			__output.push(' class="second"');
			__output.push('>');

			{
				__output.push('second guard');
			}

			__output.push('</div>');
			__r_39 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_38 && !__r_39) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveOuterInnerReturns(__output) {
	_$_.push_component();

	var __r_40 = false;
	let a = track(true);
	let b = track(true);

	__output.push('<button');
	__output.push(' class="toggle-a"');
	__output.push('>');

	{
		__output.push('Toggle A');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="toggle-b"');
	__output.push('>');

	{
		__output.push('Toggle B');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(a)) {
		__output.push('<div');
		__output.push(' class="a"');
		__output.push('>');

		{
			__output.push('a');
		}

		__output.push('</div>');
		__output.push('<!--[-->');

		if (_$_.get(b)) {
			__output.push('<div');
			__output.push(' class="b"');
			__output.push('>');

			{
				__output.push('b');
			}

			__output.push('</div>');
			__r_40 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_40) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(a) ? 'a-on rest' : 'a-off rest'));
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveElseIfReturns(__output) {
	_$_.push_component();

	var __r_41 = false;
	var __r_42 = false;
	let status = track(0);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(status) === 0) {
		__output.push('<div');
		__output.push(' class="zero"');
		__output.push('>');

		{
			__output.push('zero');
		}

		__output.push('</div>');
		__r_41 = true;
	} else {
		__output.push('<!--[-->');

		if (_$_.get(status) === 1) {
			__output.push('<div');
			__output.push(' class="one"');
			__output.push('>');

			{
				__output.push('one');
			}

			__output.push('</div>');
			__r_42 = true;
		}

		__output.push('<!--]-->');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_41 && !__r_42) {
		__output.push('<div');
		__output.push(' class="rest"');
		__output.push('>');

		{
			__output.push('rest');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="tail"');
		__output.push('>');

		{
			__output.push('tail');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ReactiveDeepNestedIndependentReturns(__output) {
	_$_.push_component();

	var __r_43 = false;
	var __r_44 = false;
	var __r_45 = false;
	var __r_46 = false;
	let c1 = track(false);
	let c2 = track(false);
	let c3 = track(false);
	let c4 = track(false);

	__output.push('<button');
	__output.push(' class="toggle-c1"');
	__output.push('>');

	{
		__output.push('Toggle C1');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="toggle-c2"');
	__output.push('>');

	{
		__output.push('Toggle C2');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="toggle-c3"');
	__output.push('>');

	{
		__output.push('Toggle C3');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="toggle-c4"');
	__output.push('>');

	{
		__output.push('Toggle C4');
	}

	__output.push('</button>');
	__output.push('<div');
	__output.push(' class="top"');
	__output.push('>');

	{
		__output.push('top');
	}

	__output.push('</div>');
	__output.push('<!--[-->');

	if (_$_.get(c1)) {
		__output.push('<div');
		__output.push(' class="hit-1"');
		__output.push('>');

		{
			__output.push('hit-1');
		}

		__output.push('</div>');
		__r_43 = true;
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_43) {
		__output.push('<div');
		__output.push(' class="middle"');
		__output.push('>');

		{
			__output.push('middle');
		}

		__output.push('</div>');
		__output.push('<section');
		__output.push(' class="nest-1"');
		__output.push('>');

		{
			__output.push('<div');
			__output.push(' class="nest-1-a"');
			__output.push('>');

			{
				__output.push('nest-1-a');
			}

			__output.push('</div>');
			__output.push('<!--[-->');

			if (_$_.get(c2)) {
				__output.push('<div');
				__output.push(' class="hit-2"');
				__output.push('>');

				{
					__output.push('hit-2');
				}

				__output.push('</div>');
				__r_44 = true;
			}

			__output.push('<!--]-->');
			__output.push('<!--[-->');

			if (!__r_44) {
				__output.push('<div');
				__output.push(' class="nest-1-b"');
				__output.push('>');

				{
					__output.push('nest-1-b');
				}

				__output.push('</div>');
				__output.push('<section');
				__output.push(' class="nest-2"');
				__output.push('>');

				{
					__output.push('<div');
					__output.push(' class="nest-2-a"');
					__output.push('>');

					{
						__output.push('nest-2-a');
					}

					__output.push('</div>');
					__output.push('<!--[-->');

					if (_$_.get(c3)) {
						__output.push('<div');
						__output.push(' class="hit-3"');
						__output.push('>');

						{
							__output.push('hit-3');
						}

						__output.push('</div>');
						__r_45 = true;
					}

					__output.push('<!--]-->');
					__output.push('<!--[-->');

					if (!__r_45) {
						__output.push('<div');
						__output.push(' class="nest-2-b"');
						__output.push('>');

						{
							__output.push('nest-2-b');
						}

						__output.push('</div>');
						__output.push('<!--[-->');

						if (_$_.get(c4)) {
							__output.push('<div');
							__output.push(' class="hit-4"');
							__output.push('>');

							{
								__output.push('hit-4');
							}

							__output.push('</div>');
							__r_46 = true;
						}

						__output.push('<!--]-->');
					}

					__output.push('<!--]-->');
				}

				__output.push('</section>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</section>');
	}

	__output.push('<!--]-->');
	__output.push('<!--[-->');

	if (!__r_43 && !__r_44 && !__r_45 && !__r_46) {
		__output.push('<div');
		__output.push(' class="root-1"');
		__output.push('>');

		{
			__output.push('root-1');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="root-2"');
		__output.push('>');

		{
			__output.push('root-2');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="root-3"');
		__output.push('>');

		{
			__output.push('root-3');
		}

		__output.push('</div>');
		__output.push('<div');
		__output.push(' class="root-4"');
		__output.push('>');

		{
			__output.push('root-4');
		}

		__output.push('</div>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}