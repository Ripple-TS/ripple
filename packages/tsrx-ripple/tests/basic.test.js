import {
	runSharedClassComponentDeclarationTests,
	runSharedComponentParamsTests,
} from '@tsrx/core/test-harness/compile';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';

runSharedClassComponentDeclarationTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

runSharedComponentParamsTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

describe('@tsrx/ripple named ref props', () => {
	it('wraps named ref props for components', () => {
		const { code } = compile(
			`component Child(props) {}
			component App() {
				let input;
				<Child input_ref={ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('input_ref: _$_.create_ref_prop(() => input, (v) => input = v)');
	});

	it('wraps anonymous ref props for components', () => {
		const { code } = compile(
			`component Child(props) {}
			component App() {
				let input;
				<Child {ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('[ref]: _$_.create_ref_prop(() => input, (v) => input = v)');
	});

	it('applies direct named ref props on host elements as refs', () => {
		const { code } = compile(
			`component App() {
				let input;
				<input input_ref={ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.ref(input_1, () => _$_.create_ref_prop');
		expect(code).not.toContain('input_ref');
	});

	it('adds assignment setters for host ref attributes with identifiers and member expressions', () => {
		const { code } = compile(
			`component App() {
				let input;
				let state = {};
				<input ref={input} />
				<input ref={state.input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.ref(input_1, () => input, (v) => input = v)');
		expect(code).toContain('_$_.ref(input_2, () => state.input, (v) => state.input = v)');
	});

	it('wraps ref forms on dynamic elements so runtime host spreads can apply them', () => {
		const { code } = compile(
			`component App() {
				let tag = track('input');
				let input;
				let state = {};
				function fn() {}
				<@tag ref={input} {ref state.other} input_ref={ref fn} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain('ref: _$_.create_ref_prop(() => input, (v) => input = v)');
		expect(code).toContain(
			'[ref_1]: _$_.create_ref_prop(() => state.other, (v) => state.other = v)',
		);
		expect(code).toContain('input_ref: _$_.create_ref_prop(() => fn, (v) => fn = v)');
	});

	it('prints named ref props in Volar TypeScript output', () => {
		const { code } = compile_to_volar_mappings(
			`component App() {
				let input;
				<input input_ref={ref input} />
			}`,
			'App.tsrx',
		);

		expect(code).toContain("import { _$_RefProp__create } from 'ripple/compiler/internal/import';");
		expect(code).toContain(
			'<input input_ref={_$_RefProp__create(() => input, (v) => input = v)} />',
		);
		expect(code).not.toContain('input_ref={ref input}');
	});

	it('does not map the generated named ref setter back to the source ref target', () => {
		const source = `component Child(props: { inputRef?: any; otherRef?: any }) {
	<input />
}

component App() {
	let input: HTMLInputElement | undefined;
	const state = { input: undefined as HTMLInputElement | undefined };
	<input type="text" input_ref={ref input} />
	<Child inputRef={ref input} otherRef={ref state.input} />
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		const host_element_offset = source.indexOf('<input type="text"');
		const host_ref_container_offset = source.indexOf('{ref input}', host_element_offset);
		const generated_host_element_offset = result.code.indexOf('<input type="text"');
		const generated_host_ref_offset = result.code.indexOf(
			'RefProp__create',
			generated_host_element_offset,
		);
		const ref_container_offset = source.indexOf('{ref input}');
		const ref_input_offset = source.indexOf('ref input') + 'ref '.length;
		const ref_state_container_offset = source.indexOf('{ref state.input}');
		const ref_state_offset = source.indexOf('ref state.input') + 'ref '.length;
		const ref_state_input_offset = ref_state_offset + 'state.'.length;
		const generated_input_getter = result.code.indexOf('input', result.code.indexOf('() => input'));
		const generated_state_getter = result.code.indexOf(
			'state.input',
			result.code.indexOf('otherRef'),
		);

		const find_mappings = (source_offset, length) =>
			result.mappings.filter(
				(mapping) => mapping.sourceOffsets[0] === source_offset && mapping.lengths[0] === length,
			);

		const input_mappings = find_mappings(ref_input_offset, 'input'.length);
		const state_mappings = find_mappings(ref_state_offset, 'state'.length);
		const state_input_mappings = find_mappings(ref_state_input_offset, 'input'.length);
		const container_mappings = result.mappings.filter(
			(mapping) =>
				mapping.sourceOffsets[0] === ref_container_offset ||
				mapping.sourceOffsets[0] === ref_state_container_offset,
		);
		const host_wrapper_mappings = result.mappings.filter((mapping) => {
			const generated_start = mapping.generatedOffsets[0];
			const generated_end = generated_start + mapping.generatedLengths[0];
			return (
				(mapping.sourceOffsets[0] === host_element_offset ||
					mapping.sourceOffsets[0] === host_ref_container_offset) &&
				generated_start <= generated_host_ref_offset &&
				generated_host_ref_offset < generated_end
			);
		});

		expect(result.errors).toEqual([]);
		expect(result.code).toContain('() => input, (v) => input = v');
		expect(result.code).toContain('() => state.input, (v) => state.input = v');
		expect(container_mappings).toEqual([]);
		expect(host_wrapper_mappings).toEqual([]);
		expect(input_mappings).toHaveLength(1);
		expect(state_mappings).toHaveLength(1);
		expect(state_input_mappings).toHaveLength(1);
		expect(input_mappings[0].generatedOffsets[0]).toBe(generated_input_getter);
		expect(state_mappings[0].generatedOffsets[0]).toBe(generated_state_getter);
		expect(state_input_mappings[0].generatedOffsets[0]).toBe(
			generated_state_getter + 'state.'.length,
		);
	});
});

describe('@tsrx/ripple <tsrx> Volar output', () => {
	it('returns children before and after setup statements', () => {
		const source = `class Foo { bar() { return <tsrx><div>"before"</div> const x = 1; <div>{x}</div></tsrx>; } }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const match = result.code.match(/const ([A-Za-z_$][\w$]*) = \[\];/);
		expect(match).not.toBeNull();

		const children_id = /** @type {RegExpMatchArray} */ (match)[1];
		const first_push = result.code.indexOf(`${children_id}.push(<div>`);
		const declaration = result.code.indexOf('const x = 1;');
		const second_push = result.code.indexOf(`${children_id}.push(<div>`, first_push + 1);
		const returned_children = result.code.indexOf(`return <>{${children_id}}</>;`);

		expect(first_push).toBeGreaterThan(-1);
		expect(declaration).toBeGreaterThan(-1);
		expect(second_push).toBeGreaterThan(-1);
		expect(returned_children).toBeGreaterThan(-1);
		expect(first_push).toBeLessThan(declaration);
		expect(declaration).toBeLessThan(second_push);
		expect(second_push).toBeLessThan(returned_children);
	});
});

describe('@tsrx/ripple nested function fragment returns', () => {
	it('keeps special fragment returns inside component-local functions', () => {
		const { code } = compile(
			`export component App() {
				<div>"App"</div>
				function FragmentReturn() {
					return <><div>fragment</div></>;
				}
				function TsxReturn() {
					return <tsx><div>tsx</div></tsx>;
				}
				function TsrxReturn() {
					return <tsrx><div>"tsrx"</div></tsrx>;
				}
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain('return;');
		expect(code).toMatch(/function FragmentReturn\(\) {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/function TsxReturn\(\) {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/function TsrxReturn\(\) {\s+return _\$_.tsrx_element/);
	});

	it('keeps special fragment returns inside component prop arrow functions', () => {
		const { code } = compile(
			`component Child(props) {}

			export component App() {
				<Child
					fragment={() => {
						return <><div>fragment</div></>;
					}}
					tsx={() => {
						return <tsx><div>tsx</div></tsx>;
					}}
					tsrx={() => {
						return <tsrx><div>"tsrx"</div></tsrx>;
					}}
				/>
			}`,
			'App.tsrx',
		);

		expect(code).not.toContain('return;');
		expect(code).toMatch(/fragment: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsx: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsrx: \(\) => {\s+return _\$_.tsrx_element/);
	});
});
