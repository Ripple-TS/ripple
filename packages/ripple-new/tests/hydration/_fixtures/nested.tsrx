import { useState } from 'ripple-new';

// SSR Phase 6 (M1) — nested-component hydration. The server wraps each nested
// component's output in a `<!--[-->…<!--]-->` range; the client componentSlot
// adopts that range during hydration (instead of cloning fresh) and the child's
// clone() adopts the server DOM via the hydration cursor.

// A FULL component (has a hook → not a hookless "lite" slot) with dynamic text
// and an interactive button — proves stateful nested hydration + event attach.
export function Item(props) @{
	const [n, setN] = useState(0);
	<li class="item">
		<span class="label">
			{props.label as string}
		</span>
		<button class="bump" onClick={() => setN(n + 1)}>
			{'x' + n as string}
		</button>
	</li>
}

// Parent with a static-text hole AND a nested-component hole (so it compiles to a
// hole template → child/sibling navigation).
export function Panel(props) @{
	<div id="panel">
		<h2>
			{props.title as string}
		</h2>
		<Item label={props.label} />
	</div>
}
