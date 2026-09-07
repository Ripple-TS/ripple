import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const RECORDING_TOOLS = new Set([
	'benchmarks/bench.mjs',
	'benchmarks/compare.mjs',
	'benchmarks/report.mjs',
	'benchmarks/lib/results.mjs',
	'benchmarks/lib/fingerprint.mjs',
]);

// Timed harnesses, fixtures, build configuration, statistics and dependencies
// define the workload. Reporting/validation changes get a separate runner hash.
export function sourceHash(root, roots, { workload = false } = {}) {
	const hash = createHash('sha256');
	function walk(dir) {
		for (const entry of fs
			.readdirSync(dir, { withFileTypes: true })
			.sort((a, b) => a.name.localeCompare(b.name))) {
			if (
				[
					'node_modules',
					'dist',
					'results',
					'baselines',
					'.compiled',
					'.vite',
					'.vite-temp',
				].includes(entry.name)
			)
				continue;
			const file = path.join(dir, entry.name);
			const relative = path.relative(root, file).split(path.sep).join('/');
			if (workload && (RECORDING_TOOLS.has(relative) || relative.endsWith('.test.mjs'))) continue;
			if (entry.isDirectory()) walk(file);
			else if (/\.(?:[cm]?js|jsx|tsx?|tsrx|vue|svelte|html|css|json)$/.test(entry.name))
				hash.update(relative).update(fs.readFileSync(file));
		}
	}
	for (const dir of roots) walk(dir);
	return hash.digest('hex');
}
