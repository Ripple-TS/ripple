import { trackAsync } from 'ripple';

describe('try block with catch and pending (server)', () => {
	it('renders resolved content with an empty pending fallback', async () => {
		function DataChild() @{
			let &[data] = trackAsync(() => Promise.resolve('resolved value'));
			<p>{data}</p>
		}

		function App() @{
			<>
				<span>{'before'}</span>
				@try {
					<DataChild />
				} @pending {}
				<span>{'after'}</span>
			</>
		}

		const { body } = await render(App);
		expect(body).toContain('before');
		expect(body).toContain('resolved value');
		expect(body).toContain('after');
		expect(body).not.toContain('loading');
	});

	it('catch block works when component throws before await with pending block', async () => {
		function ThrowingChild() {
			throw new Error('sync error');
		}

		function App() @{
			@try {
				<ThrowingChild />
			} @pending {
				<p>{'loading...'}</p>
			} @catch (err) {
				<p>{'caught error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works when component throws after await with pending block', async () => {
		function ThrowingAfterAwait() @{
			let &[data] = trackAsync(() => Promise.resolve('hello'));
			throw new Error('error after await');
			<p>{data}</p>
		}

		function App() @{
			@try {
				<ThrowingAfterAwait />
			} @pending {
				<p>{'loading...'}</p>
			} @catch (err) {
				<p>{'caught error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works with try/catch/pending when async body rejects', async () => {
		function App() @{
			@try {
				let &[data] = trackAsync(() => Promise.reject(new Error('rejected')));
				<p>{data}</p>
			} @pending {
				<p>{'loading...'}</p>
			} @catch (err) {
				<p>{'caught rejection'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught rejection');
		expect(body).not.toContain('loading...');
	});

	it('removes pending content for nested try/pending blocks', async () => {
		function App() @{
			@try {
				@try {
					let &[data] = trackAsync(() => Promise.resolve('resolved'));
					<p>{data}</p>
				} @pending {
					<p>{'inner loading...'}</p>
				}
			} @pending {
				<p>{'outer loading...'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('resolved');
		expect(body).not.toContain('outer loading...');
		expect(body).not.toContain('inner loading...');
	});
});

describe('trackAsync directly in component body (server)', () => {
	it('resolves trackAsync used directly in a component', async () => {
		function App() @{
			@try {
				<DataChild />
			} @catch (err) {
				<p>{'error'}</p>
			}
		}

		function DataChild() @{
			let &[data] = trackAsync(() => Promise.resolve('from child'));
			<p>{data}</p>
		}

		const { body } = await render(App);
		expect(body).toContain('from child');
		expect(body).not.toContain('error');
	});

	it('resolves multiple trackAsync values in the same component', async () => {
		function App() @{
			@try {
				let &[a] = trackAsync(() => Promise.resolve('hello'));
				let &[b] = trackAsync(() => Promise.resolve('world'));
				<p>
					{a}
					{' '}
					{b}
				</p>
			} @catch (err) {
				<p>{'error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('hello');
		expect(body).toContain('world');
	});

	it('renders catch when trackAsync rejects in a child component without its own try', async () => {
		function RejectChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('child rejected')));
			<p>{data}</p>
		}

		function App() @{
			@try {
				<RejectChild />
			} @catch (err) {
				<p>{'parent caught it'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('parent caught it');
	});

	it('chained trackAsync resolves both values', async () => {
		function App() @{
			@try {
				let &[name] = trackAsync(() => Promise.resolve('ripple'));
				let &[upper] = trackAsync(() => {
					const n = name;
					return Promise.resolve(n.toUpperCase());
				});
				<p>{upper}</p>
			} @catch (err) {
				<p>{'error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('RIPPLE');
		expect(body).not.toContain('error');
	});

	it('chained trackAsync catches when first rejects', async () => {
		function App() @{
			@try {
				let &[name] = trackAsync(() => Promise.reject<string>(new Error('first failed')));
				let &[upper] = trackAsync(() => {
					const n = name;
					return Promise.resolve(n.toUpperCase());
				});
				<p>{upper}</p>
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('first failed');
	});

	it('chained trackAsync catches when second rejects', async () => {
		function App() @{
			@try {
				let &[name] = trackAsync(() => Promise.resolve('ripple'));
				let &[upper] = trackAsync(() => {
					const n = name;
					return Promise.reject(new Error('second failed'));
				});
				<p>{upper}</p>
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('second failed');
	});
});

describe('nested child components with try/catch boundaries (server)', () => {
	it('inner try/catch catches error from its own child', async () => {
		function ThrowingChild() {
			throw new Error('inner error');
		}

		function Inner() @{
			@try {
				<ThrowingChild />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		function App() @{
			@try {
				<Inner />
			} @catch (err) {
				<p>{'outer caught'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('inner error');
		expect(body).not.toContain('outer caught');
	});

	it('inner try/catch catches async rejection from its own child', async () => {
		function AsyncChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('async inner error')));
			<p>{data}</p>
		}

		function Inner() @{
			@try {
				<AsyncChild />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		function App() @{
			@try {
				<Inner />
			} @catch (err) {
				<p>{'outer caught'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('async inner error');
		expect(body).not.toContain('outer caught');
	});

	it('error propagates to outer catch when inner try has no catch', async () => {
		function ThrowingChild() {
			throw new Error('propagated error');
		}

		function Inner() @{
			@try {
				<ThrowingChild />
			} @pending {
				<p>{'loading...'}</p>
			}
		}

		function App() @{
			@try {
				<Inner />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('propagated error');
		expect(body).not.toContain('loading...');
	});

	it('async rejection propagates to outer catch when inner try has no catch', async () => {
		function AsyncChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('async propagated')));
			<p>{data}</p>
		}

		function Inner() @{
			@try {
				<AsyncChild />
			} @pending {
				<p>{'loading...'}</p>
			}
		}

		function App() @{
			@try {
				<Inner />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('async propagated');
		expect(body).not.toContain('loading...');
	});

	it(
		'multiple nested levels: error propagates through pending-only boundaries to nearest catch',
		async () => {
			function ThrowingChild() {
				throw new Error('deep error');
			}

			function Level3() @{
				@try {
					<ThrowingChild />
				} @pending {
					<p>{'level3 loading'}</p>
				}
			}

			function Level2() @{
				@try {
					<Level3 />
				} @pending {
					<p>{'level2 loading'}</p>
				}
			}

			function App() @{
				@try {
					<Level2 />
				} @catch (err: Error) {
					<p>{err.message}</p>
				}
			}

			const { body } = await render(App);
			expect(body).toContain('deep error');
		},
	);

	it('sibling components: one fails, the other does not affect catch', async () => {
		function GoodChild() @{
			let &[data] = trackAsync(() => Promise.resolve('good'));
			<p>{data}</p>
		}

		function BadChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('bad child')));
			<p>{data}</p>
		}

		function App() @{
			@try {
				<>
					<GoodChild />
					<BadChild />
				</>
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('bad child');
		expect(body).not.toContain('good');
	});

	it('independent try/catch boundaries each handle their own errors', async () => {
		function FailChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('fail')));
			<p>{data}</p>
		}

		function SuccessChild() @{
			let &[data] = trackAsync(() => Promise.resolve('success'));
			<p>{data}</p>
		}

		function App() @{
			<>
				@try {
					<FailChild />
				} @catch (err: Error) {
					<p>{err.message}</p>
				}
				@try {
					<SuccessChild />
				} @catch (err) {
					<p>{'should not catch'}</p>
				}
			</>
		}

		const { body } = await render(App);
		expect(body).toContain('fail');
		expect(body).toContain('success');
		expect(body).not.toContain('should not catch');
	});

	it('inner catch handles rejection, outer renders normally', async () => {
		function AsyncChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('handled inside')));
			<p>{data}</p>
		}

		function Inner() @{
			@try {
				<AsyncChild />
			} @catch (err: Error) {
				<span>{err.message}</span>
			}
		}

		function App() @{
			<div>
				<h1>{'App'}</h1>
				<Inner />
			</div>
		}

		const { body } = await render(App);
		expect(body).toContain('App');
		expect(body).toContain('handled inside');
	});

	it('sync error in child after trackAsync routes to catch boundary', async () => {
		function BrokenChild() @{
			let &[data] = trackAsync(() => Promise.resolve('loaded'));
			throw new Error('sync after async');
			<p>{data}</p>
		}

		function Inner() @{
			@try {
				<BrokenChild />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		function App() @{
			<Inner />
		}

		const { body } = await render(App);
		expect(body).toContain('sync after async');
	});

	it('outer try with pending, inner try with catch: rejection goes to inner catch', async () => {
		function AsyncChild() @{
			let &[data] = trackAsync(() => Promise.reject(new Error('inner rejection')));
			<p>{data}</p>
		}

		function Inner() @{
			@try {
				<AsyncChild />
			} @catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		function App() @{
			@try {
				<Inner />
			} @pending {
				<p>{'outer loading'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('inner rejection');
		expect(body).not.toContain('outer loading');
	});

	it('deeply nested: async resolves through multiple component layers', async () => {
		function DataFetcher() @{
			let &[data] = trackAsync(() => Promise.resolve('deep data'));
			<span>{data}</span>
		}

		function Level2() @{
			<div>
				<DataFetcher />
			</div>
		}

		function Level1() @{
			<section>
				<Level2 />
			</section>
		}

		function App() @{
			@try {
				<Level1 />
			} @catch (err) {
				<p>{'error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('deep data');
		expect(body).not.toContain('error');
	});
});
