import { useState, useCallback } from 'ripple-new';

// Minimal hook demo — useState + memoized handler via useCallback.
export function Counter() @{
	const [n, setN] = useState(0);
	const bump = useCallback(() => setN((c) => c + 1), []);
	const reset = useCallback(() => setN(0), []);

	<div>
		<h2 class="demo-title">{'Counter'}</h2>
		<p
			class="demo-blurb"
		>{'useState + useCallback. Click to bump; setter identity is stable across renders.'}</p>
		<div class="row">
			<button class="btn" onClick={bump}>
				{'count: ' + n as string}
			</button>
			<button class="btn" onClick={reset}>{'reset'}</button>
		</div>
	</div>
}
