// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Portal, track } from 'ripple/server';

export function SimplePortal() {
	return _$_.tsrx_element(() => {
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
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.output_push('<div');
									_$_.output_push(' class="portal-content"');
									_$_.output_push('>');

									{
										_$_.output_push('Portal content');
									}

									_$_.output_push('</div>');
								});
							})
						}
					];

					if (comp) {
						_$_.render_component(comp, ...args);
					}
				}
			}

			_$_.output_push('</div>');
		});
	});
}

export function ConditionalPortal() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(true, '4f6df174');

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

				if (lazy.value) {
					{
						const comp = Portal;

						const args = [
							{
								target: typeof document !== 'undefined' ? document.body : null,
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										_$_.output_push('<div');
										_$_.output_push(' class="portal-content"');
										_$_.output_push('>');

										{
											_$_.output_push('Portal is visible');
										}

										_$_.output_push('</div>');
									});
								})
							}
						];

						if (comp) {
							_$_.render_component(comp, ...args);
						}
					}
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</div>');
		});
	});
}

export function PortalWithMainContent() {
	return _$_.tsrx_element(() => {
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
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.output_push('<div');
									_$_.output_push(' class="portal-content"');
									_$_.output_push('>');

									{
										_$_.output_push('Modal content');
									}

									_$_.output_push('</div>');
								});
							})
						}
					];

					if (comp) {
						_$_.render_component(comp, ...args);
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
	});
}

export function NestedContentWithPortal() {
	return _$_.tsrx_element(() => {
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
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									_$_.output_push('<div');
									_$_.output_push(' class="portal-content"');
									_$_.output_push('>');

									{
										_$_.output_push('Portal content');
									}

									_$_.output_push('</div>');
								});
							})
						}
					];

					if (comp) {
						_$_.render_component(comp, ...args);
					}
				}
			}

			_$_.output_push('</div>');
		});
	});
}