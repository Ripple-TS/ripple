// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

var Stage;

(function (enum_value) {
	enum_value[enum_value['Ready'] = 2] = 'Ready';
	enum_value['Label'] = 'ready';
})(Stage || (Stage = {}));

export function EnumValues() {
	return _$_.tsrx_element(() => {
		const values = [];

		for (let i = 0; i < 2; i++) {
			let Stage;

			(function (enum_value_1) {
				enum_value_1[enum_value_1['Value'] = i] = 'Value';
			})(Stage || (Stage = {}));

			values.push(() => Stage.Value);
		}

		let Local;

		(function (enum_value_2) {
			enum_value_2[enum_value_2['First'] = 5] = 'First';
			enum_value_2[enum_value_2['Second'] = 6] = 'Second';
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

			__out += '</span><span class="enum-scopes">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(values.map((read) => read()).join(','));
			}

			__out += '</span>';
			_$_.output_push(__out);
		});
	});
}