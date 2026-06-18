// SSR Phase 6 — hookless "lite" nested component hydration. Badge has no hooks,
// so the client compiles it to a `componentSlotLite` (inlined, no Block/markers).
// The server still wraps it in a `<!--[-->…<!--]-->` range; componentSlotLite
// adopts that range during hydration (and the block-skipping `sibling` walk
// resolves the SECOND badge's anchor past the first badge's range).
function Badge(props) @{
	<span class="badge">
		{props.label as string}
	</span>
}

export function Shell(props) @{
	<div id="shell">
		<h3>
			{props.title as string}
		</h3>
		<Badge label={props.a} />
		<Badge label={props.b} />
	</div>
}
