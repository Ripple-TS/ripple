import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe.each(['client', 'server'])('data scripts (%s)', (mode) => {
	it('compiles the body-local script from issue #1538', () => {
		const source = `export function Card() {
			return <article><script type="application/json" id="card-data">{'{"count":1}'}</script></article>;
		}`;
		expect(compile(source, 'Card.tsrx', { mode, hydration: true }).errors).toEqual([]);
	});

	it.each([
		'type="application/json"',
		'type={"application/json"}',
		'type="application/ld+json"',
		'type="text/plain"',
		'type="application/vnd.example+json"',
		'TYPE="APPLICATION/JSON"',
		'type=" application/json; charset=utf-8 "',
	])('allows a static data MIME type: %s', (attributes) => {
		const source = `export function Data() {
			return <script ${attributes} id="data">{"count":1}</script>;
		}`;
		const { code, errors } = compile(source, 'Data.tsrx', { mode });
		expect(errors).toEqual([]);
		expect(code).not.toContain('_$_.script(');
	});

	it.each([
		'',
		'type',
		'type=""',
		'type=" "',
		'type="module"',
		'type="importmap"',
		'type="speculationrules"',
		'type="json"',
		'type="application/"',
		'type="/json"',
		'type="application /json"',
		'type={type}',
		'type={null}',
		'type={false}',
		'{...attrs}',
		'type="application/json" {...attrs}',
		'{...attrs} type="application/json"',
		'type="application/json" type={type}',
		'TYPE="text/javascript" type="application/json"',
		'type="application/json" TYPE="text/javascript"',
		...[
			'application/ecmascript',
			'application/javascript',
			'application/x-ecmascript',
			'application/x-javascript',
			'text/ecmascript',
			'text/javascript',
			'text/javascript1.0',
			'text/javascript1.1',
			'text/javascript1.2',
			'text/javascript1.3',
			'text/javascript1.4',
			'text/javascript1.5',
			'text/jscript',
			'text/livescript',
			'text/x-ecmascript',
			'text/x-javascript',
			' TEXT/JAVASCRIPT ',
			'text/javascript; charset=utf-8',
		].map((type) => `type="${type}"`),
	])('rejects executable or unproven body scripts: %s', (attributes) => {
		const source = `export function Data({ type, attrs }) {
			return <article><script ${attributes}>window.runs++;</script></article>;
		}`;
		expect(() => compile(source, 'Data.tsrx', { mode })).toThrow(
			'<script> cannot be used outside of <head>.',
		);
	});
});
