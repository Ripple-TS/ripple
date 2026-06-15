import { use, useState } from 'ripple-new';

// SSR Phase 6 (M4) — @try hydration. The server (Phase 4) awaits use(promise),
// renders the SUCCESS arm wrapped in a `<!--[-->…<!--]-->` range, and serializes
// the resolved value. The client adopts that range and use() returns the seeded
// value synchronously (no re-suspend) — the success arm hydrates + is interactive.
export function Boundary(props) @{
	<div id="boundary">
		@try {
			const msg = use(props.promise);
			const [n, setN] = useState(0);
			<button id="ok" class="ok" onClick={() => setN(n + 1)}>
				{msg + ':' + n as string}
			</button>
		} @pending {
			<span class="loading">
				{'loading' as string}
			</span>
		} @catch (err) {
			<span class="err">
				{err.message as string}
			</span>
		}
	</div>
}
