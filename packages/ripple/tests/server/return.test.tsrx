import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

describe('returns in restricted SSR scopes', () => {
	it('allows returns inside regular functions declared in TSRX templates', () => {
		expect(
			() => compile(
				`
				function App() @{
						function label() {
							return 'ready';
						}
						<div>{label()}</div>
				}
			`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).not.toThrow();
	});

	it('compiles template directives inside templates', () => {
		expect(
			() => compile(
				`
					function App() @{
						<>
							@if (ready) {
									<div>yielded</div>
								}
								<span>after</span>
						</>
					}
				`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).not.toThrow();
	});
});

describe('function returns in SSR components', () => {
	it('renders template directive branches alongside outer siblings', async () => {
		function App() @{
			const ready = true;
			<>
				@if (ready) {
					<div class="yielded">yielded</div>
				}
				<span class="outer">outer</span>
			</>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div class="yielded">yielded</div><span class="outer">outer</span>');
	});

	it('allows plain JavaScript control flow in setup when rendered output follows', () => {
		expect(
			() => compile(
				`
					function App() @{
							const items = [1, 2, 3];
							for (const item of items) {
								<div>{item}</div>
							}
					}
				`,
				'test.tsrx',
				{ mode: 'server' },
			),
		).not.toThrow();
	});

	it('renders TSRX return arguments and skips later siblings', async () => {
		function App() @{
			const ready = true;
			if (ready) {
				return <div class="returned">returned</div>;
			}
			<span class="after">after</span>
		}

		const { body } = await render(App);
		expect(body).toBeHtml('<div class="returned">returned</div>');
	});

	it('allows guard returns before TSRX output', async () => {
		function App() @{
			const ready = true;
			if (!ready) {
				return null;
			}

			<div>{'ready'}</div>
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
