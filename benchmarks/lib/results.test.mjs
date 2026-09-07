import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateResult, checkRatios, compareResults } from './results.mjs';
import { summarizeSamples, timingStatForJson } from './stats.mjs';
const stat = (n, unit = 'ms') => ({ score: n, median: n, min: n, samples: 3, unit });
const payload = () => ({
	suite: 'example',
	targets: [
		{ name: 'ripple', ops: { mount: stat(2) } },
		{ name: 'solid', ops: { mount: stat(1) } },
	],
});
test('missing, duplicate, malformed and failed results cannot pass', () => {
	assert.throws(() => validateResult(payload(), ['octane-tsrx']), /Missing required/);
	assert.throws(
		() => validateResult(payload(), ['ripple'], ['missing']),
		/Missing required operation/,
	);
	const duplicate = payload();
	duplicate.targets.push(duplicate.targets[0]);
	assert.throws(() => validateResult(duplicate, []), /Duplicate/);
	const invalid = payload();
	invalid.targets[0].ops.mount.score = NaN;
	assert.throws(() => validateResult(invalid, []), /Invalid score/);
	assert.throws(
		() => validateResult({ ...payload(), failed: 'identity lost' }, []),
		/identity lost/,
	);
	assert.throws(
		() => validateResult({ targets: [{ name: 'ripple', ops: {} }] }, []),
		/No operations/,
	);
	assert.equal(validateResult(payload(), ['ripple', 'solid']).targets.length, 2);
});
test('ratios enforce upper/lower bounds and fail on absent comparisons', () => {
	const guard = { suite: 'example', target: 'ripple', reference: 'solid', op: 'mount' };
	assert.equal(checkRatios(payload(), [{ ...guard, maxRatio: 1.5 }]).length, 1);
	assert.equal(checkRatios(payload(), [{ ...guard, minRatio: 3 }]).length, 1);
	assert.equal(checkRatios(payload(), [{ ...guard, maxRatio: 2 }]).length, 0);
	assert.throws(
		() => checkRatios(payload(), [{ ...guard, maxRatio: 'invalid' }]),
		/Invalid ratio bound/,
	);
	assert.throws(
		() => checkRatios(payload(), [{ ...guard, op: 'missing', maxRatio: 2 }]),
		/Missing ratio/,
	);
});
test('local comparisons distinguish timing noise and deterministic growth', () => {
	const before = payload(),
		after = payload();
	after.targets[0].ops.mount = stat(2.2);
	assert.deepEqual(compareResults(after, before), []);
	after.targets[0].ops.mount = stat(2.4);
	assert.equal(compareResults(after, before).length, 1);
	after.targets[0].ops.mount = stat(2.01, 'count');
	assert.equal(compareResults(after, before).length, 1);
	before.targets = [];
	assert.throws(() => compareResults(after, before), /Baseline missing/);
});
test('timing output retains ordered samples and scoring window', () => {
	const samples = [5, 4, 3, 2, 1, 1, 1, 1];
	const result = timingStatForJson(summarizeSamples(samples));
	assert.deepEqual(result.rawSamples, samples);
	assert.equal(result.unit, 'ms');
	assert.equal(result.direction, 'lower');
	assert.ok(Number.isInteger(result.scoreStart));
	assert.throws(() => summarizeSamples([1, NaN]), /non-finite/);
});

test('target selection preserves requested order and explicit capability gaps', async () => {
	const { selectTargets } = await import('./targets.mjs');
	assert.deepEqual(selectTargets(['ripple', 'solid', 'react'], 'react,ripple'), [
		'react',
		'ripple',
	]);
	assert.deepEqual(
		selectTargets([{ name: 'ripple' }, { name: 'solid' }], 'solid,vue-vapor,ripple'),
		[{ name: 'solid' }, { name: 'ripple' }],
	);
});

test('new competitor scenarios cannot silently omit Ripple', async () => {
	const { validateRippleCoverage } = await import('./results.mjs');
	const result = payload();
	validateRippleCoverage(result);
	result.targets[1].ops.newScenario = stat(1);
	assert.throws(() => validateRippleCoverage(result), /Missing Ripple scenario/);
	const manifest = JSON.parse(
		(await import('node:fs')).readFileSync(new URL('../suites.json', import.meta.url), 'utf8'),
	);
	for (const suite of manifest)
		assert.ok(
			suite.targets.some((target) => target.name === 'ripple'),
			`${suite.name} has no Ripple implementation`,
		);
});

test('workload fingerprints ignore recording tools but retain measured source', async () => {
	const fs = await import('node:fs');
	const os = await import('node:os');
	const path = await import('node:path');
	const { sourceHash } = await import('./fingerprint.mjs');
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ripple-fingerprint-'));
	try {
		fs.mkdirSync(path.join(root, 'benchmarks/fixture'), { recursive: true });
		fs.writeFileSync(path.join(root, 'benchmarks/bench.mjs'), 'recorder v1');
		fs.writeFileSync(path.join(root, 'benchmarks/fixture/run.mjs'), 'workload v1');
		const hash = () => sourceHash(root, [path.join(root, 'benchmarks')], { workload: true });
		const before = hash();
		fs.writeFileSync(path.join(root, 'benchmarks/bench.mjs'), 'recorder v2');
		assert.equal(hash(), before);
		fs.writeFileSync(path.join(root, 'benchmarks/fixture/run.mjs'), 'workload v2');
		assert.notEqual(hash(), before);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});
