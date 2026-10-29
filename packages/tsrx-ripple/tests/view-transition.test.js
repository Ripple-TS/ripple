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
	it('scopes native pseudo arguments instead of the document root', () => {
		const { css } = compile(
			'import { ViewTransition } from "ripple"; export function App() @{ <><style>::view-transition-new(.notice) { opacity:0; }</style><ViewTransition><div>content</div></ViewTransition></> }',
			'scoped.tsrx',
			{ mode },
		);
		expect(css).toMatch(/::view-transition-new\(\.notice\.tsrx-[\da-f]+\)/);
		expect(css).not.toMatch(/\.tsrx-[\da-f]+::view-transition/);
	});

	it('scopes all four pseudo-elements, names, wildcard, and compound classes with matching component metadata', () => {
		const { css, cssHash, code } = compile(
			`import { ViewTransition as Transition } from 'ripple';
export function App() @{ <>
<style>
::view-transition-group(*) { animation-duration: 1s; }
::view-transition-image-pair(photo) { isolation:isolate; }
::view-transition-old(.fade.slide) { opacity:0; }
:active-view-transition-type(back)::view-transition-new(.slide) { opacity:1; }
</style>
<Transition name="photo" enter="fade slide"><div/></Transition>
</> }`,
			'local.tsrx',
			{ mode },
		);
		expect(css).toContain(`::view-transition-group(*.${cssHash})`);
		expect(css).toContain(`::view-transition-image-pair(photo.${cssHash})`);
		expect(css).toContain(`::view-transition-old(.fade.slide.${cssHash})`);
		expect(css).toContain(
			`:active-view-transition-type(back)::view-transition-new(.slide.${cssHash})`,
		);
		expect(code).toContain(`$v: '${cssHash}'`);
		expect(code).toContain('photo');
	});

	it('keeps global selectors unfiltered and local/global keyframes independent', () => {
		const { css, cssHash } = compile(
			`import {ViewTransition} from 'ripple'; export function App() @{ <>
<style>
::view-transition-new(.local) { animation: local 1s; }
:global(::view-transition-new(.shared)) { animation: local 1s, shared 2s; }
:global { ::view-transition-old(.shared) { animation: shared 2s; } }
@keyframes local { from {opacity:0} }
@keyframes -global-shared { from {opacity:0} }
</style><ViewTransition><div/></ViewTransition></> }`,
			'global.tsrx',
			{ mode },
		);
		expect(css).toContain(`::view-transition-new(.local.${cssHash})`);
		expect(css).toContain('::view-transition-new(.shared)');
		expect(css).toContain('::view-transition-old(.shared)');
		expect(css).toContain(`animation: ${cssHash}-local 1s, shared 2s`);
		expect(css).toContain('@keyframes shared');
	});

	it.each([
		'div ::view-transition-new(.notice)',
		'div::view-transition-new(.notice)',
		'::view-transition',
		'::view-transition-new(root)',
	])('diagnoses a document-wide or DOM-rooted local selector: %s', (selector) => {
		expect(() =>
			compile(
				`export function App() @{ <><style>${selector} { opacity:0; }</style><div/></> }`,
				'invalid.tsrx',
				{ mode },
			),
		).toThrow(/requires :global|cannot be nested/);
	});

	it.each(['assigned', 'ref'])('exposes transition classes in %s maps', (kind) => {
		const source =
			kind === 'assigned'
				? `const styles=<style>::view-transition-new(.notice) { opacity:0; }</style>; <ViewTransition enter={styles.notice}><div/></ViewTransition>`
				: `let styles; <><style ref={styles}>::view-transition-new(.notice) { opacity:0; }</style><ViewTransition enter={styles.notice}><div/></ViewTransition></>`;
		const { css, code, cssHash } = compile(
			`import {ViewTransition} from 'ripple'; export function App() @{ ${source} }`,
			'map.tsrx',
			{ mode },
		);
		expect(css).toContain(`::view-transition-new(.notice.${cssHash})`);
		expect(css).not.toContain('(unused)');
		expect(code).toContain(`${cssHash} notice`);
	});

	it('passes scope metadata after spreads and recognizes namespace imports without altering styling values', () => {
		const { cssHash, code } = compile(
			`import * as R from 'ripple'; export function App({ props, classes }) @{ <>
<style>::view-transition-new(*) { opacity:0; }</style>
<R.ViewTransition {...props} enter={classes} exit="none" update="auto" share={{ back:'slide', default:'none' }}><div/></R.ViewTransition>
</> }`,
			'dynamic.tsrx',
			{ mode },
		);
		expect(code).toContain(`$v: '${cssHash}'`);
		expect(code).toMatch(/exit: ["']none["']/);
		expect(code).toMatch(/update: ["']auto["']/);
	});

	it('keeps nested scopes distinct and applies both hashes to nested boundaries', () => {
		const { css, code } = compile(
			`import {ViewTransition} from 'ripple'; export function App() @{ <>
<style>::view-transition-new(.notice) { animation-duration:1s; }</style>
<ViewTransition enter="notice"><p>outer</p></ViewTransition>
<section><style>::view-transition-new(.notice) { animation-duration:2s; }</style><ViewTransition enter="notice"><p>inner</p></ViewTransition></section>
</> }`,
			'nested-local.tsrx',
			{ mode },
		);
		const hashes = [...css.matchAll(/::view-transition-new\(\.notice\.(tsrx-[\da-f]+)\)/g)].map(
			(match) => match[1],
		);
		expect(new Set(hashes).size).toBe(2);
		expect(code).toContain(`$v: '${hashes[0]} ${hashes[1]}'`);
	});

	it('passes applied theme scopes and exposes their transition classes', () => {
		const { css, cssHash, code } = compile(
			`import {ViewTransition} from 'ripple';
export const theme=<style>::view-transition-new(.notice) { opacity:0; }</style>;
export function App() @{ <><style apply={theme}/><ViewTransition enter="notice"><p/></ViewTransition></> }`,
			'theme.tsrx',
			{ mode },
		);
		expect(css).toContain(`::view-transition-new(.notice.${cssHash})`);
		expect(code).toContain(`$v: '${cssHash}'`);
		expect(code).toContain(`${cssHash} notice`);
	});

	it('does not pass private metadata to a shadowed component', () => {
		const { code } = compile(
			`import {ViewTransition} from 'ripple'; export function App({ViewTransition}) @{ <>
<style>::view-transition-new(.notice) { opacity:0; }</style><ViewTransition enter="notice"><p/></ViewTransition>
</> }`,
			'shadow.tsrx',
			{ mode },
		);
		expect(code).not.toContain('$v:');
	});

	it('prunes unreachable local transition rules without pruning explicit global rules', () => {
		const { css } = compile(
			`export function App() @{ <><style>
::view-transition-new(.unused) { opacity:0; }
:global(::view-transition-new(.shared)) { opacity:1; }
</style><p/></> }`,
			'unused.tsrx',
			{ mode },
		);
		expect(css).toContain('/* (unused) ::view-transition-new(.unused.');
		expect(css).toMatch(/\*\/\s*::view-transition-new\(\.shared\)/);
	});

	it.each([false, true])(
		'keeps mixed global/local selectors and escaped class-map entries valid (minify %s)',
		(minify_css) => {
			const { css, code, cssHash } = compile(
				String.raw`import {ViewTransition} from 'ripple'; export function App() @{ let styles; <>
<style ref={styles}>::view-transition-new(.notice\-in), :global(::view-transition-old(.shared)) { animation: fade 1s; } @keyframes fade { from { opacity:0; } }</style>
<ViewTransition enter={styles['notice-in']}><p/></ViewTransition>
</> }`,
				'escaped.tsrx',
				{ mode, minify_css },
			);
			expect(css).toContain(`::view-transition-new(.notice\\-in.${cssHash})`);
			expect(css).toContain('::view-transition-old(.shared)');
			expect(code).toContain(`${cssHash} notice-in`);
		},
	);
});
