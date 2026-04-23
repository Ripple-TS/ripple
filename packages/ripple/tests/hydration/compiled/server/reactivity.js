// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TrackedState() {
	_$_.push_component();

	let lazy = _$_.track(0, 'c1818584');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="count"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy)));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function CounterWithInitial(props) {
	_$_.push_component();

	let lazy_1 = _$_.track(props.initial, '03ea4348');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<span');
			_$_.output_push(' class="count"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(_$_.get(lazy_1)));
			}

			_$_.output_push('</span>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function CounterWrapper() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = CounterWithInitial;
			const args = [{ initial: 5 }];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function ComputedValues() {
	_$_.push_component();

	let lazy_2 = _$_.track(2, 'b78281db');
	let lazy_3 = _$_.track(3, 'a0cf6c6d');
	const sum = () => _$_.get(lazy_2) + _$_.get(lazy_3);

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="sum"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(sum()));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function MultipleTracked() {
	_$_.push_component();

	let lazy_4 = _$_.track(10, '843522de');
	let lazy_5 = _$_.track(20, '1308996d');
	let lazy_6 = _$_.track(30, '048c3fd0');

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="x"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_4)));
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="y"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_5)));
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="z"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(_$_.get(lazy_6)));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function DerivedState() {
	_$_.push_component();

	let lazy_7 = _$_.track('John', '6015eeca');
	let lazy_8 = _$_.track('Doe', '4fa9a20e');
	const fullName = () => `${_$_.get(lazy_7)} ${_$_.get(lazy_8)}`;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="name"');
		_$_.output_push('>');

		{
			_$_.output_push(_$_.escape(fullName()));
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}