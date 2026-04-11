// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TrackedState(__output) {
	_$_.push_component();

	let lazy = _$_.track(0);

	__output.push('<div');
	__output.push(' class="count"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function CounterWithInitial(__output, props) {
	_$_.push_component();

	let lazy_1 = _$_.track(props.initial);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_1)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function CounterWrapper(__output) {
	_$_.push_component();

	{
		const comp = CounterWithInitial;
		const args = [__output, { initial: 5 }];

		comp(...args);
	}

	_$_.pop_component();
}

export function ComputedValues(__output) {
	_$_.push_component();

	let lazy_2 = _$_.track(2);
	let lazy_3 = _$_.track(3);
	const sum = () => _$_.get(lazy_2) + _$_.get(lazy_3);

	__output.push('<div');
	__output.push(' class="sum"');
	__output.push('>');

	{
		__output.push(_$_.escape(sum()));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultipleTracked(__output) {
	_$_.push_component();

	let lazy_4 = _$_.track(10);
	let lazy_5 = _$_.track(20);
	let lazy_6 = _$_.track(30);

	__output.push('<div');
	__output.push(' class="x"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_4)));
	}

	__output.push('</div>');
	__output.push('<div');
	__output.push(' class="y"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_5)));
	}

	__output.push('</div>');
	__output.push('<div');
	__output.push(' class="z"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(lazy_6)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function DerivedState(__output) {
	_$_.push_component();

	let lazy_7 = _$_.track('John');
	let lazy_8 = _$_.track('Doe');
	const fullName = () => `${_$_.get(lazy_7)} ${_$_.get(lazy_8)}`;

	__output.push('<div');
	__output.push(' class="name"');
	__output.push('>');

	{
		__output.push(_$_.escape(fullName()));
	}

	__output.push('</div>');
	_$_.pop_component();
}