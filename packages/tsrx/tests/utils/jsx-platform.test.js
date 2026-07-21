import { describe, expect, it } from 'vitest';
import { createJsxTransform, parseModule } from '../../src/index.js';

const BASE_PLATFORM = {
	name: 'test target',
	imports: {
		suspense: 'test-target',
		errorBoundary: 'test-target/error-boundary',
	},
	jsx: {
		rewriteClassAttr: false,
		classAttrName: 'class',
	},
	validation: {
		requireUseServerForAwait: false,
	},
};

describe('createJsxTransform raw-text script capability', () => {
	it('lets an explicitly opted-in target hook own the marked expression', () => {
		const source = `export function App(props: { source: string }) @{
			<script type="application/json">{= props.source}</script>
		}`;
		const ast = parseModule(source, 'App.tsrx');
		let received_marked_child = false;
		const transform = createJsxTransform({
			...BASE_PLATFORM,
			hooks: {
				transformRawTextScriptExpression(element, expression) {
					received_marked_child = expression.rawText === 'script';
					const { rawText: _raw_text, ...ordinary_expression } = expression;
					const safe_name = (name) => ({ ...name, name: 'WholeScript' });
					return {
						...element,
						openingElement: {
							...element.openingElement,
							name: safe_name(element.openingElement.name),
						},
						closingElement: {
							...element.closingElement,
							name: safe_name(element.closingElement.name),
						},
						children: [ordinary_expression],
					};
				},
			},
		});

		const result = transform(ast, source, 'App.tsrx');

		expect(received_marked_child).toBe(true);
		expect(result.code).toContain(
			'<WholeScript type="application/json">{props.source}</WholeScript>',
		);
		expect(result.code).not.toContain('<script');
	});

	it('rejects an opt-in hook that leaves the parser-only marker behind', () => {
		const source = 'const value = <script>{= source}</script>;';
		const ast = parseModule(source, 'App.tsrx');
		const transform = createJsxTransform({
			...BASE_PLATFORM,
			hooks: {
				transformRawTextScriptExpression(element) {
					return element;
				},
			},
		});

		expect(() => transform(ast, source, 'App.tsrx')).toThrow(
			'must return a complete lowering with the parser-only rawText marker removed',
		);
	});
});
