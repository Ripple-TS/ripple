import { Fragment, useState } from 'ripple-new';

// scrollIntoView target — single focusable child.
export function ScrollTarget(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="btn">go</button>
		</Fragment>
	</div>
}

// scrollIntoView falls back to first child element when nothing is
// focusable — used to verify the picking logic.
export function ScrollNonFocusable(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div id="first">first</div>
			<div id="second">second</div>
		</Fragment>
	</div>
}

// Text-only fragment — no host element children.
// (TSRX text expressions become Text nodes between the markers.)
export function TextOnly(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			{'just text' as string}
		</Fragment>
	</div>
}

// Nested fragments — each ref binds to its own marker range.
export function NestedFragments(props) @{
	<div id="parent">
		<Fragment ref={props.outerRef}>
			<div id="outer-a">a</div>
			<Fragment ref={props.innerRef}>
				<div id="inner-a">i-a</div>
				<div id="inner-b">i-b</div>
			</Fragment>
			<div id="outer-b">b</div>
		</Fragment>
	</div>
}

// Two sibling fragments — refs must NOT cross-contaminate.
export function SiblingFragments(props) @{
	<div id="parent">
		<Fragment ref={props.leftRef}>
			<div id="L1">L1</div>
			<div id="L2">L2</div>
		</Fragment>
		<Fragment ref={props.rightRef}>
			<div id="R1">R1</div>
			<div id="R2">R2</div>
		</Fragment>
	</div>
}

// Array refs on a Fragment — attachRef supports the same multi-ref
// shape as element-level refs.
export function ArrayRef(props) @{
	<div id="parent">
		<Fragment ref={[props.refA, props.refB]}>
			<button id="btn">x</button>
		</Fragment>
	</div>
}

// Conditional fragment — when toggled in, ref attaches; when toggled
// out, ref is cleared (object refs → null, callback refs → null).
let _setShow = null;
export function setShow(v) {
	if (_setShow) _setShow(v);
}
export function ConditionalFragment(props) @{
	const [show, setShow] = useState(true);
	_setShow = setShow;
	<div id="parent">
		@if (show) {
			<Fragment ref={props.fragRef}>
				<div id="conditional">on</div>
			</Fragment>
		}
	</div>
}

// dispatchEvent through a fragment whose parent has a delegated click
// handler — verifies the event arrives at the parent's listener.
export function DispatchParent(props) @{
	<div id="parent" onClick={props.onParent}>
		<Fragment ref={props.fragRef}>
			<div id="child">child</div>
		</Fragment>
	</div>
}
