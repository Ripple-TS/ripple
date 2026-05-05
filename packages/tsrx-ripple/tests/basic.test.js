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
});
