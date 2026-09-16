// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function ClickCounter() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '18illt3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="increment">Increment</button><span class="count">' + _$_.escape(count.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function IncrementDecrement() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '11qc3q5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="decrement">-</button><span class="count">' + _$_.escape(count.value) + '</span><button class="increment">+</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function MultipleEvents() {
	return _$_.tsrx_element(() => {
		const clicks = _$_.track(0, 'i8ishc');
		const hovers = _$_.track(0, 'vrf59x');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="target">Target</button><span class="clicks">' + _$_.escape(clicks.value) + '</span><span class="hovers">' + _$_.escape(hovers.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function MultiStateUpdate() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, 'p155r4');
		const lastAction = _$_.track('none', 'gwmyks');

		const handleClick = () => {
			count.value++;
			lastAction.value = 'increment';
		};

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="btn">Click</button><span class="count">' + _$_.escape(count.value) + '</span><span class="action">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(lastAction.value);
			}

			__out += '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function ToggleButton() {
	return _$_.tsrx_element(() => {
		const isOn = _$_.track(false, '1guxsxz');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><button class="toggle">' + _$_.escape(isOn.value ? 'ON' : 'OFF') + '</button></div>';
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
		const count = _$_.track(0, '1p94et5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				const comp = ChildButton;

				const args = [
					{
						onClick: () => {
							count.value++;
						},
						label: "Click me"
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="count">' + _$_.escape(count.value) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}