import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

describe('returns in restricted scopes', () => {
	it('throws error when return is used in module scope', () => {
		expect(
			() => compile(`
				return;
				function App() { return <>
					<div>{'hello'}</div>
				</>; }
			`, 'test.tsrx', {
				mode: 'client',
			}),
		).toThrow('Return statements are not allowed at the top level of a module.');
	});

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
				{ mode: 'client' },
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
							=> <div>"yielded"</div>
						}
						<span>"after"</span>
					</>;
				}
			`,
				'test.tsrx',
				{ mode: 'client' },
			),
		).not.toThrow();
	});
});

describe('function returns in client components', () => {
	it('renders TSRX render statements and skips later siblings in the same block', () => {
		function App() {
			const ready = true;
			return <>
				if (ready) {
					=> <div class="yielded">"yielded"</div>
					<span class="inner">"inner"</span>
				}
				<span class="outer">"outer"</span>
			</>;
		}

		render(App);
		expect(container.querySelector('.yielded')?.textContent).toBe('yielded');
		expect(container.querySelector('.inner')).toBeNull();
		expect(container.querySelector('.outer')?.textContent).toBe('outer');
	});

	it('renders top-level TSRX render statements and skips later fragment siblings', () => {
		function App() {
			return <>
				=> <div class="yielded">"yielded"</div>
				<span class="after">"after"</span>
			</>;
		}

		render(App);
		expect(container.querySelector('.yielded')?.textContent).toBe('yielded');
		expect(container.querySelector('.after')).toBeNull();
	});

	it('renders TSRX return arguments and skips later siblings', () => {
		function App() {
			const ready = true;
			return <>
				if (ready) {
					return <div class="returned">"returned"</div>;
				}
				<span class="after">"after"</span>
			</>;
		}

		render(App);
		expect(container.querySelector('.returned')?.textContent).toBe('returned');
		expect(container.querySelector('.after')).toBeNull();
	});

	it('allows guard returns before TSRX output', () => {
		function App() {
			const ready = true;
			if (!ready) {
				return null;
			}

			return <><div class="ready">{'ready'}</div></>;
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
