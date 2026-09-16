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
		const n = _$_.track(0, '1a7yy3l');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(n.value) + '</div><button class="inc">inc</button><button class="dec">dec</button>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingStaticNavigatedElements() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '31s4ns');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><button class="inc">inc</button><button class="dec">dec</button>';
			_$_.output_push(__out);
		});
	});
}

export function NavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'gwgdej');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><button class="inc">inc</button><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function LeadingNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '130zymr');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="inc">inc</button><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrailingNestedNavigated() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1uuvl87');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="host">static</div><div class="wrap"><button class="inc">inc</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'brdeyh');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrap"><button class="inc">inc</button></div><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function TrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1oxax2o');

		_$_.regular_block(() => {
			let __out = '';

			__out += _$_.escape(n.value) + '<div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenTrackedText() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '10ulddz');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div>' + _$_.escape(n.value);
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
		const n = _$_.track(0, '1794alj');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="count">' + _$_.escape(n.value) + '</div>';
			_$_.output_push(__out);
		});
	});
}

export function DynamicChildThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1jc1h9l');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(n.value) + '</div><div class="a">a</div><div class="b">b</div>';
			_$_.output_push(__out);
		});
	});
}

export function IfThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1xo2wul');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function StaticThenIf() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1jl3wwo');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="a">a</div><div class="b">b</div><!--[-->';

			if (n.value >= 0) {
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
		const n = _$_.track(0, '4hsxyk');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingStaticNavigatedElements() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1i2nm0o');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1dy54zr');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapLeadingNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1gya7sf');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingNestedNavigated() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1tzwnuk');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNestedNavigatedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '7qafxf');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrackedTextThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1651kpw');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenTrackedText() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1n6t9pd');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticNestedThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'z0cect');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapAllStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1f7qiqi');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingDynamicChild() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'z4l3e');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapDynamicChildThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'heyo5f');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '15jcgyl');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenIf() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '8lq6wf');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapCompThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1s0t3x9');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenComp() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '128s6ks');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSiblingComps() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1ivgvli');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
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
		const n = _$_.track(0, '10ahg7z');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="count">' + _$_.escape(n.value) + '</div><span class="x">x</span><button class="inc">inc</button>';
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
		const n = _$_.track(0, 'zj5z3n');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			switch (n.value) {
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
		const n = _$_.track(0, 'g81yay');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapNestedFragmentThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1ot44jk');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTrailingNestedFragment() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1fz18vp');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapForThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1acyxvu');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSwitchThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '19y3grj');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapTryThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '4hpwd2');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStyleThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1viwphy');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapCollectionThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1dd1i1k');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapInlineElementThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1pw54xk');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfOnly() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1j4mp04');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfThenOne() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1iawrhh');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--><div class="a">a</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SingleRootWithIf() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'rpd5nn');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="root"><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfOnly() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '10kd2fx');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfThenOne() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'cgtahj');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapSingleRootWithIf() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1hoki9n');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function ExprThenSiblingInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1osob1q');
		const label = 'label';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(label.toUpperCase());
			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfTwoThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1nzh6oi');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b><i class="if2">y</i>';
			}

			__out += '<!--]--><div class="a">a</div><div class="b">b</div><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfTwoInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '3fm7u7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><!--[-->';

			if (n.value >= 0) {
				__out += '<b class="if">x</b><i class="if2">y</i>';
			}

			__out += '<!--]--><span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapIfTwoThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1l1acs8');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
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
		const n = _$_.track(0, 'j5zrlb');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function WrapStaticThenStyleThenStatic() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'pw4k4f');

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

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function CompThenStaticInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1r4hpd1');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function SiblingCompsInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, 'qa5dkx');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfSwapThenStaticInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '155m7jb');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer"><!--[-->';

			if (n.value % 2 === 0) {
				__out += '<b class="even">even</b>';
			} else {
				__out += '<i class="odd">odd</i>';
			}

			__out += '<!--]--><span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForThenStaticInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '1ve0yjw');
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

				__out += '</b>';
			}

			__out += '<!--]--><span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function CompThenStatementThenStaticInDiv() {
	return _$_.tsrx_element(() => {
		const n = _$_.track(0, '178iuvb');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="outer">';

			{
				const comp = Leaf;
				const args = [{}];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const label = 'after';

				console.assert(label === 'after');
			}

			__out += '<span class="after">' + _$_.escape(n.value) + '</span><button class="outer-inc">outer</button></div>';
			_$_.output_push(__out);
		});
	});
}