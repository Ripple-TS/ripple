// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function GuardReturnRenders() {
	return _$_.tsrx_element(() => {
		var return_guard = false;
		const ready = true;

		if (!ready) {
			return null;
		}

		_$_.regular_block(() => {
			_$_.output_push('<!--[-->');

			if (!return_guard) {
				_$_.output_push('<div');
				_$_.output_push(' class="ready"');
				_$_.output_push('>');

				{
					_$_.output_push('ready');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		});
	});
}

export function GuardReturnNull() {
	return _$_.tsrx_element(() => {
		var return_guard = false;
		const ready = false;

		if (!ready) {
			return null;
		}

		_$_.regular_block(() => {
			_$_.output_push('<!--[-->');

			if (!return_guard) {
				_$_.output_push('<div');
				_$_.output_push(' class="ready"');
				_$_.output_push('>');

				{
					_$_.output_push('ready');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		});
	});
}

export function StringReturn() {
	return 'hello';
}