import { Fragment, flushSync, track } from 'ripple';

describe('Fragment innerHTML', () => {
	it('renders static innerHTML fragments', () => {
		function App() {
			return <>
				let str = '<div>Test</div>';
				<Fragment innerHTML={str} />
			</>;
		}

		render(App);
		expect(container).toMatchSnapshot();
	});

	it('renders dynamic innerHTML fragments', () => {
		function App() {
			return <>
				let &[str] = track('<div>Test</div>');
				<Fragment innerHTML={str} />
				<button
					onClick={() => {
						str = '<div>Updated</div>';
					}}
				>
					{'Update'}
				</button>
			</>;
		}

		render(App);
		expect(container).toMatchSnapshot();

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container).toMatchSnapshot();
	});

	it('renders static Fragment innerHTML', () => {
		function App() {
			return <>
				const html = '<strong>Fragment HTML</strong>';
				<Fragment innerHTML={html} />
			</>;
		}

		render(App);

		expect(container.innerHTML).toContain('<strong>Fragment HTML</strong>');
		expect(container.innerHTML).not.toContain('<fragment');
	});

	it('updates dynamic Fragment innerHTML', () => {
		function App() {
			return <>
				let &[html] = track('<span>First</span>');
				<Fragment innerHTML={html} />
				<button onClick={() => (html = '<em>Second</em>')}>{'Update'}</button>
			</>;
		}

		render(App);
		expect(container.innerHTML).toContain('<span>First</span>');
		expect(container.innerHTML).toContain('<button>Update</button>');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(container.innerHTML).toContain('<em>Second</em>');
		expect(container.innerHTML).not.toContain('<span>First</span>');
		expect(container.innerHTML).toContain('<button>Update</button>');
	});

	it('renders the correct namespace for child svg element when html is surrounded by <svg>', () => {
		function App() {
			return <>
				let str = '<circle r="45" cx="50" cy="50" fill="red" />';
				<svg height="100" width="100">
					<Fragment innerHTML={str} />
				</svg>
			</>;
		}

		render(App);

		const circle = container.querySelector('circle');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it(
		'renders the correct namespace for child math element when html is surrounded by <math>',
		() => {
			function App() {
				return <>
					let str = '<mi>x</mi><mo>+</mo><mi>y</mi>';
					<math><Fragment innerHTML={str} /></math>
				</>;
			}

			render(App);

			const mi = container.querySelector('mi');
			const mo = container.querySelector('mo');
			expect(mi.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
			expect(mo.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
		},
	);
});
