import { describe, expect, it } from 'vitest';
import { compile } from '@tsrx/ripple';

function server(source) {
	return compile(source, 'App.tsrx', { mode: 'server' }).code;
}

describe('server output keeps static markup Latin-1', () => {
	it('emits characters above U+00FF in static text as numeric character references', () => {
		const code = server(`export function App() @{
	<footer>{'The Times — “quoted” … 😀'}</footer>
}`);

		expect(code).toContain('The Times &#8212; &#8220;quoted&#8221; &#8230; &#128512;');
		expect(code).not.toContain('—');
	});

	it('keeps Latin-1 characters and escapes markup before encoding', () => {
		const code = server(`export function App() @{
	<p>café {'<b>&</b>'} ñ — €</p>
}`);

		expect(code).toContain('café &lt;b>&amp;&lt;/b> ñ &#8212; &#8364;');
	});

	it('encodes static attribute values and RCDATA element text', () => {
		const code = server(`export function App() @{
	<div title="a — b">
		<textarea>t — t</textarea>
		<title>ti — tle</title>
	</div>
}`);

		expect(code).toContain('title="a &#8212; b"');
		expect(code).toContain('<textarea>t &#8212; t</textarea>');
		expect(code).toContain('<title>ti &#8212; tle</title>');
	});

	it('leaves raw-text script bodies untouched', () => {
		const code = server(`export function App() @{
	<head>
		<script>var dash = "—";</script>
	</head>
}`);

		expect(code).toContain('<script>var dash = "—";</script>');
		expect(code).not.toContain('&#8212;');
	});

	it('leaves the text of raw-text elements untouched', () => {
		const code = server(`export function App() @{
	<iframe>a — b</iframe>
}`);

		expect(code).toContain('<iframe>a — b</iframe>');
	});

	it('does not touch dynamic text', () => {
		const code = server(`export function App(props: { text: string }) @{
	<p>{props.text}</p>
}`);

		expect(code).toContain('_$_.escape(props.text)');
	});
});
