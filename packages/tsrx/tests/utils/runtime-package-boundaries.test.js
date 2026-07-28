import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { map_iterable as map_iterable_from_core } from '@tsrx/core/runtime/iterable';
import { create_ref_prop as create_ref_prop_from_core } from '@tsrx/core/runtime/ref';
import { map_iterable } from '@tsrx/runtime/iterable';
import { create_ref_prop } from '@tsrx/runtime/ref';

const runtime_packages = [
	'tsrx-runtime',
	'tsrx-react-runtime',
	'tsrx-preact-runtime',
	'tsrx-solid-runtime',
	'tsrx-vue-runtime',
];

describe('runtime package boundaries', () => {
	it('keeps compatibility exports wired to the shared runtime implementation', () => {
		expect(map_iterable_from_core).toBe(map_iterable);
		expect(create_ref_prop_from_core).toBe(create_ref_prop);
		expect(map_iterable(new Set(['a', 'b']), (value) => value.toUpperCase())).toEqual(['A', 'B']);
	});

	it.each(runtime_packages)('%s has no compiler dependency', async (directory) => {
		const package_json = JSON.parse(
			await readFile(new URL(`../../../${directory}/package.json`, import.meta.url), 'utf8'),
		);
		const dependencies = {
			...package_json.dependencies,
			...package_json.optionalDependencies,
		};

		expect(dependencies).not.toHaveProperty('@tsrx/core');
		expect(Object.keys(dependencies)).not.toContainEqual(
			expect.stringMatching(/^@tsrx\/(react|preact|solid|vue)$/),
		);
	});
});
