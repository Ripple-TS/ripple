// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function ClickCounter(__output) {
	_$_.push_component();

	let lazy = _$_.track(0);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="increment"');
		__output.push('>');

		{
			__output.push('Increment');
		}

		__output.push('</button>');
		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function IncrementDecrement(__output) {
	_$_.push_component();

	let lazy_1 = _$_.track(0);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="decrement"');
		__output.push('>');

		{
			__output.push('-');
		}

		__output.push('</button>');
		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_1)));
		}

		__output.push('</span>');
		__output.push('<button');
		__output.push(' class="increment"');
		__output.push('>');

		{
			__output.push('+');
		}

		__output.push('</button>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultipleEvents(__output) {
	_$_.push_component();

	let lazy_2 = _$_.track(0);
	let lazy_3 = _$_.track(0);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="target"');
		__output.push('>');

		{
			__output.push('Target');
		}

		__output.push('</button>');
		__output.push('<span');
		__output.push(' class="clicks"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_2)));
		}

		__output.push('</span>');
		__output.push('<span');
		__output.push(' class="hovers"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_3)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultiStateUpdate(__output) {
	_$_.push_component();

	let lazy_4 = _$_.track(0);
	let lazy_5 = _$_.track('none');

	const handleClick = () => {
		_$_.update(lazy_4);
		_$_.set(lazy_5, 'increment');
	};

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="btn"');
		__output.push('>');

		{
			__output.push('Click');
		}

		__output.push('</button>');
		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_4)));
		}

		__output.push('</span>');
		__output.push('<span');
		__output.push(' class="action"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_5)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ToggleButton(__output) {
	_$_.push_component();

	let lazy_6 = _$_.track(false);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="toggle"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_6) ? 'ON' : 'OFF'));
		}

		__output.push('</button>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ChildButton(__output, props) {
	_$_.push_component();
	__output.push('<button');
	__output.push(' class="child-btn"');
	__output.push('>');

	{
		__output.push(_$_.escape(props.label));
	}

	__output.push('</button>');
	_$_.pop_component();
}

export function ParentWithChildButton(__output) {
	_$_.push_component();

	let lazy_7 = _$_.track(0);

	__output.push('<div');
	__output.push('>');

	{
		{
			const comp = ChildButton;

			const args = [
				__output,
				{
					onClick: () => {
						_$_.update(lazy_7);
					},
					label: "Click me"
				}
			];

			comp(...args);
		}

		__output.push('<span');
		__output.push(' class="count"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lazy_7)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}