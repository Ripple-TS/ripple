import { afterEach, vi } from 'vitest';
import { cleanup } from './harness.js';

afterEach(() => {
	try {
		cleanup();
	} finally {
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
});
