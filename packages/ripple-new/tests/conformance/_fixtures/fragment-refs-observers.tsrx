import { Fragment } from 'ripple-new';

// Three siblings inside the fragment — used by observeUsing /
// unobserveUsing / getClientRects tests.
export function ThreeSiblings(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<div id="x" class="box">x</div>
			<div id="y" class="box">y</div>
			<div id="z" class="box">z</div>
		</Fragment>
	</div>
}
