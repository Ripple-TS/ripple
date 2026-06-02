import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

describe('returns in restricted SSR scopes', () => {
	it('allows returns inside regular functions declared in TSRX templates', () => {
		expect(
			() => compile(
				`
				function App() {
					return <>
						function label() {
							return 'ready';
						}
						<div>{label()}</div>
					</>;
				}
			`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).not.toThrow();
	});

	it('compiles TSRX render statements inside templates', () => {
		expect(
			() => compile(
				`
				function App() {
					return <>
						if (ready) {
								=> <div>yielded</div>
							}
							<span>after</span>
					</>;
				}
			`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).not.toThrow();
	});
});

describe('function returns in SSR components', () => {
	it('renders TSRX render statements inside control blocks alongside outer siblings', async () => {
		function App() {
			const ready = true;
			return <>
				if (ready) {
						=> <div class="yielded">yielded</div>
					}
					<span class="outer">outer</span>
			</>;
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div class="yielded">yielded</div><span class="outer">outer</span>');
	});

	it('throws when control-flow blocks contain direct TSRX children', () => {
		expect(
			() => compile(
				`
				function App() {
					return <>
						const items = [1, 2, 3];
						for (const item of items) {
							<div>{item}</div>
						}
					</>;
				}
			`,
				'test.tsrx',
				{ mode: 'server' },
			),
			).toThrow('TSRX elements and text inside JavaScript control flow blocks must use template directives.');
	});

	it('throws when top-level TSRX render statements are mixed with element children', () => {
		expect(
			() => compile(
				`
				function App() {
					return <section>
							=> <div>yielded</div>
							<span>after</span>
					</section>;
				}
			`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).toThrow(
			'TSRX render statements cannot be mixed with direct TSRX elements or text in the same template body.',
		);
	});

	it('renders TSRX return arguments and skips later siblings', async () => {
		function App() {
			const ready = true;
			return <>
				if (ready) {
						return <div class="returned">returned</div>;
					}
					<span class="after">after</span>
			</>;
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div class="returned">returned</div>');
	});

	it('allows guard returns before TSRX output', async () => {
		function App() {
			const ready = true;
			if (!ready) {
				return null;
			}

			return <><div>{'ready'}</div></>;
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div>ready</div>');
	});

	it('allows components to return null', async () => {
		function App() {
			return null;
		}

		const { body } = await render(App);
		expect(body).toBeHtml('');
	});

	it('allows components to return strings', async () => {
		function App() {
			return 'hello';
		}

		const { body } = await render(App);
		expect(body).toBeHtml('hello');
	});
});
