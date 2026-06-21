// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function TrackedState() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(0, 'c1818584');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(lazy.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function CounterWithInitial(props) {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(props.initial, '03ea4348');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span class="count">' + _$_.escape(lazy_1.value) + '</span></div>';
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
		let lazy_2 = _$_.track(2, 'b78281db');
		let lazy_3 = _$_.track(3, 'a0cf6c6d');
		const sum = () => lazy_2.value + lazy_3.value;

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
		let lazy_4 = _$_.track(10, '843522de');
		let lazy_5 = _$_.track(20, '1308996d');
		let lazy_6 = _$_.track(30, '048c3fd0');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="multiple-tracked"><div class="x">' + _$_.escape(lazy_4.value) + '</div><div class="y">' + _$_.escape(lazy_5.value) + '</div><div class="z">' + _$_.escape(lazy_6.value) + '</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function DerivedState() {
	return _$_.tsrx_element(() => {
		let lazy_7 = _$_.track('John', '6015eeca');
		let lazy_8 = _$_.track('Doe', '4fa9a20e');
		const fullName = () => `${lazy_7.value} ${lazy_8.value}`;

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