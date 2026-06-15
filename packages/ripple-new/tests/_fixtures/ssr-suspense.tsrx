import { use, useState } from 'ripple-new';

// SSR Phase 4 — Suspense + data serialization. The server render() awaits
// use(promise) and renders the resolved value (not the @pending fallback); the
// value is serialized into an inline <script> that the client seeds on hydrate
// so use() returns synchronously (no re-suspend, no client re-fetch).

// Bare use() with NO @try boundary — the resolved value flows straight into the
// DOM. Used for the hydration test: a bare use() has no boundary to catch a
// suspension, so the client MUST get the value from the seed.
export function AsyncLeaf(props) @{
	const value = use(props.promise);
	<div id="leaf">
		{value as string}
	</div>
}

// A use() that resolves to `undefined`. The resolved value must round-trip
// through the SSR seed as `undefined`, NOT `null` (JSON has no undefined). The
// rendered marker discriminates undefined / null / other so the hydration test
// can prove the seeded value is undefined.
export function AsyncUndef(props) @{
	const value = use(props.promise);
	<div id="undef">
		{(value === undefined
			? 'is-undefined'
			: value === null
				? 'is-null'
				: 'other') as string}
	</div>
}

// Mirrors the playground/ripple-new-ssr App shape: a bare use() (async data
// seeded on hydrate) PLUS a useState counter with an onClick. Proves Phase 4
// data seeding composes with stateful, interactive hydration in one single-root
// component — and that a post-hydration re-render (the click) does NOT
// re-suspend the already-seeded use().
export function AsyncCounter(props) @{
	const message = use(props.promise);
	const [n, setN] = useState(0);
	<main id="ac">
		<h1>
			{message as string}
		</h1>
		<button id="ac-btn" onClick={() => setN(n + 1)}>
			{'count:' + n as string}
		</button>
	</main>
}

// @try / @pending / @catch around a use(promise). The server awaits the promise
// and renders the success arm; a rejected promise routes to @catch.
export function Boundary(props) @{
	<div id="box">
		@try {
			const value = use(props.promise);
			<span class="ok">
				{value as string}
			</span>
		} @pending {
			<span class="loading">{'loading'}</span>
		} @catch (err) {
			<span class="err">
				{err.message as string}
			</span>
		}
	</div>
}

// Nested suspense: the outer use() must resolve before the inner @try body (and
// its own use()) is even reached — exercises the multi-pass retry loop.
export function Nested(props) @{
	<div id="outer">
		@try {
			const first = use(props.outer);
			@try {
				const second = use(props.inner);
				<span class="both">
					{first + ':' + second as string}
				</span>
			} @pending {
				<span class="inner-loading">{'inner…'}</span>
			}
		} @pending {
			<span class="outer-loading">{'outer…'}</span>
		}
	</div>
}

// Two independent sibling boundaries — both suspend in one pass, are awaited
// together, then each renders its own success arm (distinct call-site keys).
export function Siblings(props) @{
	<div id="sibs">
		@try {
			const a = use(props.a);
			<span class="a">
				{a as string}
			</span>
		} @pending {
			<span>{'a…'}</span>
		}
		@try {
			const b = use(props.b);
			<span class="b">
				{b as string}
			</span>
		} @pending {
			<span>{'b…'}</span>
		}
	</div>
}
