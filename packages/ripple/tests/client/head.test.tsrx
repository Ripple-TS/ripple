import { flushSync, track } from 'ripple';

describe('head elements', () => {
	let originalTitle: string;

	beforeEach(() => {
		// Store original title to restore later
		originalTitle = document.title;
	});

	afterEach(() => {
		// Restore original title
		document.title = originalTitle;
	});

	it('renders static title element', () => {
		function App() @{
			<>
				<head>
					<title>{'Static Test Title'}</title>
				</head>
				<div>{'Content'}</div>
			</>
		}

		render(App);

		expect(document.title).toBe('Static Test Title');
		expect(container.querySelector('div').textContent).toBe('Content');
	});

	it('renders reactive title element', () => {
		function App() @{
			let &[title] = track('Initial Title');
			<>
				<head>
					<title>{title}</title>
				</head>
				<div>
					<button
						onClick={() => {
							title = 'Updated Title';
						}}
					>{'Update Title'}</button>
					<span>{title}</span>
				</div>
			</>
		}

		render(App);

		expect(document.title).toBe('Initial Title');
		expect(container.querySelector('span').textContent).toBe('Initial Title');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(document.title).toBe('Updated Title');
		expect(container.querySelector('span').textContent).toBe('Updated Title');
	});

	it('renders title with template literal', () => {
		function App() @{
			let &[name] = track('World');
			<>
				<head>
					<title>{`Hello ${name}!`}</title>
				</head>
				<div>
					<button
						onClick={() => {
							name = 'Ripple';
						}}
					>{'Change Name'}</button>
				</div>
			</>
		}

		render(App);

		expect(document.title).toBe('Hello World!');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(document.title).toBe('Hello Ripple!');
	});

	it('renders title with computed value', () => {
		function App() @{
			let &[count] = track(0);
			let prefix = 'Count: ';
			<>
				<head>
					<title>{prefix + count}</title>
				</head>
				<div>
					<button
						onClick={() => {
							count++;
						}}
					>{'Increment'}</button>
					<span>{count}</span>
				</div>
			</>
		}

		render(App);

		expect(document.title).toBe('Count: 0');

		const button = container.querySelector('button');
		button.click();
		flushSync();

		expect(document.title).toBe('Count: 1');
		expect(container.querySelector('span').textContent).toBe('1');
	});

	it('handles multiple title updates', () => {
		function App() @{
			let &[step] = track(1);
			<>
				<head>
					<title>{`Step ${step} of 3`}</title>
				</head>
				<div>
					<button
						onClick={() => {
							step = step % 3 + 1;
						}}
					>{'Next Step'}</button>
				</div>
			</>
		}

		render(App);

		expect(document.title).toBe('Step 1 of 3');

		const button = container.querySelector('button');

		button.click();
		flushSync();
		expect(document.title).toBe('Step 2 of 3');

		button.click();
		flushSync();
		expect(document.title).toBe('Step 3 of 3');

		button.click();
		flushSync();
		expect(document.title).toBe('Step 1 of 3');
	});

	it('renders empty title', () => {
		function App() @{
			<>
				<head>
					<title>{''}</title>
				</head>
				<div>{'Empty title test'}</div>
			</>
		}

		render(App);

		expect(document.title).toBe('');
	});

	it('renders external scripts with src attributes from a loop', () => {
		const added: HTMLScriptElement[] = [];
		const scripts = [{ src: '/a.js' }, { src: '/b.js' }];

		function App() @{
			<head>
				@for (const script of scripts) {
					<script src={script.src} />
				}
			</head>
		}

		try {
			render(App);

			const head_scripts = Array.from(
				document.head.querySelectorAll('script[src]'),
			) as HTMLScriptElement[];

			for (const node of head_scripts) {
				if (node.getAttribute('src') === '/a.js' || node.getAttribute('src') === '/b.js') {
					added.push(node);
				}
			}

			const srcs = added.map((node) => node.getAttribute('src')).sort();
			expect(srcs).toEqual(['/a.js', '/b.js']);
		} finally {
			for (const node of added) {
				node.remove();
			}
		}
	});

	it('renders an inline raw-text <script> body as script text content', () => {
		function App() @{
			<head>
				<script>
					const value = 1 < 2 ? 'a' : 'b';
					window.__ripple_script_test = value;
				</script>
			</head>
		}

		const added: HTMLScriptElement[] = [];
		try {
			render(App);
			flushSync();

			const inline_scripts = Array.from(
				document.head.querySelectorAll('script:not([src])'),
			) as HTMLScriptElement[];

			for (const node of inline_scripts) {
				if (node.textContent?.includes('__ripple_script_test')) {
					added.push(node);
				}
			}

			expect(added).toHaveLength(1);
			// The body is injected verbatim, including the authored indentation, so
			// assert on the statements rather than the exact whitespace.
			const body = added[0].textContent ?? '';
			expect(body).toContain('const value = 1 < 2 ? \'a\' : \'b\';');
			expect(body).toContain('window.__ripple_script_test = value;');
		} finally {
			for (const node of added) {
				node.remove();
			}
		}
	});

	it('renders title with conditional content', () => {
		function App() @{
			let &[showPrefix] = track(true);
			let &[title] = track('Main Page');
			<>
				<head>
					<title>
						{showPrefix ? 'App - ' + title : title}
					</title>
				</head>
				<div>
					<button
						onClick={() => {
							showPrefix = !showPrefix;
						}}
					>{'Toggle Prefix'}</button>
					<button
						onClick={() => {
							title = title === 'Main Page' ? 'Settings' : 'Main Page';
						}}
					>{'Change Page'}</button>
				</div>
			</>
		}

		render(App);

		expect(document.title).toBe('App - Main Page');

		const buttons = container.querySelectorAll('button');

		// Toggle prefix off
		buttons[0].click();
		flushSync();
		expect(document.title).toBe('Main Page');

		// Change page
		buttons[1].click();
		flushSync();
		expect(document.title).toBe('Settings');

		// Toggle prefix back on
		buttons[0].click();
		flushSync();
		expect(document.title).toBe('App - Settings');
	});
});
