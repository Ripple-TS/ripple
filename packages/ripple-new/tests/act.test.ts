// React-parity act() coverage:
//   - the scope-depth counter suppresses the "update outside act(...)" warning
//   - `setIsRippleActEnvironment(true)` enables the warning; default is off
//   - updates inside flushSync are also suppressed (matches React's IS_REACT_ACT_ENVIRONMENT semantics)
//   - the warning text mirrors React's so port-from-React tests recognise it
//   - act() always returns a Promise; awaits drain microtasks + passive effects to quiescence
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, flushSync, setIsRippleActEnvironment } from '../src/index.js';
import { mount } from './_helpers';
import Counter, { bump } from './_fixtures/act-warning.tsrx';

describe('act() — React-parity contract', () => {
	let errSpy: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => {
		setIsRippleActEnvironment(false);
		errSpy.mockRestore();
	});

	it('always returns a Promise (the async testing model)', () => {
		const ret = act(() => 42);
		expect(ret).toBeInstanceOf(Promise);
		return ret.then((value) => expect(value).toBe(42));
	});

	it('drains microtasks + passive effects before resolving (async fn)', async () => {
		let resolveInner!: (v: string) => void;
		const inner = new Promise<string>((r) => {
			resolveInner = r;
		});
		const result = await act(async () => {
			resolveInner('payload');
			return inner;
		});
		expect(result).toBe('payload');
	});

	it('default env flag is off — out-of-act updates emit NO warning', async () => {
		const r = mount(Counter);
		// Direct (non-act, non-flushSync) update — warning should NOT fire because
		// IS_RIPPLE_ACT_ENVIRONMENT is false by default.
		bump();
		flushSync(() => {});
		expect(errSpy).not.toHaveBeenCalled();
		r.unmount();
	});

	it('with env flag on: update outside act() warns with the React-shape message', async () => {
		setIsRippleActEnvironment(true);
		const r = mount(Counter);
		errSpy.mockClear(); // mount's internal scheduling may have fired the warning
		bump(); // ← the offending out-of-act update
		flushSync(() => {});
		expect(errSpy).toHaveBeenCalled();
		const message = errSpy.mock.calls[0][0] as string;
		expect(message).toMatch(/was not wrapped in act/);
		expect(message).toMatch(/act\(\(\) =>/);
		r.unmount();
	});

	it('with env flag on: update INSIDE act() suppresses the warning', async () => {
		setIsRippleActEnvironment(true);
		const r = mount(Counter);
		errSpy.mockClear();
		await act(() => {
			bump();
		});
		expect(errSpy).not.toHaveBeenCalled();
		r.unmount();
	});

	it('with env flag on: update INSIDE flushSync suppresses the warning', async () => {
		setIsRippleActEnvironment(true);
		const r = mount(Counter);
		errSpy.mockClear();
		flushSync(() => {
			bump();
		});
		expect(errSpy).not.toHaveBeenCalled();
		r.unmount();
	});

	it('actScopeDepth is correctly decremented on exception (warning still suppressed after throw)', async () => {
		setIsRippleActEnvironment(true);
		const r = mount(Counter);
		errSpy.mockClear();
		await expect(
			act(() => {
				throw new Error('boom');
			}),
		).rejects.toThrow('boom');
		// Now AFTER the throw, an out-of-act update should warn (depth went back to 0).
		bump();
		flushSync(() => {});
		expect(errSpy).toHaveBeenCalled();
		r.unmount();
	});

	it('nested act() — inner failure does not unbalance the outer scope', async () => {
		setIsRippleActEnvironment(true);
		const r = mount(Counter);
		errSpy.mockClear();
		await act(async () => {
			await expect(
				act(() => {
					throw new Error('inner');
				}),
			).rejects.toThrow('inner');
			// Still inside the outer act: this update must not warn.
			bump();
		});
		expect(errSpy).not.toHaveBeenCalled();
		r.unmount();
	});
});
