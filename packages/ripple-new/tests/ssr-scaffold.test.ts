// Phase 0 SSR scaffold: the packaging + mode plumbing exists (no SSR behavior
// yet). Verifies the new subpath exports resolve and behave as scaffolded.
import { describe, it, expect } from 'vitest';
import {
	BLOCK_OPEN,
	BLOCK_CLOSE,
	HYDRATION_START,
	HYDRATION_END,
	EMPTY_COMMENT,
} from 'ripple-new/constants';
import { render } from 'ripple-new/server';

describe('SSR scaffold (phase 0)', () => {
	it('exposes the hydration marker constants via ripple-new/constants', () => {
		expect(HYDRATION_START).toBe('[');
		expect(HYDRATION_END).toBe(']');
		expect(BLOCK_OPEN).toBe('<!--[-->');
		expect(BLOCK_CLOSE).toBe('<!--]-->');
		expect(EMPTY_COMMENT).toBe('<!---->');
	});

	it('ripple-new/server render() renders a component to { head, body, css }', async () => {
		// Phase 1: render is implemented (a server component is a function → HTML).
		// Phase 4: render() is async (it awaits any suspended use(thenable)).
		const out = await render(((_s: any) => '<p>hi</p>') as any);
		expect(out).toEqual({ head: '', body: '<p>hi</p>', css: '' });
	});
});
