import { describe, it, expect } from 'vitest';
import { compile } from '../src/index.js';

describe.each(['client', 'server'])('ViewTransition %s integration', (mode) => {
	it('preserves global name/class selectors and scopes their keyframes', () => {
		const { css, code } = compile(
			`import { ViewTransition } from 'ripple';
export function App() @{ <>
  <style>
    :global(::view-transition-group(photo)) { animation: move 100ms; }
    :global(::view-transition-image-pair(.notice)) { isolation: isolate; }
    :global(::view-transition-old(.notice)) { animation: move 100ms reverse; }
    :global(::view-transition-new(.notice)) { animation: move 100ms; }
    .unused { color: red; }
    @keyframes move { from { opacity: 0; } }
  </style>
  <ViewTransition name="photo" enter="notice"><div>content</div></ViewTransition>
</> }`,
			'transition.tsrx',
			{ mode },
		);
		for (const selector of ['group(photo)', 'image-pair(.notice)', 'old(.notice)', 'new(.notice)'])
			expect(css).toContain('::view-transition-' + selector);
		expect(css).toMatch(/@keyframes tsrx-[\da-f]+-move/);
		expect(css).toMatch(/animation: tsrx-[\da-f]+-move/);
		expect(css).toContain('(unused)');
		expect(css).not.toContain('.notice.tsrx-');
		expect(code).toContain('photo');
		expect(code).toContain('notice');
	});
	it('keeps nested global pseudo rules independent of DOM scope classes', () => {
		const { css } = compile(
			`export function App() @{ <>
<style>:global(::view-transition-new(.outer)) { animation: fade 1s; } @keyframes fade { from { opacity:0; } }</style>
<div><style>:global(::view-transition-new(.inner)) { animation: fade 2s; } @keyframes fade { from { opacity:0; } }</style><p>content</p></div>
</> }`,
			'nested.tsrx',
			{ mode },
		);
		expect(css).toContain('::view-transition-new(.outer)');
		expect(css).toContain('::view-transition-new(.inner)');
		expect(
			new Set([...css.matchAll(/@keyframes (tsrx-[\da-f]+-fade)/g)].map((match) => match[1])).size,
		).toBe(2);
	});
	it('does not pretend a DOM-scoped rule reaches the document pseudo-element tree', () => {
		const { css } = compile(
			'export function App() @{ <><style>::view-transition-new(.notice) { opacity:0; }</style><div>content</div></> }',
			'scoped.tsrx',
			{ mode },
		);
		expect(css).toMatch(/\.tsrx-[\da-f]+::view-transition-new\(\.notice\)/);
	});
});
