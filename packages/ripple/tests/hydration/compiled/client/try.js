// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<!>`, 1, 1);
var root_2 = _$_.template(`<p class="loading">loading...</p>`, 0);
var root = _$_.template(`<!>`, 1, 1);
var root_4 = _$_.template(`<li> </li>`, 0);
var root_3 = _$_.template(`<ul class="items"></ul>`, 0);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<div class="loading">loading async content</div>`, 0);
var root_5 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_8 = _$_.template(`<div class="resolved"> </div>`, 0);

export function AsyncListInTryPending(__anchor, _, __block) {
	_$_.push_component();

	var fragment = root();
	var node = _$_.first_child_frag(fragment);

	_$_.try(
		node,
		(__anchor) => {
			_$_.async(async () => {
				var fragment_1 = root_1();
				var node_1 = _$_.first_child_frag(fragment_1);

				AsyncList(node_1, {}, _$_.active_block);
				_$_.append(__anchor, fragment_1);
			});
		},
		null,
		(__anchor) => {
			var p_1 = root_2();

			_$_.append(__anchor, p_1);
		}
	);

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

function AsyncList(__anchor, _, __block) {
	_$_.async(async () => {
		_$_.push_component();

		let items = (await _$_.maybe_tracked(_$_.with_scope(__block, async () => Promise.resolve(['alpha', 'beta', 'gamma']))))();

		if (_$_.aborted()) return;

		var ul_1 = root_3();

		{
			_$_.for(
				ul_1,
				() => items,
				(__anchor, item) => {
					var li_1 = root_4();

					{
						var text = _$_.child(li_1, true);

						text.nodeValue = item;
						_$_.pop(li_1);
					}

					_$_.append(__anchor, li_1);
				},
				4
			);

			_$_.pop(ul_1);
		}

		_$_.append(__anchor, ul_1);
		_$_.pop_component();
	});
}

export function AsyncTryWithLeadingSibling(__anchor, _, __block) {
	_$_.push_component();

	var fragment_2 = root_5();
	var div_1 = _$_.first_child_frag(fragment_2);
	var node_2 = _$_.sibling(div_1);

	_$_.try(
		node_2,
		(__anchor) => {
			_$_.async(async () => {
				var fragment_3 = root_6();
				var node_3 = _$_.first_child_frag(fragment_3);

				AsyncContent(node_3, {}, _$_.active_block);
				_$_.append(__anchor, fragment_3);
			});
		},
		null,
		(__anchor) => {
			var div_2 = root_7();

			_$_.append(__anchor, div_2);
		}
	);

	_$_.append(__anchor, fragment_2);
	_$_.pop_component();
}

function AsyncContent(__anchor, _, __block) {
	_$_.async(async () => {
		_$_.push_component();

		let value = (await _$_.maybe_tracked(_$_.with_scope(__block, async () => Promise.resolve('ready'))))();

		if (_$_.aborted()) return;

		var div_3 = root_8();

		{
			var text_1 = _$_.child(div_3, true);

			text_1.nodeValue = value;
			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
		_$_.pop_component();
	});
}