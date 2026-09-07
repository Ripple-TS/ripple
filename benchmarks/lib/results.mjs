import assert from 'node:assert/strict';

export const scoreOf = (stat) => stat?.score ?? stat?.median;

export function validateResult(result, expected, requiredOperations = []) {
	assert.ok(!result.failed, result.failed);
	assert.ok(Array.isArray(result.targets) && result.targets.length, 'No benchmark targets');
	const names = new Set();
	for (const target of result.targets) {
		assert.ok(!names.has(target.name), `Duplicate target: ${target.name}`);
		names.add(target.name);
		assert.ok(Object.keys(target.ops ?? {}).length, `No operations: ${target.name}`);
		for (const op of requiredOperations)
			assert.ok(target.ops[op], `Missing required operation: ${target.name}/${op}`);
		for (const [op, stat] of Object.entries(target.ops)) {
			assert.ok(
				Number.isFinite(scoreOf(stat)) && scoreOf(stat) >= 0,
				`Invalid score: ${target.name}/${op}`,
			);
			assert.ok(
				Number.isFinite(stat.min) && stat.min >= 0,
				`Invalid minimum: ${target.name}/${op}`,
			);
			assert.ok(
				Number.isInteger(stat.samples) && stat.samples > 0,
				`Missing samples: ${target.name}/${op}`,
			);
		}
	}
	for (const name of expected) assert.ok(names.has(name), `Missing required target: ${name}`);
	return result;
}

export function compareResults(result, baseline) {
	const failures = [];
	for (const target of result.targets) {
		const old = baseline.targets.find((t) => t.name === target.name);
		assert.ok(old, `Baseline missing target ${target.name}`);
		for (const op of Object.keys(old.ops))
			assert.ok(target.ops[op], `Result missing operation ${target.name}/${op}`);
		for (const [op, stat] of Object.entries(target.ops)) {
			const before = old.ops[op];
			assert.ok(before, `Baseline missing operation ${target.name}/${op}`);
			const now = scoreOf(stat),
				base = scoreOf(before);
			const deterministic = stat.unit !== 'ms';
			const regressed = deterministic
				? now > base
				: now > base * 1.15 && stat.min > before.min * 1.1 && (base >= 1 || now - base > 0.1);
			if (regressed) failures.push(`${target.name}/${op}: ${now} > ${base}`);
		}
	}
	return failures;
}

export function checkRatios(result, guards) {
	const failures = [];
	for (const guard of guards.filter((g) => g.suite === result.suite)) {
		assert.ok(
			guard.maxRatio !== undefined || guard.minRatio !== undefined,
			'Ratio guard needs a bound',
		);
		for (const bound of [guard.maxRatio, guard.minRatio])
			if (bound !== undefined) {
				assert.ok(Number.isFinite(bound) && bound >= 0, 'Invalid ratio bound');
			}
		const a = result.targets.find((t) => t.name === guard.target)?.ops[guard.op];
		const b = result.targets.find((t) => t.name === guard.reference)?.ops[guard.op];
		assert.ok(a && b, `Missing ratio comparison: ${guard.target}/${guard.reference}/${guard.op}`);
		assert.ok(scoreOf(b) > 0, 'Ratio reference must be positive');
		const ratio = scoreOf(a) / scoreOf(b);
		if (
			(guard.maxRatio !== undefined && ratio > guard.maxRatio) ||
			(guard.minRatio !== undefined && ratio < guard.minRatio)
		)
			failures.push(`${guard.op}: ${guard.target}/${guard.reference} = ${ratio}`);
	}
	return failures;
}

// Whenever Ripple is selected, every measured scenario needs its Ripple row.
// SSR throughput uses names such as news-50/ripple, hence the group prefix.
export function validateRippleCoverage(result) {
	for (const target of result.targets) {
		const split = target.name.lastIndexOf('/');
		const prefix = split < 0 ? '' : target.name.slice(0, split + 1);
		const ripple = result.targets.find((row) => row.name === prefix + 'ripple');
		assert.ok(ripple, `Missing Ripple implementation: ${result.suite}/${prefix}`);
		for (const operation of Object.keys(target.ops)) {
			assert.ok(
				ripple.ops[operation],
				`Missing Ripple scenario: ${result.suite}/${prefix}${operation}`,
			);
		}
	}
}
