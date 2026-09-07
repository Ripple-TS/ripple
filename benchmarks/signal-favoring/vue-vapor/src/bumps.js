// Module-level bump registry. Each stateful CN registers its bump closure at
// setup time (vapor bodies run once; the closure stays valid for the app
// lifetime) — the equivalent of the sibling fixtures' module-level `_setN`
// variables, just keyed by index because the chain lives in 100 SFC files
// (Vue: one component per SFC) instead of one module.
const bumps = {};

export function register(i, fn) {
	bumps[i] = fn;
}

export function bumpAt(i) {
	const fn = bumps[i];
	if (fn) fn();
}
