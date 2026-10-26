import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe('@tsrx/ripple component declarations', () => {
	it.each([false, true])(
		'renders a fragment around a component without an expression wrapper (hydration: %s)',
		(hydration) => {
			const compile_body = (body) => {
				const { code, errors } = compile(
					`import { Row } from './row.tsrx';
					export function Body(props) @{ ${body} }`,
					'Body.tsrx',
					{ mode: 'client', hydration },
				);
				expect(errors).toEqual([]);
				return code;
			};
			const direct = compile_body('<Row {...props} />');
			const fragment = compile_body('<><Row {...props} /></>');
			expect(fragment).toBe(direct);
			expect(fragment).not.toContain('_$_.expression(');
		},
	);

	it.each([{ mode: 'client' }, { mode: 'client', hydration: true }, { mode: 'server' }])(
		'preserves nested declarations (%j)',
		(options) => {
			const { code, errors } = compile(
				`export function App() @{
				function Label() @{ <span>{'Ready'}</span>; }
				<Label />;
			}`,
				'App.tsrx',
				options,
			);

			expect(errors).toEqual([]);
			expect(code).toMatch(/\tfunction Label\(\)/);
			expect(code).not.toContain('(function Label');
		},
	);

	it.each(['', 'export ', 'export default '])(
		'wraps %jmodule-level component declarations with HMR',
		(prefix) => {
			const { code, errors } = compile(`${prefix}function App() @{ <span /> }`, 'App.tsrx', {
				hmr: true,
			});

			expect(errors).toEqual([]);
			expect(code).toContain('function App()');
			expect(code).toContain('App = _$_.hmr(App);');
			if (prefix) {
				expect(code).toContain('import.meta.hot.accept(');
				expect(code).toContain(
					`App[_$_.HMR].update(module.${prefix === 'export default ' ? 'default' : 'App'});`,
				);
			}
		},
	);
});
