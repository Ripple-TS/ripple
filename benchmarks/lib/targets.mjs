// Preserve an explicit target order so repeated baselines can expose order drift.
export function selectTargets(targets, selection = process.env.BENCH_TARGETS) {
	if (!selection) return targets;
	const names = selection
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
	return names.flatMap((name) =>
		targets.filter((target) => (typeof target === 'string' ? target : target.name) === name),
	);
}
