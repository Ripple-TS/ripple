import { useState, flushSync } from 'ripple-new';

// Counter exposing several state-mutation handler patterns. The fuzz
// harness dispatches MouseEvent('click') at one of these buttons in a
// random sequence and asserts the DOM stays in sync with state.
let _snapshots: string[] = [];
export function resetSnapshots() {
	_snapshots = [];
}
export function getSnapshots() {
	return _snapshots;
}

export function FuzzCounter() @{
	const [n, setN] = useState(0);
	const handlerOne = (_e: any) => {
		setN(n + 1);
		const el = document.getElementById('out') as HTMLElement | null;
		_snapshots.push(el?.textContent ?? '');
	};
	const handlerTwo = (_e: any) => {
		// Two functional updates in one handler — both queued, single
		// commit after the handler returns.
		setN((m: number) => m + 1);
		setN((m: number) => m + 1);
		const el = document.getElementById('out') as HTMLElement | null;
		_snapshots.push('two:' + (el?.textContent ?? ''));
	};
	const handlerThree = (_e: any) => {
		// Mixed value + updater. Two value-sets collapse in React-style
		// (last wins) — but the runtime treats the second-value-set as
		// reading from CLOSURE n, not the latest queued value. So:
		//   setN(n + 1)  → queues n+1
		//   setN(n + 1)  → queues n+1 (same, closure value of n unchanged)
		//   setN(m => m + 1) → adds 1 to whatever the queue produces
		// Net: n + 1 + 1 = n + 2 (the value-sets collapse, the updater
		// adds 1). Matches React batched-update semantics.
		setN(n + 1);
		setN(n + 1);
		setN((m: number) => m + 1);
		_snapshots.push('three');
	};
	const handlerFlush = (_e: any) => {
		// flushSync inside a handler — the inner update commits eagerly,
		// then the outer dispatch's commit attempt is a no-op. Final
		// state still +1.
		flushSync(() => {
			setN(n + 1);
		});
		const el = document.getElementById('out') as HTMLElement | null;
		_snapshots.push('flush:' + (el?.textContent ?? ''));
	};
	<div>
		<button id="b-one" onClick={handlerOne}>{'one'}</button>
		<button id="b-two" onClick={handlerTwo}>{'two'}</button>
		<button id="b-three" onClick={handlerThree}>{'three'}</button>
		<button id="b-flush" onClick={handlerFlush}>{'flush'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}
