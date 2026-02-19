import * as _$_ from 'ripple/internal/server';

export async function Layout(__output, { children }) {
	return _$_.async(async () => {
		_$_.push_component();
		__output.push('<div');
		__output.push(' class="layout"');
		__output.push('>');

		{
			{
				const comp = children;
				const args = [__output, {}];

				if (comp?.async) {
					await comp(...args);
				} else if (comp) {
					comp(...args);
				}
			}
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

export function SingleChild(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="single"');
	__output.push('>');

	{
		__output.push('single');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultiRootChild(__output) {
	_$_.push_component();
	__output.push('<h1');
	__output.push('>');

	{
		__output.push('title');
	}

	__output.push('</h1>');
	__output.push('<p');
	__output.push('>');

	{
		__output.push('description');
	}

	__output.push('</p>');
	_$_.pop_component();
}

export function EmptyLayout(__output) {
	_$_.push_component();

	{
		const comp = Layout;
		const args = [__output, {}];

		comp(...args);
	}

	_$_.pop_component();
}

export function LayoutWithSingleChild(__output) {
	_$_.push_component();

	{
		const comp = Layout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = SingleChild;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function LayoutWithMultipleChildren(__output) {
	_$_.push_component();

	{
		const comp = Layout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = SingleChild;
						const args = [__output, {}];

						comp(...args);
					}

					__output.push('<div');
					__output.push(' class="extra"');
					__output.push('>');

					{
						__output.push('extra');
					}

					__output.push('</div>');
					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function LayoutWithMultiRootChild(__output) {
	_$_.push_component();

	{
		const comp = Layout;

		const args = [
			__output,

			{
				children: function children(__output) {
					_$_.push_component();

					{
						const comp = MultiRootChild;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				}
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}