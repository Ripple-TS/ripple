// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

function Row() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span data-row="">first</span>';
			_$_.output_push(__out);
		});
	});
}

export function Empty() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!---->';
			_$_.output_push(__out);
		});
	});
}

export function TrailingInElement() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				{
					const comp = Row;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

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

export function TrailingInFragment() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Row;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function LeadingInElement() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				{
					const comp = Empty;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Row;
					const args = [{}];

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

export function LeadingInFragment() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Row;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function ConsecutiveInElement() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				{
					const comp = Empty;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Row;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

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

export function ConsecutiveInFragment() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Row;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Empty;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function BetweenStaticSiblings() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><span data-row="">first</span>';

			{
				const comp = Empty;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<b>last</b></div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedEmpty() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!---->';
			_$_.output_push(__out);
		});
	});
}

export function ToggleEmpty() {
	return _$_.tsrx_element(() => {
		const show = _$_.track(true, '49n4iv');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>toggle</button>';

			{
				const comp = Row;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<!--[-->';

			if (show.value) {
				{
					const comp = Empty;
					const args = [{}];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			} else {
				__out += '<b>child</b>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}