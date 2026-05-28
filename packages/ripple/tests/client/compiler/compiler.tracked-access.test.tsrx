import { compile } from '@tsrx/ripple';

const value_message = /Use \.value or &\[\] lazy destructuring/;
const reference_message = /Use the tracked value directly instead/;

describe('Compiler: Tracked Object Direct Access Checks', () => {
	it('should error on direct access to __v of a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count.__v);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(
			/Directly accessing internal property "__v" of a tracked object is not allowed/,
		);
	});

	it('should error on direct access to "a" (get/set config) of a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let myTracked = track(0);
                console.log(myTracked.a);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(
			/Directly accessing internal property "a" of a tracked object is not allowed/,
		);
	});

	it('should error on direct access to "b" (block) of a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let myTracked = track(0);
                console.log(myTracked.b);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(
			/Directly accessing internal property "b" of a tracked object is not allowed/,
		);
	});

	it('should error on direct access to "c" (clock) of a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let myTracked = track(0);
                console.log(myTracked.c);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(
			/Directly accessing internal property "c" of a tracked object is not allowed/,
		);
	});

	it('should error on direct access to "f" (flags) of a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let myTracked = track(0);
                console.log(myTracked.f);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(
			/Directly accessing internal property "f" of a tracked object is not allowed/,
		);
	});

	it('should compile successfully with correct @ syntax access', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let &[count] = track(0);
                console.log(count);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should compile successfully with correct value access', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count.value);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should not error on accessing __v of a non-tracked object', () => {
		const code = `
            export default function App() { return <>
                let obj = { __v: 123 };
                console.log(obj.__v);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should not error on accessing __v of a non-tracked object (member expression)', () => {
		const code = `
            export default function App() { return <>
                let data = { value: { __v: 456 } };
                console.log(data.value.__v);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it(
		'should not error on accessing a property named like an internal one on a non-tracked object',
		() => {
			const code = `
            export default function App() { return <>
                let config = { a: 'some_value', b: 'another_value' };
                console.log(config.a);
                console.log(config.b);
            </>; }
        `;
			expect(() => compile(code, 'test.tsrx')).not.toThrow();
		},
	);

	it('should error on indexed [0] access on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count[0]);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(value_message);
	});

	it('should error on indexed [1] access on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                let raw = count[1];
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(reference_message);
	});

	it('should error on indexed [0] write on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                count[0] = 5;
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(value_message);
	});

	it('collects tracked numeric index errors in loose mode', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count[0]);
                let raw = count[1];
            </>; }
        `;
		const result = compile(code, 'test.tsrx', { loose: true });

		expect(result.errors.map((error) => error.message)).toEqual(
			expect.arrayContaining([
				expect.stringMatching(value_message),
				expect.stringMatching(reference_message),
			]),
		);
	});

	it('should error on indexed access through a known tracked lazy ref binding', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let &[value, tracked_ref] = track(0);
                tracked_ref[0]++;
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).toThrow(value_message);
	});

	it('should allow lazy destructuring a tracked value', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let &[value, tracked_ref] = track(0);
                console.log(value, tracked_ref.value);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should allow .value read access on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count.value);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should allow .value assignment on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                count.value = 5;
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should allow .length read access on a tracked object', () => {
		const code = `
import { track } from 'ripple';
            export default function App() { return <>
                let count = track(0);
                console.log(count.length);
            </>; }
        `;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});
});
