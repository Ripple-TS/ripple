import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inventoryTests } from '../../scripts/inventory-upstream.js';

const inventory = JSON.parse(
	readFileSync(new URL('../../upstream/tests.json', import.meta.url), 'utf8'),
);

describe('upstream test accounting', () => {
	it('records parameterized families, inherited skips, and original lines without comments', () => {
		const tests = inventoryTests(
			`
// test('commented out', () => {})
describe.skip('suite', () => {
  test.each([1, 2])('case %s', () => {})
  it.todo('later')
  test(name + ' dynamic', () => {})
})
`,
			'fixture.tsx',
		);
		expect(tests).toEqual([
			{ line: 4, title: 'suite > case %s', modifiers: ['each', 'skip'] },
			{ line: 5, title: 'suite > later', modifiers: ['skip', 'todo'] },
			{ line: 6, title: "suite > name + ' dynamic'", modifiers: ['skip'] },
		]);
	});

	it('accounts for every recorded test without counting deferred cases as passing', () => {
		const ids = new Set();
		for (const file of inventory.files) {
			expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);
			if (!file.tests) continue;
			expect(file.tests.length, file.file).toBeGreaterThan(0);
			for (const test of file.tests) {
				const id = `${file.file}:${test.line}`;
				expect(ids.has(id), id).toBe(false);
				ids.add(id);
				const mapping = file.overrides[test.line] ?? file.mapping;
				expect(['ported', 'deferred', 'inapplicable']).toContain(mapping.status);
				if (mapping.status === 'ported') {
					expect(mapping.rippleTests.length, id).toBeGreaterThan(0);
					for (const path of mapping.rippleTests) {
						expect(
							readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').length,
						).toBeGreaterThan(0);
					}
				} else {
					expect(mapping.reason.length, id).toBeGreaterThan(0);
				}
			}
			for (const line of Object.keys(file.overrides)) {
				expect(file.tests.some((test) => test.line === Number(line))).toBe(true);
			}
		}
		expect(inventory.files.filter((file) => file.kind === 'types')).toHaveLength(19);
		expect(inventory.files.filter((file) => ['client', 'server'].includes(file.kind))).toHaveLength(
			69,
		);
	});
});

// An upgrade must not silently inherit a passing mapping after source changes.
it('reports added, removed and changed sources, including assertion-only edits', async () => {
	const { compareSources } = await import('../../scripts/audit-upstream.js');
	const test = { line: 1, title: 'navigation', modifiers: [] };
	const previous = [
		{ file: 'changed.tsx', sha256: 'old', tests: [test] },
		{ file: 'removed.tsx', sha256: 'gone', tests: [test] },
		{ file: 'same.tsx', sha256: 'same', tests: [test] },
	];
	const current = [
		{ file: 'changed.tsx', sha256: 'new', tests: [test] },
		{ file: 'added.tsx', sha256: 'added', tests: [test] },
		{ file: 'same.tsx', sha256: 'same', tests: [test] },
	];
	expect(compareSources(previous, current).map(({ file, change }) => ({ file, change }))).toEqual([
		{ file: 'added.tsx', change: 'added' },
		{ file: 'changed.tsx', change: 'changed' },
		{ file: 'removed.tsx', change: 'removed' },
	]);
});

it('rejects stale mappings and unfinished client cases without hiding upstream skips', async () => {
	const { reportMappings } = await import('../../scripts/audit-upstream.js');
	const { upstreamCommit } = await import('../../scripts/inventory-upstream.js');
	const report = reportMappings([
		{
			commit: upstreamCommit,
			files: [
				{
					file: 'client.tsx',
					tests: [{ line: 1, title: 'navigation', modifiers: ['skip'] }],
					mapping: { status: 'deferred', milestone: 4, reason: 'Not ported' },
					overrides: { 2: { status: 'ported' } },
				},
			],
		},
	]);
	expect(report.missing).toEqual([
		'client.tsx:1: unfinished client/type case',
		'client.tsx:2: stale override',
	]);
	expect(report.skipped).toHaveLength(1);
	expect(report.deferred).toHaveLength(1);
	expect(report.ported).toHaveLength(0);
});

it('closes the client/type gate for both pinned framework inventories', async () => {
	const { reportMappings } = await import('../../scripts/audit-upstream.js');
	const react = JSON.parse(
		readFileSync(new URL('../../upstream/react-tests.json', import.meta.url), 'utf8'),
	);
	const report = reportMappings([inventory, react]);
	expect(report.missing).toEqual([]);
	expect(report.deferred.every((entry) => entry.reason.length > 0)).toBe(true);
	// The source skip remains auditable even though the Ripple port runs the case.
	expect(report.skipped.some((entry) => entry.id.endsWith('routeContext.test.tsx:1585'))).toBe(
		true,
	);
});
