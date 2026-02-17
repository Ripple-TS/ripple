import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TrackedState(__output) {
	_$_.push_component();

	let count = track(0);

	__output.push('<div');
	__output.push(' class="count"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(count)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function CounterWithInitial(__output, props) {
	_$_.push_component();

	let count = track(props.initial);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(count)));
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

	let a = track(2);
	let b = track(3);
	const sum = () => _$_.get(a) + _$_.get(b);

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

	let x = track(10);
	let y = track(20);
	let z = track(30);

	__output.push('<div');
	__output.push(' class="x"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(x)));
	}

	__output.push('</div>');
	__output.push('<div');
	__output.push(' class="y"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(y)));
	}

	__output.push('</div>');
	__output.push('<div');
	__output.push(' class="z"');
	__output.push('>');

	{
		__output.push(_$_.escape(_$_.get(z)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function DerivedState(__output) {
	_$_.push_component();

	let firstName = track('John');
	let lastName = track('Doe');
	const fullName = () => `${_$_.get(firstName)} ${_$_.get(lastName)}`;

	__output.push('<div');
	__output.push(' class="name"');
	__output.push('>');

	{
		__output.push(_$_.escape(fullName()));
	}

	__output.push('</div>');
	_$_.pop_component();
}