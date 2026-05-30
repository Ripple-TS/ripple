import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generate_docs_index, generated_docs_path } from '../scripts/generate-docs-index.js';
import { find_documentation_section, list_documentation_sections } from '../src/index.js';

describe('@tsrx/mcp documentation index', () => {
	it('contains the core target-neutral sections', () => {
		const slugs = list_documentation_sections().map((section) => section.slug);

		expect(slugs).toEqual(
			expect.arrayContaining([
				'overview',
				'components',
				'tsx-expression-values',
				'target-integration',
			]),
		);
	});

	it('includes generated specification grammar in language sections', () => {
		expect(find_documentation_section('components')?.content ?? '').toContain('function Button');
		expect(find_documentation_section('tsx-expression-values')?.content ?? '').toContain(
			'TsxCompatElement',
		);
		expect(find_documentation_section('tsx-expression-values')?.content ?? '').toContain(
			'TsrxExpression',
		);
	});

	it('documents component loop control-flow rules', () => {
		const content = find_documentation_section('control-flow')?.content ?? '';

		expect(content).toContain('continue');
		expect(content).toContain('`return` statements are invalid anywhere');
		expect(content).toContain('`break` is invalid inside TSRX `for...of` loops');
		expect(content).toContain('Regular `for`, `for...in`, `while`, and `do...while`');
	});

	it('keeps the checked-in generated docs fresh', async () => {
		expect(readFileSync(generated_docs_path, 'utf8')).toBe(await generate_docs_index());
	});
});
