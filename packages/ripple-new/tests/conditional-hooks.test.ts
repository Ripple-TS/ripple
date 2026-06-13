import { describe, it, expect } from 'vitest';
import { mount, nextPaint } from './_helpers';
import { Guarded, PartialGuard } from './_fixtures/conditional-hooks.tsrx';

// ripple-new supports runtime-conditional hooks: each hook call site gets a
// stable Symbol.for(stableId) slot from the compiler, so `if (cond) return;`
// before a `useEffect(…)` doesn't break the hook order assumption that
// React's rules-of-hooks exists to defend. The hook simply doesn't run on
// the short-circuited render; when the guard opens later, the hook
// registers and fires normally.

describe('conditional hooks — guard before useEffect', () => {
	it('short-circuited render runs no effect; opening the guard fires it', async () => {
		const log: string[] = [];
		const r = mount(Guarded, { hide: true, log, initialN: 7 });
		// Effect never registered while hide=true.
		await nextPaint();
		expect(log).toEqual([]);
		// Open the guard — body now runs past the early return; effect fires.
		r.update(Guarded, { hide: false, log, initialN: 7 });
		await nextPaint();
		expect(log).toContain('mount:7');
		// Click the button: new state → dep changed → cleanup + fresh mount.
		r.click('#bump');
		await nextPaint();
		expect(log).toContain('cleanup:7');
		expect(log).toContain('mount:8');
		r.unmount();
		await nextPaint();
		// On unmount the current effect's cleanup fires.
		expect(log).toContain('cleanup:8');
	});

	it('hook slots stay stable when the guard opens after a few renders', async () => {
		const log: string[] = [];
		const r = mount(PartialGuard, { hide: true, log });
		await nextPaint();
		// Two hooks ran above the guard (useState ×2), but the effect didn't.
		expect(log).toEqual([]);
		// Re-render with hide=false to traverse past the guard.
		r.update(PartialGuard, { hide: false, log });
		await nextPaint();
		expect(log).toEqual(['seen:0:0']);
		r.click('#bumpN');
		await nextPaint();
		expect(log).toEqual(['seen:0:0', 'seen:1:0']);
		r.click('#bumpM');
		await nextPaint();
		expect(log).toEqual(['seen:0:0', 'seen:1:0', 'seen:1:1']);
		r.unmount();
	});
});
