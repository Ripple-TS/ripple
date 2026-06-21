// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Portal, track } from 'ripple/server';

export function SimplePortal() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><h1>Main Content</h1>';

			{
				const comp = Portal;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="portal-content">Portal content</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				if (comp) {
					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function ConditionalPortal() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '4f6df174');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><button class="toggle">Toggle</button><!--[-->';

			if (lazy.value) {
				{
					const comp = Portal;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							target: typeof document !== 'undefined' ? document.body : null,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<div class="portal-content">Portal is visible</div>';
									_$_.output_push(__out);
								});
							})
						}
					];

					if (comp) {
						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}
				}
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function PortalWithMainContent() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><div class="main-content">Main page content</div>';

			{
				const comp = Portal;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="portal-content">Modal content</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				if (comp) {
					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '<div class="footer">Footer</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedContentWithPortal() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><div class="inner"><span>Nested content</span></div>';

			{
				const comp = Portal;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						target: typeof document !== 'undefined' ? document.body : null,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div class="portal-content">Portal content</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				if (comp) {
					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}