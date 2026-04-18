import type { Tracked } from 'ripple';
import { track } from 'ripple';

describe('lazy destructuring', () => {
	it('supports tracked value getter and setter', async () => {
		component Test() {
			let count = track(1);
			let derived = track(() => count.value * 2);

			count.value = 3;

			<pre>{`${count.value}-${derived.value}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>3-6</pre>');
	});

	it('lazily accesses object properties', async () => {
		component Inner(&{ a, b }: { a: number; b: string }) {
			<pre>{`${a}-${b}`}</pre>
		}

		component Test() {
			<Inner a={1} b="hello" />
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>1-hello</pre>');
	});

	it('supports default values in lazy object destructuring', async () => {
		component Test() {
			const obj: { a: number; b?: number } = { a: 5 };
			const &{ a, b = 99 } = obj;
			<pre>{`${a}-${b}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>5-99</pre>');
	});

	it('supports nested lazy destructuring in non-lazy component params', async () => {
		component Inner({ something: &[first, second] }: { something: Tracked<number> }) {
			first = second.value + 1;
			<pre>{`${first}-${second.value}`}</pre>
		}

		component Test() {
			<Inner something={track(1)} />
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>2-2</pre>');
	});

	it('supports let lazy destructuring with assignment writeback', async () => {
		component Test() {
			const obj = { a: 1, b: 2 };
			let &{ a, b } = obj;
			a = 10;
			b = 20;
			<pre>{`${obj.a}-${obj.b}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>10-20</pre>');
	});

	it('supports compound assignment operators on lazy bindings', async () => {
		component Test() {
			const obj = { a: 5, b: 10 };
			let &{ a, b } = obj;
			a += 3;
			b *= 2;
			<pre>{`${obj.a}-${obj.b}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>8-20</pre>');
	});

	it('supports update expressions on lazy bindings', async () => {
		component Test() {
			const obj = { count: 0 };
			let &{ count } = obj;
			count++;
			count++;
			count--;
			<pre>{obj.count}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>1</pre>');
	});

	it('supports update expressions on lazy bindings with default values', async () => {
		component Test() {
			const obj: { count?: number } = {};
			let &{ count = 0 } = obj;
			count++;
			count++;
			<pre>{obj.count}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>2</pre>');
	});

	it('supports function params with lazy destructuring and default values', async () => {
		component Test() {
			function calc(&{ x, y = 100 }: { x: number; y?: number }) {
				return x + y;
			}
			const a = calc({ x: 5, y: 10 });
			const b = calc({ x: 5 });
			<pre>{`${a}-${b}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>15-105</pre>');
	});

	it('supports nested lazy destructuring in non-lazy function params', async () => {
		component Test() {
			const something = track(1);

			function getInfo({ something: &[first, second] }: { something: Tracked<number> }) {
				first = second.value + 1;
				return `${first}-${second.value}`;
			}

			<pre>{getInfo({ something })}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>2-2</pre>');
	});

	it(
		'preserves lazy getter/setter behavior for RestElement nested destructuring in non-lazy component params',
		async () => {
			component Inner({ values: [head, ...&{ 0: first_rest, length: rest_length }] }) {
				const before = `${first_rest}-${rest_length}`;
				rest_length = 0;
				<pre>{`${head}-${before}-${first_rest}-${rest_length}`}</pre>
			}

			component Test() {
				<Inner values={[10, 20, 30]} />
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>10-20-2-undefined-0</pre>');
		},
	);

	it(
		'preserves lazy getter/setter behavior for RestElement nested destructuring in non-lazy function params',
		async () => {
			component Test() {
				function getInfo({ values: [head, ...&{ 0: first_rest, length: rest_length }] }) {
					const before = `${first_rest}-${rest_length}`;
					rest_length = 0;
					return `${head}-${before}-${first_rest}-${rest_length}`;
				}

				<pre>{getInfo({ values: [5, 6, 7] })}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>5-6-2-undefined-0</pre>');
		},
	);

	it('supports member access on lazy destructured objects', async () => {
		component Test() {
			const obj = { user: { name: 'Alice', age: 30 } };
			const &{ user } = obj;
			<pre>{`${user.name}-${user.age}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>Alice-30</pre>');
	});

	it('supports rest in lazy array destructuring for tracked tuples (iterable)', async () => {
		component Test() {
			let tracked_value = track(0);
			let &[value, ...rest] = tracked_value;
			<pre>{`${value}-${rest.length}-${rest[0] === tracked_value}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>0-1-true</pre>');
	});

	it('supports rest in lazy array destructuring for length-only array-like values', async () => {
		component Test() {
			const array_like = { 0: 'x', 1: 'y', 2: 'z', length: 3 };
			const &[first, ...rest] = array_like;
			<pre>{`${first}-${rest.join('')}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>x-yz</pre>');
	});

	it('supports standalone lazy array destructuring with track()', async () => {
		component Test() {
			let count;
			&[count] = track(0);
			<div>{count}</div>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<div>0</div>');
	});

	it('supports standalone lazy object destructuring', async () => {
		component Test() {
			let a;
			let b;
			&{ a, b } = { a: 10, b: 20 };
			<pre>{`${a}-${b}`}</pre>
		}

		const { body } = await render(Test);
		expect(body).toBeHtml('<pre>10-20</pre>');
	});
});
