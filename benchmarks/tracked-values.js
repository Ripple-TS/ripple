import { Bench } from 'tinybench';
import { tracked, derived, get, set, root } from 'ripple/internal/client';

const SCALES = [10, 100, 1_000, 10_000, 100_000];

/**
 * Run benchmarks for tracked value operations at a given scale.
 * @param {number} n - Number of tracked values to create
 */
async function run_suite(n) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`  Tracked Values Benchmark — n = ${n.toLocaleString()}`);
	console.log(`${'='.repeat(60)}\n`);

	/** @type {import('ripple/internal/client').Block} */
	let block;

	// Create a root block context (required by tracked/derived)
	root(() => {
		// Grab the block from the first tracked value we create inside root
		const probe = tracked(0);
		block = probe.b;
	});

	const bench = new Bench({
		warmupIterations: 100,
		iterations: 1000,
		time: 2000,
	});

	// Pre-allocate arrays for setup/teardown
	let values;
	let derived_values;

	// ── Creation ──────────────────────────────────────────────
	bench.add(`create ${n.toLocaleString()} tracked values`, () => {
		const arr = new Array(n);
		for (let i = 0; i < n; i++) {
			arr[i] = tracked(i, block);
		}
		values = arr;
	});

	// ── Read ─────────────────────────────────────────────────
	bench.add(
		`read ${n.toLocaleString()} tracked values`,
		() => {
			let sum = 0;
			for (let i = 0; i < values.length; i++) {
				sum += get(values[i]);
			}
			return sum;
		},
		{
			beforeAll() {
				values = new Array(n);
				for (let i = 0; i < n; i++) {
					values[i] = tracked(i, block);
				}
			},
		},
	);

	// ── Write ────────────────────────────────────────────────
	bench.add(
		`write ${n.toLocaleString()} tracked values`,
		() => {
			for (let i = 0; i < values.length; i++) {
				set(values[i], i + 1);
			}
		},
		{
			beforeAll() {
				values = new Array(n);
				for (let i = 0; i < n; i++) {
					values[i] = tracked(i, block);
				}
			},
			beforeEach() {
				// Reset values so set() detects a change each iteration
				for (let i = 0; i < values.length; i++) {
					values[i].__v = i;
				}
			},
		},
	);

	// ── Write then Read (dirty-check path) ───────────────────
	bench.add(
		`write+read ${n.toLocaleString()} tracked values`,
		() => {
			for (let i = 0; i < values.length; i++) {
				set(values[i], i + 1);
			}
			let sum = 0;
			for (let i = 0; i < values.length; i++) {
				sum += get(values[i]);
			}
			return sum;
		},
		{
			beforeAll() {
				values = new Array(n);
				for (let i = 0; i < n; i++) {
					values[i] = tracked(i, block);
				}
			},
			beforeEach() {
				for (let i = 0; i < values.length; i++) {
					values[i].__v = i;
				}
			},
		},
	);

	// ── Derived creation + read ──────────────────────────────
	bench.add(
		`create+read ${n.toLocaleString()} derived values`,
		() => {
			const arr = new Array(n);
			for (let i = 0; i < n; i++) {
				arr[i] = derived(() => get(values[i]) * 2, block);
			}
			let sum = 0;
			for (let i = 0; i < arr.length; i++) {
				sum += get(arr[i]);
			}
			return sum;
		},
		{
			beforeAll() {
				values = new Array(n);
				for (let i = 0; i < n; i++) {
					values[i] = tracked(i, block);
				}
			},
		},
	);

	await bench.run();

	console.table(
		bench.tasks.map((task) => ({
			Task: task.name,
			'ops/sec': Math.round(task.result.hz).toLocaleString(),
			'Mean (ms)': task.result.mean.toFixed(4),
			'P75 (ms)': task.result.p75.toFixed(4),
			'P99 (ms)': task.result.p99.toFixed(4),
			Margin: `±${task.result.rme.toFixed(2)}%`,
			Samples: task.result.samples.length,
		})),
	);

	// ── Sanity check ─────────────────────────────────────────
	const t = tracked(42, block);
	if (get(t) !== 42) throw new Error('Sanity check failed: initial get');
	set(t, 99);
	if (get(t) !== 99) throw new Error('Sanity check failed: get after set');

	const d = derived(() => get(t) * 2, block);
	if (get(d) !== 198) throw new Error('Sanity check failed: derived get');
}

// ── Main ──────────────────────────────────────────────────────
console.log('Ripple Tracked Values Benchmark');
console.log(`Node ${process.version} — ${process.platform} ${process.arch}`);
console.log(`Date: ${new Date().toISOString()}`);

for (const n of SCALES) {
	await run_suite(n);
}

console.log('\nDone.');
