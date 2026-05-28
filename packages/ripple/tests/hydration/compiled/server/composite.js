// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function Layout(__props) {
	_$_.push_component();

	var __r = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="layout"');
		_$_.output_push('>');

		{
			_$_.render_expression(__props.children);
		}

		_$_.output_push('</div>');
	});

	__r = true;
	_$_.pop_component();
}

export function TextWrappedLayout(__props) {
	_$_.push_component();

	var __r_1 = false;

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

	__r_1 = true;
	_$_.pop_component();
}

export function SingleChild() {
	_$_.push_component();

	var __r_2 = false;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="single"');
		_$_.output_push('>');

		{
			_$_.output_push('single');
		}

		_$_.output_push('</div>');
	});

	__r_2 = true;
	_$_.pop_component();
}

export function MultiRootChild() {
	_$_.push_component();

	var __r_3 = false;

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

	__r_3 = true;
	_$_.pop_component();
}

export function EmptyLayout() {
	_$_.push_component();

	var __r_4 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;
			const args = [{}];

			comp(...args);
		}
	});

	__r_4 = true;
	_$_.pop_component();
}

export function LayoutWithSingleChild() {
	_$_.push_component();

	var __r_5 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_6 = false;

						{
							const comp = SingleChild;
							const args = [{}];

							comp(...args);
						}

						__r_6 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_5 = true;
	_$_.pop_component();
}

export function LayoutWithMultipleChildren() {
	_$_.push_component();

	var __r_7 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_8 = false;

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
						__r_8 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_7 = true;
	_$_.pop_component();
}

export function LayoutWithMultiRootChild() {
	_$_.push_component();

	var __r_9 = false;

	_$_.regular_block(() => {
		{
			const comp = Layout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_10 = false;

						{
							const comp = MultiRootChild;
							const args = [{}];

							comp(...args);
						}

						__r_10 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_9 = true;
	_$_.pop_component();
}

export function LayoutWithTextAroundChildren() {
	_$_.push_component();

	var __r_11 = false;

	_$_.regular_block(() => {
		{
			const comp = TextWrappedLayout;

			const args = [
				{
					children: _$_.tsrx_element(function render_children() {
						_$_.push_component();

						var __r_12 = false;

						{
							const comp = SingleChild;
							const args = [{}];

							comp(...args);
						}

						__r_12 = true;
						_$_.pop_component();
					})
				}
			];

			comp(...args);
		}
	});

	__r_11 = true;
	_$_.pop_component();
}