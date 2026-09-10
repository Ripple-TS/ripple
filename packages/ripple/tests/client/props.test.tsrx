import { describe, it, expect } from 'vitest';
import { flushSync, mount, track, Props } from 'ripple';

// Component call sites with a reactive prop pass a compiled props instance:
// the props are prototype getters, so these tests cover the paths that no
// longer see own properties (enumeration, spread, JSON) alongside reactivity
// and the memoization of props built only from the parent's own props.

describe('compiled props', () => {
	it('keeps reactive props live through the class getters', () => {
		let bump: () => void = () => {};

		function Child(props: { count: number; label: string }) @{
			<span>{props.label + ':' + props.count}</span>
		}

		function App() @{
			let &[count] = track(1);
			bump = () => {
				count++;
			};
			<Child count={count * 2} label="n" />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('n:2');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('n:4');
	});

	it('evaluates a prop derived only from the parent props once', () => {
		function Leaf(props: { depth: number; path: string }) @{
			<span>{props.path + '|' + props.depth}</span>
		}

		function Node(props: { depth: number; path: string }) @{
			@if (props.depth > 0) {
				<div>
					<Node depth={props.depth - 1} path={props.path + 'L'} />
					<Node depth={props.depth - 1} path={props.path + 'R'} />
				</div>
			} @else {
				<Leaf depth={props.depth} path={props.path} />
			}
		}

		function App() @{
			<Node depth={2} path="" />
		}

		render(App);
		const leaves = Array.from(container.querySelectorAll('span')).map((el) => el.textContent);
		expect(leaves).toEqual(['LL|0', 'LR|0', 'RL|0', 'RR|0']);
	});

	it('does not memoize a prop whose source reads tracked state', () => {
		let bump: () => void = () => {};

		function Leaf(props: { value: number }) @{
			<span>{props.value}</span>
		}

		function Middle(props: { value: number }) @{
			<Leaf value={props.value + 1} />
		}

		function App() @{
			let &[count] = track(0);
			bump = () => {
				count++;
			};
			<Middle value={count} />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('1');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('2');
	});

	it('enumerates and spreads compiled props in .tsrx code', () => {
		function Child(props: { a: number; b: string; c: boolean }) @{
			const keys = Object.keys(props).join(',');
			const values = Object.values(props).join(',');
			const entries = Object.entries(props).map(([key, value]) => key + '=' + value).join(',');
			const copy = { ...props, extra: 'x' };
			const json = JSON.stringify(props);
			<>
				<p>{keys}</p>
				<p>{values}</p>
				<p>{entries}</p>
				<p>{copy.a + copy.b + copy.extra}</p>
				<p>{json}</p>
				<p>
					{'a' in props ? 'has a' : 'no a'}
				</p>
			</>
		}

		function App() @{
			let &[a] = track(1);
			<Child a={a + 1} b="s" c={true} />
		}

		render(App);
		const paragraphs = Array.from(container.querySelectorAll('p')).map((el) => el.textContent);
		expect(paragraphs).toEqual([
			'a,b,c',
			'2,s,true',
			'a=2,b=s,c=true',
			'2sx',
			'{"a":2,"b":"s","c":true}',
			'has a',
		]);
	});

	it('reads compiled props through the Props helpers outside the compiler', () => {
		let bump: () => void = () => {};
		let seen: Record<string, unknown> = {};
		let omitted: { b: string; c: number } | null = null;

		// `Object.keys` in any `.tsrx` code is lowered; only a raw own-property
		// read shows that the props are not own properties.
		const inspect = (props: { a: number; b: string; c: number }) => {
			seen = {
				keys: Props.keys(props),
				values: Props.values(props),
				entries: Props.entries(props),
				has_a: Props.has(props, 'a'),
				has_d: Props.has(props, 'd'),
				object: Props.spread(props),
				merged: Props.spread(props, { c: 9, d: 'd' }),
				own: Object.getOwnPropertyNames(props),
			};
			omitted = Props.rest(props, 'a');
		};

		function Child(props: { a: number; b: string; c: number }) @{
			inspect(props);
			<span>{props.a}</span>
		}

		function App() @{
			let &[n] = track(1);
			bump = () => {
				n++;
			};
			<Child a={n} b="s" c={3} />
		}

		render(App);
		expect(seen).toEqual({
			keys: ['a', 'b', 'c'],
			values: [1, 's', 3],
			entries: [
				['a', 1],
				['b', 's'],
				['c', 3],
			],
			has_a: true,
			has_d: false,
			object: { a: 1, b: 's', c: 3 },
			merged: { a: 1, b: 's', c: 9, d: 'd' },
			own: [],
		});
		expect(Object.keys(omitted!)).toEqual(['b', 'c']);
		expect(omitted!.c).toBe(3);

		// The helpers behave like Object on plain objects.
		expect(Props.keys({ x: 1 })).toEqual(['x']);
		expect(Props.spread({ x: 1 }, { y: 2 })).toEqual({ x: 1, y: 2 });
		expect(Props.rest({ x: 1, y: 2 }, 'x')).toEqual({ y: 2 });

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('2');
	});

	it('keeps every prop readable and live on a site above the fixed slot count', () => {
		let bump: () => void = () => {};
		let seen: unknown[] = [];

		function Wide(props: Record<string, unknown>) @{
			seen = Props.values(props);
			<span>{String(props.live) + '/' + String(props.own) + '/' + String(props.s17)}</span>
		}

		function App(props: { own?: string }) @{
			let &[count] = track(1);
			bump = () => {
				count++;
			};
			<Wide
				live={count}
				own={props.own}
				s0={0}
				s1={1}
				s2={2}
				s3={3}
				s4={4}
				s5={5}
				s6={6}
				s7={7}
				s8={8}
				s9={9}
				s10={10}
				s11={11}
				s12={12}
				s13={13}
				s14={14}
				s15={15}
				s16={16}
				s17={17}
			/>
		}

		function Root() @{
			<App own="me" />
		}

		render(Root);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('1/me/17');
		expect(seen).toEqual([1, 'me', ...Array.from({ length: 18 }, (_, i) => i)]);

		bump();
		flushSync();
		expect(text()).toBe('2/me/17');
	});

	it('memoizes a forwarded prop whose value is undefined', () => {
		let calls = 0;

		function Leaf(props: { maybe: string | undefined }) @{
			// Two reads of a memoizable prop: the second must not re-evaluate.
			<span>{String(props.maybe) + String(props.maybe)}</span>
		}

		function Middle(props: { maybe: string | undefined }) @{
			<Leaf maybe={props.maybe} />
		}

		function App() @{
			const source = {
				get maybe() {
					calls++;
					return undefined;
				},
			};
			<Middle maybe={source.maybe} />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('undefinedundefined');
		// `App` reads its getter once when the static prop is built; the memoized
		// forward in `Middle` never asks again.
		expect(calls).toBe(1);
	});

	it('gives every component the same shape of props', () => {
		let seen: Record<string, unknown[]> = {};
		const inspect = (name: string, props: object) => {
			seen[name] = [Props.keys(props), Object.getOwnPropertyNames(props), JSON.stringify(props)];
		};

		function Static(props: { a: number; b: string }) @{
			inspect('static', props);
			<span>{props.a}</span>
		}

		function Empty(props: {}) @{
			inspect('empty', props);
			<span>{'e'}</span>
		}

		function Closure(props: { n: number }) @{
			inspect('closure', props);
			<span>{props.n}</span>
		}

		function Rest(props: { keep: number; drop: number }) @{
			const rest = Props.rest(props, 'drop');
			inspect('rest', rest);
			<span>{rest.keep}</span>
		}

		function Root(props: { title: string; count: number }) @{
			inspect('root', props);
			let &[n] = track(1);
			<>
				<Static a={1} b="x" />
				<Empty />
				<Closure n={arguments.length + n} />
				<Rest keep={n} drop={2} />
			</>
		}

		const unmount = mount(Root, { target: container, props: { title: 't', count: 3 } });
		expect(seen.root).toEqual([['title', 'count'], [], '{"title":"t","count":3}']);
		expect(seen.static).toEqual([['a', 'b'], [], '{"a":1,"b":"x"}']);
		expect(seen.empty).toEqual([[], [], '{}']);
		// A site whose expression reads `arguments` keeps its closure getters as
		// own properties, under the same prototype and helpers.
		expect(seen.closure[0]).toEqual(['n']);
		expect(seen.closure[2]).toBe('{"n":1}');
		expect(seen.rest).toEqual([['keep'], ['keep'], '{"keep":1}']);
		unmount();
	});

	it('supports lazy rest destructuring of compiled props', () => {
		let bump: () => void = () => {};

		function Child(props: { first: number; second: number; third: string }) @{
			let &{ first, ...rest } = props;
			<span>{first + '/' + rest.second + '/' + rest.third}</span>
		}

		function App() @{
			let &[n] = track(1);
			bump = () => {
				n++;
			};
			<Child first={n} second={n * 10} third="t" />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('1/10/t');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('2/20/t');
	});

	it('passes a lazy pair Tracked alias as a stable prop', () => {
		let bump: () => void = () => {};

		function Child(props: { tracked: { value: number } }) @{
			<span>{props.tracked.value}</span>
		}

		function App() @{
			let &[count, countT] = track(5);
			bump = () => {
				count++;
			};
			<Child tracked={countT} />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('5');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('6');
	});

	it('switches between the branches of a flattened @if chain', () => {
		let set: (value: number) => void = () => {};

		function App() @{
			let &[value] = track(0);
			set = (next) => {
				value = next;
			};
			@if (value > 1) {
				@if (value > 2) {
					<span>big</span>
				} @else {
					<span>two</span>
				}
			} @else if (value === 1) {
				<span>one</span>
			} @else {
				<span>zero</span>
			}
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('zero');

		set(1);
		flushSync();
		expect(text()).toBe('one');

		set(2);
		flushSync();
		expect(text()).toBe('two');

		set(3);
		flushSync();
		expect(text()).toBe('big');

		set(0);
		flushSync();
		expect(text()).toBe('zero');
		expect(container.querySelectorAll('span').length).toBe(1);
	});
});
