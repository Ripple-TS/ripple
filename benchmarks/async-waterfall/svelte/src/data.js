// Simulated per-level fetch: DELAY ms latency, cached per (level, version) so
// repeated render attempts of the same version reuse ONE promise (React/Octane
// `use` re-executes the component while suspended — a fresh promise per attempt
// would never settle the tree). Identical file in every target app.
export const LEVELS = 10;
export const DELAY = 16;

const cache = new Map();

export function fetchData(level, version) {
	const key = level + ':' + version;
	let p = cache.get(key);
	if (p === undefined) {
		p = new Promise((resolve) => {
			setTimeout(() => resolve('L' + level + ':v' + version), DELAY);
		});
		cache.set(key, p);
	}
	return p;
}
