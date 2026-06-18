import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { SameFlushUnmount } from './_fixtures/ref-dispose.tsrx';

describe('deferred ref attach — same-flush unmount', () => {
	it('a ref queued then unmounted in the same flush is not re-attached to the torn-down node', () => {
		const refObj: { current: any } = { current: 'sentinel' };
		const r = mount(SameFlushUnmount, { refObj });

		// The try body threw during mount; the catch branch rendered.
		expect(r.find('#caught').textContent).toBe('caught');
		// The ref-detach cleanup ran during the try unmount (current -> null), and
		// the deferred attach was skipped because its subtree was disposed. Before
		// the fix the drain re-ran attachRef and resurrected the dead node here.
		expect(refObj.current).toBe(null);

		r.unmount();
	});
});
