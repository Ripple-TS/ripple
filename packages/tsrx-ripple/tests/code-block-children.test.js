import { compile, compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';

describe('@tsrx/ripple code blocks in template children position', () => {
	const with_statements = `function App() @{
	<>
		<span class="a">{'a'}</span>
		@{
			const x = 1;
			<span class="x">{x}</span>
		}
	</>
}`;

	it('lowers a render-bearing code block child to a scoped inline component (client)', () => {
		const { code, errors } = compile(with_statements, 'App.tsrx');
		expect(errors).toEqual([]);
		// The block's render output replaces the block at its source position.
		expect(code).toContain(`<span class="a">a</span><!>`);
		// Statements live inside the inline component callback — the wrapper
		// IIFE collapses once they move there.
		const component = code.search(/_\$_\.tsrx_element\(\(__anchor, __block\) => \{\s*const x = 1;/);
		expect(component).toBeGreaterThan(-1);
		expect(code.indexOf('_$_.expression(')).toBeLessThan(component);
		expect(code).toContain('() => x');
		expect(code).not.toContain('(() => {');
	});

	it('lowers a render-bearing code block child to a scoped inline component (server)', () => {
		const { code, errors } = compile(with_statements, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		expect(code).toContain('_$_.render_expression');
		const x_decl = code.indexOf('const x = 1;');
		const span_x = code.indexOf('_$_.escape(x)');
		expect(x_decl).toBeGreaterThan(code.indexOf('_$_.render_expression'));
		expect(span_x).toBeGreaterThan(x_decl);
	});

	it('keeps the block scoped and its render output typed in the TS view', () => {
		const { code } = compile_to_volar_mappings(with_statements, 'App.tsrx');
		const iife = code.indexOf('(() => {');
		expect(iife).toBeGreaterThan(-1);
		expect(code.indexOf('const x = 1;')).toBeGreaterThan(iife);
		expect(code).toContain('<span class="x">{x}</span>');
	});

	const shadowing = `function App() @{
	const y = 10;
	<>
		<span class="a">{'a'}</span>
		@{
			const x = 1;
			@{
				const x = 2;
				@{
					<span class="sum">{x + y}</span>
				}
			}
		}
	</>
}`;

	it('gives each nested code block its own lexical scope (client)', () => {
		const { code, errors } = compile(shadowing, 'App.tsrx');
		expect(errors).toEqual([]);
		// Shadowed declarations survive because each block is its own scope.
		expect(code).toContain('const x = 1;');
		expect(code).toContain('const x = 2;');
		expect(code).toContain('() => x + y');
		// Each nesting level becomes its own inline component scope.
		expect(code.indexOf('const x = 2;')).toBeGreaterThan(code.indexOf('const x = 1;'));
	});

	it('gives each nested code block its own lexical scope (server)', () => {
		const { code, errors } = compile(shadowing, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		expect(code).toContain('const x = 1;');
		expect(code).toContain('const x = 2;');
		expect(code).toContain('_$_.escape(x + y)');
	});

	it('keeps nested code blocks flat: plain scopes, one inline component (client)', () => {
		const { code } = compile(shadowing, 'App.tsrx');
		// Component shell + fragment shell + the innermost render-bearing
		// block. Intermediate chain levels are plain scopes, not inline
		// components wrapped in synthetic fragments, and the whole chain runs
		// synchronously inside a single scope wrapper.
		expect(code.match(/_\$_\.tsrx_element\(/g)).toHaveLength(3);
		expect(code.match(/_\$_\.template\(/g)).toHaveLength(3);
		expect(code.match(/with_scope/g)).toHaveLength(1);
		// The scope chain is the with_scope callback itself — no nested IIFEs.
		expect(code).not.toContain('(() => {');
	});

	it('gives each nested code block its own lexical scope (TS view)', () => {
		const { code } = compile_to_volar_mappings(shadowing, 'App.tsrx');
		expect(code).toContain('const x = 1;');
		expect(code).toContain('const x = 2;');
		expect(code).toContain('<span class="sum">{x + y}</span>');
	});

	const empty_nested = `function App() @{
	<>
		<span>{'a'}</span>
		<span>{'b'}</span>
		@{@{@{}}}
	</>
}`;

	it('prunes empty nested code blocks entirely (client)', () => {
		const { code, errors } = compile(empty_nested, 'App.tsrx');
		expect(errors).toEqual([]);
		// No anchor among the spans, no inline component — the empty chain
		// renders nothing.
		expect(code).toContain('<span>a</span><span>b</span>');
		expect(code).not.toContain('<span>a</span><span>b</span><!>');
		expect(code).not.toContain('(() => {');
	});

	it('prunes empty nested code blocks entirely (server)', () => {
		const { code, errors } = compile(empty_nested, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		expect(code).not.toContain('render_expression');
	});

	const template_only = `function App() @{
	<>
		<span class="a">{'a'}</span>
		@{<span class="x">{'x'}</span>}
	</>
}`;

	const template_only_nested = `function App() @{
	<>
		<span class="a">{'a'}</span>
		@{@{@{<span class="x">{'x'}</span>}}}
	</>
}`;

	it('merges a template-only block statically into the parent template (client)', () => {
		for (const source of [template_only, template_only_nested]) {
			const { code, errors } = compile(source, 'App.tsrx');
			expect(errors).toEqual([]);
			// Identical to writing the element inline: no inline component, no
			// expression anchor, no scope wrapper.
			expect(code).toContain('<span class="a">a</span><span class="x">x</span>');
			expect(code).not.toContain('(() => {');
			expect(code).not.toContain('with_scope');
		}
	});

	it('merges a template-only block statically into the output (server)', () => {
		for (const source of [template_only, template_only_nested]) {
			const { code, errors } = compile(source, 'App.tsrx', { mode: 'server' });
			expect(errors).toEqual([]);
			// Merged statically (not via render_expression); the server accumulator
			// collapses the whole template — static + the `'a'`/`'x'` holes — into a
			// single `__out +=`, mirroring the client output.
			expect(code).toContain(`__out += '<span class="a">a</span><span class="x">x</span>'`);
			expect(code).not.toContain('render_expression');
		}
	});

	const code_only = `function App() @{
	const items = [];
	<>
		@{
			const scoped = 1;
			items.push(scoped);
		}
		<span>{items.length}</span>
	</>
}`;

	it('lowers a code-only block child to a scoped statement block (client)', () => {
		const { code, errors } = compile(code_only, 'App.tsrx');
		expect(errors).toEqual([]);
		// The statements run in source order inside a real `{ }` block.
		const block = code.indexOf('{\n\t\t\t\tconst scoped = 1;');
		expect(block).toBeGreaterThan(-1);
		expect(code.indexOf('items.length')).toBeGreaterThan(block);
		// No inline component for code-only blocks.
		expect(code).not.toContain('(() => {');
	});

	it('lowers a code-only block child to a scoped statement block (server)', () => {
		const { code, errors } = compile(code_only, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		const scoped_decl = code.indexOf('const scoped = 1;');
		expect(scoped_decl).toBeGreaterThan(-1);
		expect(code.indexOf('_$_.escape(items.length)')).toBeGreaterThan(scoped_decl);
		expect(code).not.toContain('render_expression');
	});

	const nested_function_body = `function App() @{
	const x = 1;
	@{
		const y = 2;
		<div>{x + y}</div>
	}
}`;

	it('scopes a nested code-block render chain in a function body (client)', () => {
		const { code, errors } = compile(nested_function_body, 'App.tsrx');
		expect(errors).toEqual([]);
		// `x` is component setup; `y` lives in the nested block's own inline
		// component scope behind the expression anchor.
		const anchor = code.indexOf('_$_.expression(');
		expect(anchor).toBeGreaterThan(-1);
		expect(code.indexOf('const x = 1;')).toBeLessThan(anchor);
		expect(code.indexOf('const y = 2;')).toBeGreaterThan(anchor);
		expect(code).toContain('() => x + y');
	});

	it('scopes a nested code-block render chain in a function body (server)', () => {
		const { code, errors } = compile(nested_function_body, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		expect(code).toContain('_$_.render_expression');
		expect(code.indexOf('const y = 2;')).toBeGreaterThan(code.indexOf('_$_.render_expression'));
		expect(code).toContain('_$_.escape(x + y)');
	});

	const inside_if = `function App() @{
	const show = true;
	<>
		@if (show) {
			@{
				const label = 'shown';
				<span>{label}</span>
			}
		}
	</>
}`;

	it('scopes code-block children inside control-flow branches (client)', () => {
		const { code, errors } = compile(inside_if, 'App.tsrx');
		expect(errors).toEqual([]);
		// `label` lives inside the inline component within the @if branch.
		const branch = code.indexOf('var consequent =');
		const label = code.indexOf(`const label = 'shown';`);
		expect(branch).toBeGreaterThan(-1);
		expect(label).toBeGreaterThan(branch);
	});

	it('scopes code-block children inside control-flow branches (server)', () => {
		const { code, errors } = compile(inside_if, 'App.tsrx', { mode: 'server' });
		expect(errors).toEqual([]);
		expect(code).toContain(`const label = 'shown';`);
		expect(code).toContain('_$_.escape(label)');
	});
});
