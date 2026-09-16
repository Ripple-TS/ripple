// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TrackedState() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '1hovkhw');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(count.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function CounterWithInitial(props) {
	return _$_.tsrx_element(() => {
		const count = _$_.track(props.initial, '133ubs');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span class="count">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(count.value);
			}

			__out += '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function CounterWrapper() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = CounterWithInitial;
				const args = [{ initial: 5 }];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function ComputedValues() {
	return _$_.tsrx_element(() => {
		const a = _$_.track(2, '1ex10ij');
		const b = _$_.track(3, '18mae7h');
		const sum = () => a.value + b.value;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="sum">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(sum());
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function MultipleTracked() {
	return _$_.tsrx_element(() => {
		const x = _$_.track(10, '10ol1i6');
		const y = _$_.track(20, '5a4d4d');
		const z = _$_.track(30, '19fdn4');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="multiple-tracked"><div class="x">' + _$_.escape(x.value) + '</div><div class="y">' + _$_.escape(y.value) + '</div><div class="z">' + _$_.escape(z.value) + '</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function DerivedState() {
	return _$_.tsrx_element(() => {
		const firstName = _$_.track('John', 'qnrtu2');
		const lastName = _$_.track('Doe', 'm3q77y');
		const fullName = () => `${firstName.value} ${lastName.value}`;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="name">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(fullName());
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}