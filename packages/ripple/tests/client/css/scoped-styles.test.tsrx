import { track, flushSync } from 'ripple';
import { compile } from '@tsrx/ripple';
import {
	base as importedBase,
	theme as importedTheme,
} from '../../fixtures/scoped-styles/theme.tsrx';

// RFC tsrx-org/RFCs#1: a `<style>` block is scoped to its siblings — it styles
// the items beside it and everything below them, never the element that
// contains it. Sibling blocks share one hash, nested children lists that hold
// blocks are nested scopes, assigned blocks expose `$class`, and `apply`
// attaches a theme to a whole scope.

function hashes(element: Element | null): string[] {
	return Array.from(element?.classList ?? []).filter((cls) => cls.startsWith('tsrx-'));
}

function tokens(value: string): string[] {
	return value.split(' ').filter(Boolean);
}

const one = <style>
	div {
		color: red;
	}
	.one {
		margin: 0;
	}
</style>;

const two = <style>
	div {
		color: blue;
	}
</style>;

const localBase = <style>
	p {
		margin: 0;
	}
</style>;

const accent = <style apply={localBase}>
	p {
		color: purple;
	}
</style>;

const bundle = <style apply={[two, accent]} />;

describe('sibling-scoped style blocks', () => {
	it('styles the items beside a block and everything below them, never the container', () => {
		function Status() @{
			let &[ready] = track(false);
			<>
				<button onClick={() => (ready = !ready)}>{'toggle'}</button>
				<style>
					.status {
						padding: 0.5rem;
					}
				</style>
				<section id="status" class="status">
					<style>
						.title {
							font-weight: 700;
						}
						.status {
							color: rgb(9, 9, 9);
						}
					</style>
					<h2 id="title" class="title">{'Status'}</h2>
					@if (ready) {
						<>
							<style>
								.ok {
									color: green;
								}
							</style>
							<p id="ok" class="ok">{'Ready'}</p>
						</>
					} @else {
						<>
							<style>
								.wait {
									color: gray;
								}
							</style>
							<p id="wait" class="wait">{'Waiting'}</p>
						</>
					}
				</section>
			</>
		}

		render(Status);

		const section = container.querySelector('#status');
		const title = container.querySelector('#title');
		const wait = container.querySelector('#wait');

		const [A] = hashes(section);
		expect(A).toBeTruthy();
		// The section carries only the fragment's scope: the block written
		// inside it styles its children, not the section. The button is a
		// sibling of the block too.
		expect(hashes(section)).toEqual([A]);
		expect(hashes(container.querySelector('button'))).toEqual([A]);
		const B = hashes(title)[1];
		expect(hashes(title)).toEqual([A, B]);
		const D = hashes(wait)[2];
		expect(hashes(wait)).toEqual([A, B, D]);
		expect(new Set([A, B, D]).size).toBe(3);
		expect(container.querySelector('#ok')).toBeNull();

		container.querySelector('button')?.click();
		flushSync();

		const ok = container.querySelector('#ok');
		const C = hashes(ok)[2];
		expect(hashes(ok)).toEqual([A, B, C]);
		expect([A, B, D]).not.toContain(C);
		expect(container.querySelector('#wait')).toBeNull();
		expect(hashes(container.querySelector('#status'))).toEqual([A]);
	});

	it('prunes a rule that only matches the container and emits the scopes in source order', () => {
		const source = `
export function Status({ ready }: { ready: boolean }) @{
	<>
		<style>.status { padding: 0.5rem; }</style>
		<section class="status">
			<style>
				.title { font-weight: 700; }
				.status { color: rgb(9, 9, 9); }
			</style>
			<h2 class="title">{'Status'}</h2>
			@if (ready) {
				<>
					<style>.ok { color: green; }</style>
					<p class="ok">{'Ready'}</p>
				</>
			} @else {
				<>
					<style>.wait { color: gray; }</style>
					<p class="wait">{'Waiting'}</p>
				</>
			}
		</section>
	</>
}`;
		const { css, cssHash } = compile(source, 'test.tsrx');
		const [A, B, C, D] = cssHash!.split(' ');
		expect(new Set([A, B, C, D]).size).toBe(4);
		expect(css).toContain(`.status.${A} { padding: 0.5rem; }`);
		expect(css).toContain(`.title.${B} { font-weight: 700; }`);
		expect(css).toContain('/* (unused) .status { color: rgb(9, 9, 9); }*/');
		expect(css).not.toContain(`.status.${B}`);
		expect(css).toContain(`.ok.${C}`);
		expect(css).toContain(`.wait.${D}`);
		expect(css.indexOf(`.status.${A}`)).toBeLessThan(css.indexOf(`.title.${B}`));
		expect(css.indexOf(`.title.${B}`)).toBeLessThan(css.indexOf(`.ok.${C}`));
		expect(css.indexOf(`.ok.${C}`)).toBeLessThan(css.indexOf(`.wait.${D}`));
	});

	it(
		'shares one hash between the blocks of one children list, and none with the enclosing list',
		() => {
			function Two() @{
				<>
					<style>
						.host {
							margin: 0;
						}
					</style>
					<div id="host" class="host">
						<style>
							.a {
								color: red;
							}
						</style>
						<i class="a">{'a'}</i>
						<style>
							.b {
								color: blue;
							}
						</style>
						<b class="b">{'b'}</b>
					</div>
				</>
			}

			render(Two);

			const host = container.querySelector('#host');
			const i = container.querySelector('i');
			const b = container.querySelector('b');
			const [H] = hashes(host);
			expect(hashes(host)).toEqual([H]);
			const [, C] = hashes(i);
			expect(C).not.toBe(H);
			expect(hashes(i)).toEqual([H, C]);
			expect(hashes(b)).toEqual([H, C]);

			const { css, cssHash } = compile(
				`export function Two() @{
	<>
		<style>.host { margin: 0; }</style>
		<div class="host">
			<style>.a { color: red; }</style>
			<i class="a">{'a'}</i>
			<style>.b { color: blue; }</style>
			<b class="b">{'b'}</b>
		</div>
	</>
}`,
				'test.tsrx',
			);
			const [outer, inner] = cssHash!.split(' ');
			expect(cssHash!.split(' ')).toHaveLength(2);
			expect(css).toContain(`.host.${outer}`);
			expect(css).toContain(`.a.${inner}`);
			expect(css).toContain(`.b.${inner}`);
		},
	);

	it('reaches into a nested code block scope, and the nested block never reaches out', () => {
		function Panel() @{
			<>
				<style>
					div {
						color: black;
					}
				</style>
				<div id="outer">{'Black'}</div>
				@{
					<>
						<style>
							div {
								font-weight: bold;
							}
						</style>
						<div id="inner">{'Black and bold'}</div>
					</>
				}
			</>
		}

		render(Panel);

		const [A] = hashes(container.querySelector('#outer'));
		expect(hashes(container.querySelector('#outer'))).toEqual([A]);
		const inner = hashes(container.querySelector('#inner'));
		expect(inner).toHaveLength(2);
		expect(inner[0]).toBe(A);
		expect(inner[1]).not.toBe(A);
	});

	it('scopes a block inside a @for branch to the items that branch renders', () => {
		function List() @{
			let items = track(['a', 'b']);
			<>
				<button onClick={() => (items.value = [])}>{'clear'}</button>
				<style>
					li {
						list-style: none;
					}
				</style>
				<ul>
					@for (const item of items.value) {
						<>
							<style>
								li {
									padding: 0.75rem 0;
								}
							</style>
							<li class="item">{item}</li>
						</>
					} @empty {
						<li class="empty">{'none'}</li>
					}
				</ul>
			</>
		}

		render(List);

		const [first, second] = Array.from(container.querySelectorAll('li.item'));
		const [A, B] = hashes(first);
		expect(A).toBeTruthy();
		expect(B).toBeTruthy();
		expect(hashes(second)).toEqual([A, B]);
		expect(hashes(container.querySelector('ul'))).toEqual([A]);

		container.querySelector('button')?.click();
		flushSync();

		// The `@empty` branch holds no block of its own: only the outer scope.
		expect(hashes(container.querySelector('li.empty'))).toEqual([A]);
	});

	it(
		'keeps the block of an element assigned to a variable, styling its children and not its root',
		() => {
			function Templates() @{
				const card = <div id="root" class="card-root">
					<style>
						.text {
							margin: 0;
						}
					</style>
					<p id="text" class="text">{'card'}</p>
				</div>;
				<>
					{card}
					<p id="outside">{'outside'}</p>
				</>
			}

			render(Templates);

			expect(hashes(container.querySelector('#root'))).toEqual([]);
			expect(hashes(container.querySelector('#text'))).toHaveLength(1);
			expect(hashes(container.querySelector('#outside'))).toEqual([]);
		},
	);

	it('adds the scope classes of an element that spreads its props, one token per scope', () => {
		function Button(&{ ...rest }: { id: string; class?: string }) @{
			<>
				<style>
					button {
						padding: 0;
					}
				</style>
				<div>
					<style>
						button {
							margin: 0;
						}
					</style>
					<button {...rest}>{'b'}</button>
				</div>
			</>
		}

		function App() @{
			<Button id="btn" class="authored" />
		}

		render(App);

		const button = container.querySelector('#btn');
		expect(button?.classList.contains('authored')).toBe(true);
		expect(hashes(button)).toHaveLength(2);
		expect(hashes(container.querySelector('div'))).toHaveLength(1);
	});

	it('keeps the scope classes while a dynamic class value changes', () => {
		function App() @{
			let &[active] = track(false);
			<>
				<style>
					.on {
						color: green;
					}
				</style>
				<button id="toggle" onClick={() => (active = !active)}>{'toggle'}</button>
				<p id="p" class={active ? 'on' : 'off'}>{'p'}</p>
			</>
		}

		render(App);

		const p = container.querySelector('#p');
		const [A] = hashes(p);
		expect(A).toBeTruthy();
		expect(p?.className).toBe(`off ${A}`);

		container.querySelector('#toggle')?.click();
		flushSync();

		expect(p?.className).toBe(`on ${A}`);
	});
});

describe('$class and apply', () => {
	it('exposes $class on an assigned block and applies it to a whole scope', () => {
		expect(tokens(one.$class)).toHaveLength(1);
		expect(one.one).toBe(`${one.$class} one`);

		function SelfClosed() @{
			<>
				<style apply={one} />
				<div id="a1">{'a'}</div>
				<p id="a2">
					<span id="a3">{'c'}</span>
				</p>
			</>
		}

		render(SelfClosed);

		for (const id of ['a1', 'a2', 'a3']) {
			expect(hashes(container.querySelector(`#${id}`))).toEqual(tokens(one.$class));
		}
	});

	it('applies a theme and declares the scope block in one tag', () => {
		function WithBody() @{
			<>
				<style apply={one}>
					.c {
						margin: 0;
					}
				</style>
				<div id="c1" class="c">{'c'}</div>
			</>
		}

		render(WithBody);

		const div = container.querySelector('#c1');
		const classes = hashes(div);
		expect(classes).toHaveLength(2);
		// The scope's own hash comes first, then the applied theme.
		expect(classes[1]).toBe(one.$class);
		expect(classes[0]).not.toBe(one.$class);
		expect(div?.className).toBe(`c ${classes[0]} ${one.$class}`);
	});

	it('applies several themes with an array and with several blocks', () => {
		function ArrayForm() @{
			<>
				<style apply={[one, two]} />
				<div id="b1">{'b'}</div>
			</>
		}

		function TwoApplies() @{
			<>
				<style apply={one} />
				<style apply={two} />
				<div id="d1">{'d'}</div>
			</>
		}

		render(ArrayForm);
		expect(hashes(container.querySelector('#b1'))).toEqual([one.$class, two.$class]);

		render(TwoApplies);
		expect(hashes(container.querySelector('#d1'))).toEqual([one.$class, two.$class]);
	});

	it('composes themes at their definition and bundles them without CSS of their own', () => {
		expect(accent.$class).toBe(`${localBase.$class} ${tokens(accent.$class)[1]}`);
		expect(tokens(accent.$class)).toHaveLength(2);
		expect(bundle.$class).toBe(`${two.$class} ${accent.$class}`);

		function Composed() @{
			<>
				<style apply={accent} />
				<p id="p">{'composed'}</p>
			</>
		}

		render(Composed);

		expect(hashes(container.querySelector('#p'))).toEqual(tokens(accent.$class));
	});

	it('applies an imported theme through its $class at runtime', () => {
		expect(importedTheme.$class).toBe(`${importedBase.$class} ${tokens(importedTheme.$class)[1]}`);

		function Card() @{
			<>
				<style apply={importedTheme}>
					h2 {
						margin: 0;
					}
				</style>
				<article id="card">
					<h2 id="h2" class={importedTheme.dark}>{'Green, system-ui'}</h2>
				</article>
			</>
		}

		render(Card);

		const card = container.querySelector('#card');
		const [local] = hashes(card);
		expect(hashes(card)).toEqual([local, ...tokens(importedTheme.$class)]);
		expect(container.querySelector('#h2')?.className).toBe(
			`${importedTheme.dark} ${local} ${importedTheme.$class}`,
		);
	});

	it('opts single elements into a theme with $class, including a child through a prop', () => {
		function Card({ parentClass }: { parentClass: string }) @{
			<>
				<style>
					.local {
						padding: 0;
					}
				</style>
				<article id="article" class={['local', parentClass]}>
					<h2 id="h2" class={parentClass}>{'title'}</h2>
				</article>
			</>
		}

		function App() @{
			const theme = <style>
				div {
					color: blue;
				}
				.card {
					color: red;
				}
			</style>;
			<>
				<Card parentClass={theme.$class} />
				<div id="opted" class={theme.$class}>{'opted in'}</div>
				<div id="card" class={theme.card}>{'card'}</div>
				<p id="untouched">{'untouched'}</p>
			</>
		}

		render(App);

		const opted = container.querySelector('#opted');
		const theme_hash = opted?.className;
		expect(tokens(theme_hash!)).toHaveLength(1);
		expect(container.querySelector('#card')?.className).toBe(`${theme_hash} card`);
		expect(container.querySelector('#untouched')?.className).toBe('');

		const article = container.querySelector('#article');
		const local = hashes(article).find((cls) => cls !== theme_hash);
		expect(article?.className).toBe(`local ${theme_hash} ${local}`);
		expect(container.querySelector('#h2')?.className).toBe(`${theme_hash} ${local}`);
	});

	it('keeps every selector of a theme and only class selectors of a plain class map', () => {
		const source = `
export const theme = <style>
	div { color: green; }
	.dark { color: purple; }
</style>;

const plain = <style>
	div { color: red; }
	.card { color: blue; }
</style>;

const read = <style>
	span { color: red; }
</style>;

export function App() @{
	<>
		<div class={plain.card}>{'card'}</div>
		<span class={read.$class}>{'read'}</span>
	</>
}`;
		const { css, code } = compile(source, 'test.tsrx');
		const [theme_hash, plain_hash, read_hash] = [...css.matchAll(/\.(tsrx-[0-9a-f]+)/g)].map(
			(match) => match[1],
		).filter((hash, index, all) => all.indexOf(hash) === index);
		expect(css).toContain(`div.${theme_hash} { color: green; }`);
		expect(css).toContain(`.dark.${theme_hash} { color: purple; }`);
		expect(css).toContain('/* (unused) div { color: red; }*/');
		expect(css).toContain(`.card.${plain_hash} { color: blue; }`);
		// Reading `read.$class` makes the block a theme.
		expect(css).toContain(`span.${read_hash} { color: red; }`);
		expect(code).toContain(`'$class': '${theme_hash}'`);
		expect(code).toContain(`'dark': '${theme_hash} dark'`);
	});

	it(
		'emits an applied theme before the scope that applies it, and a scope before the scopes nested in it',
		() => {
			const source = `
const theme = <style>
	div { color: green; }
</style>;

export function Precedence() @{
	<>
		<style apply={theme}>
			div { color: black; }
		</style>
		<div class="outer">{'outer'}</div>
		@{
			<>
				<style>
					div { color: blue; }
				</style>
				<div class="inner">{'inner'}</div>
			</>
		}
		<style>
			div { font-style: italic; }
		</style>
	</>
}`;
			const { css, cssHash, code } = compile(source, 'test.tsrx');
			const [theme_hash, outer, inner] = cssHash!.split(' ');
			expect(cssHash!.split(' ')).toHaveLength(3);
			const green = css.indexOf(`div.${theme_hash} { color: green; }`);
			const black = css.indexOf(`div.${outer} { color: black; }`);
			const italic = css.indexOf(`div.${outer} { font-style: italic; }`);
			const blue = css.indexOf(`div.${inner} { color: blue; }`);
			expect(green).toBeGreaterThanOrEqual(0);
			expect(green).toBeLessThan(black);
			// The outer scope's blocks stay one group, even though the second
			// block is written after the nested scope.
			expect(black).toBeLessThan(italic);
			expect(italic).toBeLessThan(blue);
			expect(code).toContain(`class="outer ${outer} ${theme_hash}"`);
			expect(code).toContain(`class="inner ${outer} ${inner} ${theme_hash}"`);
		},
	);
});
