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
