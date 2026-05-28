import { trackAsync } from 'ripple';

describe('try block with catch and pending (server)', () => {
	it('renders resolved content with an empty pending fallback', async () => {
		function App() {
			return <>
				<span>{'before'}</span>
				try {
					let &[data] = trackAsync(() => Promise.resolve('resolved value'));
					<p>{data}</p>
				} pending {}
				<span>{'after'}</span>
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('before');
		expect(body).toContain('resolved value');
		expect(body).toContain('after');
		expect(body).not.toContain('loading');
	});

	it('catch block works when component throws before await with pending block', async () => {
		function ThrowingChild() {
			return <>
				throw new Error('sync error');
				let &[data] = trackAsync(() => Promise.resolve('hello'));
				<p>{data}</p>
			</>;
		}

		function App() {
			return <>
				try {
					<ThrowingChild />
				} pending {
					<p>{'loading...'}</p>
				} catch (err) {
					<p>{'caught error'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works when component throws after await with pending block', async () => {
		function ThrowingAfterAwait() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('hello'));
				throw new Error('error after await');
				<p>{data}</p>
			</>;
		}

		function App() {
			return <>
				try {
					<ThrowingAfterAwait />
				} pending {
					<p>{'loading...'}</p>
				} catch (err) {
					<p>{'caught error'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works with try/catch/pending when async body rejects', async () => {
		function App() {
			return <>
				try {
					let &[data] = trackAsync(() => Promise.reject(new Error('rejected')));
					<p>{data}</p>
				} pending {
					<p>{'loading...'}</p>
				} catch (err) {
					<p>{'caught rejection'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('caught rejection');
		expect(body).not.toContain('loading...');
	});

	it('removes pending content for nested try/pending blocks', async () => {
		function App() {
			return <>
				try {
					try {
						let &[data] = trackAsync(() => Promise.resolve('resolved'));
						<p>{data}</p>
					} pending {
						<p>{'inner loading...'}</p>
					}
				} pending {
					<p>{'outer loading...'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('resolved');
		expect(body).not.toContain('outer loading...');
		expect(body).not.toContain('inner loading...');
	});
});

describe('trackAsync directly in component body (server)', () => {
	it('resolves trackAsync used directly in a component', async () => {
		function App() {
			return <>
				try {
					<DataChild />
				} catch (err) {
					<p>{'error'}</p>
				}
			</>;
		}

		function DataChild() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('from child'));
				<p>{data}</p>
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('from child');
		expect(body).not.toContain('error');
	});

	it('resolves multiple trackAsync values in the same component', async () => {
		function App() {
			return <>
				try {
					let &[a] = trackAsync(() => Promise.resolve('hello'));
					let &[b] = trackAsync(() => Promise.resolve('world'));
					<p>
						{a}
						{' '}
						{b}
					</p>
				} catch (err) {
					<p>{'error'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('hello');
		expect(body).toContain('world');
	});

	it('renders catch when trackAsync rejects in a child component without its own try', async () => {
		function RejectChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('child rejected')));
				<p>{data}</p>
			</>;
		}

		function App() {
			return <>
				try {
					<RejectChild />
				} catch (err) {
					<p>{'parent caught it'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('parent caught it');
	});

	it('chained trackAsync resolves both values', async () => {
		function App() {
			return <>
				try {
					let &[name] = trackAsync(() => Promise.resolve('ripple'));
					let &[upper] = trackAsync(() => {
						const n = name;
						return Promise.resolve(n.toUpperCase());
					});
					<p>{upper}</p>
				} catch (err) {
					<p>{'error'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('RIPPLE');
		expect(body).not.toContain('error');
	});

	it('chained trackAsync catches when first rejects', async () => {
		function App() {
			return <>
				try {
					let &[name] = trackAsync(() => Promise.reject<string>(new Error('first failed')));
					let &[upper] = trackAsync(() => {
						const n = name;
						return Promise.resolve(n.toUpperCase());
					});
					<p>{upper}</p>
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('first failed');
	});

	it('chained trackAsync catches when second rejects', async () => {
		function App() {
			return <>
				try {
					let &[name] = trackAsync(() => Promise.resolve('ripple'));
					let &[upper] = trackAsync(() => {
						const n = name;
						return Promise.reject(new Error('second failed'));
					});
					<p>{upper}</p>
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('second failed');
	});
});

describe('nested child components with try/catch boundaries (server)', () => {
	it('inner try/catch catches error from its own child', async () => {
		function ThrowingChild() {
			return <>
				throw new Error('inner error');
				<p>{'should not render'}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<ThrowingChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		function App() {
			return <>
				try {
					<Inner />
				} catch (err) {
					<p>{'outer caught'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('inner error');
		expect(body).not.toContain('outer caught');
	});

	it('inner try/catch catches async rejection from its own child', async () => {
		function AsyncChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('async inner error')));
				<p>{data}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<AsyncChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		function App() {
			return <>
				try {
					<Inner />
				} catch (err) {
					<p>{'outer caught'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('async inner error');
		expect(body).not.toContain('outer caught');
	});

	it('error propagates to outer catch when inner try has no catch', async () => {
		function ThrowingChild() {
			return <>
				throw new Error('propagated error');
				<p>{'should not render'}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<ThrowingChild />
				} pending {
					<p>{'loading...'}</p>
				}
			</>;
		}

		function App() {
			return <>
				try {
					<Inner />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('propagated error');
		expect(body).not.toContain('loading...');
	});

	it('async rejection propagates to outer catch when inner try has no catch', async () => {
		function AsyncChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('async propagated')));
				<p>{data}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<AsyncChild />
				} pending {
					<p>{'loading...'}</p>
				}
			</>;
		}

		function App() {
			return <>
				try {
					<Inner />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('async propagated');
		expect(body).not.toContain('loading...');
	});

	it(
		'multiple nested levels: error propagates through pending-only boundaries to nearest catch',
		async () => {
			function ThrowingChild() {
				return <>
					throw new Error('deep error');
					<p>{'should not render'}</p>
				</>;
			}

			function Level3() {
				return <>
					try {
						<ThrowingChild />
					} pending {
						<p>{'level3 loading'}</p>
					}
				</>;
			}

			function Level2() {
				return <>
					try {
						<Level3 />
					} pending {
						<p>{'level2 loading'}</p>
					}
				</>;
			}

			function App() {
				return <>
					try {
						<Level2 />
					} catch (err: Error) {
						<p>{err.message}</p>
					}
				</>;
			}

			const { body } = await render(App);
			expect(body).toContain('deep error');
		},
	);

	it('sibling components: one fails, the other does not affect catch', async () => {
		function GoodChild() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('good'));
				<p>{data}</p>
			</>;
		}

		function BadChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('bad child')));
				<p>{data}</p>
			</>;
		}

		function App() {
			return <>
				try {
					<GoodChild />
					<BadChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('bad child');
		expect(body).not.toContain('good');
	});

	it('independent try/catch boundaries each handle their own errors', async () => {
		function FailChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('fail')));
				<p>{data}</p>
			</>;
		}

		function SuccessChild() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('success'));
				<p>{data}</p>
			</>;
		}

		function App() {
			return <>
				try {
					<FailChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
				try {
					<SuccessChild />
				} catch (err) {
					<p>{'should not catch'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('fail');
		expect(body).toContain('success');
		expect(body).not.toContain('should not catch');
	});

	it('inner catch handles rejection, outer renders normally', async () => {
		function AsyncChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('handled inside')));
				<p>{data}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<AsyncChild />
				} catch (err: Error) {
					<span>{err.message}</span>
				}
			</>;
		}

		function App() {
			return <>
				<div>
					<h1>{'App'}</h1>
					<Inner />
				</div>
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('App');
		expect(body).toContain('handled inside');
	});

	it('sync error in child after trackAsync routes to catch boundary', async () => {
		function BrokenChild() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('loaded'));
				throw new Error('sync after async');
				<p>{data}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<BrokenChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		function App() {
			return <><Inner /></>;
		}

		const { body } = await render(App);
		expect(body).toContain('sync after async');
	});

	it('outer try with pending, inner try with catch: rejection goes to inner catch', async () => {
		function AsyncChild() {
			return <>
				let &[data] = trackAsync(() => Promise.reject(new Error('inner rejection')));
				<p>{data}</p>
			</>;
		}

		function Inner() {
			return <>
				try {
					<AsyncChild />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			</>;
		}

		function App() {
			return <>
				try {
					<Inner />
				} pending {
					<p>{'outer loading'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('inner rejection');
		expect(body).not.toContain('outer loading');
	});

	it('deeply nested: async resolves through multiple component layers', async () => {
		function DataFetcher() {
			return <>
				let &[data] = trackAsync(() => Promise.resolve('deep data'));
				<span>{data}</span>
			</>;
		}

		function Level2() {
			return <><div><DataFetcher /></div></>;
		}

		function Level1() {
			return <><section><Level2 /></section></>;
		}

		function App() {
			return <>
				try {
					<Level1 />
				} catch (err) {
					<p>{'error'}</p>
				}
			</>;
		}

		const { body } = await render(App);
		expect(body).toContain('deep data');
		expect(body).not.toContain('error');
	});
});
