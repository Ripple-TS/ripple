import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generate_docs_index, generated_docs_path } from '../scripts/generate-docs-index.js';
import { find_documentation_section, list_documentation_sections } from '../src/index.js';

describe('@tsrx/mcp documentation index', () => {
	it('contains the core target-neutral sections', () => {
		const slugs = list_documentation_sections().map((section) => section.slug);

		expect(slugs).toEqual(
			expect.arrayContaining(['overview', 'components', 'expression-values', 'target-integration']),
		);
	});

	it('includes generated specification grammar in language sections', () => {
		const legacy_expression_node = ['Tsrx', 'Expression'].join('');
		expect(find_documentation_section('components')?.content ?? '').toContain(
			'export function Button',
		);
		expect(find_documentation_section('components')?.content ?? '').toContain('@{');
		expect(find_documentation_section('components')?.content ?? '').toContain(
			'add the missing `@` before the opening brace',
		);
		expect(find_documentation_section('expression-values')?.content ?? '').toContain(
			'PrimaryExpression',
		);
		expect(find_documentation_section('expression-values')?.content ?? '').toContain('JSXElement');
		expect(find_documentation_section('expression-values')?.content ?? '').not.toContain('tsx:');
		expect(find_documentation_section('expression-values')?.content ?? '').not.toContain(
			legacy_expression_node,
		);
		expect(find_documentation_section('overview')?.content ?? '').toContain(
			'every directive body uses a `{...}` template block',
		);
	});

	it('documents component loop control-flow rules', () => {
		const content = find_documentation_section('control-flow')?.content ?? '';

		expect(content).toContain(' { ... }');
		expect(content).toContain('`return` statements are not template output');
		expect(content).toContain('Inside TSRX `@if` branches and `@for ... of` loops');
		expect(content).toContain('direct `continue`, `break`, and `return` statements are invalid');
		expect(content).toContain('both `break` and `return` are invalid');
		expect(content).toContain('Regular `for`, `for...in`, `while`, and `do...while`');
	});

	it('keeps the checked-in generated docs fresh', async () => {
		expect(readFileSync(generated_docs_path, 'utf8')).toBe(await generate_docs_index());
	});
});
