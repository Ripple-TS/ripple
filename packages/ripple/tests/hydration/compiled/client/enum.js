// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<span class=enum-number> </span><span class=enum-string> </span><span class=enum-local> `, 1, 3);
var root = _$_.template(`<!>`, 1, 1);

function EnumValues_render(__anchor, __block) {
	var Local = _$_.with_scope(__block, () => (function (Local) {
		Local[Local['First'] = 5] = 'First';
		Local[Local['Second'] = 6] = 'Second';

		return Local;
	})(Local || (Local = {})));

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

		_$_.append(__anchor, fragment_1);
	}));

	_$_.append(__anchor, fragment);
}

EnumValues[_$_.$r] = EnumValues_render;

var Stage = (function (Stage) {
	Stage[Stage['Ready'] = 2] = 'Ready';
	Stage['Label'] = 'ready';

	return Stage;
})(Stage || (Stage = {}));

export function EnumValues() {
	return _$_.tsrx_element(EnumValues_render);
}