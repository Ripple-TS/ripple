// The ref expression is `props.pick`, so a parent re-render with a different
// `pick` swaps the callback ref's identity (or sets it to null). React 19: the
// prior ref is detached (cleanup-return, or called with null) before the new
// one attaches.
export function IdentityRef(props) @{
	<div id="host" ref={props.pick}>{'x'}</div>
}
