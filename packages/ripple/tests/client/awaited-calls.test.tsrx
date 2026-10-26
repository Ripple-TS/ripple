import { describe, expect, it } from 'vitest';
import { scope } from 'ripple/internal/client';

describe('calls with awaited operands', () => {
	it('evaluates the reported Object.values expression', async () => {
		let report = async () => 0;
		const read = async () => ({ first: 1, second: 2 });
		function Example() @{
			report = async () => Object.values(await read()).length;
			<button onClick={() => report()}>Read</button>
		}
		render(Example);
		expect(await report()).toBe(2);
	});

	it('preserves callee and argument order, receiver, result identity, and scope', async () => {
		const events: string[] = [];
		let run: () => Promise<unknown[]> = async () => [];
		let owner: ReturnType<typeof scope>;
		const result = Promise.resolve('result');
		const object = {
			get method() {
				events.push('get');
				expect(scope()).toBe(owner);
				return function (...args: number[]) {
					events.push('call');
					expect(this).toBe(object);
					expect(args).toEqual([1, 2, 3]);
					expect(scope()).toBe(owner);
					return result;
				};
			},
		};
		const argument = (value: number) => {
			events.push(String(value));
			expect(scope()).toBe(owner);
			return value;
		};
		function Example() @{
			owner = scope();
			run = async () => [object.method(argument(1), await argument(2), argument(3))];
			<p>Ready</p>
		}
		render(Example);
		const previous = scope();
		expect((await run())[0]).toBe(result);
		expect(events).toEqual(['get', '1', '2', '3', 'call']);
		expect(owner).not.toBeNull();
		expect(scope()).toBe(previous);
	});

	it('short-circuits the rest of optional chains before evaluating arguments', async () => {
		let run: (object: any) => Promise<unknown> = async () => undefined;
		let optional: (object: any) => Promise<unknown> = async () => undefined;
		let reads = 0;
		const read = async () => ++reads;
		function Example() @{
			run = async (object: any) => object?.nested.method(await read()).value;
			optional = async (object: any) => object.method?.(await read());
			<p>Ready</p>
		}
		render(Example);
		expect(await run(null)).toBeUndefined();
		expect(await optional({})).toBeUndefined();
		expect(reads).toBe(0);
		await expect(run({ nested: {} })).rejects.toThrow(TypeError);
		expect(reads).toBe(1);
		expect(await run({ nested: { method: (value: number) => ({ value }) } })).toBe(2);
	});

	it('captures callees separately for concurrent invocations', async () => {
		let run: (object: any, input: Promise<number>) => Promise<number> = async () => 0;
		let resolve_first: (value: number) => void = () => {};
		const first = new Promise<number>((resolve) => {
			resolve_first = resolve;
		});
		function Example() @{
			run = async (object: any, input: Promise<number>) => object.method(await input);
			<p>Ready</p>
		}
		render(Example);
		const pending = run({ method: (value: number) => value + 10 }, first);
		expect(await run({ method: (value: number) => value + 20 }, Promise.resolve(2))).toBe(22);
		resolve_first(1);
		expect(await pending).toBe(11);
	});

	it(
		'preserves the receiver and argument evaluation of a parenthesized optional member',
		async () => {
			let run: (object: any) => Promise<unknown> = async () => undefined;
			let reads = 0;
			const read = async () => ++reads;
			const object = {
				method(value: number) {
					expect(this).toBe(object);
					return value;
				},
			};
			function Example() @{
				// prettier-ignore
				run = async (object: any) => (object?.method)(await read());
				<p>Ready</p>
			}
			render(Example);
			expect(await run(object)).toBe(1);
			await expect(run(null)).rejects.toThrow(TypeError);
			expect(reads).toBe(2);
		},
	);

	it('constructs with spread arguments under the component scope', async () => {
		let run: () => Promise<any> = async () => undefined;
		let owner: ReturnType<typeof scope>;
		class Result {
			values: number[];
			constructor(...values: number[]) {
				expect(scope()).toBe(owner);
				this.values = values;
			}
		}
		const read = async () => [1, 2];
		function Example() @{
			owner = scope();
			run = async () => new Result(...await read());
			<p>Ready</p>
		}
		render(Example);
		const result = await run();
		expect(result).toBeInstanceOf(Result);
		expect(result.values).toEqual([1, 2]);
	});
});
