// FUZZ — Suspense / tryBlock differential.
//
// ARCHITECTURE
// ripple-new's tryBlock is a single primitive that handles render-throws,
// effect-throws, use(thenable) suspension, soft-detach of the try body
// while the pending arm is up, and TRANSITION_FALLBACK_TIMEOUT_MS for
// transition-priority suspends. Hand-written suspense tests cover named
// scenarios but never random interleavings.
//
// ORACLE
// For every fuzz case we mount the SAME component TWICE:
//   - baseline: every use(thenable) gets a promise that ships with
//     `.status = 'fulfilled'`, `.value` set, so use() returns synchronously
//     and no suspend occurs.
//   - live:  every use(thenable) gets a deferred promise that we resolve
//     (or reject) post-mount; we then drain microtasks + macrotask via
//     act() so the pending → resolved transition fully commits.
//
// After draining, live.innerHTML MUST equal baseline.innerHTML — Suspense
// is a scheduling concern, not a "final output" concern.
//
// SCALE
// 60 cases × ~6 components × 2 mounts/case = ~720 mounts on happy-dom,
// plus ~60 act() drains. Sub-3s on CI. Crank in CI via env vars below.
import { describe, it, expect } from 'vitest';
import { makeRng, makeRootRng, type FuzzRng } from './_helpers/fuzz-prng';
import { mount, act } from '../_helpers';
import { S1, S2, SSibling, SNested, SCatchReset } from './_fixtures/fuzz-suspense.tsrx';

const NUM_CASES = parseInt(process.env.RIPPLE_FUZZ_SUSPENSE_CASES || '60', 10);

// ─── Promise factories ──────────────────────────────────────────────
// ripple-new accepts React-19-shaped pre-tagged promises (status set
// ahead of use()). We build BOTH shapes — pre-fulfilled for the
// baseline render, deferred for the live render — so the oracle compares
// "if everything resolved synchronously" vs "if everything had to
// suspend and unwind through tryBlock".
type Deferred<T> = {
	promise: Promise<T> & { status?: string; value?: T; reason?: any };
	resolve: (v: T) => void;
	reject: (e: any) => void;
};

function deferred<T>(): Deferred<T> {
	let resolve!: (v: T) => void;
	let reject!: (e: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	}) as any;
	return { promise, resolve, reject };
}

function prefulfilled<T>(value: T): Promise<T> {
	const p = Promise.resolve(value) as any;
	// React-19 cache() shape — runtime returns synchronously from use().
	p.status = 'fulfilled';
	p.value = value;
	return p;
}

function prerejected(reason: any): Promise<never> {
	// Prevent unhandled-rejection noise during the baseline render.
	const p = Promise.reject(reason).catch(() => {}) as any;
	p.status = 'rejected';
	p.reason = reason;
	return p;
}

interface CaseSpec {
	component: any;
	name: string;
	/** Generate the prop bundle for one mount. */
	makeProps: () => { baseline: any; live: any; resolveLive: () => void };
}

/**
 * Decode a random seed into one of the suspense shapes. Each shape returns
 * a baseline (pre-fulfilled) prop bundle, a live (deferred) prop bundle,
 * and a `resolveLive()` callback that flips deferred promises so the live
 * mount can drain.
 */
function pickCase(rng: FuzzRng): CaseSpec {
	const shape = rng.pick([
		'S1-resolve',
		'S2-resolve-order-AB',
		'S2-resolve-order-BA',
		'SSibling-both',
		'SSibling-A-only',
		'SNested',
		'SCatchReset-resolve',
	]);
	switch (shape) {
		case 'S1-resolve': {
			const v = 'V' + rng.intBelow(99);
			return {
				component: S1,
				name: shape,
				makeProps: () => {
					const live = deferred<string>();
					return {
						baseline: { p: prefulfilled(v) },
						live: { p: live.promise },
						resolveLive: () => live.resolve(v),
					};
				},
			};
		}
		case 'S2-resolve-order-AB':
		case 'S2-resolve-order-BA': {
			const a = 'A' + rng.intBelow(99);
			const b = 'B' + rng.intBelow(99);
			return {
				component: S2,
				name: shape,
				makeProps: () => {
					const la = deferred<string>();
					const lb = deferred<string>();
					return {
						baseline: { a: prefulfilled(a), b: prefulfilled(b) },
						live: { a: la.promise, b: lb.promise },
						resolveLive: () => {
							if (shape === 'S2-resolve-order-AB') {
								la.resolve(a);
								lb.resolve(b);
							} else {
								lb.resolve(b);
								la.resolve(a);
							}
						},
					};
				},
			};
		}
		case 'SSibling-both': {
			const a = 'sA' + rng.intBelow(99);
			const b = 'sB' + rng.intBelow(99);
			return {
				component: SSibling,
				name: shape,
				makeProps: () => {
					const la = deferred<string>();
					const lb = deferred<string>();
					return {
						baseline: { a: prefulfilled(a), b: prefulfilled(b) },
						live: { a: la.promise, b: lb.promise },
						resolveLive: () => {
							// Resolve in random-ish order to exercise both arms
							// of the sibling independently.
							if (rng.bool()) {
								la.resolve(a);
								lb.resolve(b);
							} else {
								lb.resolve(b);
								la.resolve(a);
							}
						},
					};
				},
			};
		}
		case 'SSibling-A-only': {
			// Only one sibling resolves; the other stays pending. The
			// resolved sibling MUST commit its arm regardless. Differential
			// oracle: baseline pre-fulfils A and leaves B in pending shape
			// (we explicitly use a pre-rejected so it doesn't show, but
			// pending is the right model — we just keep B perpetually
			// pending so the assertion still holds).
			const a = 'oA' + rng.intBelow(99);
			return {
				component: SSibling,
				name: shape,
				makeProps: () => {
					const la = deferred<string>();
					const lb = deferred<string>(); // never resolves
					// Baseline for the "B pending forever" arm: use a
					// promise that will simply never settle, with no
					// .status / .value set. The runtime falls back to the
					// fallback. live arm also stays in fallback.
					const bNeverBaseline = new Promise<string>(() => {});
					return {
						baseline: { a: prefulfilled(a), b: bNeverBaseline },
						live: { a: la.promise, b: lb.promise },
						resolveLive: () => la.resolve(a),
					};
				},
			};
		}
		case 'SNested': {
			const a = 'nO' + rng.intBelow(99);
			const b = 'nI' + rng.intBelow(99);
			return {
				component: SNested,
				name: shape,
				makeProps: () => {
					const la = deferred<string>();
					const lb = deferred<string>();
					return {
						baseline: { a: prefulfilled(a), b: prefulfilled(b) },
						live: { a: la.promise, b: lb.promise },
						resolveLive: () => {
							// Pick a random order — inner-first vs outer-first
							// must both end at the same final DOM.
							if (rng.bool()) {
								la.resolve(a); // outer first
								lb.resolve(b);
							} else {
								lb.resolve(b); // inner first (under outer fallback)
								la.resolve(a);
							}
						},
					};
				},
			};
		}
		case 'SCatchReset-resolve': {
			const v = 'C' + rng.intBelow(99);
			return {
				component: SCatchReset,
				name: shape,
				makeProps: () => {
					const live = deferred<string>();
					return {
						baseline: { p: prefulfilled(v) },
						live: { p: live.promise },
						resolveLive: () => live.resolve(v),
					};
				},
			};
		}
	}
	throw new Error('unreachable');
}

async function runCase(caseSeed: number): Promise<void> {
	const rng = makeRng(caseSeed);
	const spec = pickCase(rng);
	const { baseline, live, resolveLive } = spec.makeProps();

	const baseMount = mount(spec.component, baseline);
	let liveMount: ReturnType<typeof mount> | undefined;
	try {
		liveMount = mount(spec.component, live);

		// Drive the live mount through pending → resolved.
		await act(async () => {
			resolveLive();
		});

		// Differential oracle: live must equal baseline byte-for-byte
		// after the drain. Comment markers (<!--…-->) inside the HTML
		// are intentionally compared too — they encode the try / pending
		// / catch arm choice, so a divergence in arm selection would
		// surface here as well.
		const baseHtml = baseMount.html();
		const liveHtml = liveMount.html();
		if (baseHtml !== liveHtml) {
			// eslint-disable-next-line no-console
			console.error(
				`[fuzz-suspense] DIFFERENTIAL MISMATCH\n  seed=${caseSeed}\n  case=${spec.name}\n  baseHtml=${baseHtml}\n  liveHtml=${liveHtml}`,
			);
			throw new Error(
				`[fuzz-suspense] base !== live for shape ${spec.name} (seed=${caseSeed})\n  base=${baseHtml}\n  live=${liveHtml}`,
			);
		}
	} finally {
		baseMount.unmount();
		liveMount?.unmount();
	}
}

describe('Suspense / tryBlock FUZZ — differential render', () => {
	it(`survives ${NUM_CASES} random suspend/resolve interleavings`, async () => {
		const root = makeRootRng('fuzz-suspense');
		for (let i = 0; i < NUM_CASES; i++) {
			const caseSeed = (root.next() * 0xffffffff) | 0;
			await runCase(caseSeed);
		}
	}, 60_000);
});

// One scenario that exercises the SSibling-A-only path which deliberately
// uses a never-resolved baseline. Splitting it out lets us assert the
// pending fallback is preserved even when the underlying promise will
// never settle — pinning the "no infinite retry" invariant.
describe('Suspense fuzz — never-resolved siblings stay in fallback', () => {
	it('a sibling whose promise never settles keeps its fallback in both renders', async () => {
		// Pin the seed so the case is reproducible regardless of NUM_CASES.
		const rng = makeRng(0xfeedbeef | 0);
		// Force the never-resolved variant: a few attempts in case the
		// shape picker rolls a different one — bail with a clear error
		// rather than silently testing a different shape.
		let spec;
		for (let i = 0; i < 16; i++) {
			const s = pickCase(rng);
			if (s.name === 'SSibling-A-only') {
				spec = s;
				break;
			}
		}
		if (!spec) throw new Error('could not pick SSibling-A-only shape');
		const { baseline, live, resolveLive } = spec.makeProps();
		const baseMount = mount(spec.component, baseline);
		const liveMount = mount(spec.component, live);
		await act(async () => {
			resolveLive();
		});
		// The resolved sibling shows the resolved class; the unresolved
		// sibling stays in fallback. Both mounts behave identically.
		expect(baseMount.html()).toBe(liveMount.html());
		// And the never-resolved fallback marker is present in BOTH.
		expect(liveMount.html()).toContain('class="f2"');
		baseMount.unmount();
		liveMount.unmount();
	});
});
