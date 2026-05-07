import { compile } from '@tsrx/ripple';

describe('compiler > typescript', () => {
	it('compiles TSInstantiationExpression', () => {
		const source = `function makeBox<T,>(value: T) {
	return { value };
}
const makeStringBox = makeBox<string>;
const stringBox = makeStringBox('abc');
const ErrorMap = Map<string, Error>;
const errorMap = new ErrorMap();`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		expect(result.code).toMatchSnapshot();
	});

	it('removes type assertions from function parameters and leaves default values', () => {
		const source = `
function getString(e: string = 'test') {
	return e;
}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		expect(result.code).toMatchSnapshot();
	});

	it('removes class TypeScript syntax from JS output', () => {
		const source = `interface BaseEvent {}

class PrintEvent implements BaseEvent {
	text: string;

	constructor(text: string) {
		this.text = text;
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		expect(result.code).not.toContain('implements');
		expect(result.code).toMatchSnapshot();
	});

	it('removes class extends type arguments from JS output', () => {
		const source = `class StringMap extends Map<string, string> {
	constructor() {
		super();
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });

		expect(result.code).not.toContain('Map<string, string>');
		expect(result.code).toContain('class StringMap extends Map');
		expect(result.code).toMatchSnapshot();
	});
});
