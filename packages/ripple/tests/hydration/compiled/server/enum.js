// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

var Stage = (function (Stage) {
	Stage[Stage['Ready'] = 2] = 'Ready';
	Stage['Label'] = 'ready';

	return Stage;
})(Stage || (Stage = {}));

export function EnumValues() {
	return _$_.tsrx_element(() => {
		var Local = (function (Local) {
			Local[Local['First'] = 5] = 'First';
			Local[Local['Second'] = 6] = 'Second';

			return Local;
		})(Local || (Local = {}));

		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="enum-number">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(Stage.Ready);
			}

			__out += '</span><span class="enum-string">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(Stage.Label);
			}

			__out += '</span><span class="enum-local">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(Local.Second);
			}

			__out += '</span>';
			_$_.output_push(__out);
		});
	});
}