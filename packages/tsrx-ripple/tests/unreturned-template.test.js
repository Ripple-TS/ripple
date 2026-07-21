import { compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';
import { TSRX_UNRETURNED_TEMPLATE_ERROR } from '@tsrx/core';

describe('@tsrx/ripple unreturned template validation', () => {
	function expect_error(source) {
		const { errors } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(errors.map((e) => e.message)).toContain(TSRX_UNRETURNED_TEMPLATE_ERROR);
	}

	function expect_valid(source) {
		const { errors } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(errors).toEqual([]);
	}

	it('emits error for free-floating @if directive', () => {
		expect_error(`function App() { @if (true) { <div /> } }`);
	});

	it('emits error for free-floating @for directive', () => {
		expect_error(`function App() { @for (const item of items) { <div /> } }`);
	});

	it('emits error for free-floating @switch directive', () => {
		expect_error(`function App() { @switch (value) { @case (1): { <div /> } } }`);
	});

	it('emits error for free-floating @try directive', () => {
		expect_error(`function App() { @try { <div /> } @catch (e) { } }`);
	});

	it('emits error for free-floating JSX fragment', () => {
		expect_error(`function App() { <></> }`);
	});

	it('emits error for free-floating JSX element', () => {
		expect_error(`function App() { <div /> }`);
	});

	it('emits error for non-tail items in sequence expressions', () => {
		expect_error(`function App() { (<div />, 1) }`);
	});

	it('emits error for free-floating @{...} code blocks', () => {
		expect_error(`function App() { @{ <div /> } }`);
	});

	it('passes valid usages (Variable Declarations)', () => {
		expect_valid(`function App() { const x = @if(true) { <div /> }; return x; }`);
		expect_valid(`function App() { const y = <div />; return y; }`);
	});

	it('passes valid usages (Assignments)', () => {
		expect_valid(`function App() { let x; x = @if(true) { <div /> }; return x; }`);
		expect_valid(`function App() { let y; y = <div />; return y; }`);
	});

	it('passes valid usages (Return statements)', () => {
		expect_valid(`function App() { return @if(true) { <div /> }; }`);
		expect_valid(`function App() { return <div />; }`);
	});

	it('passes valid usages (Implicit arrow functions)', () => {
		expect_valid(`const App = () => @if(true) { <div /> };`);
		expect_valid(`const App2 = () => <div />;`);
	});

	it('passes valid usages (Ternary expressions)', () => {
		expect_valid(`function App() { return cond ? @if(true) { <a/> } : <b/>; }`);
	});

	it('passes valid usages (Function arguments)', () => {
		expect_valid(`function App() { return render( @if(true) { <div/> } ); }`);
	});
});
