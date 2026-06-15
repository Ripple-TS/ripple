// Regression: a knownString `{x as string}` text hole that sits AMONG sibling
// holes (a component, or control flow) must adopt the SERVER text node on
// hydration — not clobber an earlier sibling's expanded `<!--[-->…<!--]-->`
// range via raw childNodes indexing.

export function Inner() @{
	<span id="inner">I</span>
}

// Text hole AFTER a component hole.
export function TextAfterComp(props: { label: string }) @{
	<div id="host">
		<Inner />
		{props.label as string}
	</div>
}

// Text hole BETWEEN two component holes.
export function TextBetweenComps(props: { label: string }) @{
	<div id="host2">
		<Inner />
		{props.label as string}
		<Inner />
	</div>
}

// Text hole AFTER a control-flow (@if) hole.
export function TextAfterIf(props: { on: boolean; label: string }) @{
	<div id="host3">
		@if (props.on) {
			<span class="on">on</span>
		}
		{props.label as string}
	</div>
}
