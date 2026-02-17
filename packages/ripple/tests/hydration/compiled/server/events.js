import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function ClickCounter(__output) {
	_$_.push_component();

	let count = track(0);

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
			__output.push(_$_.escape(_$_.get(count)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function IncrementDecrement(__output) {
	_$_.push_component();

	let count = track(0);

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
			__output.push(_$_.escape(_$_.get(count)));
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

	let clicks = track(0);
	let hovers = track(0);

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
			__output.push(_$_.escape(_$_.get(clicks)));
		}

		__output.push('</span>');
		__output.push('<span');
		__output.push(' class="hovers"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(hovers)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultiStateUpdate(__output) {
	_$_.push_component();

	let count = track(0);
	let lastAction = track('none');

	const handleClick = () => {
		_$_.update(count);
		_$_.set(lastAction, 'increment');
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
			__output.push(_$_.escape(_$_.get(count)));
		}

		__output.push('</span>');
		__output.push('<span');
		__output.push(' class="action"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(lastAction)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ToggleButton(__output) {
	_$_.push_component();

	let isOn = track(false);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<button');
		__output.push(' class="toggle"');
		__output.push('>');

		{
			__output.push(_$_.escape(_$_.get(isOn) ? 'ON' : 'OFF'));
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

	let count = track(0);

	__output.push('<div');
	__output.push('>');

	{
		{
			const comp = ChildButton;

			const args = [
				__output,

				{
					onClick: () => {
						_$_.update(count);
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
			__output.push(_$_.escape(_$_.get(count)));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}