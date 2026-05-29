import { track } from 'ripple';
import { compile } from '@tsrx/ripple';

describe('style refs', () => {
	describe('basic usage with components', () => {
		it('passes scoped classes to a child component via a style ref', () => {
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

			render(Parent);

			const div = container.querySelector('div');
			expect(div).toBeTruthy();
			expect(div.textContent).toBe('styled child');
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'highlight')).toBe(true);
		});

		it('passes multiple style ref classes to a child component', () => {
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

		it('allows style ref classes on child components with children', () => {
			const source = `
function Child({ className }) { return <>
	<div class={className}>"hello world"</div>
</>; }
function App() {
	let styles;
	return <>
		<Child className={styles.container}>"hello world"</Child>

		<style ref={(s) => styles = s}>
			.container {
				color: red;
			}
		</style>
	</>;
}`;

			expect(() => compile(source, 'test.tsrx')).not.toThrow();
		});

		it('passes scoped classes to a dynamic child component via a style ref', () => {
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

			render(Parent);

			const span = container.querySelector('span');
			expect(span).toBeTruthy();
			const classes = Array.from(span.classList);
			expect(classes.some((cls: string) => cls.startsWith('tsrx-'))).toBe(true);
			expect(classes.some((cls: string) => cls === 'text')).toBe(true);
		});

		it('child can combine its own classes with a parent style ref class', () => {
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

			render(App);

			const div = container.querySelector('div');
			expect(div).toBeTruthy();
			const classes = Array.from(div.classList);
			expect(classes.some((cls: string) => cls === 'card-base')).toBe(true);
			expect(classes.some((cls: string) => cls === 'themed')).toBe(true);
		});

		it('passes a standalone class even when it also appears in descendant context', () => {
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
function Child({ cls }) { return <>
	<div class={cls}>{'text'}</div>
</>; }
function App() { return <>
	<Child cls={style 'highlight'} />

	<style>
		.highlight {
			color: red;
		}
	</style>
</>; }`;
			expect(() => compile(source, 'test.tsrx')).toThrow();
		});

		it('does not parse the old style directive as a child expression', () => {
			const source = `function App() { return <>
	<div>{style 'foo'}</div>
	<style>
		.foo {
			color: red;
		}
	</style>
</>; }`;
			expect(() => compile(source, 'test.tsrx')).toThrow();
		});
	});

	describe('compiler output', () => {
		it('emits style class maps for client mode', () => {
			const source = `
function Child({ cls }) { return <>
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
			const { code } = compile(source, 'test.tsrx');

			expect(code).toContain('highlight');
			expect(code).toMatch(/tsrx-[a-z0-9]+ highlight/);
		});

		it('emits style class maps for server mode', () => {
			const source = `
function Child({ cls }) { return <>
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
		});
	});
});
