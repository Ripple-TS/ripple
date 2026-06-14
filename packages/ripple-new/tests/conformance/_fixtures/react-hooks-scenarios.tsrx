import { useState, useReducer, useEffect } from 'ripple-new';

// Render counter — every component below increments this so tests can
// assert "rendered exactly N times". The mutable lives outside the
// component so the test can read it between commits.
let _renderCount = 0;
export function resetRenderCount() {
	_renderCount = 0;
}
export function getRenderCount() {
	return _renderCount;
}

// Pulls setState out so tests can fire from outside the render tree.
let _setN: any = null;
let _setM: any = null;
let _setObj: any = null;
export function getSetN() {
	return _setN;
}
export function getSetM() {
	return _setM;
}
export function getSetObj() {
	return _setObj;
}

// Functional-updater queue probe — two setN((p)=>p+1) in one handler
// must compute +2, NOT +1 (functional updaters draw from the queued
// value, not the render-closure value).
export function FunctionalUpdaterQueue() @{
	const [n, setN] = useState(0);
	_setN = setN;
	_renderCount++;
	<div>
		<button
			id="inc-twice"
			onClick={() => {
				setN((p: number) => p + 1);
				setN((p: number) => p + 1);
			}}
		>{'inc'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// Mixed value + functional updater. React's rule: value sets are queued
// and applied in order; updaters apply on top.
//   setN(5); setN(p => p + 1)  → final 6
//   setN(5); setN(7)           → final 7 (last value wins)
//   setN(p => p + 1); setN(5)  → final 5 (last value clobbers)
export function MixedValueUpdater() @{
	const [n, setN] = useState(0);
	_setN = setN;
	_renderCount++;
	<div>
		<button
			id="set5-then-inc"
			onClick={() => {
				setN(5);
				setN((p: number) => p + 1);
			}}
		>{'a'}</button>
		<button
			id="set5-then-7"
			onClick={() => {
				setN(5);
				setN(7);
			}}
		>{'b'}</button>
		<button
			id="inc-then-set5"
			onClick={() => {
				setN((p: number) => p + 1);
				setN(5);
			}}
		>{'c'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// Object.is bailout — setN(current) should be a no-op (no render).
export function ObjectIsBailout() @{
	const [n, setN] = useState(0);
	_setN = setN;
	_renderCount++;
	<div>
		<button id="same" onClick={() => setN(n)}>{'same'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// NaN bailout — Object.is(NaN, NaN) === true, so setN(NaN) when current
// is NaN must skip render. Mirrors React's behavior precisely.
export function NaNBailout() @{
	const [n, setN] = useState(NaN);
	_setN = setN;
	_renderCount++;
	<div>
		<button id="nan" onClick={() => setN(NaN)}>{'nan'}</button>
		<span id="out" class={Number.isNaN(n) ? 'isNaN' : 'notNaN'}>
			{Number.isNaN(n) ? 'NaN' : n as number}
		</span>
	</div>
}

// Multi-setter batching — setN + setM in one handler produces ONE render.
// Tests both render count AND final DOM state.
export function MultiSetterBatching() @{
	const [n, setN] = useState(0);
	const [m, setM] = useState(100);
	_setN = setN;
	_setM = setM;
	_renderCount++;
	<div>
		<button
			id="both"
			onClick={() => {
				setN(n + 1);
				setM(m + 1);
			}}
		>{'both'}</button>
		<span id="n">
			{n as number}
		</span>
		<span id="m">
			{m as number}
		</span>
	</div>
}

// Lazy initializer — useState(fn) calls fn ONCE on mount. Subsequent
// renders MUST not invoke it again, even on state updates.
let _initCount = 0;
export function getInitCount() {
	return _initCount;
}
export function resetInitCount() {
	_initCount = 0;
}
export function LazyInitOnce() @{
	const [n, setN] = useState(() => {
		_initCount++;
		return 42;
	});
	_setN = setN;
	_renderCount++;
	<div>
		<button id="inc" onClick={() => setN(n + 1)}>{'inc'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// useReducer Object.is bailout — reducer returns SAME reference: no render.
let _reducerCalls = 0;
export function getReducerCalls() {
	return _reducerCalls;
}
export function resetReducerCalls() {
	_reducerCalls = 0;
}
export function ReducerSameRefBailout() @{
	const [state, dispatch] = useReducer((s, action) => {
		_reducerCalls++;
		if (action === 'keep') return s; // same reference — must skip render
		return { v: s.v + 1 };
	}, { v: 0 });
	_setN = dispatch;
	_renderCount++;
	<div>
		<button id="keep" onClick={() => dispatch('keep')}>{'keep'}</button>
		<button id="inc" onClick={() => dispatch('inc')}>{'inc'}</button>
		<span id="out">
			{state.v as number}
		</span>
	</div>
}

// useReducer 3-arg lazy init form — React supports useReducer(reducer,
// initialArg, init). ripple-new accepts the same signature; this pins it.
export function ReducerLazyInit(props) @{
	const [n, dispatch] = useReducer((s, _a) => s + 1, props.seed, (seed) => seed * 10);
	_setN = dispatch;
	_renderCount++;
	<div>
		<button id="inc" onClick={() => dispatch('inc')}>{'inc'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// useReducer reducer-ref change between renders — the LATEST reducer
// passed to useReducer must drive the NEXT dispatch. Common pattern:
// closing over fresh props in the reducer body.
export function ReducerLatestRef(props) @{
	const [n, dispatch] = useReducer((s, _action) => s + props.step, 0);
	_setN = dispatch;
	_renderCount++;
	<div>
		<button id="go" onClick={() => dispatch('go')}>{'go'}</button>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// useState setter from a PREVIOUS render still works on a current
// scope — React parity. The setter is identity-stable across renders so
// holding it from render N then calling it during render N+1 must still
// schedule against the current Block.
let _capturedSetter: any = null;
export function getCapturedSetter() {
	return _capturedSetter;
}
export function StableSetterIdentity() @{
	const [n, setN] = useState(0);
	// Capture the setter only on the FIRST render — subsequent renders
	// must see the SAME setter identity.
	if (_capturedSetter === null) _capturedSetter = setN;
	_setN = setN;
	_renderCount++;
	<div>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// Setter called after unmount — must be a no-op (no throw, no error).
export function SetAfterUnmount() @{
	const [n, setN] = useState(0);
	_setN = setN;
	_renderCount++;
	<div>
		<span id="out">
			{n as number}
		</span>
	</div>
}

// useEffect that calls setState — schedules a follow-up render. After
// the effect fires, the next render commits the new value.
let _effectFired = 0;
export function getEffectFired() {
	return _effectFired;
}
export function resetEffectFired() {
	_effectFired = 0;
}
export function EffectTriggersRender() @{
	const [n, setN] = useState(0);
	_setN = setN;
	_renderCount++;
	useEffect(() => {
		_effectFired++;
		if (n === 0) setN(1);
	}, [n]);
	<span id="out">
		{n as number}
	</span>
}

// Setting state on an object stored in useState — verifies reference
// inequality triggers a render even when the value-shape is identical.
export function ObjectStateRender() @{
	const [obj, setObj] = useState({ a: 0 });
	_setObj = setObj;
	_renderCount++;
	<div>
		<span id="out">
			{obj.a as number}
		</span>
	</div>
}
