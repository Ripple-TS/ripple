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
	let &[n] = track(0);
	<>
		<div class="count">{n}</div>
		<button class="inc" onClick={() => n++}>{'inc'}</button>
		<button class="dec" onClick={() => n--}>{'dec'}</button>
	</>
}

export function TrailingStaticNavigatedElements() @{
	let &[n] = track(0);
	<>
		<div class="host">{'static'}</div>
		<button class="inc" onClick={() => n++}>{'inc'}</button>
		<button class="dec" onClick={() => n--}>{'dec'}</button>
	</>
}

export function NavigatedThenStatic() @{
	let &[n] = track(0);
	<>
		<div class="host">{'static'}</div>
		<button class="inc" onClick={() => n++}>{'inc'}</button>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function LeadingNavigatedThenStatic() @{
	let &[n] = track(0);
	<>
		<button class="inc" onClick={() => n++}>{'inc'}</button>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function TrailingNestedNavigated() @{
	let &[n] = track(0);
	<>
		<div class="host">{'static'}</div>
		<div class="wrap">
			<button class="inc" onClick={() => n++}>{'inc'}</button>
		</div>
	</>
}

export function NestedNavigatedThenStatic() @{
	let &[n] = track(0);
	<>
		<div class="wrap">
			<button class="inc" onClick={() => n++}>{'inc'}</button>
		</div>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function TrackedTextThenStatic() @{
	let &[n] = track(0);
	<>
		{n}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenTrackedText() @{
	let &[n] = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		{n}
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
	let &[n] = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="count">{n}</div>
	</>
}

export function DynamicChildThenStatic() @{
	let &[n] = track(0);
	<>
		<div class="count">{n}</div>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function IfThenStatic() @{
	let &[n] = track(0);
	<>
		@if (n >= 0) {
			<b class="if">{'x'}</b>
		}
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
	</>
}

export function StaticThenIf() @{
	let &[n] = track(0);
	<>
		<div class="a">{'a'}</div>
		<div class="b">{'b'}</div>
		@if (n >= 0) {
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
	let &[n] = track(0);
	<div class="outer">
		<TrailingNavigatedElements />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTrailingStaticNavigatedElements() @{
	let &[n] = track(0);
	<div class="outer">
		<TrailingStaticNavigatedElements />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapNavigatedThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<NavigatedThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapLeadingNavigatedThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<LeadingNavigatedThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTrailingNestedNavigated() @{
	let &[n] = track(0);
	<div class="outer">
		<TrailingNestedNavigated />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapNestedNavigatedThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<NestedNavigatedThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTrackedTextThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<TrackedTextThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenTrackedText() @{
	let &[n] = track(0);
	<div class="outer">
		<StaticThenTrackedText />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStaticNestedThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<StaticNestedThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapAllStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<AllStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTrailingDynamicChild() @{
	let &[n] = track(0);
	<div class="outer">
		<TrailingDynamicChild />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapDynamicChildThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<DynamicChildThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapIfThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<IfThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenIf() @{
	let &[n] = track(0);
	<div class="outer">
		<StaticThenIf />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapCompThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<CompThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenComp() @{
	let &[n] = track(0);
	<div class="outer">
		<StaticThenComp />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapSiblingComps() @{
	let &[n] = track(0);
	<div class="outer">
		<SiblingComps />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
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
	let &[n] = track(0);
	<>
		<div class="count">{n}</div>
		<>
			<span class="x">{'x'}</span>
			<button class="inc" onClick={() => n++}>{'inc'}</button>
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
	let &[n] = track(0);
	<>
		@switch (n) {
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
	let &[n] = track(0);
	<div class="outer">
		<UntrackedTextThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapNestedFragmentThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<NestedFragmentThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTrailingNestedFragment() @{
	let &[n] = track(0);
	<div class="outer">
		<TrailingNestedFragment />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapForThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<ForThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapSwitchThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<SwitchThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapTryThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<TryThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStyleThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<StyleThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapCollectionThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<CollectionThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapInlineElementThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<InlineElementThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function IfOnly() @{
	let &[n] = track(0);
	<>
		@if (n >= 0) {
			<b class="if">{'x'}</b>
		}
	</>
}

export function IfThenOne() @{
	let &[n] = track(0);
	<>
		@if (n >= 0) {
			<b class="if">{'x'}</b>
		}
		<div class="a">{'a'}</div>
	</>
}

export function SingleRootWithIf() @{
	let &[n] = track(0);
	<div class="root">
		@if (n >= 0) {
			<b class="if">{'x'}</b>
		}
	</div>
}

export function WrapIfOnly() @{
	let &[n] = track(0);
	<div class="outer">
		<IfOnly />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapIfThenOne() @{
	let &[n] = track(0);
	<div class="outer">
		<IfThenOne />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapSingleRootWithIf() @{
	let &[n] = track(0);
	<div class="outer">
		<SingleRootWithIf />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function ExprThenSiblingInDiv() @{
	let &[n] = track(0);
	const label = 'label';
	<div class="outer">
		{label.toUpperCase()}
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function IfTwoThenStatic() @{
	let &[n] = track(0);
	<>
		@if (n >= 0) {
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
	let &[n] = track(0);
	<div class="outer">
		@if (n >= 0) {
			<>
				<b class="if">{'x'}</b>
				<i class="if2">{'y'}</i>
			</>
		}
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapIfTwoThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<IfTwoThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
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
	let &[n] = track(0);
	<div class="outer">
		<StaticCallThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}

export function WrapStaticThenStyleThenStatic() @{
	let &[n] = track(0);
	<div class="outer">
		<StaticThenStyleThenStatic />
		<span class="after">{n}</span>
		<button class="outer-inc" onClick={() => n++}>{'outer'}</button>
	</div>
}
