import { describe, expect, it } from 'vitest';
import { compile } from 'ripple/compiler';

const source = `
component App() {
	<tsx:react>
		<div className="react-content">{'Hello'}</div>
	</tsx:react>
}
`;

describe('compiler tsx compat configuration', () => {
	it('allows tsx compat when no compat config is provided', () => {
		expect(() =>
			compile(source, '/src/App.ripple', {
				mode: 'client',
			}),
		).not.toThrow();
	});

	it('throws when tsx compat kind is not configured', () => {
		expect(() =>
			compile(source, '/src/App.ripple', {
				mode: 'client',
				compat_kinds: [],
			}),
		).toThrow('<tsx:react> requires "react" compat to be configured in ripple.config.ts.');
	});

	it('allows tsx compat kinds that are configured', () => {
		expect(() =>
			compile(source, '/src/App.ripple', {
				mode: 'client',
				compat_kinds: ['react'],
			}),
		).not.toThrow();
	});
});
