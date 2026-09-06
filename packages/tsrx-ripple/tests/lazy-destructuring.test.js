import { describe, expect, it } from 'vitest';
import * as client from '../../ripple/src/runtime/internal/client/index.js';
import * as server from '../../ripple/src/runtime/internal/server/index.js';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { check_types, find_exact_mapping } from './test-utils.js';

function compile_test(source, mode) {
	const { code, errors } = compile(source, 'lazy.tsrx', { mode });
	expect(errors).toEqual([]);
	const body = code.replace(/^import \* as _\$_ from 'ripple\/internal\/(?:client|server)';\n/, '');
	return new Function('_$_', `${body}\nreturn test;`)(mode === 'client' ? client : server);
}

for (const mode of ['client', 'server']) {
	describe(`lazy destructuring in ${mode} output`, () => {
		it.each(['const &{ value }', 'let &{ value }', '&{ value }'])(
			'keeps %s loop reads lazy and captures each iteration',
			(target) => {
				const test = compile_test(
					`function test(items) {
					const value = 'outer';
					const reads = [];
					for (${target} of items) {
						reads.push(() => value);
					}
					items[0].value = 10;
					items[1].value = 20;
					return [reads.map(read => read()), value];
				}`,
					mode,
				);
				expect(test([{ value: 1 }, { value: 2 }])).toEqual([[10, 20], 'outer']);
			},
		);

		it.each(['const &[first]', '&[first]'])(
			'handles %s in for-in loops with a non-block body',
			(target) => {
				const test = compile_test(
					`function test(items) {
					const result = [];
					for (${target} in items) result.push(first);
					return result;
				}`,
					mode,
				);
				expect(test({ apple: 1, banana: 2 })).toEqual(['a', 'b']);
			},
		);

		it.each(['const [&{ value }]', '[&{ value }]'])('handles nested %s loop targets', (target) => {
			const test = compile_test(
				`function test(items) {
					const reads = [];
					for (${target} of items) reads.push(() => value);
					items[0][0].value = 5;
					return reads.map(read => read());
				}`,
				mode,
			);
			expect(test([[{ value: 1 }]])).toEqual([5]);
		});

		it('supports bare for-await targets', async () => {
			const test = compile_test(
				`async function test(items) {
				const reads = [];
				for await (&{ value } of items) reads.push(() => value);
				items[0].value = 9;
				return reads.map(read => read());
			}`,
				mode,
			);
			expect(await test([{ value: 1 }])).toEqual([9]);
		});

		it('preserves eager assignment loop targets', () => {
			const test = compile_test(
				`function test(items) {
				let value;
				for ({ value } of items) {}
				return value;
			}`,
				mode,
			);
			expect(test([{ value: 4 }])).toBe(4);
		});

		it('rewrites classic loop initializers, tests, updates and bodies', () => {
			const test = compile_test(
				`function test(pair) {
				const result = [];
				for (let &[i] = pair, start = i; i < 3; i++) {
					result.push([start, i]);
				}
				return result;
			}`,
				mode,
			);
			const pair = [0];
			expect(test(pair)).toEqual([
				[0, 0],
				[0, 1],
				[0, 2],
			]);
			expect(pair).toEqual([3]);
		});

		it('preserves defaults, computed keys and nested writable declarations', () => {
			const test = compile_test(
				`function test(item) {
				const key = 'value';
				let { child: &{ [key]: value = 2 } } = item;
				value++;
				value += 3;
				return value;
			}`,
				mode,
			);
			const item = { child: {} };
			expect(test(item)).toBe(6);
			expect(item.child.value).toBe(6);
		});

		it('keeps nested array defaults lazy', () => {
			const test = compile_test(
				`function test(pair, fallback) {
				const [&{ value } = fallback] = pair;
				fallback.value = 7;
				return value;
			}`,
				mode,
			);
			expect(test([], { value: 1 })).toBe(7);
		});

		it('keeps body shadowing separate from the loop binding', () => {
			const test = compile_test(
				`function test(items) {
				const result = [];
				for (&{ value } of items) {
					result.push(value);
					{ const value = 'inner'; result.push(value); }
				}
				return result;
			}`,
				mode,
			);
			expect(test([{ value: 3 }])).toEqual([3, 'inner']);
		});

		it.each([
			'if (cond) &{ value } = item;',
			'while (cond) &{ value } = item;',
			'label: &{ value } = item;',
			'[&{ value }] = items;',
			'[&{ value }] = items, done();',
			'result = [&{ value }] = items;',
		])('rejects unsupported assignment position: %s', (statement) => {
			expect(() => compile(`function test() { ${statement} }`, 'lazy.tsrx', { mode })).toThrow(
				'Lazy destructuring assignments require',
			);
		});
	});
}

it('preserves author bindings in editor output for bare and nested loop targets', () => {
	const source = `function test(items: { value: number }[]) {
		const result: number[] = [];
		for (&{ value } of items) result.push(value);
		for (const [&{ value }] of [items]) result.push(value);
		return result;
	}`;
	const result = compile_to_volar_mappings(source, 'lazy.tsrx');
	expect(result.errors).toEqual([]);
	expect(result.code).toContain('for (const { value } of items)');
	expect(result.code).toContain('for (const [{ value }] of [items])');
	expect(check_types(result.code).errors).toEqual([]);
});

it.each([
	'for (&[first] in { apple: 1 }) { const letter: string = first; }',
	'for (const &{ length } in { apple: 1 }) { const size: number = length; }',
	'for (let &[first] in { apple: 1 }) { first = \"b\"; { const first = 1; } }',
	'for (let &[i] = [0]; i < 3; i++) { const value: number = i; }',
	'let { child: &{ value = 2 } } = { child: { value: 1 } }; value++;',
	'const [&{ value } = { value: 1 }] = []; const result: number = value;',
	'for await (&{ value } of [{ value: 1 }]) { const result: number = value; }',
])('typechecks lazy patterns in client to_ts output: %s', (statement) => {
	const result = compile_to_volar_mappings(`async function test() { ${statement} }`, 'lazy.tsrx');
	expect(result.errors).toEqual([]);
	expect(check_types(result.code).errors).toEqual([]);
});

it.each(['of', 'in'])(
	'maps bare for-%s bindings and references to their authored identifiers',
	(operator) => {
		const source = `function test(items: { value: number }[]) {
		for (&{ value } ${operator} items) { console.log(value); }
	}`;
		const result = compile_to_volar_mappings(source, 'lazy.tsrx');
		for (const needle of ['value }', 'value);']) {
			expect(
				find_exact_mapping(
					result.mappings,
					source.indexOf(needle),
					result.code.indexOf(needle),
					'value'.length,
				),
			).toBeDefined();
		}
	},
);

it.each(['of', 'in'])('reports binding type errors in for-%s editor output', (operator) => {
	const pattern = operator === 'of' ? '&{ value }' : '&{ length: value }';
	const source = `function test() {
		for (${pattern} ${operator} [{ value: 1 }]) {
			const invalid: string = value;
		}
	}`;
	const result = compile_to_volar_mappings(source, 'lazy.tsrx');
	expect(check_types(result.code).errors).toEqual([
		"Type 'number' is not assignable to type 'string'.",
	]);
});
