// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Portal, track } from 'ripple/server';

export function SimplePortal() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<h1');
			_$_.output_push('>');

			{
				_$_.output_push('Main Content');
			}

			_$_.output_push('</h1>');

			{
				const comp = Portal;

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(function render_children() {
							_$_.push_component();
							_$_.output_push('<div');
							_$_.output_push(' class="portal-content"');
							_$_.output_push('>');

							{
								_$_.output_push('Portal content');
							}

							_$_.output_push('</div>');
							_$_.pop_component();
						})
					}
				];

				if (comp) {
					comp(...args);
				}
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ConditionalPortal() {
	_$_.push_component();

	let lazy = _$_.track(true);

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<button');
			_$_.output_push(' class="toggle"');
			_$_.output_push('>');

			{
				_$_.output_push('Toggle');
			}

			_$_.output_push('</button>');
			_$_.output_push('<!--[-->');

			if (_$_.get(lazy)) {
				{
					const comp = Portal;

					const args = [
						{
							target: typeof document !== 'undefined' ? document.body : null,
							children: _$_.tsrx_element(function render_children() {
								_$_.push_component();
								_$_.output_push('<div');
								_$_.output_push(' class="portal-content"');
								_$_.output_push('>');

								{
									_$_.output_push('Portal is visible');
								}

								_$_.output_push('</div>');
								_$_.pop_component();
							})
						}
					];

					if (comp) {
						comp(...args);
					}
				}
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function PortalWithMainContent() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="main-content"');
			_$_.output_push('>');

			{
				_$_.output_push('Main page content');
			}

			_$_.output_push('</div>');

			{
				const comp = Portal;

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(function render_children() {
							_$_.push_component();
							_$_.output_push('<div');
							_$_.output_push(' class="portal-content"');
							_$_.output_push('>');

							{
								_$_.output_push('Modal content');
							}

							_$_.output_push('</div>');
							_$_.pop_component();
						})
					}
				];

				if (comp) {
					comp(...args);
				}
			}

			_$_.output_push('<div');
			_$_.output_push(' class="footer"');
			_$_.output_push('>');

			{
				_$_.output_push('Footer');
			}

			_$_.output_push('</div>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function NestedContentWithPortal() {
	_$_.push_component();

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="outer"');
		_$_.output_push('>');

		{
			_$_.output_push('<div');
			_$_.output_push(' class="inner"');
			_$_.output_push('>');

			{
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push('Nested content');
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('</div>');

			{
				const comp = Portal;

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(function render_children() {
							_$_.push_component();
							_$_.output_push('<div');
							_$_.output_push(' class="portal-content"');
							_$_.output_push('>');

							{
								_$_.output_push('Portal content');
							}

							_$_.output_push('</div>');
							_$_.pop_component();
						})
					}
				];

				if (comp) {
					comp(...args);
				}
			}
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}