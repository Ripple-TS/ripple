import { Fragment, useState } from 'ripple-new';

// A fragment whose child set GROWS at runtime: #a is always present, #b mounts
// when the toggle flips. Used to prove fragment listeners/observers added before
// #b existed still apply to #b (React future-children contract).
export function FutureChildren(props) @{
	const [show, setShow] = useState(false);
	<div id="host">
		<button id="toggle" type="button" onClick={() => setShow(true)}>{'toggle'}</button>
		<Fragment ref={props.fragRef}>
			<button id="a" type="button">{'a'}</button>
			@if (show) {
				<button id="b" type="button">{'b'}</button>
			}
		</Fragment>
	</div>
}

// A <Fragment ref> whose ref expression can change across renders (props.pick),
// to exercise the compiler's fragmentRef update path.
export function FragmentRefUpdate(props) @{
	<div id="host">
		<Fragment ref={props.pick}>
			<span id="x">{'x'}</span>
		</Fragment>
	</div>
}
