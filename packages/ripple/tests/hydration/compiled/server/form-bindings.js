// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	bindChecked,
	bindFiles,
	bindGroup,
	bindIndeterminate,
	bindValue,
	track
} from 'ripple/server';

function binding(bind, value, accessors) {
	return accessors
		? bind(() => value.value, (next) => value.value = next)
		: bind(value);
}

export function Checkbox({ initial = false, seeded = false, accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'zrc2h5');
		const ref = binding(bindChecked, value, accessors);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			if (seeded) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);
				__out += '<input type="checkbox" checked />';
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(1);
				__out += '<input type="checkbox" />';
			}

			__out += '<!--]--><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>toggle</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function MixedCheckbox({ initial = true, accessors = false }) {
	return _$_.tsrx_element(() => {
		const checked = _$_.track(false, '1k51omq');
		const indeterminate = _$_.track(initial, '1dddeo5');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input type="checkbox" /><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify([checked.value, indeterminate.value]));
			}

			__out += '</output><button>toggle</button></div>';
			_$_.output_push(__out);
		});
	});
}

function LastCheckbox({ ref }) {
	return _$_.tsrx_element(() => {
		let __out = '';

		__out += '<input type="checkbox" checked value="c" />';
		_$_.output_push(__out);
	});
}

export function CheckboxGroup({ initial = ['a', 'c'], accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'mcl3up');
		const ref = binding(bindGroup, value, accessors);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input type="checkbox" checked value="a" /><input type="checkbox" value="b" />';

			{
				const comp = LastCheckbox;
				const args = [{ ref }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function RadioGroup({ initial = 'b', accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, '1owve6m');
		const ref = binding(bindGroup, value, accessors);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input type="radio" name="choice" value="a" /><input type="radio" name="choice" checked value="b" /><input type="radio" name="choice" value="c" /><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function Select({ initial = 2, size = 0, accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'fhbif6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><select' + _$_.attr('size', size, false);
			_$_.output_push(__out);
			__out = '';

			_$_.content_editable(
				() => {
					let __out = '';

					__out += '<option disabled value="0">Disabled</option><optgroup disabled label="Disabled group"><option' + _$_.attr('value', -1, false) + '>Disabled child</option></optgroup><option value="1">One</option><option value="2">Two</option><option value="3">Three</option>';
					_$_.output_push(__out);
				},
				void 0
			);

			__out += '</select><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function SeededSelect({ initial = 'b', accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'h4hak3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><select';
			_$_.output_push(__out);
			__out = '';

			_$_.content_editable(
				() => {
					let __out = '';

					__out += '<option value="a">A</option><option selected value="b">B</option><option value="c">C</option>';
					_$_.output_push(__out);
				},
				void 0
			);

			__out += '</select><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function MultiSelect({ initial = ['a', 'c'], accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, '1u2cfy7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><select multiple';
			_$_.output_push(__out);
			__out = '';

			_$_.content_editable(
				() => {
					let __out = '';

					__out += '<option selected value="a">A</option><option value="b">B</option><option selected value="c">C</option>';
					_$_.output_push(__out);
				},
				void 0
			);

			__out += '</select><output>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(JSON.stringify(value.value));
			}

			__out += '</output><button>reset</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function Files({ initial = null, next = null, accessors = false }) {
	return _$_.tsrx_element(() => {
		const value = _$_.track(initial, 'kqa7zz');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input type="file" multiple /><output>';

			{
				_$_.output_push(__out);
				__out = '';

				_$_.render_expression(value.value
					? Array.from(value.value, (file) => file.name).join(',')
					: 'none');
			}

			__out += '</output><button>update</button></div>';
			_$_.output_push(__out);
		});
	});
}