// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Nested({ tag, ...attrs }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.dynamic_element(tag, { id: "record", ...attrs });
			}

			__out += '</section>';
			_$_.output_push(__out);
		});
	});
}

export function Siblings() {
	return _$_.tsrx_element(() => {
		const tag = _$_.track('div', '14vn3vw');
		const count = _$_.track(0, 'srt8pa');
		const input = 'input';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><b>before</b>';
			_$_.output_push(__out);
			__out = '';

			_$_.dynamic_element(tag.value, {
				id: "record",
				'data-count': count.value,
				innerHTML: `<em>${count.value}</em>`
			});

			_$_.output_push(__out);
			__out = '';
			_$_.dynamic_element(input, { id: "field", value: `value-${count.value}` });
			__out += '<button>update</button><button>replace</button><p>after</p></section>';
			_$_.output_push(__out);
		});
	});
}

function Child({ value }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value);
			}

			__out += '</span><strong>child</strong>';
			_$_.output_push(__out);
		});
	});
}

export function ComponentTarget() {
	return _$_.tsrx_element(() => {
		const tag = Child;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section>';
			_$_.output_push(__out);
			__out = '';
			_$_.dynamic_element(tag, { value: "component" });
			__out += '<p>after</p></section>';
			_$_.output_push(__out);
		});
	});
}

export function Root() {
	return _$_.tsrx_element(() => {
		const tag = 'div';

		_$_.regular_block(() => {
			let __out = '';

			_$_.output_push(__out);
			__out = '';
			_$_.dynamic_element(tag, { id: "record", innerHTML: "root" });
			__out += '<p>after</p>';
			_$_.output_push(__out);
		});
	});
}

export function Svg() {
	return _$_.tsrx_element(() => {
		const tag = 'circle';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<svg>';
			_$_.output_push(__out);
			__out = '';
			_$_.dynamic_element(tag, { id: "record", r: "5" });
			__out += '<rect width="10" height="10"></rect></svg>';
			_$_.output_push(__out);
		});
	});
}