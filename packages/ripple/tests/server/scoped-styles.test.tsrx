import { getCss } from 'ripple/server';
import { base as importedBase, theme as importedTheme } from '../fixtures/scoped-styles/theme.tsrx';

// RFC tsrx-org/RFCs#1 on the server: the class table matches the client, and
// a request collects the sheets of the scopes it rendered — an applied theme
// before the scope that applies it, whichever module the theme lives in.

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
</style>;

describe('sibling-scoped style blocks (server)', () => {
	function Status({ ready }: { ready: boolean }) @{
		<>
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

	it('renders the class table and collects every scope sheet in source order', async () => {
		function Ready() @{
			<Status ready={true} />
		}

		const { body, css } = await render(Ready);
		const { document } = parseHtml(body);

		const [A] = hashes(document.querySelector('#status'));
		expect(hashes(document.querySelector('#status'))).toEqual([A]);
		const B = hashes(document.querySelector('#title'))[1];
		expect(hashes(document.querySelector('#title'))).toEqual([A, B]);
		const C = hashes(document.querySelector('#ok'))[2];
		expect(hashes(document.querySelector('#ok'))).toEqual([A, B, C]);
		expect(document.querySelector('#wait')).toBeNull();

		// Every scope's CSS ships, the branch never rendered included, and the
		// sheets follow source order.
		const collected = [...css];
		expect(collected).toHaveLength(4);
		expect(collected.slice(0, 3)).toEqual([A, B, C]);
		const text = getCss(css);
		expect(text).toContain(`.status.${A}`);
		expect(text).toContain(`.title.${B}`);
		expect(text).toContain('/* (unused) .status {');
		expect(text).toContain(`.ok.${C}`);
		expect(text).toContain(`.wait.${collected[3]}`);
		expect(text.indexOf(`.status.${A}`)).toBeLessThan(text.indexOf(`.title.${B}`));
		expect(text.indexOf(`.title.${B}`)).toBeLessThan(text.indexOf(`.ok.${C}`));
	});

	it('stamps the other branch with its own hash', async () => {
		function Waiting() @{
			<Status ready={false} />
		}

		const { body } = await render(Waiting);
		const { document } = parseHtml(body);

		const wait = hashes(document.querySelector('#wait'));
		expect(wait).toHaveLength(3);
		expect(wait.slice(0, 2)).toEqual(hashes(document.querySelector('#title')));
		expect(document.querySelector('#ok')).toBeNull();
	});

	it('registers the blocks of one children list as one sheet', async () => {
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

		const { body, css } = await render(Two);
		const { document } = parseHtml(body);

		const [H] = hashes(document.querySelector('#host'));
		const [, C] = hashes(document.querySelector('i'));
		expect(hashes(document.querySelector('b'))).toEqual([H, C]);
		expect([...css]).toEqual([H, C]);
		const text = getCss(css);
		expect(text).toContain(`.a.${C}`);
		expect(text).toContain(`.b.${C}`);
		expect(text.match(new RegExp(`\\.a\\.${C}`, 'g'))).toHaveLength(1);
	});

	it('merges the scope classes into a spread', async () => {
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

		const { body } = await render(App);
		const { document } = parseHtml(body);

		const button = document.querySelector('#btn');
		expect(button?.classList.contains('authored')).toBe(true);
		expect(hashes(button)).toHaveLength(2);
	});
});

describe('spreads with an imported theme (server)', () => {
	it('merges the scope classes of a static class into the spread once', async () => {
		function Card(&{ ...rest }: { class?: string }) @{
			<>
				<style apply={importedTheme}>
					.box {
						color: red;
					}
				</style>
				<div id="box" class="box" {...rest}>{'x'}</div>
			</>
		}

		function App() @{
			<Card class="from-spread" />
		}

		const { body } = await render(App);
		expect(body.match(/class=/g)).toHaveLength(1);
		const { document } = parseHtml(body);

		const box = document.querySelector('#box');
		const [local] = hashes(box);
		expect(local).toBeTruthy();
		expect(hashes(box)).toEqual([local, ...tokens(importedTheme.$class)]);
		expect(box?.classList.contains('box')).toBe(true);
	});
});

describe('$class and apply (server)', () => {
	it(
		'applies a same-module theme and registers its sheet before the scope that applies it',
		async () => {
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

			const { body, css } = await render(WithBody);
			const { document } = parseHtml(body);

			const div = document.querySelector('#c1');
			const [local, applied] = hashes(div);
			expect(div?.className).toBe(`c ${local} ${one.$class}`);
			expect(applied).toBe(one.$class);
			expect([...css]).toEqual([one.$class, local]);
			const text = getCss(css);
			expect(text.indexOf(`div.${one.$class}`)).toBeLessThan(text.indexOf(`.c.${local}`));
		},
	);

	it('applies an imported theme through its $class and collects its sheets first', async () => {
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

		const { body, css } = await render(Card);
		const { document } = parseHtml(body);

		const card = document.querySelector('#card');
		const [local] = hashes(card);
		expect(hashes(card)).toEqual([local, ...tokens(importedTheme.$class)]);
		// The class list is normalized on the server, so the theme hash that
		// `theme.dark` already carries appears once.
		const h2 = Array.from(document.querySelector('#h2')?.classList ?? []);
		expect(h2.slice(0, 2)).toEqual(tokens(importedTheme.dark));
		expect(h2).toContain(local);
		for (const token of tokens(importedTheme.$class)) expect(h2).toContain(token);
		// base (applied by theme), theme, then the applying scope.
		expect([...css]).toEqual([...tokens(importedTheme.$class), local]);
		const text = getCss(css);
		expect(text.indexOf(`article.${importedBase.$class}`)).toBeLessThan(
			text.indexOf(`article.${tokens(importedTheme.$class)[1]}`),
		);
		expect(text.indexOf(`.dark.${tokens(importedTheme.$class)[1]}`)).toBeLessThan(
			text.indexOf(`h2.${local}`),
		);
	});

	it('registers a theme only when something reads it', async () => {
		function App() @{
			const unused = <style>
				.u {
					color: red;
				}
			</style>;
			const theme = <style>
				div {
					color: blue;
				}
			</style>;
			<>
				<div id="opted" class={theme.$class}>{'opted in'}</div>
				<p id="untouched">{'untouched'}</p>
			</>
		}

		const { body, css } = await render(App);
		const { document } = parseHtml(body);

		const theme_hash = document.querySelector('#opted')?.className;
		expect(tokens(theme_hash!)).toHaveLength(1);
		expect(document.querySelector('#untouched')?.className).toBe('');
		expect([...css]).toEqual([theme_hash]);
		expect(getCss(css)).toContain(`div.${theme_hash}`);
	});
});
