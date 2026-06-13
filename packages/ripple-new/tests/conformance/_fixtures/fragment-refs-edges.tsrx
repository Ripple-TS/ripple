import { Fragment, useState } from 'ripple-new';

// Component that re-renders on demand without unmounting the fragment —
// used to verify that the ref keeps the SAME instance across re-renders.
let _setN = null;
export function bumpN() {
	if (_setN) _setN((n) => n + 1);
}
export function StableAcrossRenders(props) @{
	const [n, setN] = useState(0);
	_setN = setN;
	<div id="parent">
		<span id="counter">
			{n as number}
		</span>
		<Fragment ref={props.fragRef}>
			<div id="child">x</div>
		</Fragment>
	</div>
}

// Single fragment child for listener-doubling, listener-after-unmount,
// and other "single child + observer" cases.
export function Single(props) @{
	<div id="parent">
		<Fragment ref={props.fragRef}>
			<button id="k">x</button>
		</Fragment>
	</div>
}

// dispatchEvent fired from a deep descendant — verifies bubbling all the
// way up through the fragment's parent host.
export function DeepDispatch(props) @{
	<div id="parent" onClick={props.onParent}>
		<Fragment ref={props.fragRef}>
			<section>
				<button id="deep">deep</button>
			</section>
		</Fragment>
	</div>
}

// Fragment with NO ref attribute — verifies non-ref Fragments still
// flatten children correctly (existing behaviour, but pinned here).
export function FragmentNoRef() @{
	<div id="parent">
		<Fragment>
			<span class="a">A</span>
			<span class="b">B</span>
		</Fragment>
	</div>
}
