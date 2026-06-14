// Tiny deterministic PRNG shared by ripple-new fuzz harnesses. Inline
// mulberry32 (6 lines of state) seeded from a string hash so:
//   - no `seedrandom` / `fast-check` dep on the test path
//   - same seed → same case stream forever (CI repro = one env var)
//   - safe to use across vitest workers (state lives in the closure)
//
// The seed is sourced once at module import: `RIPPLE_FUZZ_SEED` env var
// if set, otherwise the literal string 'default'. Tests that want a per-
// case sub-PRNG should call `makeRng(seed)` with a 32-bit int and use
// the returned next()/pick()/intBetween() helpers.

export function hashStringTo32Bit(s: string): number {
	// FNV-1a 32-bit — collision-resistant enough for seed derivation and
	// short enough to inline; we only need uniform spread, not crypto.
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

export interface FuzzRng {
	/** Uniform float in [0, 1). */
	next(): number;
	/** Uniform integer in [0, max) (exclusive). max=0 returns 0. */
	intBelow(max: number): number;
	/** Uniform integer in [lo, hi] (inclusive). */
	intBetween(lo: number, hi: number): number;
	/** Uniform pick from a non-empty array. Throws on empty. */
	pick<T>(arr: readonly T[]): T;
	/** Weighted pick: weights[i] is relative weight for items[i]. */
	weighted<T>(items: readonly T[], weights: readonly number[]): T;
	/** Bernoulli: true with probability p ∈ [0,1]. */
	bool(p?: number): boolean;
	/** Re-emit the seed that drove THIS rng (for failure logs). */
	readonly seed: number;
}

/**
 * mulberry32: 4-line PRNG with a 2^32 period — sufficient for fuzz cases
 * that run a few hundred iterations × a few dozen actions each. The
 * returned object is the only state; deterministic across runs.
 */
export function makeRng(seed: number): FuzzRng {
	let state = seed >>> 0;
	const next = () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const intBelow = (max: number) => {
		if (max <= 0) return 0;
		return Math.floor(next() * max);
	};
	const intBetween = (lo: number, hi: number) => lo + intBelow(hi - lo + 1);
	const pick = <T>(arr: readonly T[]): T => {
		if (arr.length === 0) throw new Error('pick(): empty array');
		return arr[intBelow(arr.length)];
	};
	const weighted = <T>(items: readonly T[], weights: readonly number[]): T => {
		let total = 0;
		for (const w of weights) total += w;
		const r = next() * total;
		let acc = 0;
		for (let i = 0; i < items.length; i++) {
			acc += weights[i];
			if (r < acc) return items[i];
		}
		return items[items.length - 1];
	};
	const bool = (p = 0.5) => next() < p;
	return { next, intBelow, intBetween, pick, weighted, bool, seed };
}

/**
 * Root RNG for a given suite name. Reads `RIPPLE_FUZZ_SEED` from env if
 * present, falls back to 'default'. Suite name is mixed in so two fuzz
 * files don't trade state when run together.
 */
export function makeRootRng(suite: string): FuzzRng {
	const envSeed =
		(typeof process !== 'undefined' && process.env && process.env.RIPPLE_FUZZ_SEED) || 'default';
	return makeRng(hashStringTo32Bit(`${envSeed}::${suite}`));
}
