import { useState, useEffect } from 'ripple-new';

// React-style guarded component: `if (cond) return;` early-exit followed by
// hooks. ripple-new supports runtime-conditional hooks (each call site has
// its own stable slot identity via Symbol.for, so hooks remain referenceable
// even when the body short-circuits). The effect should fire when the guard
// opens AND its deps change — and NOT fire while the guard is closed.
export function Guarded(props) @{
	const [n, setN] = useState(props.initialN ?? 0);
	if (props.hide) return;
	useEffect(() => {
		props.log.push('mount:' + n);
		return () => props.log.push('cleanup:' + n);
	}, [n]);
	<button id="bump" onClick={() => setN(n + 1)}>
		{n as string}
	</button>
}

// Same shape but with the hook order interleaved with intermediate logic.
// Exercises the per-call-site slot stability when a render is short-circuited
// after a few hooks have run.
export function PartialGuard(props) @{
	const [n, setN] = useState(0);
	const [m, setM] = useState(0);
	if (props.hide) return;
	useEffect(() => {
		props.log.push('seen:' + n + ':' + m);
	}, [n, m]);
	<>
		<button id="bumpN" onClick={() => setN(n + 1)}>
			{'n=' + n as string}
		</button>
		<button id="bumpM" onClick={() => setM(m + 1)}>
			{'m=' + m as string}
		</button>
	</>
}
