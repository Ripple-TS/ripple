import { useState } from 'ripple-new';

// A `ref` arriving through a spread (`{...props.attrs}`) must behave exactly like
// a direct `ref={}`: attach on mount, run a callback's React-19 cleanup-return
// (or null) on detach, clear object refs, and detach on unmount. SpreadToggle
// exercises conditional mount/unmount via @if; SpreadDirect keeps the element
// mounted so the spread's ref value can change across renders.

export function SpreadToggle(props) @{
	const [shown, setShown] = useState(true);
	<div>
		<button id="toggle" onClick={() => setShown(!shown)}>{'t'}</button>
		@if (shown) {
			<span id="target" {...props.attrs}>{'x'}</span>
		}
	</div>
}

export function SpreadDirect(props) @{
	<span id="target" {...props.attrs}>{'x'}</span>
}
