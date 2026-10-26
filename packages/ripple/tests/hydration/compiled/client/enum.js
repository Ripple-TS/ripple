// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<span class=enum-number> </span><span class=enum-string> </span><span class=enum-local> </span><span class=enum-scopes> `, 1, 4);
var root = _$_.template(`<!>`, 1, 1);

function EnumValues_render(__anchor, __block) {
	const values = [];

	for (let i = 0; i < 2; i++) {
		let Stage;

		(function (enum_value_1) {
			enum_value_1[enum_value_1['Value'] = i] = 'Value';
		})(Stage || (Stage = {}));

		_$_.with_scope(__block, () => values.push(() => Stage.Value));
	}

	let Local;

	(function (enum_value_2) {
		enum_value_2[enum_value_2['First'] = 5] = 'First';
		enum_value_2[enum_value_2['Second'] = 6] = 'Second';
	})(Local || (Local = {}));

	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
		var fragment_1 = root_1();
		var span = _$_.first_child_frag(fragment_1);

		{
			var expression = _$_.hydrating ? _$_.hydrate_child() : span.firstChild;

			_$_.expression(expression, () => Stage.Ready);
			_$_.hydrating && _$_.pop(span);
		}

		var span_1 = _$_.hydrating ? _$_.hydrate_sibling() : span.nextSibling;

		{
			var expression_1 = _$_.hydrating ? _$_.hydrate_child() : span_1.firstChild;

			_$_.expression(expression_1, () => Stage.Label);
			_$_.hydrating && _$_.pop(span_1);
		}

		var span_2 = _$_.hydrating ? _$_.hydrate_sibling() : span_1.nextSibling;

		{
			var expression_2 = _$_.hydrating ? _$_.hydrate_child() : span_2.firstChild;

			_$_.expression(expression_2, () => Local.Second);
			_$_.hydrating && _$_.pop(span_2);
		}

		var span_3 = _$_.hydrating ? _$_.hydrate_sibling() : span_2.nextSibling;

		{
			var expression_3 = _$_.hydrating ? _$_.hydrate_child() : span_3.firstChild;

			_$_.expression(expression_3, () => _$_.with_scope(__block, () => values.map((read) => _$_.with_scope(__block, read)).join(',')));
			_$_.hydrating && _$_.pop(span_3);
		}

		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

EnumValues[_$_.$r] = EnumValues_render;

var Stage;

(function (enum_value) {
	enum_value[enum_value['Ready'] = 2] = 'Ready';
	enum_value['Label'] = 'ready';
})(Stage || (Stage = {}));

export function EnumValues() {
	return _$_.tsrx_element(EnumValues_render);
}