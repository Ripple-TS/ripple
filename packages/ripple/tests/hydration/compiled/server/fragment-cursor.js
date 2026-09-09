// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

function Leaf() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<i class="leaf">leaf</i>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingNavigatedElements() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(0, 'a695c021');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(lazy.value) + '</div><button class="inc">inc</button><button class="dec">dec</button>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingStaticNavigatedElements() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(0, '0afd9398');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><button class="inc">inc</button><button class="dec">dec</button>';
			_$_.output_push(__out);
		});
	});
}

export function NavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track(0, '3cea07db');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><button class="inc">inc</button><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function LeadingNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(0, '8ca89613');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="inc">inc</button><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingNestedNavigated() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track(0, 'f0f5a337');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><div class="wrap"><button class="inc">inc</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_5 = _$_.track(0, '2a6293f9');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrap"><button class="inc">inc</button></div><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_6 = _$_.track(0, 'db93f6f0');

		_$_.regular_block(() => {
			let __out = '';

			__out += _$_.escape(lazy_6.value) + '<div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenTrackedText() {
	return _$_.tsrx_element(() => {
		let lazy_7 = _$_.track(0, '84cf2507');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div>' + _$_.escape(lazy_7.value);
			_$_.output_push(__out);
		});
	});
}

export function StaticNestedThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="wrap"><span>x</span></div><div class="b">b</div><div class="c">c</div>';
			_$_.output_push(__out);
		});
	});
}

export function AllStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div><div class="c">c</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingDynamicChild() {
	return _$_.tsrx_element(() => {
		let lazy_8 = _$_.track(0, '9be343a7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="count">' + _$_.escape(lazy_8.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function DynamicChildThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_9 = _$_.track(0, 'c76dd5a9');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(lazy_9.value) + '</div><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function IfThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_10 = _$_.track(0, 'fb175ecd');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (lazy_10.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenIf() {
	return _$_.tsrx_element(() => {
		let lazy_11 = _$_.track(0, 'c8563a58');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div><!--[-->';

			if (lazy_11.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function CompThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenComp() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div>';

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			_$_.output_push(__out);
		});
	});
}

export function SiblingComps() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Leaf;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Leaf;
					const args = [{}];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function WrapTrailingNavigatedElements() {
	return _$_.tsrx_element(() => {
		let lazy_12 = _$_.track(0, '1032dbec');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrailingNavigatedElements;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_12.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingStaticNavigatedElements() {
	return _$_.tsrx_element(() => {
		let lazy_13 = _$_.track(0, 'c2e2a938');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrailingStaticNavigatedElements;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_13.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_14 = _$_.track(0, 'b4046e87');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = NavigatedThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_14.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapLeadingNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_15 = _$_.track(0, 'bed7f7ef');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = LeadingNavigatedThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_15.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingNestedNavigated() {
	return _$_.tsrx_element(() => {
		let lazy_16 = _$_.track(0, 'eddbe7bc');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrailingNestedNavigated;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_16.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNestedNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_17 = _$_.track(0, '1bdc4523');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = NestedNavigatedThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_17.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_18 = _$_.track(0, '97e02c24');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrackedTextThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_18.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenTrackedText() {
	return _$_.tsrx_element(() => {
		let lazy_19 = _$_.track(0, 'd5526861');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticThenTrackedText;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_19.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticNestedThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_20 = _$_.track(0, '7e2d3fad');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticNestedThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_20.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapAllStatic() {
	return _$_.tsrx_element(() => {
		let lazy_21 = _$_.track(0, 'b894f45a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = AllStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_21.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingDynamicChild() {
	return _$_.tsrx_element(() => {
		let lazy_22 = _$_.track(0, '038446ca');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrailingDynamicChild;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_22.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapDynamicChildThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_23 = _$_.track(0, '3ec460c3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = DynamicChildThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_23.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_24 = _$_.track(0, '95b417dd');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = IfThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_24.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenIf() {
	return _$_.tsrx_element(() => {
		let lazy_25 = _$_.track(0, '1f01fa6f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticThenIf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_25.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapCompThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_26 = _$_.track(0, 'e6bdb91d');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = CompThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_26.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenComp() {
	return _$_.tsrx_element(() => {
		let lazy_27 = _$_.track(0, '89d5704c');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticThenComp;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_27.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSiblingComps() {
	return _$_.tsrx_element(() => {
		let lazy_28 = _$_.track(0, 'c5c51af6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = SiblingComps;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_28.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function UntrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		const label = 'label';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(label.toUpperCase());
			__out += '<div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function NestedFragmentThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><span class="x">x</span><span class="y">y</span><div class="b">b</div><div class="c">c</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingNestedFragment() {
	return _$_.tsrx_element(() => {
		let lazy_29 = _$_.track(0, '82cbc65f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(lazy_29.value) + '</div><span class="x">x</span><button class="inc">inc</button>';
			_$_.output_push(__out);
		});
	});
}

export function ForThenStatic() {
	return _$_.tsrx_element(() => {
		const items = [1, 2];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			for (const item of items) {
				__out += '<b class="item">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</b>';
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_30 = _$_.track(0, '800f9ff3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			switch (lazy_30.value) {
				case 0:
					__out += '<b class="zero">zero</b>';
					break;

				default:
					__out += '<b class="other">other</b>';
					break;
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function TryThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[--><b class="try">try</b><!--]-->';
					_$_.output_push(__out);
				},
				(e) => {
					let __out = '';

					__out += '<!--[--><b class="catch">catch</b><!--]-->';
					_$_.output_push(__out);
				},
				null
			);

			__out += '<div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function StyleThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<style>' + _$_.escape(`.styled { color: red; }`) + '</style><div class="styled a">a</div><div class="styled b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function CollectionThenStatic() {
	return _$_.tsrx_element(() => {
		const items = [1, 2];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';
			_$_.output_push(__out);
			__out = '';

			_$_.render_expression(items.map((item) => _$_.tsrx_element(() => {
				let __out = '';

				__out += '<b class="item">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</b>';
				_$_.output_push(__out);
			})));

			__out += '<div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function InlineElementThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';
			_$_.output_push(__out);
			__out = '';

			_$_.render_expression(_$_.tsrx_element(() => {
				let __out = '';

				__out += '<b class="inline">inline</b>';
				_$_.output_push(__out);
			}));

			__out += '<div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function WrapUntrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_31 = _$_.track(0, '3a78abea');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = UntrackedTextThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_31.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNestedFragmentThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_32 = _$_.track(0, 'db289d00');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = NestedFragmentThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_32.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingNestedFragment() {
	return _$_.tsrx_element(() => {
		let lazy_33 = _$_.track(0, 'bb509235');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TrailingNestedFragment;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_33.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapForThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_34 = _$_.track(0, 'a715e40a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = ForThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_34.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSwitchThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_35 = _$_.track(0, 'a598ad9f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = SwitchThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_35.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTryThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_36 = _$_.track(0, '1030b116');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = TryThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_36.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStyleThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_37 = _$_.track(0, 'f35d8716');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StyleThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_37.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapCollectionThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_38 = _$_.track(0, 'b1e7a298');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = CollectionThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_38.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapInlineElementThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_39 = _$_.track(0, 'df10dc38');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = InlineElementThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_39.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfOnly() {
	return _$_.tsrx_element(() => {
		let lazy_40 = _$_.track(0, 'c6afe814');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (lazy_40.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfThenOne() {
	return _$_.tsrx_element(() => {
		let lazy_41 = _$_.track(0, 'c3b63525');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (lazy_41.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><div class="a">a</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SingleRootWithIf() {
	return _$_.tsrx_element(() => {
		let lazy_42 = _$_.track(0, '63d962e3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="root"><!--[-->';

			if (lazy_42.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfOnly() {
	return _$_.tsrx_element(() => {
		let lazy_43 = _$_.track(0, '83c8f19d');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = IfOnly;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_43.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfThenOne() {
	return _$_.tsrx_element(() => {
		let lazy_44 = _$_.track(0, '2cee9a57');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = IfThenOne;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_44.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSingleRootWithIf() {
	return _$_.tsrx_element(() => {
		let lazy_45 = _$_.track(0, 'c179a57b');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = SingleRootWithIf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_45.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function ExprThenSiblingInDiv() {
	return _$_.tsrx_element(() => {
		let lazy_46 = _$_.track(0, 'db1d59ee');
		const label = 'label';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(label.toUpperCase());
			__out += '<span class="after">' + _$_.escape(lazy_46.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfTwoThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_47 = _$_.track(0, 'd8310b12');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (lazy_47.value >= 0) {
				__out += '<b class="if">x</b><i class="if2">y</i>';
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfTwoInDiv() {
	return _$_.tsrx_element(() => {
		let lazy_48 = _$_.track(0, '0c602c2f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><!--[-->';

			if (lazy_48.value >= 0) {
				__out += '<b class="if">x</b><i class="if2">y</i>';
			}

			__out += '<!--]--><span class="after">' + _$_.escape(lazy_48.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfTwoThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_49 = _$_.track(0, 'cd8f8438');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = IfTwoThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_49.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForTwoNodeItems() {
	return _$_.tsrx_element(() => {
		const items = [1, 2];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><!--[-->';

			for (const item of items) {
				__out += '<b class="item">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</b><i class="sep">|</i>';
			}

			__out += '<!--]--><span class="after">after</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function StaticCallThenStatic() {
	return _$_.tsrx_element(() => {
		const makeB = () => _$_.tsrx_element(() => {
			_$_.regular_block(() => {
				let __out = '';

				__out += '<b class="made">made</b>';
				_$_.output_push(__out);
			});
		});

		_$_.regular_block(() => {
			let __out = '';

			_$_.output_push(__out);
			__out = '';
			_$_.render_tsrx_element(makeB());
			__out += '<div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenStyleThenStatic() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><style>' + _$_.escape(`.styled2 { color: blue; }`) + '</style><div class="styled2 b">b</div><div class="styled2 c">c</div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticCallThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_50 = _$_.track(0, '4513c76f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticCallThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_50.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenStyleThenStatic() {
	return _$_.tsrx_element(() => {
		let lazy_51 = _$_.track(0, '5d5162df');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = StaticThenStyleThenStatic;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(lazy_51.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}