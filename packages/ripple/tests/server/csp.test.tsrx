import { Context, Fragment, trackAsync } from 'ripple';
import { getCss, prerender, render } from 'ripple/server';
import { parseHTML } from 'linkedom';

function deferred() {
	let resolve!: (value: string) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<string>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function elements(html: string) {
	return [
		...parseHTML(`<html><head></head><body>${html}</body></html>`).document.querySelectorAll(
			'script, style',
		),
	];
}

it.each([false, true])('restores component context in late catch rendering (stream=%s)', async (
	streaming,
) => {
	const context = new Context<string>();
	const work = deferred();
	function Work() @{
		const value = trackAsync(() => work.promise);
		<p>{value.value}</p>
	}
	function Catch() @{
		const value = context.get();
		<p>{value}</p>
	}
	function App() @{
		context.set('Context from provider');
		@try {
			<Work />
		} @catch {
			<Catch />
		}
	}
	const chunks: string[] = [];
	const result =
		streaming
			? render(App, {
					nonce: 'response',
					stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
				})
			: render(App);
	work.reject(new Error('late failure'));
	const output = await result;
	expect('body' in output ? output.body : chunks.join('')).toContain('Context from provider');
});

it(
	'isolates and escapes nonces across concurrent shells, nested patches, late styles and errors',
	async () => {
		const renders = ['first-+/=', 'second-"<&'].map((nonce) => {
			const parent = deferred();
			const child = deferred();
			const failure = deferred();
			function Styled() @{
				<>
					<style>
						p {
							color: rgb(1, 2, 3);
						}
					</style>
					<p>Styled</p>
				</>
			}
			function Child() @{
				const value = trackAsync(() => child.promise);
				<>
					<p>{value.value}</p>
					<Styled />
				</>
			}
			function Parent() @{
				const value = trackAsync(() => parent.promise);
				<>
					<p>{value.value}</p>
					@try {
						<Child />
					} @pending {
						<p>Child pending</p>
					}
				</>
			}
			function Failure() @{
				const value = trackAsync(() => failure.promise);
				<p>{value.value}</p>
			}
			function App() @{
				<>
					<style>
						main {
							color: rgb(4, 5, 6);
						}
					</style>
					<main>Shell</main>
					<Fragment innerHTML="<script data-application>void 0</script>" />
					@try {
						<Parent />
					} @pending {
						<p>Parent pending</p>
					}
					@try {
						<Failure />
					} @pending {
						<p>Failure pending</p>
					}
				</>
			}
			const chunks: string[] = [];
			const result = render(App, {
				nonce,
				stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} },
			});
			expect(chunks).toHaveLength(1);
			return { nonce, parent, child, failure, chunks, result };
		});
		for (const run of renders.toReversed()) {
			run.parent.resolve('Parent ready');
			await new Promise((resolve) => setImmediate(resolve));
			await new Promise((resolve) => setImmediate(resolve));
			expect(run.chunks.join('')).toContain('Child pending');
		}
		for (const run of renders) {
			run.child.resolve('Child ready');
			run.failure.reject(new Error('Failed </script><script>unsafe</script>'));
			await run.result;
			const html = run.chunks.join('');
			expect(run.chunks.length).toBeGreaterThanOrEqual(3);
			expect(html).toContain(',1)</script>');
			expect(html).toContain('data-ripple-chunk');
			expect(html).not.toContain('</script><script>unsafe');
			const nodes = elements(html);
			expect(nodes.filter((node) => node.tagName === 'STYLE')).toHaveLength(2);
			for (const node of nodes) {
				const inert = node.getAttribute('type') === 'application/json';
				const application = node.hasAttribute('data-application');
				expect(node.getAttribute('nonce')).toBe(inert || application ? null : run.nonce);
			}
		}
	},
);

it(
	'keeps no-nonce output compatible and leaves buffered CSS and application HTML to the caller',
	async () => {
		function App() @{
			<>
				<style>
					p {
						color: red;
					}
				</style>
				<p>Hello</p>
				<head>
					<script>
						{
							('void 0');
						}
					</script>
				</head>
			</>
		}
		const plain = await render(App);
		const withNonce = await render(App, { nonce: 'response' });
		expect(withNonce).toEqual(plain);
		expect(getCss(withNonce.css)).toContain('color: red');
		expect((await prerender(App)).body).toBe(plain.body);
		const chunks: string[] = [];
		await render(App, { stream: { push: (chunk) => chunks.push(chunk), close() {}, error() {} } });
		expect(chunks.join('')).toContain('<style data-ripple-ssr>');
		expect(chunks.join('')).not.toContain('nonce=');
	},
);
