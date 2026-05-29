// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function ClickCounter() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(0, 'a070e3a7');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="increment"');
				_$_.output_push('>');

				{
					_$_.output_push('Increment');
				}

				_$_.output_push('</button>');
				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function IncrementDecrement() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(0, '87fcabdd');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="decrement"');
				_$_.output_push('>');

				{
					_$_.output_push('-');
				}

				_$_.output_push('</button>');
				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_1.value));
				}

				_$_.output_push('</span>');
				_$_.output_push('<button');
				_$_.output_push(' class="increment"');
				_$_.output_push('>');

				{
					_$_.output_push('+');
				}

				_$_.output_push('</button>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function MultipleEvents() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(0, '41b9f0b0');
		let lazy_3 = _$_.track(0, '72789f75');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="target"');
				_$_.output_push('>');

				{
					_$_.output_push('Target');
				}

				_$_.output_push('</button>');
				_$_.output_push('<span');
				_$_.output_push(' class="clicks"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_2.value));
				}

				_$_.output_push('</span>');
				_$_.output_push('<span');
				_$_.output_push(' class="hovers"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_3.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
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
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="btn"');
				_$_.output_push('>');

				{
					_$_.output_push('Click');
				}

				_$_.output_push('</button>');
				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_4.value));
				}

				_$_.output_push('</span>');
				_$_.output_push('<span');
				_$_.output_push(' class="action"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_5.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function ToggleButton() {
	return _$_.tsrx_element(() => {
		let lazy_6 = _$_.track(false, 'be823ec7');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<button');
				_$_.output_push(' class="toggle"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_6.value ? 'ON' : 'OFF'));
				}

				_$_.output_push('</button>');
			}

			_$_.output_push('</div>');
		});
	});
}

export function ChildButton(props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<button');
			_$_.output_push(' class="child-btn"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(props.label));
			}

			_$_.output_push('</button>');
		});
	});
}

export function ParentWithChildButton() {
	return _$_.tsrx_element(() => {
		let lazy_7 = _$_.track(0, 'dcc2e0f9');

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
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

					_$_.render_component(comp, ...args);
				}

				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(lazy_7.value));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');
		});
	});
}