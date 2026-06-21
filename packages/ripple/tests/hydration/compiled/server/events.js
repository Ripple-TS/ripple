// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function ClickCounter() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(0, 'a070e3a7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="increment">Increment</button><span class="count">' + _$_.escape(lazy.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function IncrementDecrement() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(0, '87fcabdd');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="decrement">-</button><span class="count">' + _$_.escape(lazy_1.value) + '</span><button class="increment">+</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function MultipleEvents() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(0, '41b9f0b0');
		let lazy_3 = _$_.track(0, '72789f75');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="target">Target</button><span class="clicks">' + _$_.escape(lazy_2.value) + '</span><span class="hovers">' + _$_.escape(lazy_3.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function MultiStateUpdate() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track(0, '5a375160');
		let lazy_5 = _$_.track('none', '3ceeb88c');

		const handleClick = () => {
			_$_.update(lazy_4);
			_$_.set(lazy_5, 'increment');
		};

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="btn">Click</button><span class="count">' + _$_.escape(lazy_4.value) + '</span><span class="action">' + _$_.escape(lazy_5.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function ToggleButton() {
	return _$_.tsrx_element(() => {
		let lazy_6 = _$_.track(false, 'be823ec7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="toggle">' + _$_.escape(lazy_6.value ? 'ON' : 'OFF') + '</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function ChildButton(props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="child-btn">' + _$_.escape(props.label) + '</button>';
			_$_.output_push(__out);
		});
	});
}

export function ParentWithChildButton() {
	return _$_.tsrx_element(() => {
		let lazy_7 = _$_.track(0, 'dcc2e0f9');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				const comp = ChildButton;

				const args = [
					{
						onClick: () => {
							_$_.update(lazy_7);
						},
						label: "Click me"
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="count">' + _$_.escape(lazy_7.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}