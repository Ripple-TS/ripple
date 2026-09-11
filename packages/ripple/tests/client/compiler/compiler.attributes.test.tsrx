import { parse, compile } from '@tsrx/ripple';

describe('compiler > attributes', () => {
	it('generates valid JavaScript for component props with hyphenated attributes', () => {
		const source = `
			function Child(props) @{
				<div />
			}

			export default function App() @{
				<Child data-scope="test" aria-label="accessible" class="valid" />
			}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		// Hyphenated prop names are quoted keys of the plain props literal.
		expect(result.code).toContain(`'data-scope': "test"`);
		expect(result.code).toContain(`'aria-label': "accessible"`);
		expect(result.code).toContain('class: "valid"');
	});

	it('generates valid JavaScript for all types of hyphenated attributes', () => {
		const testCases = [
			{ attr: 'data-testid="value"', expected: `'data-testid': "value"` },
			{ attr: 'aria-label="label"', expected: `'aria-label': "label"` },
			{ attr: 'data-custom-attr="custom"', expected: `'data-custom-attr': "custom"` },
			{ attr: 'ng-if="condition"', expected: `'ng-if': "condition"` },
		];

		testCases.forEach(({ attr, expected }) => {
			const source = `
				function Child(props) @{
					<div />
				}
				export default function App() @{
					<Child ${attr} />
				}`;

			const result = compile(source, 'test.tsrx', { mode: 'client' });
			expect(result.code).toContain(expected);
		});
	});

	it('handles mixed valid and invalid attribute identifiers correctly', () => {
		const source = `
			function Child(props) @{
				<div />
			}

			export default function App() @{
				<Child
					validProp="valid"
					class="valid"
					id="valid"
					data-invalid="invalid"
					aria-invalid="invalid"
					custom-prop="invalid"
				/>
			}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		// Valid identifiers are plain keys
		expect(result.code).toContain('validProp: "valid"');
		expect(result.code).toContain('class: "valid"');
		expect(result.code).toContain('id: "valid"');

		// Invalid identifiers (with hyphens) are quoted keys
		expect(result.code).toContain(`'data-invalid': "invalid"`);
		expect(result.code).toContain(`'aria-invalid': "invalid"`);
		expect(result.code).toContain(`'custom-prop': "invalid"`);
	});

	it('ensures generated code is syntactically valid JavaScript', () => {
		const source = `
			function Child(props) @{
				<div />
			}

			export default function App() @{
				<Child data-scope="test" />
			}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		// Extract the props literal from the generated code and test it's valid JavaScript
		const match = result.code.match(/render_component\(Child, __anchor, (\{[\s\S]*?\})\)/);
		expect(match).toBeTruthy();

		const literal = match?.[1];
		expect(() => {
			// Test that the object literal is syntactically valid
			new Function(`return ${literal}`);
		}).not.toThrow();

		// Also verify it contains the expected quoted key
		expect(literal).toContain(`'data-scope': "test"`);
	});
});
