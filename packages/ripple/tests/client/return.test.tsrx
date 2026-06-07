import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

describe('returns in restricted scopes', () => {
	it('throws error when return is used in module scope', () => {
		expect(
			() => compile(`
				return;
				function App() @{
					<div>{'hello'}</div>
				}
			`, 'test.tsrx', {
				mode: 'client',
			}),
		).toThrow('Return statements are not allowed at the top level of a module.');
	});

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
				{ mode: 'client' },
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
				{ mode: 'client' },
			),
		).not.toThrow();
	});
});

describe('function returns in client components', () => {
	it('renders template directive branches alongside outer siblings', () => {
		function App() @{
			const ready = true;
			<>
				@if (ready) {
					<div class="yielded">yielded</div>
				}
				<span class="outer">outer</span>
			</>
		}

		render(App);
		expect(container.querySelector('.yielded')?.textContent).toBe('yielded');
		expect(container.querySelector('.outer')?.textContent).toBe('outer');
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
							<></>
					}
				`,
				'test.tsrx',
				{ mode: 'client' },
			),
		).not.toThrow();
	});

	it('renders TSRX return arguments and skips later siblings', () => {
		function App() @{
			const ready = true;
			if (ready) {
				return <div class="returned">returned</div>;
			}
			<span class="after">after</span>
		}

		render(App);
		expect(container.querySelector('.returned')?.textContent).toBe('returned');
		expect(container.querySelector('.after')).toBeNull();
	});

	it('allows guard returns before TSRX output', () => {
		function App() @{
			const ready = true;
			if (!ready) {
				return null;
			}

			<div class="ready">{'ready'}</div>
		}

		render(App);
		expect(container.querySelector('.ready')?.textContent).toBe('ready');
	});

	it('allows components to return null', () => {
		function App() {
			return null;
		}

		render(App);
		expect(container.textContent).toBe('');
	});

	it('allows components to return strings', () => {
		function App() {
			return 'hello';
		}

		render(App);
		expect(container.textContent).toBe('hello');
	});
});
