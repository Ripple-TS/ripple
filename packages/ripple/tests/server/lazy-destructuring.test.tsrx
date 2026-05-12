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
			component Inner({
				values: [head, ...&{ 0: first_rest, length: rest_length }],
			}: {
				values: number[];
			}) {
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
				function getInfo({
					values: [head, ...&{ 0: first_rest, length: rest_length }],
				}: {
					values: number[];
				}) {
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

	describe('nested lazy destructuring', () => {
		it('supports nested lazy object inside lazy object as component params', async () => {
			component Inner(&{ outer: &{ inner } }: { outer: { inner: number } }) {
				<pre>{inner}</pre>
			}

			component Test() {
				<Inner outer={{ inner: 7 }} />
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>7</pre>');
		});

		it('supports nested lazy array inside regular object as component params', async () => {
			component Inner({ pair: &[first, second] }: { pair: [number, number] }) {
				<pre>{`${first}-${second}`}</pre>
			}

			component Test() {
				<Inner pair={[3, 4]} />
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>3-4</pre>');
		});

		it('supports nested lazy object inside lazy array as function params', async () => {
			component Test() {
				function getName(&[&{ name }]: [{ name: string }]) {
					return name;
				}
				<pre>{getName([{ name: 'Alice' }])}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>Alice</pre>');
		});

		it('supports nested lazy array inside lazy array as function params', async () => {
			component Test() {
				function getValues(&[&[a, b]]: [[number, number]]) {
					return `${a}-${b}`;
				}
				<pre>{getValues([[5, 6]])}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>5-6</pre>');
		});

		it('supports three-level lazy object nesting as component params', async () => {
			component Inner(&{ a: &{ b: &{ c } } }: { a: { b: { c: number } } }) {
				<pre>{c}</pre>
			}

			component Test() {
				<Inner a={{ b: { c: 42 } }} />
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>42</pre>');
		});

		it('supports nested lazy object inside lazy object as function params', async () => {
			component Test() {
				function getValue(&{ outer: &{ inner } }: { outer: { inner: number } }) {
					return inner;
				}
				<pre>{getValue({ outer: { inner: 11 } })}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>11</pre>');
		});

		it(
			'supports nested lazy array inside lazy object as function params with writeback',
			async () => {
				component Test() {
					const obj = { pair: [1, 2] as [number, number] };
					function bump(&{ pair: &[first, second] }: { pair: [number, number] }) {
						first = first + 10;
						second = second + 20;
					}
					bump(obj);
					<pre>{`${obj.pair[0]}-${obj.pair[1]}`}</pre>
				}

				const { body } = await render(Test);
				expect(body).toBeHtml('<pre>11-22</pre>');
			},
		);

		it('supports three-level lazy object nesting as function params', async () => {
			component Test() {
				function getValue(&{ a: &{ b: &{ c } } }: { a: { b: { c: number } } }) {
					return c;
				}
				<pre>{getValue({ a: { b: { c: 99 } } })}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>99</pre>');
		});

		it('supports nested lazy object inside lazy object in const declaration', async () => {
			component Test() {
				const data = { outer: { inner: 5 } };
				const &{ outer: &{ inner } } = data;
				<pre>{inner}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>5</pre>');
		});

		it('supports nested lazy object inside lazy object in let with writeback', async () => {
			component Test() {
				const data = { outer: { inner: 5 } };
				let &{ outer: &{ inner } } = data;
				inner = 50;
				<pre>{data.outer.inner}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>50</pre>');
		});

		it('supports nested lazy array inside lazy object in let with writeback', async () => {
			component Test() {
				const data = { pair: [1, 2] as [number, number] };
				let &{ pair: &[first, second] } = data;
				first = 100;
				second = 200;
				<pre>{`${data.pair[0]}-${data.pair[1]}`}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>100-200</pre>');
		});

		it('supports three-level lazy object nesting in let with writeback', async () => {
			component Test() {
				const data = { a: { b: { c: 1 } } };
				let &{ a: &{ b: &{ c } } } = data;
				c = 999;
				<pre>{data.a.b.c}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>999</pre>');
		});

		it('supports compound assignment on deeply nested lazy bindings', async () => {
			component Test() {
				const data = { a: { b: { c: 5 } } };
				let &{ a: &{ b: &{ c } } } = data;
				c += 10;
				c *= 2;
				<pre>{data.a.b.c}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>30</pre>');
		});

		it('supports default values inside nested lazy destructuring', async () => {
			component Test() {
				const data: { outer: { inner?: number } } = { outer: {} };
				const &{ outer: &{ inner = 42 } } = data;
				<pre>{inner}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>42</pre>');
		});

		it('supports multiple sibling nested lazy destructures', async () => {
			component Test() {
				const data = { a: { x: 1 }, b: { y: 2 } };
				const &{ a: &{ x }, b: &{ y } } = data;
				<pre>{`${x}-${y}`}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>1-2</pre>');
		});

		it('supports multiple sibling nested lazy destructures with writeback', async () => {
			component Test() {
				const data = { a: { x: 1 }, b: { y: 2 } };
				let &{ a: &{ x }, b: &{ y } } = data;
				x = 11;
				y = 22;
				<pre>{`${data.a.x}-${data.b.y}`}</pre>
			}

			const { body } = await render(Test);
			expect(body).toBeHtml('<pre>11-22</pre>');
		});
	});
});
