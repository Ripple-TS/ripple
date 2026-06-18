import { describe, it, expect } from 'vitest';
import { mount, act } from './_helpers';
import {
	NestedSuspendBoundary,
	bumpChild,
	goChild,
	bumpSibling,
	getMemoCalls,
	resetMemoCalls,
} from './_fixtures/nested-suspend.tsrx';

// A thenable pre-tagged as fulfilled resolves synchronously in use() (no
// suspend), so the initial render commits with state.
function fulfilled<T>(value: T) {
	return { then() {}, status: 'fulfilled', value };
}
function deferred<T>() {
	let resolve!: (v: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('nested suspend — hook state survives a descendant suspend', () => {
	it('preserves useState across the whole try subtree + useMemo cache when a nested child suspends on update', async () => {
		resetMemoCalls();
		const gate = deferred<string>();
		const resolved = fulfilled('R');
		const r = mount(NestedSuspendBoundary, { resolved, gate: gate.promise });
		await act(() => {});

		// Initial commit — no suspend (resolved promise is synchronous).
		expect(r.find('#counter').textContent).toBe('0/R/M');
		expect(r.find('#sibling').textContent).toBe('0');
		expect(getMemoCalls()).toBe(1);

		// Build up state in both children (no suspend).
		await act(() => bumpChild());
		await act(() => bumpChild());
		await act(() => bumpSibling());
		expect(r.find('#counter').textContent).toBe('2/R/M');
		expect(r.find('#sibling').textContent).toBe('1');
		expect(getMemoCalls()).toBe(1);

		// NESTED descendant suspend: the Counter swaps to a pending promise on its
		// OWN re-render, so handleSuspense sees sourceBlock === the child block,
		// not the try-body block. Fallback shows.
		await act(() => goChild());
		expect(r.findAll('#counter')).toHaveLength(0);
		expect(r.find('#fallback').textContent).toBe('loading');

		// Resolve — the try subtree resumes. Before the fix this re-mounted the
		// whole subtree, resetting both counters to 0 and re-running the memo
		// factory. With the fix, every hook's state is intact.
		await act(() => gate.resolve('G'));
		expect(r.findAll('#fallback')).toHaveLength(0);
		expect(r.find('#counter').textContent).toBe('2/G/M'); // n + memo preserved
		expect(r.find('#sibling').textContent).toBe('1'); // sibling state preserved
		expect(getMemoCalls()).toBe(1); // memo factory NOT re-run

		// State still live after resume.
		await act(() => bumpChild());
		expect(r.find('#counter').textContent).toBe('3/G/M');
		r.unmount();
	});
});
