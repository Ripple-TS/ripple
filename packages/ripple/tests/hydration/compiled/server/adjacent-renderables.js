// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

function Pair(props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(props.first.value);
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(props.second.value);
			}

			__out += '</section>';
			_$_.output_push(__out);
		});
	});
}

export function AdjacentRenderableProps() {
	return _$_.tsrx_element(() => {
		const first = _$_.track(
			_$_.tsrx_element(() => {
				_$_.regular_block(() => {
					let __out = '';

					__out += '<i>one</i>';
					_$_.output_push(__out);
				});
			}),
			'1dcwkoa'
		);

		const second = _$_.track(
			_$_.tsrx_element(() => {
				_$_.regular_block(() => {
					let __out = '';

					__out += '<b>two</b>';
					_$_.output_push(__out);
				});
			}),
			'x8qdcf'
		);

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Pair;
				const args = [{ first, second }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<button>update</button>';
			_$_.output_push(__out);
		});
	});
}

export function MixedRenderableValues() {
	return _$_.tsrx_element(() => {
		const first = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				let __out = '';

				__out += '<i>one</i>';
				_$_.output_push(__out);
			});
		});

		const second = _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				let __out = '';

				__out += '<b>two</b>';
				_$_.output_push(__out);
			});
		});

		const values = [first, null, '&', second, undefined];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>before:';
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(first);
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(second);
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(values);
			__out += '&lt;after</section>';
			_$_.output_push(__out);
		});
	});
}