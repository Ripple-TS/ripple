import { Fragment } from 'ripple-new';

// Sibling before the fragment, fragment with one child, sibling after —
// exercises every region compareDocumentPosition can report.
export function SurroundedFragment(props) @{
	<div id="parent">
		<div id="before">before</div>
		<Fragment ref={props.fragRef}>
			<div id="inside">inside</div>
		</Fragment>
		<div id="after">after</div>
	</div>
}

// Just the parent + a single fragment child — used by dispatchEvent test
// to verify the event reaches a listener on the parent.
export function ParentWithFragmentChild(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div id="child">x</div>
		</Fragment>
	</div>
}
