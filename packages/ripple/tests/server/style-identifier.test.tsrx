import { track } from 'ripple';
import { compile } from '@tsrx/ripple';

describe('{style} directive (server)', () => {
	describe('basic usage with components', () => {
		it('passes scoped class to a child component via {style}', async () => {
			component Child({ className }: { className: string }) {
				<div class={className}>{'styled child'}</div>
			}

			component Parent() {
				<Child className={style 'highlight'} />

				<style>
					.highlight {
						color: red;
					}
				</style>
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

		it('passes multiple {style} classes to a child component', async () => {
			component Child({ primary, secondary }: { primary: string; secondary: string }) {
				<div class={primary}>{'primary'}</div>
				<span class={secondary}>{'secondary'}</span>
			}

			component Parent() {
				<Child primary={style 'primary'} secondary={style 'secondary'} />

				<style>
					.primary {
						color: blue;
					}
					.secondary {
						color: gray;
					}
				</style>
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
		it('allows parent to style child elements via {style} prop', async () => {
			component Button({ extraClass }: { extraClass?: string }) {
				<button class={extraClass ?? ''}>{'Click me'}</button>
			}

			component App() {
				<Button extraClass={style 'fancy'} />

				<style>
					.fancy {
						background: gold;
					}
				</style>
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const button = document.querySelector('button');
			expect(button).toBeTruthy();
			const classes = Array.from(button.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'fancy')).toBe(true);
		});

		it('child can combine its own classes with parent {style} class', async () => {
			component Card({ className }: { className?: string }) {
				<div class={['card-base', className ?? '']}>{'card content'}</div>

				<style>
					.card-base {
						border: 1px solid black;
					}
				</style>
			}

			component App() {
				<Card className={style 'themed'} />

				<style>
					.themed {
						background: purple;
					}
				</style>
			}

			const { body } = await render(App);
			const { document } = parseHtml(body);

			const div = document.querySelector('div');
			expect(div).toBeTruthy();
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls === 'card-base')).toBe(true);
			expect(classes.some((cls: string) => cls === 'themed')).toBe(true);
		});

		it(
			'passes standalone class to child even when it also appears in descendant context',
			async () => {
				component Child({ cls }: { cls: string }) {
					<span class={cls}>{'text'}</span>
				}

				component App() {
					<div class="parent">
						<Child cls={style 'dual'} />
					</div>

					<style>
						.dual {
							color: blue;
						}
						.parent .dual {
							font-weight: bold;
						}
					</style>
				}

				const { body } = await render(App);
				const { document } = parseHtml(body);

				const span = document.querySelector('span');
				expect(span).toBeTruthy();
				const classes = Array.from(span.classList);
				expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
				expect(classes.some((cls: string) => cls === 'dual')).toBe(true);
			},
		);
	});

	it('passes scoped class to a dynamic child component via {style}', async () => {
		component Child({ cls }: { cls: string }) {
			<span class={cls}>{'text'}</span>
		}

		component Parent() {
			let dynamic = track(() => Child);
			<div class="wrapper">
				<@dynamic cls={style 'text'} />
			</div>

			<style>
				.text {
					color: red;
				}
			</style>
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
		component Wrapper({ children }) {
			<div class="green">
				{'Wrapper'}
				{children}
			</div>

			<style>
				.green {
					color: green;
				}
			</style>
		}

		component Child() {
			<div class="red">{'Child'}</div>

			<style>
				.red {
					color: red;
				}
			</style>
		}

		component App() {
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
		component Wrapper({ children }) {
			<section>{children}</section>
		}

		component App() {
			const DynamicWrapper = track(() => Wrapper);

			<@DynamicWrapper>
				<div class="green">{'Slotted child'}</div>
			</@DynamicWrapper>

			<style>
				.green {
					color: green;
				}
			</style>
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
		it('inlines scoped class strings', () => {
			const source = `
component Child({ cls }: { cls: string }) {
	<div class={cls}>{'text'}</div>
}
export component App() {
	<Child cls={style 'highlight'} />

	<style>
		.highlight {
			color: red;
		}
	</style>
}`;
			const { code } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(code).toContain('highlight');
			expect(code).toMatch(/tsrx-[a-z0-9]+/);
			expect(code).toContain('register_css');
		});

		it('includes CSS hash in rendered HTML', async () => {
			component Child({ cls }: { cls: string }) {
				<div class={cls}>{'hello'}</div>
			}

			component App() {
				<Child cls={style 'styled'} />

				<style>
					.styled {
						font-weight: bold;
					}
				</style>
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
