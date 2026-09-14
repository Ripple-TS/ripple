import { RippleURL, RippleURLSearchParams, flushSync, track } from 'ripple';

describe('RippleURLSearchParams > derived', () => {
	it('handles reactive computed properties based on search params', () => {
		function URLTest() @{
			const params = RippleURLSearchParams('page=1&limit=10');
			const page = track(() => parseInt(params.get('page') || '1', 10));
			const limit = track(() => parseInt(params.get('limit') || '10', 10));
			const offset = track(() => (page.value - 1) * limit.value);
			<>
				<button onClick={() => params.set('page', '2')}>{'next page'}</button>
				<button onClick={() => params.set('page', '1')}>{'first page'}</button>
				<pre>{`Page: ${page.value}`}</pre>
				<pre>{`Limit: ${limit.value}`}</pre>
				<pre>{`Offset: ${offset.value}`}</pre>
			</>
		}

		render(URLTest);

		const nextButton = container.querySelectorAll('button')[0];
		const firstButton = container.querySelectorAll('button')[1];

		// Initial state
		expect(container.querySelectorAll('pre')[0].textContent).toBe('Page: 1');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('Limit: 10');
		expect(container.querySelectorAll('pre')[2].textContent).toBe('Offset: 0');

		// Test next page
		nextButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('Page: 2');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('Limit: 10');
		expect(container.querySelectorAll('pre')[2].textContent).toBe('Offset: 10');

		// Test first page
		firstButton.click();
		flushSync();

		expect(container.querySelectorAll('pre')[0].textContent).toBe('Page: 1');
		expect(container.querySelectorAll('pre')[1].textContent).toBe('Limit: 10');
		expect(container.querySelectorAll('pre')[2].textContent).toBe('Offset: 0');
	});

	it('maintains reactivity across multiple components', () => {
		function ParentTest() @{
			const params = RippleURLSearchParams('count=0');
			<>
				<ChildA {params} />
				<ChildB {params} />
			</>
		}

		function ChildA({ params }: { params: RippleURLSearchParams }) @{
			<button
				onClick={() => {
					const current = parseInt(params.get('count') || '0', 10);
					params.set('count', String(current + 1));
				}}
			>{'increment'}</button>
		}

		function ChildB({ params }: { params: RippleURLSearchParams }) @{
			const count = track(() => params.get('count'));
			<pre>{count.value}</pre>
		}

		render(ParentTest);

		const button = container.querySelector('button');

		// Initial state
		expect(container.querySelector('pre').textContent).toBe('0');

		// Test increment from child component
		button.click();
		flushSync();

		expect(container.querySelector('pre').textContent).toBe('1');

		button.click();
		flushSync();

		expect(container.querySelector('pre').textContent).toBe('2');
	});
});
