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
