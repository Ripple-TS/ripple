import { describe, expect, it } from 'vitest';
import { analyzeTsrx, DIAGNOSTIC_CODES, parseModule } from '../../src/index.js';
import { TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR } from '../../src/analyze/validation.js';

const filename = 'App.tsrx';

/**
 * Parse and run the target-neutral analysis in diagnostic-collection mode.
 * Keeping this below the target compilers ensures the semantic rules are
 * exercised once rather than repeated by every lowering target.
 *
 * @param {string} source
 * @param {import('../../types/index.d.ts').TSRXAnalysisOptions} [options]
 */
function analyze(source, options = { collect: true }) {
	const parse_errors = [];
	const comments = [];
	const ast = parseModule(source, filename, {
		collect: true,
		errors: parse_errors,
		comments,
	});

	expect(parse_errors).toEqual([]);

	return analyzeTsrx(ast, filename, { ...options, comments });
}

/** @param {ReturnType<typeof analyze>} result */
function forgotten_output_errors(result) {
	return result.errors.filter(
		(error) => error.code === DIAGNOSTIC_CODES.FORGOTTEN_STATEMENT_CONTAINER,
	);
}

describe('target-neutral TSRX analysis', () => {
	describe('unused template output', () => {
		it('reports free-floating output in every ordinary function form', () => {
			const result = analyze(
				`function Declaration() { <div /> }
				const Arrow = () => { <div /> };
				const Expression = function () { <div /> };
				consume(function () { <div /> });
				const object = { render() { <div /> } };
				class Component { render() { <div /> } }`,
				{ collect: true },
			);
			const errors = forgotten_output_errors(result);

			expect(errors).toHaveLength(6);
			expect(
				errors.every((error) => error.message === TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR),
			).toBe(true);
		});

		it('reports every free-floating TSRX output shape once', () => {
			const result = analyze(
				`function Test(ok, items, value) {
					<div />;
					<><div /></>;
					<style>div { color: red; }</style>;
					@if (ok) { <div /> } @else { <span /> };
					@for (const item of items) { <div>{item}</div> };
					@switch (value) { @case 1: { <div /> } @default: { <span /> } };
					@try { <div /> } @catch (error) { <span /> };
					@{ <div /> };
				}`,
				{ collect: true },
			);

			expect(forgotten_output_errors(result)).toHaveLength(8);
		});

		it('reports output nested in ordinary JavaScript blocks and output followed by setup', () => {
			const result = analyze(`function Test() {
				if (ready) {
					<div />
				}

				<span />;
				const value = 1;
				console.log(value);
			}`);

			expect(forgotten_output_errors(result)).toHaveLength(2);
		});

		it('reports free-floating output in the setup portion of a function @{...} body', () => {
			const result = analyze(
				`function Test(enabled, ready, items, value) @{
					if (enabled) {
						<div />;
						<><div /></>;
						<style>div { color: red; }</style>;
						@if (ready) { <div /> } @else { <span /> };
						@for (const item of items) { <div>{item}</div> };
						@switch (value) { @case 1: { <div /> } @default: { <span /> } };
						@try { <div /> } @catch (error) { <span /> };
						@{ <div /> };
					}

					<main />
				}`,
				{ collect: true },
			);

			expect(forgotten_output_errors(result)).toHaveLength(8);
		});

		it('reports free-floating output in ordinary setup loops', () => {
			const result = analyze(`function Test() @{
				const items = [1, 2, 3];
				for (const item of items) {
					<div>{item}</div>
				}

				<main />
			}`);

			expect(forgotten_output_errors(result)).toHaveLength(1);
		});

		it('reports every braceless statement-position template', () => {
			const result = analyze(
				`function Test(a, b, object, items, ready) @{
					if (a) <div />;
					if (b) run(); else <span />;
					for (;;) <p />;
					for (const key in object) <section />;
					for (const item of items) <article />;
					while (ready) <aside />;
					output: <footer />;

					<main />
				}`,
				{ collect: true },
			);

			expect(forgotten_output_errors(result)).toHaveLength(7);
		});

		it('reports free-floating setup output in retained and nested @{...} expressions', () => {
			const result = analyze(
				`function Retained(enabled) {
					const content = @{
						if (enabled) {
							<aside />
						}

						<main />
					};

					return content;
				}

				function Nested(enabled) {
					return <section>
						@{
							if (enabled) {
								<aside />
							}

							<main />
						}
					</section>;
				}`,
				{ collect: true },
			);

			expect(forgotten_output_errors(result)).toHaveLength(2);
		});

		it('looks through value-transparent expression wrappers', () => {
			const result = analyze(`function Test() {
				(<div />);
				(<span /> as JSX.Element);
			}`);

			expect(forgotten_output_errors(result)).toHaveLength(2);
		});

		it('throws during strict analysis', () => {
			const ast = parseModule('function Test() { <div /> }', filename);

			expect(() => analyzeTsrx(ast, filename)).toThrow(TSRX_FORGOTTEN_STATEMENT_CONTAINER_ERROR);
		});

		it('collects and continues for editor and type-only analysis modes', () => {
			for (const options of [
				{ collect: true },
				{ loose: true },
				{ typeOnly: true },
				{ to_ts: true },
			]) {
				const result = analyze('function Test() { <div /> }', options);

				expect(forgotten_output_errors(result), options).toHaveLength(1);
			}
		});
	});

	describe('rendered or retained template output', () => {
		it('allows every function form to use a direct @{...} body', () => {
			for (const source of [
				'function Test() @{ <div /> }',
				'const Test = () => @{ <div /> };',
				'const Test = function () @{ <div /> };',
				'consume(function () @{ <div /> });',
				'const object = { render() @{ <div /> } };',
				'class Test { render() @{ <div /> } }',
			]) {
				expect(forgotten_output_errors(analyze(source)), source).toEqual([]);
			}
		});

		it('still checks ordinary nested functions inside a function @{...} body', () => {
			const result = analyze(`function App() @{
				const render = function () {
					<span />
				};

				<div>{render()}</div>
			}`);

			expect(forgotten_output_errors(result)).toHaveLength(1);
		});

		it('allows returned, retained, passed, and expression-bodied output', () => {
			for (const source of [
				'function Test() { return <div />; }',
				'function Test() { const view = <div />; return view; }',
				'function Test() { render(<div />); }',
				'function Test() { return ready && <div />; }',
				'const Test = () => <div />;',
				'function Test() { const view = @if (ready) { <div /> }; return view; }',
				'function Test() { const view = @{ <div /> }; return view; }',
			]) {
				expect(forgotten_output_errors(analyze(source)), source).toEqual([]);
			}
		});

		it('allows retained setup output before the rendered value of a function @{...} body', () => {
			const result = analyze(`function Test(enabled) @{
				let content = null;
				if (enabled) {
					content = <aside /> as JSX.Element;
					renderPreview(<small />);
				}

				@if (content) {
					<main>{content}</main>
				} @else {
					<main />
				}
			}`);

			expect(forgotten_output_errors(result)).toEqual([]);
		});

		it('allows templates used as ordinary control-flow values', () => {
			const result = analyze(`function Test() {
				if (<Condition />) run();
				for (; <Condition />; ) run();
				while (<Condition />) run();
			}`);

			expect(forgotten_output_errors(result)).toEqual([]);
		});

		it('does not report nested output that belongs to another template', () => {
			const result = analyze(`function Test() {
				return <section>
					@if (ready) { <div /> } @else { <span /> }
				</section>;
			}`);

			expect(forgotten_output_errors(result)).toEqual([]);
		});

		it('does not apply function-body semantics at module scope', () => {
			expect(forgotten_output_errors(analyze('<div />'))).toEqual([]);
		});
	});
});
