import { describe, it, expect } from 'vitest';
import { version } from '../src/index.js';
import pkg from '../package.json' with { type: 'json' };

describe('version', () => {
	it('exported version is sourced from package.json (no drift)', () => {
		expect(version).toBe(pkg.version);
		expect(version).toMatch(/^\d+\.\d+\.\d+/);
	});
});
