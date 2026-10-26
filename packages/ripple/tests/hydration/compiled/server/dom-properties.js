// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function Dialog({ managed = false }) {
	return _$_.tsrx_element(() => {
		const version = _$_.track(0, '18zhp6i');
		const open = _$_.track(false, '1nw4vc3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<dialog' + _$_.attr('open', managed ? open.value : undefined, true);

			const spread_attrs = { ...{ class: 'v' + version.value } };

			__out += _$_.spread_attrs(spread_attrs) + '>';
			_$_.output_push(__out);
			__out = '';

			const spread_inner_html = _$_.spread_inner_html(spread_attrs);

			if (spread_inner_html !== void 0) {
				__out += spread_inner_html;
			} else {
				__out += '<button>Update</button><button>Toggle</button>';
			}

			__out += '</dialog>';
			_$_.output_push(__out);
		});
	});
}

export function ManagedDialog() {
	return _$_.tsrx_element(() => {
		{
			const comp = Dialog;
			const args = [{ managed: true }];

			_$_.render_component(comp, ...args);
		}
	});
}