import { track } from 'ripple';
import { compile } from '@tsrx/ripple';

describe('style refs (server)', () => {
	describe('basic usage with components', () => {
		it('passes scoped classes to a child component via a style ref', async () => {
			function Child({ className }: { className: string }) {
				return <><div class={className}>{'styled child'}</div></>;
			}

			function Parent() {
				let styles;
				return <>
					<Child className={styles.highlight} />
					<style ref={(s) => (styles = s)}>
						.highlight {
							color: red;
						}
					</style>
				</>;
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

		it('passes multiple style ref classes to a child component', async () => {
			function Child({ primary, secondary }: { primary: string; secondary: string }) {
				return <>
					<div class={primary}>{'primary'}</div>
					<span class={secondary}>{'secondary'}</span>
				</>;
			}

			function Parent() {
				let styles;
				return <>
					<Child primary={styles.primary} secondary={styles.secondary} />
					<style ref={(s) => (styles = s)}>
						.primary {
							color: blue;
						}
						.secondary {
							color: gray;
						}
					</style>
				</>;
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
		it('allows parent to style child elements via a style ref prop', async () => {
			function Button({ extraClass }: { extraClass?: string }) {
				return <><button class={extraClass ?? ''}>{'Click me'}</button></>;
			}

			function App() {
				let styles;
				return <>
					<Button extraClass={styles.fancy} />
					<style ref={(s) => (styles = s)}>
						.fancy {
							background: gold;
						}
					</style>
				</>;
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const button = document.querySelector('button');
			expect(button).toBeTruthy();
			const classes = Array.from(button.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'fancy')).toBe(true);
		});

		it('child can combine its own classes with a parent style ref class', async () => {
			function Card({ className }: { className?: string }) {
				return <>
					<div class={['card-base', className ?? '']}>{'card content'}</div>
					<style>
						.card-base {
							border: 1px solid black;
						}
					</style>
				</>;
			}

			function App() {
				let styles;
				return <>
					<Card className={styles.themed} />
					<style ref={(s) => (styles = s)}>
						.themed {
							background: purple;
						}
					</style>
				</>;
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
			function Child({ cls }: { cls: string }) {
				return <><span class={cls}>{'text'}</span></>;
			}

			function App() {
				let styles;
				return <>
					<div class="parent">
						<Child cls={styles.dual} />
					</div>
					<style ref={(s) => (styles = s)}>
						.dual {
							color: blue;
						}
						.parent .dual {
							font-weight: bold;
						}
					</style>
				</>;
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

	it('passes scoped classes to a dynamic child component via a style ref', async () => {
		function Child({ cls }: { cls: string }) {
			return <><span class={cls}>{'text'}</span></>;
		}

		function Parent() {
			let styles;
			return <>
				let dynamic = track(() => Child);
				<div class="wrapper">
					<@dynamic cls={styles.text} />
				</div>
				<style ref={(s) => (styles = s)}>
					.text {
						color: red;
					}
				</style>
			</>;
		}

		const { body } = await render(Parent);
		const { document } = parseHtml(body);

		const span = document.querySelector('span');
		expect(span).toBeTruthy();
		const classes = Array.from(span.classList);
		expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
		expect(classes.some((cls: string) => cls === 'text')).toBe(true);
	});

	it('preserves caller scoped hash through wrapper children', async () => {
		function Wrapper({ children }) {
			return <>
				<div class="green">
					{'Wrapper'}
					{children}
				</div>
				<style>
					.green {
						color: green;
					}
				</style>
			</>;
		}

		function Child() {
			return <>
				<div class="red">{'Child'}</div>
				<style>
					.red {
						color: red;
					}
				</style>
			</>;
		}

		function App() {
			return <>
				<Wrapper>
					<Child />
				</Wrapper>
			</>;
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
		function Wrapper({ children }) {
			return <><section>{children}</section></>;
		}

		function App() {
			return <>
				const DynamicWrapper = track(() => Wrapper);
				<@DynamicWrapper>
					<div class="green">{'Slotted child'}</div>
				</@DynamicWrapper>
				<style>
					.green {
						color: green;
					}
				</style>
			</>;
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
function Child({ cls }: { cls: string }) { return <>
	<div class={cls}>{'text'}</div>
</>; }
export function App() {
	let styles;
	return <>
		<Child cls={styles.highlight} />

		<style ref={(s) => styles = s}>
			.highlight {
				color: red;
			}
		</style>
	</>;
}`;
			const { code } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(code).toContain('highlight');
			expect(code).toMatch(/tsrx-[a-z0-9]+ highlight/);
			expect(code).toContain('register_css');
		});

		it('includes CSS hash in rendered HTML', async () => {
			function Child({ cls }: { cls: string }) {
				return <><div class={cls}>{'hello'}</div></>;
			}

			function App() {
				let styles;
				return <>
					<Child cls={styles.styled} />
					<style ref={(s) => (styles = s)}>
						.styled {
							font-weight: bold;
						}
					</style>
				</>;
			}

			const { body, css } = await render(App);

			expect(css.size).toBeGreaterThan(0);
			const hashes = Array.from(css);
			expect(hashes.some((h: string) => h.startsWith('tsrx-'))).toBe(true);

			expect(body).toMatch(/tsrx-[a-z0-9]+/);
			expect(body).toContain('styled');
		});
	});
});
