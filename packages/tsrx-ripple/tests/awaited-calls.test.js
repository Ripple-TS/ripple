import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe.each([false, true])('awaited calls (hydration: %s)', (hydration) => {
	it.each([
		'Object.values(await read()).length',
		'consume(await read())',
		'consume(first(), await read(), last())',
		'consume(...await read())',
		'object[await key()](await read())',
		'(await read())(await read())',
		'object?.method(await read())',
		'object.method?.(await read())',
		'object?.nested.method(await read()).value',
		'(object?.method)(await read())',
		'object?.[await key()]?.(await read())',
		'consume(async () => await read())',
		'new Constructor(await read())',
	])('emits valid JavaScript for %s', (expression) => {
		const source = `export function Example({ read, consume, first, last, object, key, Constructor }) @{
			async function report() { return ${expression}; }
			<button onClick={() => report()}>Read</button>
		}`;
		for (const mode of ['client', 'server']) {
			const { code, errors } = compile(source, 'Example.tsrx', { mode, hydration });
			expect(errors).toEqual([]);
			expect(() =>
				acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
			).not.toThrow();
		}
	});

	it('retains Ripple intrinsic lowering inside optional chains', () => {
		const { code, errors } = compile(
			`import { track } from 'ripple';
			export function Example({ read }) @{
				async function report() { return track(await read())?.value; }
				<button onClick={report}>Read</button>
			}`,
			'Example.tsrx',
			{ hydration },
		);
		expect(errors).toEqual([]);
		expect(code).toContain('_$_.track(await');
		expect(() => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })).not.toThrow();
	});

	it('handles awaited calls through aliased Ripple imports', () => {
		const { code, errors } = compile(
			`import { flushSync as flush } from 'ripple';
			export function Example({ read }) @{
				async function report() { return flush(await read()); }
				<button onClick={report}>Read</button>
			}`,
			'Example.tsrx',
			{ hydration },
		);
		expect(errors).toEqual([]);
		expect(() => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })).not.toThrow();
	});
});
