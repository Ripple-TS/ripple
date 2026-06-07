import { describe, it, expect } from 'vitest';
import { Context, flushSync } from 'ripple';

describe('context', () => {
	it('creates a reactive ref with initial value', () => {
		const MyContext = new Context<string | null>(null);

		function Child() @{
			const value = MyContext.get();
			<div>{value}</div>
		}

		function TestContext() @{
			const value = MyContext.get();
			MyContext.set('Hello from context!');
			<Child />
		}

		render(TestContext);

		expect(container.querySelector('div').textContent).toBe('Hello from context!');
	});

	it('handles context captured inside a computed tracked', () => {
		const MyContext = new Context<number | null>(null);

		const doubleContext = () => {
			const value = MyContext.get() as number;
			return value * 2;
		};

		function App() @{
			MyContext.set(4);
			MyContext.set(8);
			<>
				<h3>{MyContext.get()}</h3>
				<h4>
					{'2x:'}
					{doubleContext()}
				</h4>
			</>
		}

		render(App);
		flushSync();
	});
});
