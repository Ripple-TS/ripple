// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function Layout(__output, __props) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="layout"');
	__output.push('>');

	{
		_$_.render_expression(__output, __props.children);
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function TextWrappedLayout(__output, __props) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="layout"');
	__output.push('>');

	{
		__output.push('before');
		_$_.render_expression(__output, __props.children);
		__output.push('after');
	}

	__output.push('</div>');
	_$_.pop_component();
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
				children: _$_.ripple_element(function render_children(__output) {
					_$_.push_component();

					{
						const comp = SingleChild;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				})
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
				children: _$_.ripple_element(function render_children(__output) {
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
				})
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
				children: _$_.ripple_element(function render_children(__output) {
					_$_.push_component();

					{
						const comp = MultiRootChild;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				})
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}

export function LayoutWithTextAroundChildren(__output) {
	_$_.push_component();

	{
		const comp = TextWrappedLayout;

		const args = [
			__output,
			{
				children: _$_.ripple_element(function render_children(__output) {
					_$_.push_component();

					{
						const comp = SingleChild;
						const args = [__output, {}];

						comp(...args);
					}

					_$_.pop_component();
				})
			}
		];

		comp(...args);
	}

	_$_.pop_component();
}