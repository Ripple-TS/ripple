import { Fragment } from 'ripple-new';

// Two focusable inputs side-by-side — covers basic focus() and focusLast().
export function TwoInputs(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<input id="a" />
			<input id="b" />
		</Fragment>
	</div>
}

// disabled button must be skipped by focus() / focusLast().
export function DisabledThenButton(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="bad" disabled>x</button>
			<button id="good">y</button>
		</Fragment>
	</div>
}

// Non-focusable elements at the head — focus() must walk past them.
export function NonFocusableBeforeButton(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div>not focusable</div>
			<span>also not</span>
			<button id="target">target</button>
		</Fragment>
	</div>
}

// Nothing focusable — focus() and focusLast() must no-op.
export function NoFocusable(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div>a</div>
			<span>b</span>
		</Fragment>
	</div>
}

// Explicit tabIndex=0 on a div makes it focusable.
export function ExplicitTabIndex(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div id="tabbable" tabIndex={0}>tabbable</div>
		</Fragment>
	</div>
}

// tabIndex=-1 makes an otherwise-focusable element non-focusable for
// focus() / focusLast() — they should pick the next eligible element.
export function SkipsNegativeTabIndex(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<input id="skip" tabIndex={-1} />
			<input id="keep" />
		</Fragment>
	</div>
}

// blur() target — a single focused input inside the fragment.
export function BlurInside(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<input id="inside" />
		</Fragment>
	</div>
}

// blur() must be a no-op when focus is OUTSIDE the fragment. Provides
// both an outside input and an inside fragment (no focusable elements
// in the fragment, so any focused element is necessarily outside).
export function BlurOutside(props) @{
	<div id="parent">
		<input id="outside" />
		<Fragment ref={props.fragRef}>
			<div>nothing focusable</div>
		</Fragment>
	</div>
}
