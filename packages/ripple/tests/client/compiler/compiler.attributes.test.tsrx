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

		// The prop names, hyphenated or not, are the site's key list; the values
		// are the constructor arguments.
		expect(result.code).toMatch(/props_site\(\['data-scope', 'aria-label', 'class'\]/);
		expect(result.code).toMatch(/\.C\(props_site, "test", "accessible", "valid"\)/);
	});

	it('generates valid JavaScript for all types of hyphenated attributes', () => {
		const testCases = [
			{
				attr: 'data-testid="value"',
				expected: /\['data-testid'\][\s\S]*\.C\(props_site, "value"\)/,
			},
			{ attr: 'aria-label="label"', expected: /\['aria-label'\][\s\S]*\.C\(props_site, "label"\)/ },
			{
				attr: 'data-custom-attr="custom"',
				expected: /\['data-custom-attr'\][\s\S]*\.C\(props_site, "custom"\)/,
			},
			{ attr: 'ng-if="condition"', expected: /\['ng-if'\][\s\S]*\.C\(props_site, "condition"\)/ },
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
			expect(result.code).toMatch(expected);
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

		// Valid identifiers should not be quoted
		expect(result.code).toMatch(/'validProp'/);
		expect(result.code).toMatch(/'class'/);
		expect(result.code).toMatch(/'id'/);

		// Invalid identifiers (with hyphens) should be quoted
		expect(result.code).toMatch(/'data-invalid'/);
		expect(result.code).toMatch(/'aria-invalid'/);
		expect(result.code).toMatch(/'custom-prop'/);
		expect(result.code).toMatch(
			/\.C\(props_site, "valid", "valid", "valid", "invalid", "invalid", "invalid"\)/,
		);
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

		// Extract the site's key list from the generated code and test it's valid JavaScript
		const match = result.code.match(/_\$_\.props_site\((\[[^\]]*\])/);
		expect(match).toBeTruthy();

		const keys = match?.[1];
		expect(() => {
			// Test that the array literal is syntactically valid
			new Function(`return ${keys}`);
		}).not.toThrow();

		// Also verify it contains the expected quoted key
		expect(keys).toMatch(/'data-scope'/);
		expect(result.code).toMatch(/\.C\(props_site, "test"\)/);
	});
});
