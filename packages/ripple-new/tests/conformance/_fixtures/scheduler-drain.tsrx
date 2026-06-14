import { useState, useLayoutEffect } from 'ripple-new';

// Regression fixture for the scheduler mid-flush rethrow bug. When one block
// throws during a re-render with no enclosing @try, the error must not abandon
// the rest of the flush queue or skip commitEffects(): sibling roots batched
// into the same flush still have to render and commit their effects.

let _throwerSet: any = null;
let _siblingSet: any = null;
let _siblingLayoutRuns = 0;
let _siblingRenders = 0;

export function setThrower(n: number) {
	_throwerSet(n);
}
export function setSibling(n: number) {
	_siblingSet(n);
}
export function getSiblingLayoutRuns() {
	return _siblingLayoutRuns;
}
export function getSiblingRenders() {
	return _siblingRenders;
}

// Throws during render once its state reaches 1. No @try wraps it, so the
// error is unhandled and propagates to the scheduler.
export function Thrower() @{
	const [n, setN] = useState(0);
	_throwerSet = setN;
	if (n === 1) throw new Error('boom during render');
	<div id="thrower">
		{n as number}
	</div>
}

// A sibling root that records each render and each layout-effect commit so the
// test can prove the flush drained past the thrower and committed effects.
export function Sibling() @{
	const [n, setN] = useState(0);
	_siblingSet = setN;
	_siblingRenders++;
	useLayoutEffect(() => {
		_siblingLayoutRuns++;
	}, [n]);
	<div id="sibling">
		{n as number}
	</div>
}
