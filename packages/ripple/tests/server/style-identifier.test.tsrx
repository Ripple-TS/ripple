import { track } from 'ripple';
import { compile } from '@tsrx/ripple';

const external_styles = <style>
	.external {
		color: tomato;
	}
</style>;

describe('style class maps (server)', () => {
	describe('basic usage with components', () => {
		it('passes scoped classes to a child component via a style expression', async () => {
			function Child({ className }: { className: string }) @{
				<div class={className}>{'styled child'}</div>
			}

			function Parent() @{
				const styles = <style>
					.highlight {
						color: red;
					}
				</style>;

				<Child className={styles.highlight} />
			}

			const { body } = await render(Parent);
			const { document } = parseHtml(body);

			const div = document.querySelector('div');
			expect(div).toBeTruthy();
			expect(div.textContent).toBe('styled child');
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'highlight')).toBe(true);
		});

		it('passes multiple style expression classes to a child component', async () => {
			function Child({ primary, secondary }: { primary: string; secondary: string }) @{
				<>
					<div class={primary}>{'primary'}</div>
					<span class={secondary}>{'secondary'}</span>
				</>
			}

			function Parent() @{
				const styles = <style>
					.primary {
						color: blue;
					}
					.secondary {
						color: gray;
					}
				</style>;

				<Child primary={styles.primary} secondary={styles.secondary} />
			}

			const { body } = await render(Parent);
			const { document } = parseHtml(body);

			const div = document.querySelector('div');
			const span = document.querySelector('span');

			expect(div).toBeTruthy();
			expect(span).toBeTruthy();

			const divClasses = Array.from(div.classList);
			expect(divClasses.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(divClasses.some((cls: string) => cls === 'primary')).toBe(true);

			const spanClasses = Array.from(span.classList);
			expect(spanClasses.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(spanClasses.some((cls: string) => cls === 'secondary')).toBe(true);
		});
	});

	describe('parent styling applied to child', () => {
		it('allows parent to style child elements via a style expression prop', async () => {
			function Button({ extraClass }: { extraClass?: string }) @{
				<button class={extraClass ?? ''}>{'Click me'}</button>
			}

			function App() @{
				const styles = <style>
					.fancy {
						background: gold;
					}
				</style>;

				<Button extraClass={styles.fancy} />
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const button = document.querySelector('button');
			expect(button).toBeTruthy();
			const classes = Array.from(button.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'fancy')).toBe(true);
		});

		it('child can combine its own classes with a parent style expression class', async () => {
			function Card({ className }: { className?: string }) @{
				<>
					<div class={['card-base', className ?? '']}>{'card content'}</div>
					<style>
						.card-base {
							border: 1px solid black;
						}
					</style>
				</>
			}

			function App() @{
				const styles = <style>
					.themed {
						background: purple;
					}
				</style>;

				<Card className={styles.themed} />
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const div = document.querySelector('div');
			expect(div).toBeTruthy();
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls === 'card-base')).toBe(true);
			expect(classes.some((cls: string) => cls === 'themed')).toBe(true);
		});

		it('passes a standalone class even when it also appears in descendant context', async () => {
			function Child({ cls }: { cls: string }) @{
				<span class={cls}>{'text'}</span>
			}

			function App() @{
				const styles = <style>
					.dual {
						color: blue;
					}
					.parent .dual {
						font-weight: bold;
					}
				</style>;

				<div class="parent">
					<Child cls={styles.dual} />
				</div>
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const span = document.querySelector('span');
			expect(span).toBeTruthy();
			const classes = Array.from(span.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'dual')).toBe(true);
		});
	});

	it('passes scoped classes to a dynamic child component via a style expression', async () => {
		function Child({ cls }: { cls: string }) @{
			<span class={cls}>{'text'}</span>
		}

		function Parent() @{
			const styles = <style>
				.text {
					color: red;
				}
			</style>;

			let dynamic = track(() => Child);
			<div class="wrapper">
				<{dynamic} cls={styles.text} />
			</div>
		}

		const { body } = await render(Parent);
		const { document } = parseHtml(body);

		const span = document.querySelector('span');
		expect(span).toBeTruthy();
		const classes = Array.from(span.classList);
		expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
		expect(classes.some((cls: string) => cls === 'text')).toBe(true);
	});

	it('passes style expression classes declared outside the component', async () => {
		function Child({ cls }: { cls: string }) @{
			<span class={cls}>{'text'}</span>
		}

		function Parent() @{
			<Child cls={external_styles.external} />
		}

		const { body, css } = await render(Parent);
		const { document } = parseHtml(body);

		const span = document.querySelector('span');
		expect(span).toBeTruthy();
		const classes = Array.from(span.classList);
		expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
		expect(classes.some((cls: string) => cls === 'external')).toBe(true);

		expect(css.size).toBeGreaterThan(0);
		expect(Array.from(css).some((hash: string) => hash.startsWith('tsrx-'))).toBe(true);
	});

	it('preserves caller scoped hash through wrapper children', async () => {
		function Wrapper({ children }) @{
			<>
				<div class="green">
					{'Wrapper'}
					{children}
				</div>
				<style>
					.green {
						color: green;
					}
				</style>
			</>
		}

		function Child() @{
			<>
				<div class="red">{'Child'}</div>
				<style>
					.red {
						color: red;
					}
				</style>
			</>
		}

		function App() @{
			<Wrapper>
				<Child />
			</Wrapper>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		const wrapper = document.querySelector('.green');
		const child = document.querySelector('.red');
		const wrapper_scopes = Array.from(wrapper.classList).filter((name) => name.startsWith('tsrx-'));
		const child_scopes = Array.from(child.classList).filter((name) => name.startsWith('tsrx-'));

		expect(wrapper_scopes).toHaveLength(1);
		expect(child_scopes).toHaveLength(1);

		const wrapper_scope = wrapper_scopes[0];
		const child_scope = child_scopes.find((name) => name !== wrapper_scope) || child_scopes[0];
		expect(wrapper_scope).not.toBe(child_scope);
	});

	it('applies caller scoped hash to slotted children through dynamic components', async () => {
		function Wrapper({ children }) @{
			<section>{children}</section>
		}

		function App() @{
			const DynamicWrapper = track(() => Wrapper);
			<>
				<{DynamicWrapper}>
					<div class="green">{'Slotted child'}</div>
				</{DynamicWrapper}>
				<style>
					.green {
						color: green;
					}
				</style>
			</>
		}

		const { body } = await render(App);
		const { document } = parseHtml(body);
		const slotted_child = document.querySelector('section > div.green');
		const slotted_scopes = Array.from(slotted_child.classList).filter(
			(name) => name.startsWith('tsrx-'),
		);

		expect(slotted_scopes).toHaveLength(1);
	});

	describe('server compiler output', () => {
		it('emits style class maps', () => {
			const source = `
function Child({ cls }: { cls: string }) @{
	<div class={cls}>{'text'}</div>
}
export function App() @{
	const styles = <style>
		.highlight {
			color: red;
		}
	</style>;

		<Child cls={styles.highlight} />
}`;
			const { code } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(code).toContain('highlight');
			expect(code).toMatch(/tsrx-[a-z0-9]+ highlight/);
			expect(code).toContain('register_css');
		});

		it('includes CSS hash in rendered HTML', async () => {
			function Child({ cls }: { cls: string }) @{
				<div class={cls}>{'hello'}</div>
			}

			function App() @{
				const styles = <style>
					.styled {
						font-weight: bold;
					}
				</style>;

				<Child cls={styles.styled} />
			}

			const { body, css } = await render(App);

			expect(css.size).toBeGreaterThan(0);
			const hashes = Array.from(css);
			expect(hashes.some((h: string) => h.startsWith('tsrx-'))).toBe(true);

			expect(body).toMatch(/tsrx-[a-z0-9]+/);
			expect(body).toContain('styled');
		});

		it('prunes style expression selectors the class map cannot reach', () => {
			const source = `
export function App() @{
	const styles = <style>
		div {
			color: red;
		}
		.parent .card {
			font-weight: bold;
		}
		.card {
			color: green;
			&:hover {
				color: blue;
			}
		}
		:global(.badge) {
			padding: 0;
		}
		:global(body) {
			margin: 0;
		}
	</style>;

	<div class={styles.card}>{'text'}</div>
}`;
			const { css, cssHash } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(css).toContain('/* (unused) div {');
			expect(css).toContain('/* (unused) .parent .card {');
			expect(css).toContain(`.card.${cssHash}`);
			expect(css).toContain('&:hover {');
			expect(css).toContain('.badge {');
			expect(css).not.toContain(`.badge.${cssHash}`);
			expect(css).toContain('/* (unused) :global(body) {');
		});

		it('keeps all selectors of a free-standing style block', () => {
			const source = `
export function App() @{
	<>
		<div class="card">{'text'}</div>

		<style>
			div {
				color: red;
			}
			.card {
				color: green;
			}
		</style>
	</>
}`;
			const { css, cssHash } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(css).not.toContain('(unused)');
			expect(css).toContain(`div.${cssHash}`);
			expect(css).toContain(`.card.${cssHash}`);
		});
	});
});
