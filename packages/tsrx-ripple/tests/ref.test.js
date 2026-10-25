import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe.each([false, true])('ref setters (hydration: %s)', (hydration) => {
	it.each([
		['a const arrow callback', 'const attach = (node) => { node.textContent = "ready"; };'],
		['a const function callback', 'const attach = function (node) {};'],
		['a const factory result', 'const attach = makeRef();'],
		['a destructured const', 'const { attach } = props;'],
	])('does not assign to %s', (_, declaration) => {
		const { code, errors } = compile(
			`export function App(props) @{
				${declaration}
				<>
					<span ref={attach} />
					<Child ref={attach} />
					<span ref={[attach]} />
					<Child ref={[attach]} />
				</>
			}`,
			'App.tsrx',
			{ mode: 'client', hydration },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('_$_.ref(span, () => attach);');
		expect(code).toContain('_$_.create_ref_prop(() => attach)');
		expect(code).not.toContain('(v) => attach = v');
	});

	it.each([
		'const attach = (node) => {};',
		'import { attach } from "./refs.js";',
		'import attach from "./refs.js";',
	])('resolves immutable refs from enclosing scopes: %s', (declaration) => {
		const { code, errors } = compile(
			`${declaration}
			export function App() @{
				<><span ref={attach} /><Child ref={[attach]} /></>
			}`,
			'App.tsrx',
			{ mode: 'client', hydration },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('_$_.ref(span, () => attach);');
		expect(code).toContain('_$_.create_ref_prop(() => attach)');
		expect(code).not.toContain('(v) => attach = v');
	});

	it('keeps setters for mutable refs and members of const objects', () => {
		const { code, errors } = compile(
			`const slot = () => {};
			export function App() @{
				let slot;
				const state = {};
				<>
					<span ref={slot} />
					<Child ref={slot} />
					<span ref={[slot, state.element]} />
					<span ref={state.element} />
				</>
			}`,
			'App.tsrx',
			{ mode: 'client', hydration },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('_$_.ref(span, () => slot.v, (v) => slot.v = v)');
		expect(code).toContain('_$_.create_ref_prop(() => slot.v, (v) => slot.v = v)');
		expect(code).toContain('_$_.create_ref_prop(() => state.element, (v) => state.element = v)');
		expect(code).toContain('_$_.ref(span_2, () => state.element, (v) => state.element = v)');
	});
});
