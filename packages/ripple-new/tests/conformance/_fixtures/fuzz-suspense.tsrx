import { use, useState, useEffect, useTransition } from 'ripple-new';

// Single use() inside @try — the simplest suspense shape.
export function S1(props) @{
	<div id="root">
		@try {
			const v = use(props.p);
			<span class="r">
				{v as string}
			</span>
		} @pending {
			<span class="f">{'F1'}</span>
		} @catch (err) {
			<span class="e">
				{'E1:' + (err as any).message as string}
			</span>
		}
	</div>
}

// Two use() calls in sequence — replay should hit the cached value of the
// first promise. Order of resolution matters; fuzz exercises both arrival
// orders.
export function S2(props) @{
	<div id="root">
		@try {
			const a = use(props.a);
			const b = use(props.b);
			<span class="r">
				{a + ':' + b as string}
			</span>
		} @pending {
			<span class="f">{'F2'}</span>
		} @catch (err) {
			<span class="e">
				{'E2:' + (err as any).message as string}
			</span>
		}
	</div>
}

// Sibling try blocks — each suspends independently. Crucial: a thenable
// resolution must NOT spill into the wrong boundary.
export function SSibling(props) @{
	<div id="root">
		@try {
			const a = use(props.a);
			<span class="r1">
				{a as string}
			</span>
		} @pending {
			<span class="f1">{'F1'}</span>
		}
		@try {
			const b = use(props.b);
			<span class="r2">
				{b as string}
			</span>
		} @pending {
			<span class="f2">{'F2'}</span>
		}
	</div>
}

// Nested try blocks — inner pending is hidden behind outer pending when
// outer is suspended; both must commit cleanly when outer resolves.
export function SNested(props) @{
	<div id="root">
		@try {
			const a = use(props.a);
			<div class="r1">
				<span>
					{a as string}
				</span>
				@try {
					const b = use(props.b);
					<span class="r2">
						{b as string}
					</span>
				} @pending {
					<span class="f2">{'IF2'}</span>
				}
			</div>
		} @pending {
			<span class="f1">{'OF1'}</span>
		}
	</div>
}

// State inside @try — when use() suspends and we replay, the existing
// useState slot must rehydrate to the same value (no fresh init).
let _bumpState: any = null;
export function bumpStateIn() {
	if (_bumpState) _bumpState((n: number) => n + 1);
}
export function SState(props) @{
	<div id="root">
		@try {
			const [n, setN] = useState(0);
			_bumpState = setN;
			const v = use(props.p);
			<span class="r">
				{v + ':' + n as string}
			</span>
		} @pending {
			<span class="f">{'F'}</span>
		}
	</div>
}

// Catch + reset — clicking the reset button retries the try body with
// the latest props.p (the test swaps it via r.update before reset fires).
export function SCatchReset(props) @{
	<div id="root">
		@try {
			const v = use(props.p);
			<span class="r">
				{v as string}
			</span>
		} @pending {
			<span class="f">{'F'}</span>
		} @catch (err, reset) {
			<button class="reset" onClick={reset}>
				{'reset:' + (err as any).message as string}
			</button>
		}
	</div>
}
