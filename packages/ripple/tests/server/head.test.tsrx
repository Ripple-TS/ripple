import { track } from 'ripple';

describe('head elements', () => {
	it('renders static title element', async () => {
		function App() @{
			<>
				<head>
					<title>{'Static Test Title'}</title>
				</head>
				<div>{'Content'}</div>
			</>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('Static Test Title');
		expect(document.querySelector('div').textContent).toBe('Content');
	});

	it('renders reactive title element', async () => {
		function App() @{
			let &[title] = track('Initial Title');
			<>
				<head>
					<title>{title}</title>
				</head>
				<div>
					<span>{title}</span>
				</div>
			</>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('Initial Title');
		expect(document.querySelector('span').textContent).toBe('Initial Title');
	});

	it('renders title with template literal', async () => {
		function App() @{
			let &[name] = track('World');
			<head>
				<title>{`Hello ${name}!`}</title>
			</head>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('Hello World!');
	});

	it('renders title with computed value', async () => {
		function App() @{
			let &[count] = track(0);
			let prefix = 'Count: ';
			<>
				<head>
					<title>
						{prefix + count}
					</title>
				</head>
				<div>
					<span>{count}</span>
				</div>
			</>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('Count: 0');
	});

	it('renders empty title', async () => {
		function App() @{
			<>
				<head>
					<title>{''}</title>
				</head>
				<div>{'Empty title test'}</div>
			</>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('');
	});

	it('renders external scripts with src attributes from a loop', async () => {
		const Head = ({ scripts }: { scripts: { src: string }[] }) => @{
			<head>
				@for (const script of scripts) {
					<script src={script.src} />
				}
			</head>
		};

		function App() @{
			<Head scripts={[{ src: '/a.js' }, { src: '/b.js' }]} />
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		const srcs = Array.from(document.querySelectorAll('head script[src]')).map(
			(node) => node.getAttribute('src'),
		).sort();

		expect(srcs).toEqual(['/a.js', '/b.js']);
	});

	it('renders an inline raw-text <script> body verbatim', async () => {
		function App() @{
			<head>
				<script>
					const value = 1 < 2 ? 'a' : 'b';
				</script>
			</head>
		}

		const { head } = await render(App);

		// The body is emitted verbatim (unescaped), including the authored
		// indentation, so match the statement inside the tags rather than the
		// exact whitespace.
		expect(head).toMatch(/<script>[\s\S]*const value = 1 < 2 \? 'a' : 'b';[\s\S]*<\/script>/);
	});

	it('renders title with conditional content', async () => {
		function App() @{
			let &[showPrefix] = track(true);
			let &[title] = track('Main Page');
			<head>
				<title>
					{showPrefix ? 'App - ' + title : title}
				</title>
			</head>
		}

		const { head, body } = await render(App);
		const { document } = parseAsFullHtml(head, body);

		expect(document.title).toBe('App - Main Page');
	});
});
