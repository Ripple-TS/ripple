// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="typed-run"> <span>tail</span></div><p class="typed-number"> </p><button>update</button>`, 1, 3);
var root = _$_.template(`<!>`, 1, 1);

import { track } from 'ripple';

export function TypedText() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track({ label: '<first>', count: 2 }, __block, '9bf2304a');
		var fragment = root();
		var node = _$_.first_child_frag(fragment);

		_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_1();
			var div = _$_.first_child_frag(fragment_1);

			{
				var expression = _$_.hydrating ? _$_.hydrate_child(true) : div.firstChild;

				_$_.pop(div);
			}

			var p = _$_.hydrating ? _$_.hydrate_sibling() : div.nextSibling;

			{
				var expression_1 = _$_.hydrating ? _$_.hydrate_text() : p.firstChild;
			}

			var button = _$_.hydrating ? _$_.hydrate_sibling() : p.nextSibling;

			button.__click = () => {
				_$_.set(lazy, { label: '&next', count: 3n });
			};

			_$_.render(
				(__prev) => {
					var __a = 'value: ' + (lazy.value.label + String(lazy.value.count ?? ''));

					if (__prev.a !== __a) {
						_$_.set_text(expression, __prev.a = __a);
					}

					var __b = (0, lazy.value.count);

					if (__prev.b !== __b) {
						_$_.set_text(expression_1, __prev.b = __b);
					}
				},
				{ a: ' ', b: ' ' }
			);

			_$_.append(__anchor, fragment_1);
		}));

		_$_.append(__anchor, fragment);
	});
}

_$_.delegate(['click']);