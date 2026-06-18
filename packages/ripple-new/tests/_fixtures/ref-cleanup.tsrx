import { useState } from 'ripple-new';

// React 19 callback-ref cleanup. CleanupRef's ref RETURNS a cleanup function;
// it must run on detach (with the captured node) instead of `ref(null)`.
// LegacyRef's ref returns nothing, so the legacy `ref(null)` contract holds.
// The @if branch toggles so we can detach/re-attach without unmounting the root.

export function CleanupRef(props) @{
	const [shown, setShown] = useState(true);
	<div>
		<button id="toggle" onClick={() => setShown(!shown)}>{'toggle'}</button>
		@if (shown) {
			<span
				id="target"
				ref={(el) => {
					props.onAttach(el);
					return () => props.onCleanup(el);
				}}
			>{'x'}</span>
		}
	</div>
}

export function LegacyRef(props) @{
	const [shown, setShown] = useState(true);
	<div>
		<button id="toggle" onClick={() => setShown(!shown)}>{'toggle'}</button>
		@if (shown) {
			<span
				id="target"
				ref={(el) => {
					props.observe(el);
				}}
			>{'x'}</span>
		}
	</div>
}
