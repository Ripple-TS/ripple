import { compile, compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';

// An event attribute with no value like `<div onC>` (mid-typing while completing
// `onClick`) is a mistake, not a crash. The compiler reports an error pointing at
// the attribute (collected in editor mode, thrown in strict mode) and skips
// generating the handler. A valueless non-event attribute like `<div hidden>` is
// normal JSX and still works.
describe('@tsrx/ripple valueless event attributes', () => {
	const sources = {
		'mid-typing onC': `export function App() {
	return <div class="x" onC>{'hi'}</div>;
}`,
		'bare onClick': `export function App() {
	return <div onClick>{'hi'}</div>;
}`,
	};

	/** @param {string} source */
	const attr_range = (source) => {
		const name = source.includes('onClick') ? 'onClick' : 'onC';
		const start = source.indexOf(name);
		return { start, end: start + name.length };
	};

	for (const [kind, source] of Object.entries(sources)) {
		const attr_name = source.includes('onClick') ? 'onClick' : 'onC';

		it(`collects a positioned error and completes client compilation (${kind})`, () => {
			const { code, errors } = compile(source, 'App.tsrx', { collect: true });
			const { start, end } = attr_range(source);

			expect(code).toBeTypeOf('string');
			expect(errors.length).toBeGreaterThan(0);
			const error = errors.find((e) => /event attribute/i.test(e.message));
			expect(error).toBeDefined();
			// the error range covers the attribute node
			expect(error?.pos).toBeLessThanOrEqual(start);
			expect(error?.end).toBeGreaterThanOrEqual(end);
			// the broken attribute is omitted, not emitted as `onClick=""` markup
			expect(code).not.toContain(`${attr_name}=`);
		});

		it(`collects a positioned error and completes server compilation (${kind})`, () => {
			const { code, errors } = compile(source, 'App.tsrx', { collect: true, mode: 'server' });
			const { start, end } = attr_range(source);

			expect(code).toBeTypeOf('string');
			const error = errors.find((e) => /event attribute/i.test(e.message));
			expect(error).toBeDefined();
			expect(error?.pos).toBeLessThanOrEqual(start);
			expect(error?.end).toBeGreaterThanOrEqual(end);
			expect(code).not.toContain(`${attr_name}=`);
		});

		it(`completes compile_to_volar_mappings with full mappings (${kind})`, () => {
			const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			const { start, end } = attr_range(source);

			expect(result.code).toBeTypeOf('string');
			expect(result.mappings.length).toBeGreaterThan(1);
			const error = result.errors.find((e) => /event attribute/i.test(e.message));
			expect(error).toBeDefined();
			expect(error?.pos).toBeLessThanOrEqual(start);
			expect(error?.end).toBeGreaterThanOrEqual(end);
		});

		it(`throws a positioned CompileError in strict mode (${kind})`, () => {
			const { start, end } = attr_range(source);
			let thrown;
			try {
				compile(source, 'App.tsrx');
			} catch (e) {
				thrown = e;
			}

			expect(thrown).toBeDefined();
			// an error that points at the code, not a crash with no location
			expect(thrown.constructor).not.toBe(TypeError);
			expect(thrown.message).toMatch(/event attribute/i);
			expect(thrown.pos).toBeLessThanOrEqual(start);
			expect(thrown.end).toBeGreaterThanOrEqual(end);
		});
	}

	it('keeps boolean shorthand on non-event attributes compiling clean', () => {
		const source = `export function App() {
	return <div hidden>{'x'}</div>;
}`;
		const client = compile(source, 'App.tsrx', { collect: true });
		const server = compile(source, 'App.tsrx', { collect: true, mode: 'server' });

		expect(client.errors).toEqual([]);
		expect(server.errors).toEqual([]);
		// strict mode must not throw either
		expect(() => compile(source, 'App.tsrx')).not.toThrow();
		expect(() => compile(source, 'App.tsrx', { mode: 'server' })).not.toThrow();
	});
});
