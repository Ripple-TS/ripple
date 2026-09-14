import { track } from 'ripple';

// Components exercising where the hydration cursor sits after a node, block,
// or component: on its last DOM node, where the parent's sibling traversal
// expects it. Fragment roots are hydrated on their own and as a child with
// trailing siblings (`Wrap<Name>`), so the compiler's closing `next(n)` must
// land on the fragment's last top-level node; the single-root shapes at the
// end check a slot followed by siblings inside an element.

function Leaf() @{
	<i class="leaf">{'leaf'}</i>
}

export function TrailingNavigatedElements() @{
	const n = track(0);
	<>
		<div class="count">{n.value}</div>
		<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		<button class="dec" onClick={() => n.value--}>{'dec'}</button>
	</>
}

export function TrailingStaticNavigatedElements() @{
	const n = track(0);
	<>
		<div class="host">{'static'}</div>
		<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		<button class="dec" onClick={() => n.value--}>{'dec'}</button>
	</>
}

export function NavigatedThenStatic() @{
	const n = track(0);
	<>
		<div class="host">{'static'}</div>
		<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function LeadingNavigatedThenStatic() @{
	const n = track(0);
	<>
		<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function TrailingNestedNavigated() @{
	const n = track(0);
	<>
		<div class="host">{'static'}</div>
		<div class="wrap">
			<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		</div>
	</>
}

export function NestedNavigatedThenStatic() @{
	const n = track(0);
	<>
		<div class="wrap">
			<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		</div>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function TrackedTextThenStatic() @{
	const n = track(0);
	<>
		{n.value}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenTrackedText() @{
	const n = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		{n.value}
	</>
}

export function StaticNestedThenStatic() @{
	<>
		<div class="a">{'a'}</div>
		<div class="wrap">
			<span>{'x'}</span>
		</div>
		<div class="b">{'b'}</div>
		<div class="c">{'c'}</div>
	</>
}

export function AllStatic() @{
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		<div class="c">{'c'}</div>
	</>
}

export function TrailingDynamicChild() @{
	const n = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="count">{n.value}</div>
	</>
}

export function DynamicChildThenStatic() @{
	const n = track(0);
	<>
		<div class="count">{n.value}</div>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function IfThenStatic() @{
	const n = track(0);
	<>
		@if (n.value >= 0) {
			<b class="if">{'x'}</b>
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenIf() @{
	const n = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		@if (n.value >= 0) {
			<b class="if">{'x'}</b>
		}
	</>
}

export function CompThenStatic() @{
	<>
		<Leaf />
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenComp() @{
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		<Leaf />
	</>
}

export function SiblingComps() @{
	<>
		<Leaf />
		<Leaf />
	</>
}

export function WrapTrailingNavigatedElements() @{
	const n = track(0);
	<div class="outer">
		<TrailingNavigatedElements />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTrailingStaticNavigatedElements() @{
	const n = track(0);
	<div class="outer">
		<TrailingStaticNavigatedElements />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapNavigatedThenStatic() @{
	const n = track(0);
	<div class="outer">
		<NavigatedThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapLeadingNavigatedThenStatic() @{
	const n = track(0);
	<div class="outer">
		<LeadingNavigatedThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTrailingNestedNavigated() @{
	const n = track(0);
	<div class="outer">
		<TrailingNestedNavigated />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapNestedNavigatedThenStatic() @{
	const n = track(0);
	<div class="outer">
		<NestedNavigatedThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTrackedTextThenStatic() @{
	const n = track(0);
	<div class="outer">
		<TrackedTextThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenTrackedText() @{
	const n = track(0);
	<div class="outer">
		<StaticThenTrackedText />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStaticNestedThenStatic() @{
	const n = track(0);
	<div class="outer">
		<StaticNestedThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapAllStatic() @{
	const n = track(0);
	<div class="outer">
		<AllStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTrailingDynamicChild() @{
	const n = track(0);
	<div class="outer">
		<TrailingDynamicChild />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapDynamicChildThenStatic() @{
	const n = track(0);
	<div class="outer">
		<DynamicChildThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapIfThenStatic() @{
	const n = track(0);
	<div class="outer">
		<IfThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenIf() @{
	const n = track(0);
	<div class="outer">
		<StaticThenIf />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapCompThenStatic() @{
	const n = track(0);
	<div class="outer">
		<CompThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenComp() @{
	const n = track(0);
	<div class="outer">
		<StaticThenComp />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapSiblingComps() @{
	const n = track(0);
	<div class="outer">
		<SiblingComps />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function UntrackedTextThenStatic() @{
	const label = 'label';
	<>
		{label.toUpperCase()}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function NestedFragmentThenStatic() @{
	<>
		<div class="a">{'a'}</div>
		<>
			<span class="x">{'x'}</span>
			<span class="y">{'y'}</span>
		</>
		<div class="b">{'b'}</div>
		<div class="c">{'c'}</div>
	</>
}

export function TrailingNestedFragment() @{
	const n = track(0);
	<>
		<div class="count">{n.value}</div>
		<>
			<span class="x">{'x'}</span>
			<button class="inc" onClick={() => n.value++}>{'inc'}</button>
		</>
	</>
}

export function ForThenStatic() @{
	const items = [1, 2];
	<>
		@for (const item of items) {
			<b class="item">{item}</b>
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function SwitchThenStatic() @{
	const n = track(0);
	<>
		@switch (n.value) {
			@case 0: {
				<b class="zero">{'zero'}</b>
			}
			@default: {
				<b class="other">{'other'}</b>
			}
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function TryThenStatic() @{
	<>
		@try {
			<b class="try">{'try'}</b>
		} @catch (e) {
			<b class="catch">{'catch'}</b>
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StyleThenStatic() @{
	<>
		<style>{`.styled { color: red; }`}</style>
		<div class="styled a">{'a'}</div>
		<div class="styled b">{'b'}</div>
	</>
}

export function CollectionThenStatic() @{
	const items = [1, 2];
	<>
		{items.map((item) => <b class="item">{item}</b>)}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function InlineElementThenStatic() @{
	<>
		{<b class="inline">{'inline'}</b>}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function WrapUntrackedTextThenStatic() @{
	const n = track(0);
	<div class="outer">
		<UntrackedTextThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapNestedFragmentThenStatic() @{
	const n = track(0);
	<div class="outer">
		<NestedFragmentThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTrailingNestedFragment() @{
	const n = track(0);
	<div class="outer">
		<TrailingNestedFragment />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapForThenStatic() @{
	const n = track(0);
	<div class="outer">
		<ForThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapSwitchThenStatic() @{
	const n = track(0);
	<div class="outer">
		<SwitchThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapTryThenStatic() @{
	const n = track(0);
	<div class="outer">
		<TryThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStyleThenStatic() @{
	const n = track(0);
	<div class="outer">
		<StyleThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapCollectionThenStatic() @{
	const n = track(0);
	<div class="outer">
		<CollectionThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapInlineElementThenStatic() @{
	const n = track(0);
	<div class="outer">
		<InlineElementThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function IfOnly() @{
	const n = track(0);
	<>
		@if (n.value >= 0) {
			<b class="if">{'x'}</b>
		}
	</>
}

export function IfThenOne() @{
	const n = track(0);
	<>
		@if (n.value >= 0) {
			<b class="if">{'x'}</b>
		}
		<div class="a">{'a'}</div>
	</>
}

export function SingleRootWithIf() @{
	const n = track(0);
	<div class="root">
		@if (n.value >= 0) {
			<b class="if">{'x'}</b>
		}
	</div>
}

export function WrapIfOnly() @{
	const n = track(0);
	<div class="outer">
		<IfOnly />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapIfThenOne() @{
	const n = track(0);
	<div class="outer">
		<IfThenOne />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapSingleRootWithIf() @{
	const n = track(0);
	<div class="outer">
		<SingleRootWithIf />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function ExprThenSiblingInDiv() @{
	const n = track(0);
	const label = 'label';
	<div class="outer">
		{label.toUpperCase()}
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function IfTwoThenStatic() @{
	const n = track(0);
	<>
		@if (n.value >= 0) {
			<>
				<b class="if">{'x'}</b>
				<i class="if2">{'y'}</i>
			</>
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function IfTwoInDiv() @{
	const n = track(0);
	<div class="outer">
		@if (n.value >= 0) {
			<>
				<b class="if">{'x'}</b>
				<i class="if2">{'y'}</i>
			</>
		}
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapIfTwoThenStatic() @{
	const n = track(0);
	<div class="outer">
		<IfTwoThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function ForTwoNodeItems() @{
	const items = [1, 2];
	<div class="outer">
		@for (const item of items) {
			<>
				<b class="item">{item}</b>
				<i class="sep">{'|'}</i>
			</>
		}
		<span class="after">{'after'}</span>
	</div>
}

export function StaticCallThenStatic() @{
	const makeB = () => <b class="made">{'made'}</b>;
	<>
		{makeB()}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenStyleThenStatic() @{
	<>
		<div class="a">{'a'}</div>
		<style>{`.styled2 { color: blue; }`}</style>
		<div class="styled2 b">{'b'}</div>
		<div class="styled2 c">{'c'}</div>
	</>
}

export function WrapStaticCallThenStatic() @{
	const n = track(0);
	<div class="outer">
		<StaticCallThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenStyleThenStatic() @{
	const n = track(0);
	<div class="outer">
		<StaticThenStyleThenStatic />
		<span class="after">{n.value}</span>
		<button class="outer-inc" onClick={() => n.value++}>{'outer'}</button>
	</div>
}
