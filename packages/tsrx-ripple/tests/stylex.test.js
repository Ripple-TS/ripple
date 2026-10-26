import { describe, expect, it } from 'vitest';
import { compile, compile_to_volar_mappings } from '../src/index.js';

describe('StyleX sx lowering', () => {
	it.each(['client', 'server'])('uses the shared visitor for %s output', (mode) => {
		const source = `import { styles } from './styles';
export function App() @{
  <div sx={styles.root}><svg><path sx={styles.icon} /></svg></div>
}`;
		const { code, map } = compile(source, 'App.tsrx', { mode, stylex: true });
		expect(code.match(/from '@stylexjs\/stylex'/g)).toHaveLength(1);
		expect(code).toContain('.attrs(styles.root)');
		expect(code).toContain('.attrs(styles.icon)');
		expect(code).not.toContain('sx:');
		expect(map.sourcesContent).toEqual([source]);
	});

	it.each(['client', 'server'])('lowers sx in returned and nested JSX values for %s', (mode) => {
		const source = `import { styles } from './styles';
function Child(props) { return <section>{props.children}</section>; }
export function App() {
  const content = <span sx={styles.root}>Hello</span>;
  return <Child>{content}</Child>;
}`;
		const { code } = compile(source, 'App.tsrx', { mode, stylex: true });
		expect(code).toContain('.attrs(styles.root)');
		expect(code).toContain("from '@stylexjs/stylex'");
	});

	it.each(['client', 'server'])('reuses visible namespace and named imports for %s', (mode) => {
		for (const [declaration, call] of [
			["import * as stylesApi from '@stylexjs/stylex';", 'stylesApi.attrs(styles.root)'],
			["import { attrs as getAttrs } from '@stylexjs/stylex';", 'getAttrs(styles.root)'],
		]) {
			// Imports need not precede the component in the source.
			const source = `import { styles } from './styles';
export function App() { return <div sx={styles.root} />; }
${declaration}`;
			const { code } = compile(source, 'App.tsrx', { mode, stylex: true });
			expect(code).toContain(call);
			expect(code).not.toContain('__ripple_stylex');
			expect(code.match(/from '@stylexjs\/stylex'/g)).toHaveLength(1);
		}
	});

	it.each(['client', 'server'])('does not reuse shadowed or type-only imports for %s', (mode) => {
		for (const declaration of [
			"import * as stylex from '@stylexjs/stylex';",
			"import { attrs as stylex } from '@stylexjs/stylex';",
			"import type * as stylex from '@stylexjs/stylex';",
			"import { type attrs as stylex } from '@stylexjs/stylex';",
		]) {
			const parameter = declaration.includes('type ') ? 'props' : 'stylex';
			const source = `${declaration}
import { styles } from './styles';
export function App(${parameter}) { return <div sx={styles.root} data-local={${parameter}} />; }`;
			const { code } = compile(source, 'App.tsrx', { mode, stylex: true });
			expect(code).toContain('__ripple_stylex.attrs(styles.root)');
		}
	});

	it('keeps component sx props and emits no unused runtime import', () => {
		const source = `function Child(props) { return <div>{props.sx}</div>; }
export function App() { return <Child sx="owned-by-component" />; }`;
		expect(compile(source, 'App.tsrx', { stylex: true }).code).not.toContain('@stylexjs/stylex');
	});

	it('leaves sx alone when disabled', () => {
		const source = 'export function App() { return <div sx="ordinary" />; }';
		expect(compile(source, 'App.tsrx').code).not.toContain('@stylexjs/stylex');
	});

	it.each(['client', 'server'])('collects an original-source diagnostic in %s mode', (mode) => {
		const source = 'export function App() { return <div sx="invalid" />; }';
		const { errors } = compile(source, 'App.tsrx', { mode, stylex: true, collect: true });
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('sx must contain a StyleX expression');
		expect(source.slice(errors[0].pos, errors[0].end)).toBe('sx="invalid"');
	});

	it('retains the sx attribute in editor output for the opt-in JSX types', () => {
		const source = `import { styles } from './styles';
export function App() { return <div sx={styles.root} />; }`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx');
		expect(code).toContain('sx={styles.root}');
		expect(code).not.toContain('@stylexjs/stylex');
	});
});
