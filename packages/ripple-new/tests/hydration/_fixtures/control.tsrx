import { useState } from 'ripple-new';

// SSR Phase 6 (M3) — @if / @switch hydration. The server wraps the TAKEN branch
// in a `<!--[-->…<!--]-->` range; the client adopts it as the slot, brackets the
// already-present branch content with branch markers, and adopts it via the
// hydration cursor (no content rebuild) — then the branch's handlers work.

export function Toggle(props) @{
	const [n, setN] = useState(0);
	<div id="toggle">
		@if (props.on) {
			<button id="hit" class="on" onClick={() => setN(n + 1)}>
				{'on:' + n as string}
			</button>
		} @else {
			<span class="off">
				{'off' as string}
			</span>
		}
	</div>
}

export function Pick(props) @{
	<div id="pick">
		@switch (props.k) {
			@case 'a': {
				<span class="a">
					{'AAA' as string}
				</span>
			}
			@case 'b': {
				<span class="b">
					{'BBB' as string}
				</span>
			}
			@default: {
				<span class="d">
					{'???' as string}
				</span>
			}
		}
	</div>
}
