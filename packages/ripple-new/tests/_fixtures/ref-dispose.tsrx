// A ref'd element mounts, then a sibling throws during the SAME flush, so the
// @try boundary unmounts the try body (running the ref-detach cleanup) before
// the deferred ref-attach queue drains. The queued attach must be skipped — not
// re-attach to the torn-down node.

function BoomChild() @{
	throw new Error('boom during mount');
	<div>{'never'}</div>
}

export function SameFlushUnmount(props) @{
	<>
		@try {
			<>
				<div id="refchild" ref={props.refObj}>{'x'}</div>
				<BoomChild />
			</>
		} @catch (e) {
			<div id="caught">{'caught'}</div>
		}
	</>
}
