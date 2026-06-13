import { Fragment } from 'ripple-new';

// Two siblings inside the fragment — basic add-to-all-children probe.
export function TwoChildren(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="a">a</button>
			<button id="b">b</button>
		</Fragment>
	</div>
}

// Deeply-nested descendant — listener must fire via bubbling from the
// inner <span> even though it was attached to the direct child <button>.
export function DeepNested(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="outer">
				<span id="inner">click me</span>
			</button>
		</Fragment>
	</div>
}

// Sibling outside the fragment — addEventListener must NOT touch it.
export function OutsideSibling(props) @{
	<div id="parent">
		<button id="outside">outside</button>
		<Fragment ref={props.fragRef}>
			<button id="inside">inside</button>
		</Fragment>
		<button id="after">after</button>
	</div>
}

// Empty fragment — addEventListener is a no-op (no children to attach to).
export function EmptyFragment(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}></Fragment>
	</div>
}

// Single child with id "k" — used to verify removeEventListener and
// capture/once semantics one element at a time.
export function SingleChild(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="k">k</button>
		</Fragment>
	</div>
}
