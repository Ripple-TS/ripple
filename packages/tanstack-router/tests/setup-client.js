import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from './harness.js';

beforeEach(() => {
	vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
	try {
		cleanup();
	} finally {
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
});
