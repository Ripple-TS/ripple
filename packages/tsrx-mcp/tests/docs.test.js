import { describe, expect, it } from 'vitest';
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
		expect(find_documentation_section('components')?.content).toContain('ComponentDeclaration');
		expect(find_documentation_section('tsx-expression-values')?.content).toContain('TsxElement');
	});
});
