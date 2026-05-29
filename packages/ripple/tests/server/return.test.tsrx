import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple';

const TSRX_RETURN_ERROR = 'Return statements are not allowed inside TSRX templates. Move the return before the TSRX return value, or use conditional rendering instead.';

describe('returns in prohibited SSR scopes', () => {
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
				{ mode: 'server' },
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
				{ mode: 'server' },
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
				{ mode: 'server' },
			),
		).not.toThrow();
	});
});

describe('function returns in SSR components', () => {
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
