// Compare two saved runs without rebuilding or retiming the fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { validateResult, compareResults, scoreOf } from './lib/results.mjs';
const [baselineDir, resultDir, ...selected] = process.argv.slice(2);
if (!baselineDir || !resultDir)
	throw Error('Usage: node benchmarks/compare.mjs <baseline-dir> <result-dir> [suite ...]');
const names = selected.length
	? selected
	: fs
			.readdirSync(resultDir)
			.filter((name) => name.endsWith('.json') && name !== 'summary.json' && !name.startsWith('_'))
			.map((name) => name.slice(0, -5));
if (!names.length) throw Error('No saved suite results found');
const summary = [];
for (const suite of names) {
	const current = JSON.parse(fs.readFileSync(path.join(resultDir, `${suite}.json`), 'utf8'));
	const baseline = JSON.parse(fs.readFileSync(path.join(baselineDir, `${suite}.json`), 'utf8'));
	validateResult(baseline, []);
	validateResult(
		current,
		baseline.targets.map((target) => target.name),
	);
	if (current.suite !== baseline.suite) throw Error('Mismatched suite results');
	if ((current.meta?.cpuThrottle ?? 1) !== (baseline.meta?.cpuThrottle ?? 1))
		throw Error('Incompatible CPU throttle rates');
	for (const field of [
		'cpu',
		'platform',
		'arch',
		'node',
		'quick',
		'lockfileSha256',
		'workloadSha256',
	]) {
		if (current.meta?.[field] !== baseline.meta?.[field])
			throw Error(`Incompatible ${suite} baseline metadata: ${field}`);
	}
	const failures = compareResults(current, baseline);
	let faster = 0;
	for (const target of current.targets)
		for (const [op, stat] of Object.entries(target.ops)) {
			const before = baseline.targets.find((row) => row.name === target.name)?.ops[op];
			if (before && scoreOf(stat) < scoreOf(before)) faster++;
		}
	summary.push({
		suite,
		regressions: failures.length,
		lowerScores: faster,
		status: failures.length ? 'FAIL' : 'PASS',
	});
	for (const failure of failures) console.log(`${suite}: ${failure}`);
}
console.table(summary);
console.log(
	'Lower scores are observations, not proof of a timing win; inspect uncertainty and repeat runs.',
);
process.exitCode = summary.some((row) => row.status === 'FAIL') ? 1 : 0;
