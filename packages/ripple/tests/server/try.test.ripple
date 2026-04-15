import { trackAsync } from 'ripple';

describe('try block with catch and pending (server)', () => {
	it('catch block works when component throws before await with pending block', async () => {
		component ThrowingChild() {
			throw new Error('sync error');
			let &[data] = trackAsync(() => Promise.resolve('hello'));
			<p>{data}</p>
		}

		component App() {
			try {
				<ThrowingChild />
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works when component throws after await with pending block', async () => {
		component ThrowingAfterAwait() {
			let &[data] = trackAsync(() => Promise.resolve('hello'));
			throw new Error('error after await');
			<p>{data}</p>
		}

		component App() {
			try {
				<ThrowingAfterAwait />
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught error');
		expect(body).not.toContain('loading...');
	});

	it('catch block works with try/catch/pending when async body rejects', async () => {
		component App() {
			try {
				let &[data] = trackAsync(() => Promise.reject(new Error('rejected')));
				<p>{data}</p>
			} pending {
				<p>{'loading...'}</p>
			} catch (err) {
				<p>{'caught rejection'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('caught rejection');
		expect(body).not.toContain('loading...');
	});

	it('removes pending content for nested try/pending blocks', async () => {
		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('resolved');
		expect(body).not.toContain('outer loading...');
		expect(body).not.toContain('inner loading...');
	});
});

describe('trackAsync directly in component body (server)', () => {
	it('resolves trackAsync used directly in a component', async () => {
		component App() {
			try {
				<DataChild />
			} catch (err) {
				<p>{'error'}</p>
			}
		}

		component DataChild() {
			let &[data] = trackAsync(() => Promise.resolve('from child'));
			<p>{data}</p>
		}

		const { body } = await render(App);
		expect(body).toContain('from child');
		expect(body).not.toContain('error');
	});

	it('resolves multiple trackAsync values in the same component', async () => {
		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('hello');
		expect(body).toContain('world');
	});

	it('renders catch when trackAsync rejects in a child component without its own try', async () => {
		component RejectChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('child rejected')));
			<p>{data}</p>
		}

		component App() {
			try {
				<RejectChild />
			} catch (err) {
				<p>{'parent caught it'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('parent caught it');
	});

	it('chained trackAsync resolves both values', async () => {
		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('RIPPLE');
		expect(body).not.toContain('error');
	});

	it('chained trackAsync catches when first rejects', async () => {
		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('first failed');
	});

	it('chained trackAsync catches when second rejects', async () => {
		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('second failed');
	});
});

describe('nested child components with try/catch boundaries (server)', () => {
	it('inner try/catch catches error from its own child', async () => {
		component ThrowingChild() {
			throw new Error('inner error');
			<p>{'should not render'}</p>
		}

		component Inner() {
			try {
				<ThrowingChild />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		component App() {
			try {
				<Inner />
			} catch (err) {
				<p>{'outer caught'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('inner error');
		expect(body).not.toContain('outer caught');
	});

	it('inner try/catch catches async rejection from its own child', async () => {
		component AsyncChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('async inner error')));
			<p>{data}</p>
		}

		component Inner() {
			try {
				<AsyncChild />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		component App() {
			try {
				<Inner />
			} catch (err) {
				<p>{'outer caught'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('async inner error');
		expect(body).not.toContain('outer caught');
	});

	it('error propagates to outer catch when inner try has no catch', async () => {
		component ThrowingChild() {
			throw new Error('propagated error');
			<p>{'should not render'}</p>
		}

		component Inner() {
			try {
				<ThrowingChild />
			} pending {
				<p>{'loading...'}</p>
			}
		}

		component App() {
			try {
				<Inner />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('propagated error');
		expect(body).not.toContain('loading...');
	});

	it('async rejection propagates to outer catch when inner try has no catch', async () => {
		component AsyncChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('async propagated')));
			<p>{data}</p>
		}

		component Inner() {
			try {
				<AsyncChild />
			} pending {
				<p>{'loading...'}</p>
			}
		}

		component App() {
			try {
				<Inner />
			} catch (err: Error) {
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
			component ThrowingChild() {
				throw new Error('deep error');
				<p>{'should not render'}</p>
			}

			component Level3() {
				try {
					<ThrowingChild />
				} pending {
					<p>{'level3 loading'}</p>
				}
			}

			component Level2() {
				try {
					<Level3 />
				} pending {
					<p>{'level2 loading'}</p>
				}
			}

			component App() {
				try {
					<Level2 />
				} catch (err: Error) {
					<p>{err.message}</p>
				}
			}

			const { body } = await render(App);
			expect(body).toContain('deep error');
		},
	);

	it('sibling components: one fails, the other does not affect catch', async () => {
		component GoodChild() {
			let &[data] = trackAsync(() => Promise.resolve('good'));
			<p>{data}</p>
		}

		component BadChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('bad child')));
			<p>{data}</p>
		}

		component App() {
			try {
				<GoodChild />
				<BadChild />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('bad child');
		expect(body).not.toContain('good');
	});

	it('independent try/catch boundaries each handle their own errors', async () => {
		component FailChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('fail')));
			<p>{data}</p>
		}

		component SuccessChild() {
			let &[data] = trackAsync(() => Promise.resolve('success'));
			<p>{data}</p>
		}

		component App() {
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
		}

		const { body } = await render(App);
		expect(body).toContain('fail');
		expect(body).toContain('success');
		expect(body).not.toContain('should not catch');
	});

	it('inner catch handles rejection, outer renders normally', async () => {
		component AsyncChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('handled inside')));
			<p>{data}</p>
		}

		component Inner() {
			try {
				<AsyncChild />
			} catch (err: Error) {
				<span>{err.message}</span>
			}
		}

		component App() {
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
		component BrokenChild() {
			let &[data] = trackAsync(() => Promise.resolve('loaded'));
			throw new Error('sync after async');
			<p>{data}</p>
		}

		component Inner() {
			try {
				<BrokenChild />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		component App() {
			<Inner />
		}

		const { body } = await render(App);
		expect(body).toContain('sync after async');
	});

	it('outer try with pending, inner try with catch: rejection goes to inner catch', async () => {
		component AsyncChild() {
			let &[data] = trackAsync(() => Promise.reject(new Error('inner rejection')));
			<p>{data}</p>
		}

		component Inner() {
			try {
				<AsyncChild />
			} catch (err: Error) {
				<p>{err.message}</p>
			}
		}

		component App() {
			try {
				<Inner />
			} pending {
				<p>{'outer loading'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('inner rejection');
		expect(body).not.toContain('outer loading');
	});

	it('deeply nested: async resolves through multiple component layers', async () => {
		component DataFetcher() {
			let &[data] = trackAsync(() => Promise.resolve('deep data'));
			<span>{data}</span>
		}

		component Level2() {
			<div><DataFetcher /></div>
		}

		component Level1() {
			<section><Level2 /></section>
		}

		component App() {
			try {
				<Level1 />
			} catch (err) {
				<p>{'error'}</p>
			}
		}

		const { body } = await render(App);
		expect(body).toContain('deep data');
		expect(body).not.toContain('error');
	});
});
