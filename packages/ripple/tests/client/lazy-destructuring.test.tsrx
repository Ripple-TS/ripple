import type { Tracked } from 'ripple';
import { flushSync, track } from 'ripple';

describe('lazy destructuring', () => {
	it('supports tracked value getter and setter', () => {
		function Test() {
			return <>
				let count = track(1);
				let doubled = track(() => count.value * 2);
				<div>{`${count.value}-${doubled.value}`}</div>
				<button
					onClick={() => {
						count.value = 5;
					}}
				>
					{'set'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('div')!.textContent).toBe('1-2');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('div')!.textContent).toBe('5-10');
	});

	it('lazily accesses object properties with const', () => {
		function Inner(&{ a, b }: { a: number; b: string }) {
			return <><pre>{`${a}-${b}`}</pre></>;
		}

		function Test() {
			return <>
				let &[a] = track(1);
				let &[b] = track('hello');
				<Inner {a} {b} />
				<button
					onClick={() => {
						a = 2;
						b = 'world';
					}}
				>
					{'update'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('1-hello');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('pre')!.textContent).toBe('2-world');
	});

	it('lazily accesses array elements with const', () => {
		function Inner(&{ first, second }: { first: number; second: number }) {
			return <><pre>{`${first}-${second}`}</pre></>;
		}

		function Test() {
			return <>
				let &[first] = track(10);
				let &[second] = track(20);
				<Inner {first} {second} />
				<button
					onClick={() => {
						first = 30;
						second = 40;
					}}
				>
					{'update'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('10-20');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('pre')!.textContent).toBe('30-40');
	});

	it('preserves numeric member access on lazy array value bindings', () => {
		function Child({ pair: &[first] }: { pair: [{ 0: string }] }) {
			return <><pre>{first[0]}</pre></>;
		}

		function Test() {
			return <><Child pair={[{ 0: 'x' }]} /></>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('x');
	});

	it('supports default values in lazy object destructuring', () => {
		function Test() {
			return <>
				const obj: { a: number; b?: number } = { a: 5 };
				const &{ a, b = 99 } = obj;
				<pre>{`${a}-${b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('5-99');
	});

	it('supports lazy destructuring in component params', () => {
		function Inner(&{ name, age }: { name: string; age: number }) {
			return <><pre>{`${name}-${age}`}</pre></>;
		}

		function Test() {
			return <><Inner name="Alice" age={30} /></>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('Alice-30');
	});

	it('supports lazy destructuring in component params with reactivity', () => {
		function Inner(&{ count }: { count: number }) {
			return <><pre>{count}</pre></>;
		}

		function Test() {
			return <>
				let &[count] = track(0);
				<Inner {count} />
				<button
					onClick={() => {
						count++;
					}}
				>
					{'increment'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('0');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('pre')!.textContent).toBe('1');
	});

	it('supports nested lazy destructuring in non-lazy component params', () => {
		function Inner({ something: &[first, second] }: { something: Tracked<number> }) {
			return <>
				first = second.value + 1;
				<pre>{`${first}-${second.value}`}</pre>
			</>;
		}

		function Test() {
			return <><Inner something={track(1)} /></>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('2-2');
	});

	it(
		'preserves lazy getter/setter behavior for nested rest destructuring in non-lazy component params',
		() => {
			function Inner({
				values: [head, ...&{ length: rest_length, 0: first_rest }],
			}: {
				values: [number, Tracked<number>, Tracked<number>];
			}) {
				return <>
					const before = `${first_rest?.value ?? 'nil'}-${rest_length}`;
					rest_length = 0;
					<pre>{`${head}-${before}-${first_rest?.value ?? 'nil'}-${rest_length}`}</pre>
				</>;
			}

			function Test() {
				return <><Inner values={[10, track(20), track(30)]} /></>;
			}

			render(Test);
			expect(container.querySelector('pre')!.textContent).toBe('10-20-2-nil-0');
		},
	);

	it('supports lazy destructuring in function params', () => {
		function Test() {
			return <>
				function getInfo(&{ x, y }: { x: number; y: number }) {
					return x + y;
				}
				const result = getInfo({ x: 3, y: 7 });
				<pre>{result}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('10');
	});

	it('supports nested lazy destructuring in non-lazy function params', () => {
		function Test() {
			return <>
				const something = track(1);
				function getInfo({ something: &[first, second] }: { something: Tracked<number> }) {
					first = second.value + 1;
					return `${first}-${second.value}`;
				}
				const result = getInfo({ something });
				<pre>{result}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('2-2');
	});

	it(
		'preserves lazy getter/setter behavior for nested rest destructuring in non-lazy function params',
		() => {
			function Test() {
				return <>
					function summarize({
						values: [head, ...&{ length: rest_length, 0: first_rest }],
					}: {
						values: [number, Tracked<number>, Tracked<number>];
					}) {
						const before = `${first_rest?.value ?? 'nil'}-${rest_length}`;
						rest_length = 0;
						return `${head}-${before}-${first_rest?.value ?? 'nil'}-${rest_length}`;
					}
					const result = summarize({ values: [5, track(6), track(7)] });
					<pre>{result}</pre>
				</>;
			}

			render(Test);
			expect(container.querySelector('pre')!.textContent).toBe('5-6-2-nil-0');
		},
	);

	it('supports let lazy destructuring with assignment writeback', () => {
		function Test() {
			return <>
				const obj = { a: 1, b: 2 };
				let &{ a, b } = obj;
				a = 10;
				b = 20;
				<pre>{`${obj.a}-${obj.b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('10-20');
	});

	it('supports compound assignment operators on lazy bindings', () => {
		function Test() {
			return <>
				const obj = { a: 5, b: 10 };
				let &{ a, b } = obj;
				a += 3;
				b *= 2;
				<pre>{`${obj.a}-${obj.b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('8-20');
	});

	it('supports update expressions on lazy bindings', () => {
		function Test() {
			return <>
				const obj = { count: 0 };
				let &{ count } = obj;
				count++;
				count++;
				count--;
				<pre>{obj.count}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('1');
	});

	it('supports function params with lazy destructuring and default values', () => {
		function Test() {
			return <>
				function calc(&{ x, y = 100 }: { x: number; y?: number }) {
					return x + y;
				}
				const a = calc({ x: 5, y: 10 });
				const b = calc({ x: 5 });
				<pre>{`${a}-${b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('15-105');
	});

	it('supports lazy destructuring with default value writeback', () => {
		function Test() {
			return <>
				const obj: { a: number; b?: number } = { a: 1 };
				let &{ a, b = 50 } = obj;
				b = 99;
				<pre>{`${a}-${obj.b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('1-99');
	});

	it('supports rest destructuring from iterable array-like tracked values', () => {
		function Test() {
			return <>
				let &[value, ...rest] = track(0);
				<pre>{`${value}-${rest.length}-${(rest[0] as Tracked<number>).value === value}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('0-1-true');
	});

	it('supports rest destructuring from length-only array-like sources', () => {
		function Test() {
			return <>
				const source = { 0: 'x', 1: 'y', 2: 'z', length: 3 };
				const &[first, ...rest] = source;
				<pre>{`${first}-${rest.join(',')}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('x-y,z');
	});

	it('supports rest destructuring from iterable sources', () => {
		function Test() {
			return <>
				const source = {
					*[Symbol.iterator]() {
						yield 'x';
						yield 'y';
						yield 'z';
					},
				};
				const &[first, ...rest] = source;
				<pre>{`${first}-${rest.join(',')}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('x-y,z');
	});

	it('supports update expressions on lazy bindings with default values', () => {
		function Test() {
			return <>
				const obj: { count?: number } = {};
				let &{ count = 0 } = obj;
				count++;
				count++;
				<pre>{obj.count}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('2');
	});

	it('supports member access on lazy destructured objects', () => {
		function Test() {
			return <>
				const obj = { user: { name: 'Alice', age: 30 } };
				const &{ user } = obj;
				<pre>{`${user.name}-${user.age}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('Alice-30');
	});

	it('supports standalone lazy array destructuring with track()', () => {
		function Test() {
			return <>
				let count: number;
				&[count] = track(0);
				<div>{count}</div>
				<button
					onClick={() => {
						count++;
					}}
				>
					{'inc'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('div')!.textContent).toBe('0');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('div')!.textContent).toBe('1');
	});

	it('supports standalone lazy array destructuring with second element', () => {
		function Test() {
			return <>
				let value;
				let tracked;
				&[value, tracked] = track(42);
				<div>{value}</div>
				<button
					onClick={() => {
						value = 100;
					}}
				>
					{'set'}
				</button>
			</>;
		}

		render(Test);
		expect(container.querySelector('div')!.textContent).toBe('42');
		container.querySelector('button')!.click();
		flushSync();
		expect(container.querySelector('div')!.textContent).toBe('100');
	});

	it('supports direct value access on tracked values', () => {
		function Test() {
			return <>
				let tracked = track(0);
				++tracked.value;
				tracked.value++;
				tracked.value = tracked.value + 1;
				let value = tracked.value;
				let ref = tracked;
				<pre>{`${value}-${ref === tracked}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('3-true');
	});

	it('supports lazy destructured tracked ref value access', () => {
		function Child({ pair: &[value, tracked_ref] }: { pair: Tracked<number> }) {
			return <>
				++tracked_ref.value;
				tracked_ref.value++;
				<pre>{`${value}-${tracked_ref.value}`}</pre>
			</>;
		}

		function Test() {
			return <>
				let tracked = track(0);
				<Child pair={tracked} />
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('2-2');
	});

	it('supports standalone lazy object destructuring', () => {
		function Test() {
			return <>
				let a;
				let b;
				&{ a, b } = { a: 10, b: 20 };
				<pre>{`${a}-${b}`}</pre>
			</>;
		}

		render(Test);
		expect(container.querySelector('pre')!.textContent).toBe('10-20');
	});
});
