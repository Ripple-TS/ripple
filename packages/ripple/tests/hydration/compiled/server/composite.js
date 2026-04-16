// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function Layout(__props) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			_$_.render_expression(__props.children);
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function TextWrappedLayout(__props) {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			_$_.output_push('before');
			_$_.render_expression(__props.children);
			_$_.output_push('after');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function SingleChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="single"');
		_$_.output_push('>');

		{
			_$_.output_push('single');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function MultiRootChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<h1');
		_$_.output_push('>');

		{
			_$_.output_push('title');
		}

		_$_.output_push('</h1>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<p');
		_$_.output_push('>');

		{
			_$_.output_push('description');
		}

		_$_.output_push('</p>');
	});

	_$_.pop_component();
}

export function EmptyLayout() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Layout;
			const args = [{}];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function LayoutWithSingleChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();

						{
							const comp = SingleChild;
							const args = [{}];

							comp(...args);
						}

						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function LayoutWithMultipleChildren() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();

						{
							const comp = SingleChild;
							const args = [{}];

							comp(...args);
						}

						_$_.output_push('<div');
						_$_.output_push(' class="extra"');
						_$_.output_push('>');

						{
							_$_.output_push('extra');
						}

						_$_.output_push('</div>');
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function LayoutWithMultiRootChild() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();

						{
							const comp = MultiRootChild;
							const args = [{}];

							comp(...args);
						}

						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}

export function LayoutWithTextAroundChildren() {
	_$_.push_component();

	_$_.regular_block(() => {
		{
			const comp = TextWrappedLayout;

			const args = [
				{
					children: _$_.ripple_element(function render_children() {
						_$_.push_component();

						{
							const comp = SingleChild;
							const args = [{}];

							comp(...args);
						}

						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	_$_.pop_component();
}