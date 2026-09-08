// Operation-level paired comparison; never combines unlike units into one score.
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const dirs = args.filter((arg) => !arg.startsWith('--'));
const output = path.resolve(
	args.find((arg) => arg.startsWith('--output='))?.slice(9) ??
		'benchmarks/results/baseline-report.md',
);
if (dirs.length < 3) throw Error('Provide at least three independent normal result directories');
const summaries = dirs.map((dir) =>
	JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8')),
);
for (const summary of summaries) {
	if (summary.metadata.quick) throw Error('A quick smoke pass cannot establish a normal baseline');
	if (summary.summary.some((suite) => suite.status !== 'PASS'))
		throw Error('All baseline suites must pass');
	for (const field of [
		'cpu',
		'platform',
		'arch',
		'node',
		'lockfileSha256',
		'workloadSha256',
		'rippleSourceSha256',
	])
		if (summary.metadata[field] !== summaries[0].metadata[field])
			throw Error(`Incompatible baseline metadata: ${field}`);
}
const median = (values) => values.slice().sort((a, b) => a - b)[values.length >> 1];
const score = (stat) => stat.score ?? stat.median;
const fmt = (value) =>
	value == null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(3);
const rows = [];
for (const { suite } of summaries[0].summary) {
	const runs = dirs.map((dir) =>
		JSON.parse(fs.readFileSync(path.join(dir, `${suite}.json`), 'utf8')),
	);
	for (const ripple of runs[0].targets.filter(
		(target) => target.name === 'ripple' || target.name.endsWith('/ripple'),
	)) {
		const prefix = ripple.name === 'ripple' ? '' : ripple.name.slice(0, -6);
		for (const [operation, first] of Object.entries(ripple.ops)) {
			const samples = runs.map(
				(run) => run.targets.find((target) => target.name === ripple.name)?.ops[operation],
			);
			if (samples.some((stat) => !stat))
				throw Error(`Missing Ripple operation: ${suite}/${operation}`);
			const values = samples.map(score);
			const competitors = runs[0].targets
				.filter(
					(target) =>
						target.name !== ripple.name &&
						!target.name.includes('-dialect-pair') &&
						target.name.startsWith(prefix) &&
						target.ops[operation],
				)
				.map((target) => {
					const stats = runs.map(
						(run) => run.targets.find((row) => row.name === target.name)?.ops[operation],
					);
					if (stats.some((stat) => !stat))
						throw Error(`Missing competitor: ${target.name}/${operation}`);
					return {
						name: target.name.slice(prefix.length),
						score: median(stats.map(score)),
						scores: stats.map(score),
					};
				})
				.sort((a, b) => a.score - b.score);
			const row = {
				suite,
				group: prefix.replace(/\/$/, ''),
				operation,
				unit: first.unit ?? 'ms',
				score: median(values),
				minScore: Math.min(...values),
				maxScore: Math.max(...values),
				p95: median(samples.map((stat) => stat.p95 ?? score(stat))),
				rme: Math.max(...samples.map((stat) => stat.scoreRme ?? stat.rme ?? 0)),
				samples: samples.reduce((sum, stat) => sum + stat.samples, 0),
				competitors,
				best: competitors[0] ?? null,
			};
			rows.push(row);
		}
	}
}
const meta = summaries[0].metadata;
const lines = [
	'# Ripple benchmark baseline',
	'',
	`Recorded from ${dirs.length} independent normal runs on ${meta.cpu}, ${meta.platform}/${meta.arch}, Node ${meta.node}.`,
	'',
	`Workload SHA-256: \`${meta.workloadSha256}\`.`,
	`Lockfile SHA-256: \`${meta.lockfileSha256}\`.`,
	'',
	'These are baseline observations before Ripple optimization. Scores below are medians of the per-run headline scores; the range shows run-to-run variation. The p95 column is the median of the per-run p95 values. RME remains a per-run diagnostic; neither is proof of a timing win. Each ratio column is Ripple's score divided by that framework's score, so values below 1 mean Ripple is faster. For timings below 0.01 ms or a zero reference, the comparison shows an absolute difference instead. N/A means that operation has no matching competitor fixture.',
	'',
	'## Verified environment',
	'',
	'```json',
	JSON.stringify(meta.packageVersions, null, 2),
	'```',
	'',
	'## Largest timing gaps to investigate later',
	'',
	'These candidates are ranked by absolute time difference from the best matching competitor, without starting performance work.',
	'',
];
const gaps = rows
	.filter((row) => row.unit === 'ms' && row.best && row.score - row.best.score > 0.1)
	.sort((a, b) => b.score - b.best.score - (a.score - a.best.score))
	.slice(0, 10);
for (const row of gaps)
	lines.push(
		`- ${row.suite}${row.group ? '/' + row.group : ''} / ${row.operation}: Ripple ${fmt(row.score)} ms, ${row.best.name} ${fmt(row.best.score)} ms; gap ${fmt(row.score - row.best.score)} ms.`,
	);
const comparison = (row, name) => {
	const other = row.competitors.find((target) => target.name === name);
	if (!other) return 'N/A';
	return other.score === 0 || (row.unit === 'ms' && Math.min(row.score, other.score) < 0.01)
		? `Δ ${fmt(row.score - other.score)}`
		: `${(row.score / other.score).toFixed(2)}×`;
};
for (const suite of [...new Set(rows.map((row) => row.suite))]) {
	lines.push(
		'',
		`## ${suite}`,
		'',
		'| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Ripple ÷ Octane TSRX | Ripple ÷ Octane JSX | Ripple ÷ Solid | Ripple ÷ Vue Vapor | Best matching competitor |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
	);
	for (const row of rows.filter((row) => row.suite === suite))
		lines.push(
			`| ${row.group ? row.group + '/' : ''}${row.operation} | ${row.unit} | ${fmt(row.score)} [${fmt(row.minScore)}, ${fmt(row.maxScore)}] | ${fmt(row.p95)} | ${row.rme.toFixed(1)}% | ${row.samples} | ${comparison(row, 'octane-tsrx')} | ${comparison(row, 'octane-jsx')} | ${comparison(row, 'solid')} | ${comparison(row, 'vue-vapor')} | ${row.best ? `${row.best.name}: ${fmt(row.best.score)}` : 'N/A'} |`,
		);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lines.join('\n') + '\n');
fs.writeFileSync(
	output.replace(/\.md$/, '.json'),
	JSON.stringify({ metadata: meta, directories: dirs, rows }, null, 2) + '\n',
);
console.log(`Wrote ${rows.length} Ripple operations to ${output}`);
