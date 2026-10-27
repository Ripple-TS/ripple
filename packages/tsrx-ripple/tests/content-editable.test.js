import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe('contenteditable hydration output', () => {
	it('inlines the empty snapshot without allocating a server render block', () => {
		const { code } = compile(
			'export function App() { return <div contentEditable={true} />; }',
			'test.tsrx',
			{ mode: 'server' },
		);
		expect(code).toContain('data-ripple-content=""');
		expect(code).not.toContain('content_editable(');
	});

	it('keeps ordinary literal spreads on their existing rendering path', () => {
		for (const mode of ['client', 'server']) {
			const { code } = compile(
				'export function App() { return <div {...{ class: "row" }}>text</div>; }',
				'test.tsrx',
				{ mode },
			);
			expect(code).not.toContain('content_editable');
			expect(code).not.toContain('data-ripple-content');
		}
	});

	it('keeps the Trusted Types sink without editable guards in client-only components', () => {
		const { code } = compile(
			'export function App({html}) { return <div contentEditable={true} innerHTML={html} />; }',
			'test.tsrx',
			{ hydration: false },
		);
		expect(code).not.toContain('content_editable');
		expect(code).toContain('set_inner_html');
	});
});
