import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

const TSRX_RETURN_ERROR = 'Return statements are not allowed inside TSRX templates. Move the return before the TSRX return value, or use conditional rendering instead.';

describe('returns in prohibited scopes', () => {
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

	it('throws when return is used inside a TSRX fragment', () => {
		expect(
			() => compile(
				`
				function App() {
					return <>
						if (ready) {
							return;
						}
						<div>{'ready'}</div>
					</>;
				}
			`,
				'test.tsrx',
				{ mode: 'client' },
			),
		).toThrow(TSRX_RETURN_ERROR);
	});

	it('throws when return is used inside a TSRX element', () => {
		expect(
			() => compile(
				`
				function App() {
					return <section>
						if (ready) {
							return null;
						}
						<div>{'ready'}</div>
					</section>;
				}
			`,
				'test.tsrx',
				{ mode: 'client' },
			),
		).toThrow(TSRX_RETURN_ERROR);
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
});

describe('function returns in client components', () => {
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
