import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe.each([false, true])('optional calls (hydration: %s)', (hydration) => {
	it.each(['() => done?.()', '() => { done?.(); }', '() => { return done?.(); }'])(
		'preserves the optional call in an event handler: %s',
		(handler) => {
			const { code, errors } = compile(
				`export function Action({ done }: { done?: () => void }) @{
					<button onClick={${handler}}>Run</button>
				}`,
				'App.tsrx',
				{ mode: 'client', hydration },
			);

			expect(errors).toEqual([]);
			expect(code).toContain('_$_.with_scope(__block, () => done?.())');
		},
	);

	it('preserves optional calls during component initialization', () => {
		const { code, errors } = compile(
			`export function Action({ done }: { done?: () => string }) @{
				const label = done?.() ?? 'Ready';
				<button>{label}</button>
			}`,
			'App.tsrx',
			{ mode: 'client', hydration },
		);

		expect(errors).toEqual([]);
		expect(code).toContain("_$_.with_scope(__block, () => done?.()) ?? 'Ready'");
	});

	it('still unwraps non-optional zero-argument calls', () => {
		const { code, errors } = compile(
			`export function Action({ done }: { done: () => void }) @{
				<button onClick={() => { done(); }}>Run</button>
			}`,
			'App.tsrx',
			{ mode: 'client', hydration },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('_$_.with_scope(__block, done)');
	});
});
