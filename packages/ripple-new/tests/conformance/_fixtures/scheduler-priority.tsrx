import { useState, useLayoutEffect, useEffect } from 'ripple-new';

// ─────────────────────────────────────────────────────────────────────────────
// Discrete-event sync-commit probe
// ─────────────────────────────────────────────────────────────────────────────

export function ClickCounter() @{
	const [n, setN] = useState(0);
	<button id="b" onClick={() => setN(n + 1)}>
		{n as number}
	</button>
}

// Snapshot probe — handler reads DOM after setState. React's contract says
// the read sees the just-committed value. Pre-fix ripple-new sees stale DOM.
export let snapshots: string[] = [];
export function resetSnapshots() {
	snapshots = [];
}
export function FastClick() @{
	const [n, setN] = useState(0);
	const handler = (_e) => {
		setN(n + 1);
		const btn = document.getElementById('fc');
		snapshots.push(btn?.textContent ?? '' as string);
	};
	<button id="fc" onClick={handler}>
		{n as number}
	</button>
}

// ─────────────────────────────────────────────────────────────────────────────
// Effect mount-order probe — parent + child must fire child-first.
// ─────────────────────────────────────────────────────────────────────────────

export let layoutOrder: string[] = [];
export let passiveOrder: string[] = [];
export function resetEffectOrder() {
	layoutOrder = [];
	passiveOrder = [];
}

function Inner() @{
	useLayoutEffect(() => {
		layoutOrder.push('inner-layout');
	}, []);
	useEffect(() => {
		passiveOrder.push('inner-passive');
	}, []);
	<span class="inner">i</span>
}

function Middle() @{
	useLayoutEffect(() => {
		layoutOrder.push('middle-layout');
	}, []);
	useEffect(() => {
		passiveOrder.push('middle-passive');
	}, []);
	<div class="middle">
		<Inner />
	</div>
}

export function Outer() @{
	useLayoutEffect(() => {
		layoutOrder.push('outer-layout');
	}, []);
	useEffect(() => {
		passiveOrder.push('outer-passive');
	}, []);
	<div class="outer">
		<Middle />
	</div>
}

// Sibling order — same depth, source-order preserved.
export let siblingOrder: string[] = [];
export function resetSiblingOrder() {
	siblingOrder = [];
}

function SibA() @{
	useLayoutEffect(() => {
		siblingOrder.push('A');
	}, []);
	<span class="a">a</span>
}
function SibB() @{
	useLayoutEffect(() => {
		siblingOrder.push('B');
	}, []);
	<span class="b">b</span>
}

export function SiblingParent() @{
	useLayoutEffect(() => {
		siblingOrder.push('parent');
	}, []);
	<div>
		<SibA />
		<SibB />
	</div>
}

// Cleanup-order probe — parent/child cleanups also fire child-first.
export let cleanupOrder: string[] = [];
export function resetCleanupOrder() {
	cleanupOrder = [];
}

function CleanupChild() @{
	useLayoutEffect(() => () => cleanupOrder.push('inner'), []);
	<span class="cc">cc</span>
}

export function CleanupProbe() @{
	useLayoutEffect(() => () => cleanupOrder.push('outer'), []);
	<div>
		<CleanupChild />
	</div>
}
