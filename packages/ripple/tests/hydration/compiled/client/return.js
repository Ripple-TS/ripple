// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="ready">ready</div>`, 0);
var root = _$_.template(`<!><!>`, 1, 2);
var root_3 = _$_.template(`<div class="ready">ready</div>`, 0);
var root_2 = _$_.template(`<!><!>`, 1, 2);

export function GuardReturnRenders() {
	return _$_.tsrx_element((__anchor, __block) => {
		var return_guard = false;
		const ready = true;
		var fragment = root();
		var node = _$_.first_child_frag(fragment);

		{
			_$_.if(node, (__render) => {
				return_guard = false;

				if (!ready) return_guard = true;
			});
		}

		var node_1 = _$_.sibling(node);

		var content = (__anchor) => {
			var div_1 = root_1();

			_$_.append(__anchor, div_1);
		};

		_$_.if(node_1, (__render) => {
			if (!return_guard) __render(content);
		});

		_$_.append(__anchor, fragment);
	});
}

export function GuardReturnNull() {
	return _$_.tsrx_element((__anchor, __block) => {
		var return_guard = false;
		const ready = false;
		var fragment_1 = root_2();
		var node_2 = _$_.first_child_frag(fragment_1);

		{
			_$_.if(node_2, (__render) => {
				return_guard = false;

				if (!ready) return_guard = true;
			});
		}

		var node_3 = _$_.sibling(node_2);

		var content_1 = (__anchor) => {
			var div_2 = root_3();

			_$_.append(__anchor, div_2);
		};

		_$_.if(node_3, (__render) => {
			if (!return_guard) __render(content_1);
		});

		_$_.append(__anchor, fragment_1);
	});
}

export function StringReturn() {
	return 'hello';
}