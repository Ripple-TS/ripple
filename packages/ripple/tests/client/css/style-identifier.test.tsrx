import { track } from 'ripple';
import { compile } from '@tsrx/ripple';

const external_styles = <style>
	.external {
		color: tomato;
	}
</style>;

describe('style class maps', () => {
	describe('basic usage with components', () => {
		it('passes scoped classes to a child component via a style expression', () => {
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

			render(Parent);

			const div = container.querySelector('div');
			expect(div).toBeTruthy();
			expect(div.textContent).toBe('styled child');
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'highlight')).toBe(true);
		});

		it('passes multiple style expression classes to a child component', () => {
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

			render(Parent);

			const div = container.querySelector('div');
			const span = container.querySelector('span');

			expect(div).toBeTruthy();
			expect(span).toBeTruthy();

			const divClasses = Array.from(div.classList);
			expect(divClasses.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(divClasses.some((cls: string) => cls === 'primary')).toBe(true);

			const spanClasses = Array.from(span.classList);
			expect(spanClasses.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(spanClasses.some((cls: string) => cls === 'secondary')).toBe(true);
		});

		it('allows style expression classes on child components with children', () => {
			const source = `
function Child({ className }) @{
	<div class={className}>hello world</div>
}
function App() @{
	const styles = <style>
		.container {
			color: red;
		}
	</style>;

		<Child className={styles.container}>hello world</Child>
}`;

			expect(() => compile(source, 'test.tsrx')).not.toThrow();
		});

		it('passes scoped classes to a dynamic child component via a style expression', () => {
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

			render(Parent);

			const span = container.querySelector('span');
			expect(span).toBeTruthy();
			const classes = Array.from(span.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'text')).toBe(true);
		});

		it('passes style expression classes declared outside the component', () => {
			function Child({ cls }: { cls: string }) @{
				<span class={cls}>{'text'}</span>
			}

			function Parent() @{
				<Child cls={external_styles.external} />
			}

			render(Parent);

			const span = container.querySelector('span');
			expect(span).toBeTruthy();
			const classes = Array.from(span.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'external')).toBe(true);
		});

		it('child can combine its own classes with a parent style expression class', () => {
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

			render(App);

			const div = container.querySelector('div');
			expect(div).toBeTruthy();
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls === 'card-base')).toBe(true);
			expect(classes.some((cls: string) => cls === 'themed')).toBe(true);
		});

		it('passes a standalone class even when it also appears in descendant context', () => {
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

			render(App);

			const span = container.querySelector('span');
			expect(span).toBeTruthy();
			const classes = Array.from(span.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'dual')).toBe(true);
		});
	});

	describe('removed syntax', () => {
		it('does not parse the old style directive in attributes', () => {
			const source = `
function Child({ cls }) @{
	<div class={cls}>{'text'}</div>
}
function App() @{
	<>
		<Child cls={style 'highlight'} />
		<style>
			.highlight {
				color: red;
			}
		</style>
	</>
}`;
			expect(() => compile(source, 'test.tsrx')).toThrow();
		});

		it('does not parse the old style directive as a child expression', () => {
			const source = `function App() @{
	<>
		<div>{style 'foo'}</div>
		<style>
			.foo {
				color: red;
			}
		</style>
	</>
			}`;
			expect(() => compile(source, 'test.tsrx')).toThrow();
		});
	});

	describe('compiler output', () => {
		it('emits style class maps for client mode', () => {
			const source = `
function Child({ cls }) @{
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
			const { code } = compile(source, 'test.tsrx');

			expect(code).toContain('highlight');
			expect(code).toMatch(/tsrx-[a-z0-9]+ highlight/);
		});

		it('emits style class maps for server mode', () => {
			const source = `
function Child({ cls }) @{
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
		});
	});
});
