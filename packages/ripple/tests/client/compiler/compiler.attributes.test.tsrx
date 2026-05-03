import { parse, compile } from '@tsrx/ripple';

describe('compiler > attributes', () => {
	it('generates valid JavaScript for component props with hyphenated attributes', () => {
		const source = `
			component Child(props) {
				<div />
			}

			export default component App() {
				<Child data-scope="test" aria-label="accessible" class="valid" />
			}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		// Should contain properly quoted hyphenated properties and unquoted valid identifiers
		expect(result.code).toMatch(/'data-scope': "test"/);
		expect(result.code).toMatch(/'aria-label': "accessible"/);
		expect(result.code).toMatch(/class: "valid"/);
	});

	it('generates valid JavaScript for all types of hyphenated attributes', () => {
		const testCases = [
			{ attr: 'data-testid="value"', expected: /'data-testid': "value"/ },
			{ attr: 'aria-label="label"', expected: /'aria-label': "label"/ },
			{ attr: 'data-custom-attr="custom"', expected: /'data-custom-attr': "custom"/ },
			{ attr: 'ng-if="condition"', expected: /'ng-if': "condition"/ },
		];

		testCases.forEach(({ attr, expected }) => {
			const source = `
				component Child(props) { <div /> }
				export default component App() { <Child ${attr} /> }`;

			const result = compile(source, 'test.tsrx', { mode: 'client' });
			expect(result.code).toMatch(expected);
		});
	});

	it('handles mixed valid and invalid attribute identifiers correctly', () => {
		const source = `
			component Child(props) {
				<div />
			}

			export default component App() {
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
		expect(result.code).toMatch(/validProp: "valid"/);
		expect(result.code).toMatch(/class: "valid"/);
		expect(result.code).toMatch(/id: "valid"/);

		// Invalid identifiers (with hyphens) should be quoted
		expect(result.code).toMatch(/'data-invalid': "invalid"/);
		expect(result.code).toMatch(/'aria-invalid': "invalid"/);
		expect(result.code).toMatch(/'custom-prop': "invalid"/);
	});

	it('ensures generated code is syntactically valid JavaScript', () => {
		const source = `
			component Child(props) {
				<div />
			}

			export default component App() {
				<Child data-scope="test" />
			}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		// Extract the props object from the generated code and test it's valid JavaScript
		const match = result.code.match(/Child\([^,]+,\s*(\{[^}]+\})/);
		expect(match).toBeTruthy();

		const propsObject = match?.[1];
		expect(() => {
			// Test that the object literal is syntactically valid
			new Function(`return ${propsObject}`);
		}).not.toThrow();

		// Also verify it contains the expected quoted property
		expect(propsObject).toMatch(/'data-scope': "test"/);
	});
});
